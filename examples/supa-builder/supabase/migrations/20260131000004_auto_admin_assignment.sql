-- Auto-assign admin role to first user per organization
-- This trigger runs after a new user signs in via SSO

-- ============================================================================
-- AUTO ADMIN ASSIGNMENT FUNCTION
-- Automatically assigns admin role to first user in an organization
-- ============================================================================

create or replace function public.auto_assign_first_admin()
returns trigger
language plpgsql
security definer
as $$
declare
  v_org_id text;
  v_user_count integer;
begin
  -- Extract organization from user metadata (set via SSO claims)
  -- Adjust this based on your SSO configuration
  --
  -- For Google Workspace: use 'hd' (hosted domain)
  -- For Azure AD/Okta: use custom claim 'organization_id'
  -- For development: use 'default_org'
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

  -- If this is the first user, make them admin
  if v_user_count = 0 then
    insert into public.user_roles (user_id, organization_id, role)
    values (new.id, v_org_id, 'admin')
    on conflict (user_id, organization_id) do nothing;

    raise notice 'Auto-assigned admin role to user % in organization %', new.email, v_org_id;
  else
    -- Subsequent users get builder role by default
    insert into public.user_roles (user_id, organization_id, role)
    values (new.id, v_org_id, 'builder')
    on conflict (user_id, organization_id) do nothing;

    raise notice 'Auto-assigned builder role to user % in organization %', new.email, v_org_id;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- TRIGGER ON AUTH.USERS
-- Fires when a new user is created (after SSO sign-in)
-- ============================================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.auto_assign_first_admin();

comment on function public.auto_assign_first_admin is 'Automatically assign admin role to first user per organization, builder to others';

-- ============================================================================
-- MANUAL ADMIN ASSIGNMENT FUNCTION (for additional admins)
-- Admins can use this to promote other users
-- ============================================================================

create or replace function public.promote_to_admin(
  p_user_email text,
  p_organization_id text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_caller_is_admin boolean;
begin
  -- Check if caller is admin
  select exists(
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and organization_id = p_organization_id
      and role = 'admin'
  ) into v_caller_is_admin;

  if not v_caller_is_admin then
    raise exception 'Only admins can promote users';
  end if;

  -- Get user ID from email
  select id into v_user_id
  from auth.users
  where email = p_user_email;

  if v_user_id is null then
    raise exception 'User not found: %', p_user_email;
  end if;

  -- Update role to admin
  update public.user_roles
  set role = 'admin',
      assigned_by = auth.uid(),
      assigned_at = now()
  where user_id = v_user_id
    and organization_id = p_organization_id;

  return true;
end;
$$;

grant execute on function public.promote_to_admin to authenticated;

comment on function public.promote_to_admin is 'Allow admins to promote other users to admin role';
