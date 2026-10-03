-- Add columns for OAuth context (previously stored in JWT state parameter)
/* auth_migration: 20260115000000 */
ALTER TABLE {{ index .Options "Namespace" }}.flow_state
    ADD COLUMN IF NOT EXISTS invite_token TEXT NULL,
    ADD COLUMN IF NOT EXISTS referrer TEXT NULL,
    ADD COLUMN IF NOT EXISTS oauth_client_state_id UUID NULL,
    ADD COLUMN IF NOT EXISTS linking_target_id UUID NULL,
    ADD COLUMN IF NOT EXISTS email_optional BOOLEAN NOT NULL DEFAULT FALSE;

-- Make PKCE fields nullable to support implicit flow
/* auth_migration: 20260115000000 */
ALTER TABLE {{ index .Options "Namespace" }}.flow_state
    ALTER COLUMN code_challenge DROP NOT NULL,
    ALTER COLUMN code_challenge_method DROP NOT NULL,
    ALTER COLUMN auth_code DROP NOT NULL;

/* auth_migration: 20260115000000 */
COMMENT ON TABLE {{ index .Options "Namespace" }}.flow_state
    IS 'Stores metadata for all OAuth/SSO login flows';
