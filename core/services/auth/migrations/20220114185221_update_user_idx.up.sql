-- updates users_instance_id_email_idx definition

DROP INDEX IF EXISTS users_instance_id_email_idx;
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx on "{{ index .Options "Namespace" }}".users using btree (instance_id, lower(email));
