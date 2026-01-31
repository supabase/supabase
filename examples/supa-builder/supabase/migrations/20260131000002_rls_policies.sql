-- SupaBuilder RLS Policies
-- Row Level Security policies for admin vs builder access control

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- Admins see all org projects, builders see only their own
-- ============================================================================

-- Policy: Admins can see all projects in their organization
create policy "Admins can view all organization projects"
  on public.projects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.organization_id = projects.organization_id
        and user_roles.role = 'admin'
    )
    and deleted_at is null
  );

-- Policy: Builders can only see projects they created
create policy "Builders can view their own projects"
  on public.projects
  for select
  to authenticated
  using (
    creator_id = auth.uid()
    and deleted_at is null
  );

-- Policy: All authenticated users can create projects (rate limited by function)
create policy "Authenticated users can create projects"
  on public.projects
  for insert
  to authenticated
  with check (
    creator_id = auth.uid()
  );

-- Policy: Admins can update any project in their organization
create policy "Admins can update organization projects"
  on public.projects
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.organization_id = projects.organization_id
        and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.organization_id = projects.organization_id
        and user_roles.role = 'admin'
    )
  );

-- Policy: Builders can update their own projects (limited fields)
create policy "Builders can update their own projects"
  on public.projects
  for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- ============================================================================
-- USER ROLES TABLE POLICIES
-- Only admins can modify roles, everyone can view their own role
-- ============================================================================

-- Policy: Users can view their own roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Admins can view all roles in their organization
create policy "Admins can view organization roles"
  on public.user_roles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = auth.uid()
        and ur.organization_id = user_roles.organization_id
        and ur.role = 'admin'
    )
  );

-- Policy: Admins can assign roles in their organization
create policy "Admins can assign roles"
  on public.user_roles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = auth.uid()
        and ur.organization_id = user_roles.organization_id
        and ur.role = 'admin'
    )
  );

-- Policy: Admins can update roles in their organization
create policy "Admins can update roles"
  on public.user_roles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = auth.uid()
        and ur.organization_id = user_roles.organization_id
        and ur.role = 'admin'
    )
  );

-- Policy: Admins can delete roles in their organization (except their own)
create policy "Admins can delete roles"
  on public.user_roles
  for delete
  to authenticated
  using (
    user_id != auth.uid() -- Can't delete own role
    and exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = auth.uid()
        and ur.organization_id = user_roles.organization_id
        and ur.role = 'admin'
    )
  );

-- ============================================================================
-- PROJECT AUDIT LOGS POLICIES
-- Admins can view all org logs, builders can view their project logs
-- ============================================================================

-- Policy: Admins can view all audit logs in their organization
create policy "Admins can view organization audit logs"
  on public.project_audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.organization_id = project_audit_logs.organization_id
        and user_roles.role = 'admin'
    )
  );

-- Policy: Builders can view audit logs for their projects
create policy "Builders can view their project audit logs"
  on public.project_audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_audit_logs.project_id
        and projects.creator_id = auth.uid()
    )
  );

-- Policy: All authenticated users can insert audit logs (for their own actions)
create policy "Users can create audit logs"
  on public.project_audit_logs
  for insert
  to authenticated
  with check (actor_id = auth.uid());

-- ============================================================================
-- RATE LIMITS TABLE POLICIES
-- Users can view their own rate limits
-- ============================================================================

-- Policy: Users can view their own rate limits
create policy "Users can view their own rate limits"
  on public.rate_limits
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can insert their own rate limit records
create policy "Users can create rate limit records"
  on public.rate_limits
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Admins can view all rate limits in their organization
create policy "Admins can view organization rate limits"
  on public.rate_limits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.organization_id = rate_limits.organization_id
        and user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. Service role keys are encrypted in the database
-- 2. Decryption function should only be called server-side with proper auth
-- 3. Builders cannot see other builders' projects
-- 4. Admins have full visibility within their organization
-- 5. Audit logs are immutable (no update/delete policies)
-- 6. Rate limits prevent abuse even before RLS checks
