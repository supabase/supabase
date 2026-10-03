/* auth_migration: 20260821010000 */
-- Bearer tokens authorising SCIM requests for one SSO provider. Only the
-- SHA-256 digest is stored; a token carries 160 bits, so the digest needs no salt.
create table if not exists {{ index .Options "Namespace" }}.scim_tokens (
    id uuid not null,
    sso_provider_id uuid not null references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade,
    token_hash text not null,
    prefix text not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    last_used_at timestamptz,
    constraint scim_tokens_pkey primary key (id),
    constraint scim_tokens_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
    constraint scim_tokens_expires_at_future check (expires_at is null or expires_at > created_at),
    constraint scim_tokens_revoked_after_created check (revoked_at is null or revoked_at >= created_at)
);

/* auth_migration: 20260821010000 */
-- The digest resolves a request to a provider, so it is unique across all providers.
create unique index if not exists scim_tokens_token_hash_key
    on {{ index .Options "Namespace" }}.scim_tokens (token_hash);

/* auth_migration: 20260821010000 */
-- Not partial, so an ON DELETE CASCADE from sso_providers can find revoked
-- tokens too.
create index if not exists scim_tokens_sso_provider_id_idx
    on {{ index .Options "Namespace" }}.scim_tokens (sso_provider_id);

/* auth_migration: 20260821010000 */
-- Supports purging expired tokens.
create index if not exists scim_tokens_expires_at_idx
    on {{ index .Options "Namespace" }}.scim_tokens (expires_at);

/* auth_migration: 20260821010000 */
-- Supports purging revoked tokens.
create index if not exists scim_tokens_revoked_at_idx
    on {{ index .Options "Namespace" }}.scim_tokens (revoked_at);
