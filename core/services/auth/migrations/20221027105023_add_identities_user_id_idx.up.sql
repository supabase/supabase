create index if not exists identities_user_id_idx on {{ index .Options "Namespace" }}.identities using btree (user_id);
