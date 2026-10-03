-- adds reauthentication_token and reauthentication_sent_at 

ALTER TABLE {{ index .Options "Namespace" }}.users
ADD COLUMN IF NOT EXISTS reauthentication_token varchar(255) null default '',
ADD COLUMN IF NOT EXISTS reauthentication_sent_at timestamptz null default null;
