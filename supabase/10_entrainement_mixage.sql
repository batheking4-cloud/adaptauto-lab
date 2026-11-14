-- ADAPT'AUTO LAB - S'entraîner (correction immédiate), MIXAGE de l'examen, formats audio. Ne supprime rien. Relançable.
alter table public.questions add column if not exists statement_text text not null default '';
-- Stockage existant (bucket « media ») : formats audio MP3, WAV, M4A, fichiers jusqu'à 25 Mo
update storage.buckets set file_size_limit = 26214400,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/mp4','audio/x-m4a','audio/m4a','audio/aac'] where id = 'media';

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_ids uuid[] not null, source text not null default 'mix', created_at timestamptz not null default now(), finished_at timestamptz);
alter table public.practice_sessions enable row level security;
drop policy if exists "practice: lecture" on public.practice_sessions;
create policy "practice: lecture" on public.practice_sessions for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.q_json(q public.questions) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id',q.id,'text',q.text,'qtype',q.qtype,'autoplay',q.audio_autoplay,'statement_text',q.statement_text,
    'image_path',coalesce((select path from public.media where id = q.image_id), q.image_path),
    'audio_path',(select path from public.media where id = q.audio_id),
    'audio_text',(select text_content from public.media where id = q.audio_id),
    'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id)) $$;

-- La correction immédiate n'est possible QUE pour une séance « S'entraîner » en cours (3 h), jamais pendant un examen blanc
create or replace function public.check_answer(p_question uuid, p_selected uuid[], p_record boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare corr uuid[]; ok boolean; expl text; ca text;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not (public.is_admin()
    or exists (select 1 from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where qq.question_id = p_question and z.kind = 'game' and z.status = 'published')
    or exists (select 1 from public.attempt_answers a where a.user_id = auth.uid() and a.question_id = p_question)
    or exists (select 1 from public.practice_sessions s where s.user_id = auth.uid() and s.finished_at is null and s.created_at > now() - interval '3 hours' and p_question = any(s.question_ids))) then
    raise exception 'Question non accessible'; end if;
  corr := array(select id from public.question_options where question_id = p_question and is_correct);
  ok := (select coalesce(array_agg(x order by x),'{}') from unnest(coalesce(p_selected,'{}')) x) = (select coalesce(array_agg(x order by x),'{}') from unnest(corr) x);
  select explanation, (select path from public.media where id = correction_audio_id) into expl, ca from public.questions where id = p_question;
  if p_record then insert into public.attempt_answers(user_id, question_id, selected, is_correct) values (auth.uid(), p_question, to_jsonb(coalesce(p_selected,'{}')), ok); end if;
  return jsonb_build_object('is_correct', ok, 'correct_ids', to_jsonb(corr), 'explanation', coalesce(expl,''), 'correction_audio_path', ca);
end $$;

create or replace function public.practice_options() returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'bank_total',(select count(*) from public.questions where kind = 'bank'),
    'categories',(select coalesce(jsonb_agg(jsonb_build_object('name',category,'count',c) order by category),'[]'::jsonb) from (select category, count(*) c from public.questions where kind = 'bank' group by category) t),
    'slides',(select coalesce(jsonb_agg(jsonb_build_object('slide_no',z.slide_no,'count',(select count(*) from public.quiz_questions where quiz_id = z.id)) order by z.slide_no),'[]'::jsonb) from public.quizzes z where z.slide_no is not null and z.status = 'published')) $$;

create or replace function public.start_practice(p_source text default 'mix', p_slide int default null, p_category text default null, p_count int default 20) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ids uuid[]; sid uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  p_count := greatest(1, least(coalesce(p_count, 20), 100));
  ids := array(select q.id from public.questions q where (
      (p_source in ('mix','bank') and q.kind = 'bank' and (p_category is null or q.category = p_category))
      or (p_source in ('mix','slides') and q.kind = 'slide' and q.id in (select qq.question_id from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where z.slide_no is not null and z.status = 'published'))
      or (p_source = 'slide' and q.kind = 'slide' and q.id in (select qq.question_id from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where z.slide_no = p_slide and z.status = 'published')))
    and exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct)
    order by random() limit p_count);
  if coalesce(array_length(ids, 1), 0) = 0 then raise exception 'Aucune question disponible pour ce choix'; end if;
  insert into public.practice_sessions(user_id, question_ids, source) values (auth.uid(), ids, p_source) returning id into sid;
  return jsonb_build_object('session_id', sid, 'questions', (select jsonb_agg(public.q_json(q) order by array_position(ids, q.id)) from public.questions q where q.id = any(ids)));
end $$;

create or replace function public.finish_practice(p_session uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.practice_sessions; q public.questions; sel uuid[]; corr uuid[]; ok boolean; c int := 0; w int := 0; t int; pct int; aid uuid; det jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into s from public.practice_sessions where id = p_session and user_id = auth.uid() and finished_at is null;
  if not found then raise exception 'Séance introuvable ou déjà terminée'; end if;
  t := array_length(s.question_ids, 1);
  insert into public.attempts(user_id, quiz_id, kind, total) values (auth.uid(), null, 'practice', t) returning id into aid;
  for q in select qs.* from public.questions qs where qs.id = any(s.question_ids) order by array_position(s.question_ids, qs.id) loop
    sel := array(select j::uuid from jsonb_array_elements_text(coalesce((select x->'selected' from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) x where x->>'question_id' = q.id::text limit 1),'[]'::jsonb)) j);
    corr := array(select id from public.question_options where question_id = q.id and is_correct);
    ok := (select coalesce(array_agg(x order by x),'{}') from unnest(sel) x) = (select coalesce(array_agg(x order by x),'{}') from unnest(corr) x);
    if ok then c := c + 1; else w := w + 1; end if;
    insert into public.attempt_answers(user_id, attempt_id, question_id, selected, is_correct) values (auth.uid(), aid, q.id, to_jsonb(sel), ok);
    det := det || jsonb_build_object('question_id',q.id,'text',q.text,'selected',to_jsonb(sel),'correct_ids',to_jsonb(corr),'is_correct',ok,'explanation',q.explanation,
      'image_path',coalesce((select path from public.media where id = q.image_id), q.image_path),
      'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id));
  end loop;
  pct := case when t = 0 then 0 else round(100.0 * c / t) end;
  update public.attempts set score_pct = pct, correct = c, wrong = w where id = aid;
  update public.practice_sessions set finished_at = now() where id = p_session;
  return jsonb_build_object('score_pct',pct,'correct',c,'wrong',w,'total',t,'passed',null,'pass_score',0,'details',det);
end $$;
revoke execute on function public.practice_options(), public.start_practice(text,int,text,int), public.finish_practice(uuid,jsonb) from public, anon;
grant execute on function public.practice_options(), public.start_practice(text,int,text,int), public.finish_practice(uuid,jsonb) to authenticated;

-- Le cours ne parle plus de mini-jeux
update public.course_sections set blocks = replace(replace(replace(blocks::text, '"🎮 Mini-jeux, quiz et examens blancs"', '"📝 Examen blanc"'), '"/eleve/quiz"', '"/eleve/examen-ecrit"'), 'puis passe un mini-jeu', 'puis lance une série « S’entraîner »')::jsonb
  where blocks::text like '%Mini-jeux%' or blocks::text like '%/eleve/quiz%' or blocks::text like '%passe un mini-jeu%';
update public.course_chapters set summary = replace(summary, 'les mini-jeux et les examens blancs', 'S’entraîner et les examens blancs') where summary like '%mini-jeux%';
