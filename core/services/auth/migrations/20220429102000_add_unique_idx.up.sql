-- add partial unique indices to confirmation_token, recovery_token, email_change_token_current, email_change_token_new, phone_change_token, reauthentication_token
-- ignores partial unique index creation on fields which contain empty strings, whitespaces or purely numeric otps

DROP INDEX IF EXISTS confirmation_token_idx; 
DROP INDEX IF EXISTS recovery_token_idx;
DROP INDEX IF EXISTS email_change_token_current_idx;
DROP INDEX IF EXISTS email_change_token_new_idx;
DROP INDEX IF EXISTS reauthentication_token_idx;

CREATE UNIQUE INDEX IF NOT EXISTS confirmation_token_idx ON {{ index .Options "Namespace" }}.users USING btree (confirmation_token) WHERE confirmation_token !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS recovery_token_idx ON {{ index .Options "Namespace" }}.users USING btree (recovery_token) WHERE recovery_token !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_current_idx ON {{ index .Options "Namespace" }}.users USING btree (email_change_token_current) WHERE email_change_token_current !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_new_idx ON {{ index .Options "Namespace" }}.users USING btree (email_change_token_new) WHERE email_change_token_new !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS reauthentication_token_idx ON {{ index .Options "Namespace" }}.users USING btree (reauthentication_token) WHERE reauthentication_token !~ '^[0-9 ]*$';
