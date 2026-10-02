-- WebAuthn credentials table stores passkey credential data
/* auth_migration: 20260302000000 */
create table if not exists {{ index .Options "Namespace" }}.webauthn_credentials (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references {{ index .Options "Namespace" }}.users (id) on delete cascade,
    credential_id bytea not null,
    public_key bytea not null,
    attestation_type text not null default '',
    aaguid uuid,
    sign_count bigint not null default 0,
    transports jsonb not null default '[]'::jsonb,
    backup_eligible boolean not null default false,
    backed_up boolean not null default false,
    friendly_name text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_used_at timestamptz,
    constraint webauthn_credentials_pkey primary key (id)
);

/* auth_migration: 20260302000000 */
create unique index if not exists webauthn_credentials_credential_id_key
    on {{ index .Options "Namespace" }}.webauthn_credentials (credential_id);

/* auth_migration: 20260302000000 */
create index if not exists webauthn_credentials_user_id_idx
    on {{ index .Options "Namespace" }}.webauthn_credentials (user_id);

-- WebAuthn challenges table stores temporary challenge/session data
/* auth_migration: 20260302000000 */
create table if not exists {{ index .Options "Namespace" }}.webauthn_challenges (
    id uuid not null default gen_random_uuid(),
    user_id uuid references {{ index .Options "Namespace" }}.users (id) on delete cascade,
    challenge_type text not null check (challenge_type in ('signup', 'registration', 'authentication')),
    session_data jsonb not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    constraint webauthn_challenges_pkey primary key (id)
);

/* auth_migration: 20260302000000 */
create index if not exists webauthn_challenges_user_id_idx
    on {{ index .Options "Namespace" }}.webauthn_challenges (user_id);

/* auth_migration: 20260302000000 */
create index if not exists webauthn_challenges_expires_at_idx
    on {{ index .Options "Namespace" }}.webauthn_challenges (expires_at);
