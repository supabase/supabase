create index if not exists sessions_user_id_idx on {{ index .Options "Namespace" }}.sessions (user_id);

