-- ADAPT'AUTO LAB - médias (images, audios), parcours (à lancer après 03)
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('image','audio')),
  name text not null, path text not null unique, text_content text not null default '', created_at timestamptz not null default now());
alter table public.media enable row level security;
drop policy if exists "media: admin" on public.media;
create policy "media: admin" on public.media for all using (public.is_admin()) with check (public.is_admin());
alter table public.questions add column if not exists image_id uuid references public.media(id) on delete set null,
  add column if not exists audio_id uuid references public.media(id) on delete set null,
  add column if not exists correction_audio_id uuid references public.media(id) on delete set null,
  add column if not exists audio_autoplay boolean not null default false;
alter table public.quizzes add column if not exists intro_audio_id uuid references public.media(id) on delete set null,
  add column if not exists outro_audio_id uuid references public.media(id) on delete set null;

-- Stockage : lecture publique par lien, écriture réservée à l'admin, types et taille limités (10 Mo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media',true,10485760,array['image/jpeg','image/png','image/webp','audio/mpeg'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "media lecture" on storage.objects; drop policy if exists "media ajout admin" on storage.objects;
drop policy if exists "media modif admin" on storage.objects; drop policy if exists "media suppr admin" on storage.objects;
create policy "media lecture" on storage.objects for select using (bucket_id = 'media');
create policy "media ajout admin" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media modif admin" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "media suppr admin" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

create table if not exists public.paths (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  status text not null default 'draft' check (status in ('draft','published')), created_at timestamptz not null default now());
create table if not exists public.path_steps (
  id uuid primary key, path_id uuid not null references public.paths(id) on delete cascade, position int not null default 0,
  chapter text not null default '', type text not null check (type in ('lesson','game','exam')), title text not null,
  content text not null default '', video_url text not null default '', quiz_id uuid references public.quizzes(id) on delete set null,
  unlock_type text not null default 'free' check (unlock_type in ('free','previous','previous_score','all_previous')), min_score int not null default 70);
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade, step_id uuid not null references public.path_steps(id) on delete cascade,
  completed_at timestamptz not null default now(), primary key (user_id, step_id));
alter table public.paths enable row level security; alter table public.path_steps enable row level security; alter table public.lesson_progress enable row level security;
drop policy if exists "paths: admin" on public.paths; drop policy if exists "paths: élèves" on public.paths; drop policy if exists "steps: admin" on public.path_steps;
drop policy if exists "steps: élèves" on public.path_steps; drop policy if exists "lp: lecture" on public.lesson_progress; drop policy if exists "lp: ajout" on public.lesson_progress;
create policy "paths: admin" on public.paths for all using (public.is_admin()) with check (public.is_admin());
create policy "paths: élèves" on public.paths for select using (status = 'published');
create policy "steps: admin" on public.path_steps for all using (public.is_admin()) with check (public.is_admin());
create policy "steps: élèves" on public.path_steps for select using (exists (select 1 from public.paths p where p.id = path_id and p.status = 'published'));
create policy "lp: lecture" on public.lesson_progress for select using (user_id = auth.uid() or public.is_admin());
create policy "lp: ajout" on public.lesson_progress for insert with check (user_id = auth.uid() and exists (select 1 from public.path_steps s where s.id = step_id));

-- Fonctions mises à jour : renvoient aussi images et audios
create or replace function public.q_json(q public.questions) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id',q.id,'text',q.text,'qtype',q.qtype,'autoplay',q.audio_autoplay,
    'image_path',(select path from public.media where id = q.image_id),'audio_path',(select path from public.media where id = q.audio_id),
    'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id)) $$;
revoke execute on function public.q_json(public.questions) from public, anon, authenticated;

create or replace function public.get_quiz(p_quiz uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare qz public.quizzes; res jsonb;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into qz from public.quizzes where id = p_quiz and (status = 'published' or public.is_admin());
  if not found then raise exception 'Contenu introuvable ou non publié'; end if;
  select jsonb_build_object('id',qz.id,'kind',qz.kind,'title',qz.title,'intro_text',qz.intro_text,'outro_text',qz.outro_text,'duration_min',qz.duration_min,'pass_score',qz.pass_score,
    'intro_audio',(select path from public.media where id = qz.intro_audio_id),'outro_audio',(select path from public.media where id = qz.outro_audio_id),
    'questions', coalesce((select jsonb_agg(public.q_json(q) order by qq.position) from public.quiz_questions qq join public.questions q on q.id = qq.question_id where qq.quiz_id = qz.id),'[]'::jsonb)) into res;
  return res;
end $$;

create or replace function public.get_error_questions() returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(public.q_json(q)), '[]'::jsonb) from public.questions q where auth.uid() is not null and q.id in (
    select question_id from (select distinct on (question_id) question_id, is_correct from public.attempt_answers
      where user_id = auth.uid() order by question_id, created_at desc) t where not t.is_correct) $$;

create or replace function public.check_answer(p_question uuid, p_selected uuid[], p_record boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare corr uuid[]; ok boolean; expl text; ca text;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not (public.is_admin()
    or exists (select 1 from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where qq.question_id = p_question and z.kind = 'game' and z.status = 'published')
    or exists (select 1 from public.attempt_answers a where a.user_id = auth.uid() and a.question_id = p_question)) then
    raise exception 'Question non accessible'; end if;
  corr := array(select id from public.question_options where question_id = p_question and is_correct);
  ok := (select coalesce(array_agg(x order by x),'{}') from unnest(coalesce(p_selected,'{}')) x) = (select coalesce(array_agg(x order by x),'{}') from unnest(corr) x);
  select explanation, (select path from public.media where id = correction_audio_id) into expl, ca from public.questions where id = p_question;
  if p_record then insert into public.attempt_answers(user_id, question_id, selected, is_correct) values (auth.uid(), p_question, to_jsonb(coalesce(p_selected,'{}')), ok); end if;
  return jsonb_build_object('is_correct', ok, 'correct_ids', to_jsonb(corr), 'explanation', coalesce(expl,''), 'correction_audio_path', ca);
end $$;
