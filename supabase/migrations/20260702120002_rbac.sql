-- RBAC — funções auxiliares de papel (spec §7).
-- SECURITY DEFINER para consultar users_internal sem recursão de RLS.
-- Nota: auth.users é compartilhado com o front (pacientes). Um usuário só é
-- "interno" se tiver linha em users_internal — por isso NÃO há trigger de
-- criação automática no signup. Usuários internos são criados deliberadamente.

create or replace function public.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users_internal
  where id = auth.uid()
    and status = 'active'
$$;

create or replace function public.has_role(variadic roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = any(roles)
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'super_admin'
$$;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_role(app_role[]) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
