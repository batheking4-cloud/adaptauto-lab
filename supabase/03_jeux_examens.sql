-- ADAPT'AUTO LAB - mini-jeux, quiz, examens, résultats (à lancer APRÈS 02_phase2.sql)
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('game','exam')),
  title text not null, description text not null default '', category text not null default 'Général',
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  intro_text text not null default '', outro_text text not null default '',
  duration_min int, pass_score int not null default 70 check (pass_score between 0 and 100),
  status text not null default 'draft' check (status in ('draft','published')),
  is_demo boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.quiz_questions (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null default 0, primary key (quiz_id, question_id));
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  kind text not null, score_pct int not null default 0, correct int not null default 0, wrong int not null default 0,
  total int not null default 0, passed boolean, created_at timestamptz not null default now());
create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected jsonb not null default '[]', is_correct boolean not null, created_at timestamptz not null default now());
alter table public.quizzes enable row level security; alter table public.quiz_questions enable row level security;
alter table public.attempts enable row level security; alter table public.attempt_answers enable row level security;
drop policy if exists "quizzes: admin" on public.quizzes; drop policy if exists "quizzes: élèves publiés" on public.quizzes;
drop policy if exists "quiz_questions: admin" on public.quiz_questions; drop policy if exists "attempts: lecture" on public.attempts;
drop policy if exists "answers: lecture" on public.attempt_answers;
create policy "quizzes: admin" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());
create policy "quizzes: élèves publiés" on public.quizzes for select using (status = 'published');
create policy "quiz_questions: admin" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "attempts: lecture" on public.attempts for select using (user_id = auth.uid() or public.is_admin());
create policy "answers: lecture" on public.attempt_answers for select using (user_id = auth.uid() or public.is_admin());
-- Pas de politique d'écriture pour les élèves : tout passe par les fonctions ci-dessous (score calculé côté serveur).

create or replace function public.get_quiz(p_quiz uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare qz public.quizzes; res jsonb;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into qz from public.quizzes where id = p_quiz and (status = 'published' or public.is_admin());
  if not found then raise exception 'Contenu introuvable ou non publié'; end if;
  select jsonb_build_object('id',qz.id,'kind',qz.kind,'title',qz.title,'intro_text',qz.intro_text,'outro_text',qz.outro_text,'duration_min',qz.duration_min,'pass_score',qz.pass_score,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'text',q.text,'qtype',q.qtype,
      'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id)) order by qq.position)
      from public.quiz_questions qq join public.questions q on q.id = qq.question_id where qq.quiz_id = qz.id), '[]'::jsonb)) into res;
  return res;
end $$;

create or replace function public.get_error_questions() returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'text',q.text,'qtype',q.qtype,
    'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id))), '[]'::jsonb)
  from public.questions q where auth.uid() is not null and q.id in (
    select question_id from (select distinct on (question_id) question_id, is_correct from public.attempt_answers
      where user_id = auth.uid() order by question_id, created_at desc) t where not t.is_correct) $$;

create or replace function public.check_answer(p_question uuid, p_selected uuid[], p_record boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare corr uuid[]; ok boolean; expl text;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not (public.is_admin()
    or exists (select 1 from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where qq.question_id = p_question and z.kind = 'game' and z.status = 'published')
    or exists (select 1 from public.attempt_answers a where a.user_id = auth.uid() and a.question_id = p_question)) then
    raise exception 'Question non accessible'; end if;
  corr := array(select id from public.question_options where question_id = p_question and is_correct);
  ok := (select coalesce(array_agg(x order by x),'{}') from unnest(coalesce(p_selected,'{}')) x) = (select coalesce(array_agg(x order by x),'{}') from unnest(corr) x);
  select explanation into expl from public.questions where id = p_question;
  if p_record then insert into public.attempt_answers(user_id, question_id, selected, is_correct) values (auth.uid(), p_question, to_jsonb(coalesce(p_selected,'{}')), ok); end if;
  return jsonb_build_object('is_correct', ok, 'correct_ids', to_jsonb(corr), 'explanation', coalesce(expl,''));
end $$;

create or replace function public.submit_attempt(p_quiz uuid, p_answers jsonb, p_preview boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare qz public.quizzes; q public.questions; sel uuid[]; corr uuid[]; ok boolean; c int := 0; w int := 0; t int; pct int; pas boolean; aid uuid; det jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into qz from public.quizzes where id = p_quiz and (status = 'published' or public.is_admin());
  if not found then raise exception 'Contenu introuvable ou non publié'; end if;
  select count(*) into t from public.quiz_questions where quiz_id = p_quiz;
  if not p_preview then insert into public.attempts(user_id, quiz_id, kind, total) values (auth.uid(), p_quiz, qz.kind, t) returning id into aid; end if;
  for q in select qs.* from public.quiz_questions qq join public.questions qs on qs.id = qq.question_id where qq.quiz_id = p_quiz order by qq.position loop
    sel := array(select j::uuid from jsonb_array_elements_text(coalesce((select x->'selected' from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) x where x->>'question_id' = q.id::text limit 1),'[]'::jsonb)) j);
    corr := array(select id from public.question_options where question_id = q.id and is_correct);
    ok := (select coalesce(array_agg(x order by x),'{}') from unnest(sel) x) = (select coalesce(array_agg(x order by x),'{}') from unnest(corr) x);
    if ok then c := c + 1; else w := w + 1; end if;
    if not p_preview then insert into public.attempt_answers(user_id, attempt_id, question_id, selected, is_correct) values (auth.uid(), aid, q.id, to_jsonb(sel), ok); end if;
    det := det || jsonb_build_object('question_id',q.id,'text',q.text,'selected',to_jsonb(sel),'correct_ids',to_jsonb(corr),'is_correct',ok,'explanation',q.explanation,
      'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id));
  end loop;
  pct := case when t = 0 then 0 else round(100.0 * c / t) end;
  pas := case when qz.kind = 'exam' then pct >= qz.pass_score else null end;
  if not p_preview then update public.attempts set score_pct = pct, correct = c, wrong = w, passed = pas where id = aid; end if;
  return jsonb_build_object('score_pct',pct,'correct',c,'wrong',w,'total',t,'passed',pas,'pass_score',qz.pass_score,'details',det);
end $$;
revoke execute on function public.get_quiz(uuid), public.get_error_questions(), public.check_answer(uuid,uuid[],boolean), public.submit_attempt(uuid,jsonb,boolean) from public, anon;
grant execute on function public.get_quiz(uuid), public.get_error_questions(), public.check_answer(uuid,uuid[],boolean), public.submit_attempt(uuid,jsonb,boolean) to authenticated;

-- Exemples (une seule fois)
do $$ declare g uuid; e uuid; begin
if not exists (select 1 from public.quizzes where is_demo) then
  insert into public.quizzes(kind,title,description,category,intro_text,outro_text,status,is_demo)
    values ('game','[EXEMPLE] Mini-jeu de démonstration','Exemple, pas un contenu officiel.','Démo','Bienvenue ! Réponds aux questions, la correction est immédiate.','Bravo, tu as terminé le mini-jeu.','published',true) returning id into g;
  insert into public.quizzes(kind,title,description,category,duration_min,pass_score,status,is_demo)
    values ('exam','[EXEMPLE] Examen blanc de démonstration','Exemple, pas un examen officiel.','Démo',5,70,'published',true) returning id into e;
  insert into public.quiz_questions(quiz_id,question_id,position) select g, id, row_number() over (order by created_at) from public.questions where is_demo;
  insert into public.quiz_questions(quiz_id,question_id,position) select e, id, row_number() over (order by created_at) from public.questions where is_demo;
end if; end $$;
