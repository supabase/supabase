-- Replaces the legacy `checksum` column from the old GitHub-sync workflow
-- (20241002215612_troubleshooting_validation.sql), which that workflow's
-- removal left behind. Dropped and re-added nullable: existing rows should
-- start out as unsynced, not carry over the old column's stale values.
alter table troubleshooting_entries drop column if exists checksum;
alter table troubleshooting_entries add column checksum text;
