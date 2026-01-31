-- SupaBuilder Initial Schema
-- Core tables for enterprise project provisioning platform

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- PROJECTS TABLE
-- Tracks all child Supabase projects created through SupaBuilder
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),

  -- Project identification
  project_ref text unique not null, -- Supabase project reference (e.g., "abcdefghijklmnop")
  project_name text not null,
  organization_id text not null, -- Enterprise org identifier

  -- Credentials (encrypted)
  anon_key text not null,
  service_role_key_encrypted text not null, -- Encrypted with pgcrypto

  -- Project configuration
  region text not null, -- AWS region (e.g., "us-east-1")
  status text not null default 'provisioning' check (status in ('provisioning', 'active', 'paused', 'failed', 'deleted')),

  -- Metadata
  purpose text, -- Why this project was created
  description text,

  -- Ownership and tracking
  creator_id uuid not null, -- User who created the project (references auth.users)
  creator_email text not null,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, -- Soft delete

  -- Management API metadata
  management_api_response jsonb, -- Store full API response for debugging

  -- Indexes for common queries
  constraint projects_org_name_unique unique (organization_id, project_name, deleted_at)
);

-- Indexes for performance
create index idx_projects_organization on public.projects(organization_id) where deleted_at is null;
create index idx_projects_creator on public.projects(creator_id) where deleted_at is null;
create index idx_projects_status on public.projects(status) where deleted_at is null;
create index idx_projects_created_at on public.projects(created_at desc);

-- Comment
comment on table public.projects is 'Child Supabase projects created through SupaBuilder';

-- ============================================================================
-- USER ROLES TABLE
-- Manages admin vs builder role assignments per organization
-- ============================================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null, -- references auth.users(id)
  organization_id text not null,
  role text not null check (role in ('admin', 'builder')),

  -- Metadata
  assigned_by uuid, -- Admin who assigned this role
  assigned_at timestamptz not null default now(),

  -- Ensure one role per user per org
  constraint user_roles_unique unique (user_id, organization_id)
);

-- Indexes
create index idx_user_roles_user on public.user_roles(user_id);
create index idx_user_roles_org on public.user_roles(organization_id);

comment on table public.user_roles is 'Role assignments for users within organizations';

-- ============================================================================
-- PROJECT AUDIT LOGS TABLE
-- Immutable audit trail of all project operations
-- ============================================================================
create table public.project_audit_logs (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null references public.projects(id) on delete cascade,

  -- Action details
  action text not null check (action in ('create', 'pause', 'resume', 'delete', 'update')),
  actor_id uuid not null, -- User who performed the action
  actor_email text not null,

  -- Context
  organization_id text not null,
  metadata jsonb, -- Additional context (e.g., what was changed)

  -- Timestamp (immutable)
  created_at timestamptz not null default now()
);

-- Indexes for audit queries
create index idx_audit_project on public.project_audit_logs(project_id, created_at desc);
create index idx_audit_actor on public.project_audit_logs(actor_id, created_at desc);
create index idx_audit_org on public.project_audit_logs(organization_id, created_at desc);
create index idx_audit_action on public.project_audit_logs(action);

comment on table public.project_audit_logs is 'Immutable audit trail for all project operations';

-- ============================================================================
-- RATE LIMITS TABLE
-- Simple DB-based rate limiting (5 projects/hour per user)
-- ============================================================================
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,
  organization_id text not null,
  action text not null, -- e.g., 'create_project'

  created_at timestamptz not null default now(),

  -- Index for quick lookups
  constraint rate_limits_idx unique (user_id, organization_id, action, created_at)
);

-- Index for time-based queries
create index idx_rate_limits_user_action on public.rate_limits(user_id, action, created_at desc);

comment on table public.rate_limits is 'Rate limiting tracking for user actions';

-- ============================================================================
-- ENCRYPTION FUNCTIONS
-- Encrypt/decrypt service_role_key using pgcrypto
-- ============================================================================

-- Encryption function
-- Uses AES-256 encryption with a key from environment/secrets
create or replace function public.encrypt_service_role_key(
  p_service_role_key text,
  p_encryption_key text
)
returns text
language plpgsql
security definer
as $$
begin
  return encode(
    pgp_sym_encrypt(
      p_service_role_key,
      p_encryption_key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
end;
$$;

-- Decryption function (admin only)
create or replace function public.decrypt_service_role_key(
  p_encrypted_key text,
  p_encryption_key text
)
returns text
language plpgsql
security definer
as $$
begin
  return pgp_sym_decrypt(
    decode(p_encrypted_key, 'base64'),
    p_encryption_key,
    'cipher-algo=aes256'
  );
end;
$$;

comment on function public.encrypt_service_role_key is 'Encrypt service_role_key using AES-256';
comment on function public.decrypt_service_role_key is 'Decrypt service_role_key (admin only)';

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to projects table
create trigger set_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's role in an organization
create or replace function public.get_user_role(
  p_user_id uuid,
  p_organization_id text
)
returns text
language plpgsql
security definer
stable
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.user_roles
  where user_id = p_user_id
    and organization_id = p_organization_id;

  return coalesce(v_role, 'builder'); -- Default to builder if no role assigned
end;
$$;

comment on function public.get_user_role is 'Get user role within an organization';

-- Function to check if user is admin
create or replace function public.is_admin(
  p_user_id uuid,
  p_organization_id text
)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.user_roles
    where user_id = p_user_id
      and organization_id = p_organization_id
      and role = 'admin'
  );
end;
$$;

comment on function public.is_admin is 'Check if user has admin role in organization';

-- ============================================================================
-- GRANTS
-- Enable RLS and grant basic permissions
-- ============================================================================

-- Enable RLS on all tables
alter table public.projects enable row level security;
alter table public.user_roles enable row level security;
alter table public.project_audit_logs enable row level security;
alter table public.rate_limits enable row level security;

-- Grant usage on schema
grant usage on schema public to authenticated;
grant usage on schema public to anon;

-- Grant permissions on tables (RLS policies will control actual access)
grant select, insert, update on public.projects to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert on public.project_audit_logs to authenticated;
grant select, insert on public.rate_limits to authenticated;

-- Grant execute on functions
grant execute on function public.get_user_role to authenticated;
grant execute on function public.is_admin to authenticated;
