-- Add token_endpoint_auth_method column to oauth_clients table
-- Per RFC 7591: "If unspecified or omitted, the default is 'client_secret_basic'"
-- For public clients, the default is 'none' since they don't have a client secret
/* auth_migration: 20260121000000 */
alter table {{ index .Options "Namespace" }}.oauth_clients
    add column if not exists token_endpoint_auth_method text check (token_endpoint_auth_method in ('client_secret_basic', 'client_secret_post', 'none'));

-- Set default values for existing clients based on their client_type
/* auth_migration: 20260121000000 */
update {{ index .Options "Namespace" }}.oauth_clients
    set token_endpoint_auth_method = case
        when client_type = 'public' then 'none'
        else 'client_secret_basic'
    end
    where token_endpoint_auth_method is null;

-- Now make the column not null
/* auth_migration: 20260121000000 */
alter table {{ index .Options "Namespace" }}.oauth_clients
    alter column token_endpoint_auth_method set not null;
