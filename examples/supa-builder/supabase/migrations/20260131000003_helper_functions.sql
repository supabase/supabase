-- SupaBuilder Helper Functions
-- Rate limiting and utility functions

-- ============================================================================
-- RATE LIMITING FUNCTION
-- Checks if user has exceeded rate limit (5 projects/hour)
-- ============================================================================

create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_organization_id text,
  p_action text,
  p_max_requests integer default 5,
  p_window_minutes integer default 60
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_window_start timestamptz;
begin
  -- Calculate time window start
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;

  -- Count requests in the time window
  select count(*)
  into v_count
  from public.rate_limits
  where user_id = p_user_id
    and organization_id = p_organization_id
    and action = p_action
    and created_at > v_window_start;

  -- Return true if under limit, false if exceeded
  return v_count < p_max_requests;
end;
$$;

comment on function public.check_rate_limit is 'Check if user is within rate limit for an action';

-- ============================================================================
-- RATE LIMIT RECORDING FUNCTION
-- Records a rate limit event
-- ============================================================================

create or replace function public.record_rate_limit(
  p_user_id uuid,
  p_organization_id text,
  p_action text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.rate_limits (user_id, organization_id, action)
  values (p_user_id, p_organization_id, p_action)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.record_rate_limit is 'Record a rate limit event';

-- ============================================================================
-- AUDIT LOG HELPER FUNCTION
-- Creates an audit log entry
-- ============================================================================

create or replace function public.create_audit_log(
  p_project_id uuid,
  p_action text,
  p_actor_id uuid,
  p_actor_email text,
  p_organization_id text,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.project_audit_logs (
    project_id,
    action,
    actor_id,
    actor_email,
    organization_id,
    metadata
  )
  values (
    p_project_id,
    p_action,
    p_actor_id,
    p_actor_email,
    p_organization_id,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.create_audit_log is 'Create an audit log entry';

-- ============================================================================
-- PROJECT STATUS UPDATE FUNCTION
-- Updates project status with validation and audit logging
-- ============================================================================

create or replace function public.update_project_status(
  p_project_id uuid,
  p_new_status text,
  p_actor_id uuid,
  p_actor_email text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_old_status text;
  v_organization_id text;
begin
  -- Validate status
  if p_new_status not in ('provisioning', 'active', 'paused', 'failed', 'deleted') then
    raise exception 'Invalid status: %', p_new_status;
  end if;

  -- Get current status and org
  select status, organization_id
  into v_old_status, v_organization_id
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'Project not found: %', p_project_id;
  end if;

  -- Update status
  update public.projects
  set status = p_new_status
  where id = p_project_id;

  -- Create audit log
  perform public.create_audit_log(
    p_project_id,
    'update',
    p_actor_id,
    p_actor_email,
    v_organization_id,
    jsonb_build_object(
      'field', 'status',
      'old_value', v_old_status,
      'new_value', p_new_status
    )
  );

  return true;
end;
$$;

comment on function public.update_project_status is 'Update project status with audit logging';

-- ============================================================================
-- SOFT DELETE FUNCTION
-- Soft deletes a project (sets deleted_at timestamp)
-- ============================================================================

create or replace function public.soft_delete_project(
  p_project_id uuid,
  p_actor_id uuid,
  p_actor_email text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_organization_id text;
begin
  -- Get organization ID
  select organization_id
  into v_organization_id
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'Project not found: %', p_project_id;
  end if;

  -- Soft delete (set deleted_at and status)
  update public.projects
  set
    deleted_at = now(),
    status = 'deleted'
  where id = p_project_id
    and deleted_at is null;

  -- Create audit log
  perform public.create_audit_log(
    p_project_id,
    'delete',
    p_actor_id,
    p_actor_email,
    v_organization_id,
    jsonb_build_object('soft_delete', true)
  );

  return true;
end;
$$;

comment on function public.soft_delete_project is 'Soft delete a project with audit logging';

-- ============================================================================
-- CLEANUP OLD RATE LIMITS
-- Function to clean up old rate limit records (run periodically)
-- ============================================================================

create or replace function public.cleanup_old_rate_limits(
  p_retention_hours integer default 168 -- 7 days default
)
returns integer
language plpgsql
security definer
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits
  where created_at < now() - (p_retention_hours || ' hours')::interval;

  get diagnostics v_deleted = row_count;

  return v_deleted;
end;
$$;

comment on function public.cleanup_old_rate_limits is 'Clean up old rate limit records (7+ days)';

-- ============================================================================
-- GET USER PROJECTS COUNT
-- Returns count of active projects for a user
-- ============================================================================

create or replace function public.get_user_projects_count(
  p_user_id uuid,
  p_organization_id text
)
returns integer
language plpgsql
security definer
stable
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.projects
  where creator_id = p_user_id
    and organization_id = p_organization_id
    and deleted_at is null
    and status in ('active', 'provisioning', 'paused');

  return v_count;
end;
$$;

comment on function public.get_user_projects_count is 'Get count of active projects for a user';

-- ============================================================================
-- GET ORGANIZATION PROJECTS COUNT
-- Returns count of all projects in an organization
-- ============================================================================

create or replace function public.get_org_projects_count(
  p_organization_id text
)
returns integer
language plpgsql
security definer
stable
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.projects
  where organization_id = p_organization_id
    and deleted_at is null
    and status in ('active', 'provisioning', 'paused');

  return v_count;
end;
$$;

comment on function public.get_org_projects_count is 'Get count of all projects in an organization';

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

grant execute on function public.check_rate_limit to authenticated;
grant execute on function public.record_rate_limit to authenticated;
grant execute on function public.create_audit_log to authenticated;
grant execute on function public.update_project_status to authenticated;
grant execute on function public.soft_delete_project to authenticated;
grant execute on function public.cleanup_old_rate_limits to authenticated;
grant execute on function public.get_user_projects_count to authenticated;
grant execute on function public.get_org_projects_count to authenticated;
