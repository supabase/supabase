-- Create unified custom OAuth/OIDC providers table
-- This table stores both OAuth2 and OIDC providers with type discrimination

/* auth_migration: 20260219120000 */
create table if not exists {{ index .Options "Namespace" }}.custom_oauth_providers (
    id uuid not null default gen_random_uuid(),

    -- Provider type: 'oauth2' or 'oidc'
    provider_type text not null check (provider_type in ('oauth2', 'oidc')),

    -- Common fields for both OAuth2 and OIDC
    identifier text not null,
    name text not null,
    client_id text not null,
    client_secret text not null, -- Encrypted at application level
    -- Store JSON-encoded string slices in jsonb columns
    acceptable_client_ids text[] not null default '{}', -- Additional client IDs for multi-platform apps
    scopes text[] not null default '{}',
    pkce_enabled boolean not null default true,
    attribute_mapping jsonb not null default '{}',
    authorization_params jsonb not null default '{}',
    enabled boolean not null default true,
    email_optional boolean not null default false, -- Allow sign-in without email

    -- OIDC-specific fields (null for OAuth2 providers)
    issuer text null,
    discovery_url text null, -- Optional override for .well-known/openid-configuration
    skip_nonce_check boolean not null default false,
    cached_discovery jsonb null,
    discovery_cached_at timestamptz null,

    -- OAuth2-specific fields (null for OIDC providers)
    authorization_url text null,
    token_url text null,
    userinfo_url text null,
    jwks_uri text null,

    -- Timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Primary key and unique constraints
    constraint custom_oauth_providers_pkey primary key (id),
    constraint custom_oauth_providers_identifier_key unique (identifier),

    -- OIDC-specific constraints
    constraint custom_oauth_providers_oidc_requires_issuer check (
        provider_type != 'oidc' or issuer is not null
    ),
    constraint custom_oauth_providers_oidc_issuer_https check (
        provider_type != 'oidc' or issuer is null or issuer like 'https://%'
    ),
    constraint custom_oauth_providers_oidc_discovery_url_https check (
        provider_type != 'oidc' or discovery_url is null or discovery_url like 'https://%'
    ),

    -- OAuth2-specific constraints
    constraint custom_oauth_providers_oauth2_requires_endpoints check (
        provider_type != 'oauth2' or (
            authorization_url is not null and
            token_url is not null and
            userinfo_url is not null
        )
    ),
    constraint custom_oauth_providers_authorization_url_https check (
        authorization_url is null or authorization_url like 'https://%'
    ),
    constraint custom_oauth_providers_token_url_https check (
        token_url is null or token_url like 'https://%'
    ),
    constraint custom_oauth_providers_userinfo_url_https check (
        userinfo_url is null or userinfo_url like 'https://%'
    ),
    constraint custom_oauth_providers_jwks_uri_https check (
        jwks_uri is null or jwks_uri like 'https://%'
    ),

    -- Format and length constraints
    -- Identifier must be alphanumeric with optional hyphens (no leading/trailing hyphens)
    constraint custom_oauth_providers_identifier_format check (
        identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'
    ),
    constraint custom_oauth_providers_name_length check (
        char_length(name) >= 1 and char_length(name) <= 100
    ),
    constraint custom_oauth_providers_issuer_length check (
        issuer is null or (char_length(issuer) >= 1 and char_length(issuer) <= 2048)
    ),
    constraint custom_oauth_providers_discovery_url_length check (
        discovery_url is null or char_length(discovery_url) <= 2048
    ),
    constraint custom_oauth_providers_authorization_url_length check (
        authorization_url is null or char_length(authorization_url) <= 2048
    ),
    constraint custom_oauth_providers_token_url_length check (
        token_url is null or char_length(token_url) <= 2048
    ),
    constraint custom_oauth_providers_userinfo_url_length check (
        userinfo_url is null or char_length(userinfo_url) <= 2048
    ),
    constraint custom_oauth_providers_jwks_uri_length check (
        jwks_uri is null or char_length(jwks_uri) <= 2048
    ),
    constraint custom_oauth_providers_client_id_length check (
        char_length(client_id) >= 1 and char_length(client_id) <= 512
    )
);

/* auth_migration: 20260219120000 */
create index if not exists custom_oauth_providers_identifier_idx
    on {{ index .Options "Namespace" }}.custom_oauth_providers (identifier);

/* auth_migration: 20260219120000 */
create index if not exists custom_oauth_providers_provider_type_idx
    on {{ index .Options "Namespace" }}.custom_oauth_providers (provider_type);

/* auth_migration: 20260219120000 */
create index if not exists custom_oauth_providers_enabled_idx
    on {{ index .Options "Namespace" }}.custom_oauth_providers (enabled);

/* auth_migration: 20260219120000 */
create index if not exists custom_oauth_providers_created_at_idx
    on {{ index .Options "Namespace" }}.custom_oauth_providers (created_at);
