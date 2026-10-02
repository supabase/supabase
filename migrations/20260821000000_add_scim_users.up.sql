/* auth_migration: 20260821000000 */
-- SCIM Users provisioned into one SSO provider. The resource is stored as a
-- document; queryable columns are generated from it so the two cannot drift.
create table if not exists {{ index .Options "Namespace" }}.scim_users (
    id uuid not null,
    sso_provider_id uuid not null references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade,
    user_id uuid references {{ index .Options "Namespace" }}.users (id) on delete set null,
    resource jsonb not null,
    user_name text not null generated always as (lower(resource->>'userName')) stored,
    external_id text generated always as (resource->>'externalId') stored,
    active boolean not null generated always as (coalesce((resource->>'active')::boolean, true)) stored,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint scim_users_pkey primary key (id)
);

/* auth_migration: 20260821000000 */
-- userName is unique within a provider, case-folded, excluding soft-deleted rows.
create unique index if not exists scim_users_user_name_key
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, user_name)
    where deleted_at is null;

/* auth_migration: 20260821000000 */
-- externalId is unique within a provider when set; nulls are unconstrained.
create unique index if not exists scim_users_external_id_key
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, external_id)
    where external_id is not null and deleted_at is null;

/* auth_migration: 20260821000000 */
-- Links a SCIM user to its auth.users row; not partial, so an ON DELETE SET
-- NULL from auth.users can find soft-deleted rows too.
create index if not exists scim_users_user_id_idx
    on {{ index .Options "Namespace" }}.scim_users (user_id);

/* auth_migration: 20260821000000 */
create index if not exists scim_users_id_idx
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, id)
    where deleted_at is null;

/* auth_migration: 20260821000000 */
create index if not exists scim_users_user_name_idx
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, user_name collate "C", id)
    where deleted_at is null;

/* auth_migration: 20260821000000 */
create index if not exists scim_users_created_at_idx
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, created_at, id)
    where deleted_at is null;

/* auth_migration: 20260821000000 */
create index if not exists scim_users_updated_at_idx
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id, updated_at, id)
    where deleted_at is null;

/* auth_migration: 20260821000000 */
create index if not exists scim_users_sso_provider_id_idx
    on {{ index .Options "Namespace" }}.scim_users (sso_provider_id);

/* auth_migration: 20260821000000 */
-- Supports purging soft-deleted rows.
create index if not exists scim_users_deleted_at_idx
    on {{ index .Options "Namespace" }}.scim_users (deleted_at);
