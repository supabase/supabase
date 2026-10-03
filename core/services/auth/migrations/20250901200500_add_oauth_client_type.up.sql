-- Make client_secret_hash nullable to support public clients
-- Public clients don't have client secrets, only confidential clients do

alter table {{ index .Options "Namespace" }}.oauth_clients alter column client_secret_hash drop not null;

-- Add client_type enum and column to oauth_clients table
do $$ begin
    create type {{ index .Options "Namespace" }}.oauth_client_type as enum('public', 'confidential');
exception
    when duplicate_object then null;
end $$;

-- Add client_type column to oauth_clients table
alter table {{ index .Options "Namespace" }}.oauth_clients  add column if not exists client_type {{ index .Options "Namespace" }}.oauth_client_type not null default 'confidential';
