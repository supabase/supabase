/* auth_migration: 20260824000001 */
create table if not exists {{ index .Options "Namespace" }}.mfa_recovery_code_sets (
    id uuid primary key,
    user_id uuid not null unique references {{ index .Options "Namespace" }}.users (id) on delete cascade,
    mfa_factor_id uuid not null unique references {{ index .Options "Namespace" }}.mfa_factors (id) on delete cascade,
    failed_verification_count integer not null default 0 check (failed_verification_count >= 0),
    verification_locked_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

/* auth_migration: 20260824000001 */
create table if not exists {{ index .Options "Namespace" }}.mfa_recovery_codes (
    id uuid primary key,
    mfa_recovery_code_set_id uuid not null references {{ index .Options "Namespace" }}.mfa_recovery_code_sets (id) on delete cascade,
    code_hash text not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
);

/* auth_migration: 20260824000001 */
create index if not exists mfa_recovery_codes_set_id_idx
    on {{ index .Options "Namespace" }}.mfa_recovery_codes (mfa_recovery_code_set_id);
