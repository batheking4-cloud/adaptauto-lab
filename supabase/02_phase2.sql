-- ADAPT'AUTO LAB - Phase 2 : banque de questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null default 'Général',
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  qtype text not null default 'single' check (qtype in ('single','multiple','truefalse')),
  explanation text not null default '',
  image_path text, audio_path text, correction_audio_path text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  position int not null default 0
);
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
-- Admin seulement. Les élèves n'ont AUCUN accès direct (les bonnes réponses restent secrètes ; la Phase 3 ajoutera un accès sûr).
drop policy if exists "questions: admin" on public.questions;
drop policy if exists "options: admin" on public.question_options;
create policy "questions: admin" on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy "options: admin" on public.question_options for all using (public.is_admin()) with check (public.is_admin());

-- Exemples (clairement marqués, pas des questions officielles)
do $$ declare qid uuid; begin
if not exists (select 1 from public.questions where is_demo) then
 insert into public.questions(text,category,difficulty,qtype,explanation,is_demo) values('[EXEMPLE] Que faire devant un feu rouge fixe ?','Signalisation',1,'single','Exemple de démonstration, pas une question officielle du Code de la route sénégalais.',true) returning id into qid;
 insert into public.question_options(question_id,text,is_correct,position) values (qid,'S''arrêter',true,0),(qid,'Ralentir seulement',false,1),(qid,'Accélérer',false,2);
 insert into public.questions(text,category,difficulty,qtype,explanation,is_demo) values('[EXEMPLE] Quelles informations doit montrer un conducteur lors d''un contrôle ?','Documents',2,'multiple','Exemple de démonstration, pas une question officielle.',true) returning id into qid;
 insert into public.question_options(question_id,text,is_correct,position) values (qid,'Le permis de conduire',true,0),(qid,'La carte grise',true,1),(qid,'Un ticket de cinéma',false,2);
 insert into public.questions(text,category,difficulty,qtype,explanation,is_demo) values('[EXEMPLE] La ceinture de sécurité est utile même sur un court trajet.','Sécurité',1,'truefalse','Exemple de démonstration, pas une question officielle.',true) returning id into qid;
 insert into public.question_options(question_id,text,is_correct,position) values (qid,'Vrai',true,0),(qid,'Faux',false,1);
end if; end $$;
