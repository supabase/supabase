-- Drop the client_id column and related constraints/indexes from oauth_clients table
-- The id (uuid) field will serve as the public client_id

-- Drop the unique constraint on client_id
alter table {{ index .Options "Namespace" }}.oauth_clients 
    drop constraint if exists oauth_clients_client_id_key;

-- Drop the index on client_id
drop index if exists {{ index .Options "Namespace" }}.oauth_clients_client_id_idx;

-- Drop the client_id column
alter table {{ index .Options "Namespace" }}.oauth_clients 
    drop column if exists client_id;
