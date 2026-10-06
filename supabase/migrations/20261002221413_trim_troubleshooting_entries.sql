alter table troubleshooting_entries
  drop column if exists title,
  drop column if exists topics,
  drop column if exists keywords,
  drop column if exists api,
  drop column if exists errors,
  drop column if exists checksum;

-- Nullable: 278 existing rows predate kb and have no sensible slug value.
alter table troubleshooting_entries
  add column slug text unique;
