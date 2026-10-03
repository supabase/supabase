-- see: https://stackoverflow.com/questions/7624919/check-if-a-user-defined-type-already-exists-in-postgresql/48382296#48382296
do $$ begin
    create type {{ index .Options "Namespace" }}.factor_type as enum('totp', 'webauthn');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type {{ index .Options "Namespace" }}.factor_status as enum('unverified', 'verified');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type {{ index .Options "Namespace" }}.aal_level as enum('aal1', 'aal2', 'aal3');
exception
    when duplicate_object then null;
end $$;

-- auth.mfa_factors definition
create table if not exists {{ index .Options "Namespace" }}.mfa_factors(
       id uuid not null,
       user_id uuid not null,
       friendly_name text null,
       factor_type {{ index .Options "Namespace" }}.factor_type not null,
       status {{ index .Options "Namespace" }}.factor_status not null,
       created_at timestamptz not null,
       updated_at timestamptz not null,
       secret text null,
       constraint mfa_factors_pkey primary key(id),
       constraint mfa_factors_user_id_fkey foreign key (user_id) references {{ index .Options "Namespace" }}.users(id) on delete cascade
);
comment on table {{ index .Options "Namespace" }}.mfa_factors is 'auth: stores metadata about factors';

create unique index if not exists mfa_factors_user_friendly_name_unique on {{ index .Options "Namespace" }}.mfa_factors (friendly_name, user_id) where trim(friendly_name) <> '';

-- auth.mfa_challenges definition
create table if not exists {{ index .Options "Namespace" }}.mfa_challenges(
       id uuid not null,
       factor_id uuid not null,
       created_at timestamptz not null,
       verified_at timestamptz  null,
       ip_address  inet not null,
       constraint mfa_challenges_pkey primary key (id),
       constraint mfa_challenges_auth_factor_id_fkey foreign key (factor_id) references {{ index .Options "Namespace" }}.mfa_factors(id) on delete cascade
);
comment on table {{ index .Options "Namespace" }}.mfa_challenges is 'auth: stores metadata about challenge requests made';



-- add factor_id and amr claims to session
create table if not exists {{ index .Options "Namespace" }}.mfa_amr_claims(
    session_id uuid not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    authentication_method text not null,
    constraint mfa_amr_claims_session_id_authentication_method_pkey unique(session_id, authentication_method),
    constraint mfa_amr_claims_session_id_fkey foreign key(session_id) references {{ index .Options "Namespace" }}.sessions(id) on delete cascade
);
comment on table {{ index .Options "Namespace" }}.mfa_amr_claims is 'auth: stores authenticator method reference claims for multi factor authentication';
