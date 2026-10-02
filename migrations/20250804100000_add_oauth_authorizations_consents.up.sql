-- Create OAuth 2.1 support with enums, authorization, and consent tables

-- Create enums for OAuth authorization management
do $$ begin
    create type {{ index .Options "Namespace" }}.oauth_authorization_status as enum('pending', 'approved', 'denied', 'expired');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type {{ index .Options "Namespace" }}.oauth_response_type as enum('code');
exception
    when duplicate_object then null;
end $$;

-- Create oauth_authorizations table for OAuth 2.1 authorization requests
create table if not exists {{ index .Options "Namespace" }}.oauth_authorizations (
    id uuid not null,
    authorization_id text not null,
    client_id uuid not null references {{ index .Options "Namespace" }}.oauth_clients(id) on delete cascade,
    user_id uuid null references {{ index .Options "Namespace" }}.users(id) on delete cascade,
    redirect_uri text not null,
    scope text not null,
    state text null,
    resource text null,
    code_challenge text null,
    code_challenge_method {{ index .Options "Namespace" }}.code_challenge_method null,
    response_type {{ index .Options "Namespace" }}.oauth_response_type not null default 'code',
    
    -- Flow control
    status {{ index .Options "Namespace" }}.oauth_authorization_status not null default 'pending',
    authorization_code text null,
    
    -- Timestamps
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '3 minutes'),
    approved_at timestamptz null,
    
    constraint oauth_authorizations_pkey primary key (id),
    constraint oauth_authorizations_authorization_id_key unique (authorization_id),
    constraint oauth_authorizations_authorization_code_key unique (authorization_code),
    constraint oauth_authorizations_redirect_uri_length check (char_length(redirect_uri) <= 2048),
    constraint oauth_authorizations_scope_length check (char_length(scope) <= 4096),
    constraint oauth_authorizations_state_length check (char_length(state) <= 4096),
    constraint oauth_authorizations_resource_length check (char_length(resource) <= 2048),
    constraint oauth_authorizations_code_challenge_length check (char_length(code_challenge) <= 128),
    constraint oauth_authorizations_authorization_code_length check (char_length(authorization_code) <= 255),
    constraint oauth_authorizations_expires_at_future check (expires_at > created_at)
);

-- Create indexes for oauth_authorizations
--  for CleanupExpiredOAuthServerAuthorizations
create index if not exists oauth_auth_pending_exp_idx
    on {{ index .Options "Namespace" }}.oauth_authorizations (expires_at)
    where status = 'pending';



-- Create oauth_consents table for user consent management
create table if not exists {{ index .Options "Namespace" }}.oauth_consents (
    id uuid not null,
    user_id uuid not null references {{ index .Options "Namespace" }}.users(id) on delete cascade,
    client_id uuid not null references {{ index .Options "Namespace" }}.oauth_clients(id) on delete cascade,
    scopes text not null,
    granted_at timestamptz not null default now(),
    revoked_at timestamptz null,
    
    constraint oauth_consents_pkey primary key (id),
    constraint oauth_consents_user_client_unique unique (user_id, client_id),
    constraint oauth_consents_scopes_length check (char_length(scopes) <= 2048),
    constraint oauth_consents_scopes_not_empty check (char_length(trim(scopes)) > 0),
    constraint oauth_consents_revoked_after_granted check (revoked_at is null or revoked_at >= granted_at)
);

-- Create indexes for oauth_consents
-- Active consent look-up (user + client, only non-revoked rows)
create index if not exists oauth_consents_active_user_client_idx
    on {{ index .Options "Namespace" }}.oauth_consents (user_id, client_id)
    where revoked_at is null;

-- "Show me all consents for this user, newest first"
create index if not exists oauth_consents_user_order_idx
    on {{ index .Options "Namespace" }}.oauth_consents (user_id, granted_at desc);

-- Bulk revoke for an entire client (only non-revoked rows)
create index if not exists oauth_consents_active_client_idx
    on {{ index .Options "Namespace" }}.oauth_consents (client_id)
    where revoked_at is null;
