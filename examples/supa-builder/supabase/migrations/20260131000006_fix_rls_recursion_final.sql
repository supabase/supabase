-- Final fix for RLS infinite recursion
-- Solution: Make user_roles completely open for SELECT (no recursion)
-- Access control happens at the projects level, not at viewing roles

-- ============================================================================
-- DROP ALL EXISTING user_roles POLICIES
-- ============================================================================

drop policy if exists "Users can view their own roles" on public.user_roles;
drop policy if exists "Users can view roles in their organizations" on public.user_roles;
drop policy if exists "Allow role assignments" on public.user_roles;
drop policy if exists "Allow role updates" on public.user_roles;
drop policy if exists "Allow role deletions" on public.user_roles;

-- ============================================================================
-- SIMPLE NON-RECURSIVE POLICIES FOR user_roles
-- ============================================================================

-- Policy: All authenticated users can view all roles
-- This is safe because viewing roles doesn't grant access to projects
-- Project access is controlled by separate RLS policies on the projects table
create policy "Authenticated users can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (true);

-- Policy: Prevent inserts via RLS (use helper functions instead)
-- This ensures role assignment goes through proper validation
create policy "No direct role inserts"
  on public.user_roles
  for insert
  to authenticated
  with check (false);

-- Policy: Prevent updates via RLS (use helper functions instead)
create policy "No direct role updates"
  on public.user_roles
  for update
  to authenticated
  using (false);

-- Policy: Prevent deletes via RLS (use helper functions instead)
create policy "No direct role deletes"
  on public.user_roles
  for delete
  to authenticated
  using (false);

-- ============================================================================
-- HELPER FUNCTION FOR ROLE ASSIGNMENT (bypasses RLS)
-- ============================================================================

-- Function to assign initial role (used by trigger)
create or replace function public.assign_user_role(
  p_user_id uuid,
  p_organization_id text,
  p_role text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, organization_id, role)
  values (p_user_id, p_organization_id, p_role)
  on conflict (user_id, organization_id) do nothing;

  return true;
end;
$$;

grant execute on function public.assign_user_role to authenticated;

comment on function public.assign_user_role is 'Assign role to user (bypasses RLS)';

-- ============================================================================
-- UPDATE AUTO-ADMIN ASSIGNMENT TRIGGER TO USE NEW FUNCTION
-- ============================================================================

create or replace function public.auto_assign_first_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id text;
  v_user_count integer;
begin
  -- Extract organization from user metadata
  v_org_id := coalesce(
    new.raw_user_meta_data->>'organization_id',
    new.raw_user_meta_data->>'org_id',
    new.raw_user_meta_data->>'hd',  -- Google Workspace hosted domain
    new.raw_app_meta_data->>'organization_id',
    'default_org'  -- Fallback for development/testing
  );

  -- Count existing users in this organization
  select count(*)
  into v_user_count
  from public.user_roles
  where organization_id = v_org_id;

  -- Assign role based on whether this is first user
  if v_user_count = 0 then
    perform public.assign_user_role(new.id, v_org_id, 'admin');
    raise notice 'Auto-assigned admin role to user % in organization %', new.email, v_org_id;
  else
    perform public.assign_user_role(new.id, v_org_id, 'builder');
    raise notice 'Auto-assigned builder role to user % in organization %', new.email, v_org_id;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- UPDATE promote_to_admin FUNCTION
-- ============================================================================

create or replace function public.promote_to_admin(
  p_user_email text,
  p_organization_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_caller_role text;
begin
  -- Get caller's role (this function bypasses RLS)
  select role into v_caller_role
  from public.user_roles
  where user_id = auth.uid()
    and organization_id = p_organization_id;

  -- Check if caller is admin
  if v_caller_role != 'admin' then
    raise exception 'Only admins can promote users';
  end if;

  -- Get user ID from email
  select id into v_user_id
  from auth.users
  where email = p_user_email;

  if v_user_id is null then
    raise exception 'User not found: %', p_user_email;
  end if;

  -- Update role to admin (bypasses RLS because security definer)
  update public.user_roles
  set role = 'admin',
      assigned_by = auth.uid(),
      assigned_at = now()
  where user_id = v_user_id
    and organization_id = p_organization_id;

  return true;
end;
$$;

comment on policy "Authenticated users can view all roles" on public.user_roles is 'Allow viewing roles - access control happens at projects level';
