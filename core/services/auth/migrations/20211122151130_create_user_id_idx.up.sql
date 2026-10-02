-- create index on identities.user_id

CREATE INDEX IF NOT EXISTS identities_user_id_idx ON "{{ index .Options "Namespace" }}".identities using btree (user_id);
