-- Create enums for OAuth client fields
do $$ begin
    create type {{ index .Options "Namespace" }}.oauth_registration_type as enum('dynamic', 'manual');
exception
    when duplicate_object then null;
end $$;

-- Create oauth_clients table for OAuth client management
create table if not exists {{ index .Options "Namespace" }}.oauth_clients (
    id uuid not null,
    client_id text not null,
    client_secret_hash text not null,
    registration_type {{ index .Options "Namespace" }}.oauth_registration_type not null,
    redirect_uris text not null,
    grant_types text not null,
    client_name text null,
    client_uri text null,
    logo_uri text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz null,
    constraint oauth_clients_pkey primary key (id),
    constraint oauth_clients_client_id_key unique (client_id),
    constraint oauth_clients_client_name_length check (char_length(client_name) <= 1024),
    constraint oauth_clients_client_uri_length check (char_length(client_uri) <= 2048),
    constraint oauth_clients_logo_uri_length check (char_length(logo_uri) <= 2048)
);

-- Create indexes
create index if not exists oauth_clients_client_id_idx 
    on {{ index .Options "Namespace" }}.oauth_clients (client_id);

create index if not exists oauth_clients_deleted_at_idx 
    on {{ index .Options "Namespace" }}.oauth_clients (deleted_at);
