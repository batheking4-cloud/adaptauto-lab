-- Neumorphisme + MIXAGE (texte et audio) - à lancer après 05
alter table public.media alter column path drop not null;
alter table public.media add column if not exists usage text not null default 'autre';
update public.app_settings set mode = 'dark', primary_color = '#1a8cff' where id = 1;
create or replace function public.q_json(q public.questions) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id',q.id,'text',q.text,'qtype',q.qtype,'autoplay',q.audio_autoplay,
    'image_path',(select path from public.media where id = q.image_id),'audio_path',(select path from public.media where id = q.audio_id),
    'audio_text',(select text_content from public.media where id = q.audio_id),
    'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'text',o.text) order by o.position),'[]'::jsonb) from public.question_options o where o.question_id = q.id)) $$;
revoke execute on function public.q_json(public.questions) from public, anon, authenticated;
