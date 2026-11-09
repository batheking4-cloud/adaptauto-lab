-- ADAPT'AUTO LAB - Phase 1 : profils, rôles, réglages
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('admin','student')),
  created_at timestamptz not null default now()
);
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  mode text not null default 'dark',
  primary_color text not null default '#0a84ff',
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- Test d'administrateur côté serveur (security definer évite la récursion RLS)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Création automatique du profil : le rôle est TOUJOURS 'student' (jamais lu depuis l'inscription)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'student');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;

create policy "profil: lecture propre ou admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profil: modif nom (rôle inchangé)" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profil: admin modifie tout" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy "profil: admin supprime" on public.profiles for delete using (public.is_admin());

create policy "réglages: lecture tous" on public.app_settings for select using (true);
create policy "réglages: admin modifie" on public.app_settings for update
  using (public.is_admin()) with check (public.is_admin());
