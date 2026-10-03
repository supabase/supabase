/* auth_migration: 20250925093508 */
ALTER TABLE {{ index .Options "Namespace" }}.mfa_factors 
ADD COLUMN IF NOT EXISTS last_webauthn_challenge_data JSONB;
/* auth_migration: 20250925093508 */
COMMENT ON COLUMN {{ index .Options "Namespace" }}.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';
