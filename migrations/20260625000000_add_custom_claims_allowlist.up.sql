-- Add custom_claims_allowlist column to custom_oauth_providers table
-- Holds a flat list of raw IdP claim keys to copy verbatim into custom_claims.
-- Empty (the default) means no custom claims are captured.
/* auth_migration: 20260625000000 */
alter table {{ index .Options "Namespace" }}.custom_oauth_providers
    add column if not exists custom_claims_allowlist text[] not null default '{}';
