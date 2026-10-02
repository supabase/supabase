/* auth_migration: 20260831180000 */
alter table {{ index .Options "Namespace" }}.one_time_tokens
    add column if not exists expires_at timestamptz;
