-- adds confirmed at

ALTER TABLE {{ index .Options "Namespace" }}.users
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz GENERATED ALWAYS AS (LEAST (users.email_confirmed_at, users.phone_confirmed_at)) STORED;
