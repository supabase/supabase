alter table if exists {{ index .Options "Namespace" }}.sessions
  add column if not exists oauth_client_id uuid;

alter table {{ index .Options "Namespace" }}.sessions
  add constraint sessions_oauth_client_id_fkey foreign key (oauth_client_id)
  references {{ index .Options "Namespace" }}.oauth_clients(id) on delete cascade not valid;

alter table {{ index .Options "Namespace" }}.sessions
  validate constraint sessions_oauth_client_id_fkey;

create index if not exists sessions_oauth_client_id_idx on {{ index .Options "Namespace" }}.sessions (oauth_client_id);
