-- ADAPT'AUTO LAB - WhatsApp gratuit (liens wa.me) : numéros des élèves + numéro de l'auto-école
alter table public.profiles add column if not exists phone text;
alter table public.app_settings add column if not exists whatsapp_number text not null default '';
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'student',
          nullif(left(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[^0-9+]', '', 'g'), 16), ''));
  return new;
end $$;
