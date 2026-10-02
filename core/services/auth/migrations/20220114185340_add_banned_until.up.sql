-- adds banned_until column

ALTER TABLE {{ index .Options "Namespace" }}.users
ADD COLUMN IF NOT EXISTS banned_until timestamptz NULL;
