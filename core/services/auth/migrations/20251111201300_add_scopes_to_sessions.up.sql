-- Add scopes column to sessions table for OAuth scope tracking
-- This is nullable to avoid issues with existing sessions
/* auth_migration: 202511112013000 */
alter table if exists {{ index .Options "Namespace" }}.sessions
  add column if not exists scopes text null;

-- Add constraint to ensure scopes are reasonable length (4KB limit)
/* auth_migration: 202511112013000 */
alter table {{ index .Options "Namespace" }}.sessions
  add constraint sessions_scopes_length check (char_length(scopes) <= 4096);
