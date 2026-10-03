alter table if exists {{ index .Options "Namespace" }}.sessions
  add column if not exists tag text;
