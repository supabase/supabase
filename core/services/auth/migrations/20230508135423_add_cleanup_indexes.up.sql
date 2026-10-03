-- Indexes used for cleaning up old or stale objects.

create index if not exists
  refresh_tokens_updated_at_idx
  on {{ index .Options "Namespace" }}.refresh_tokens (updated_at desc);

create index if not exists
  flow_state_created_at_idx
  on {{ index .Options "Namespace" }}.flow_state (created_at desc);

create index if not exists
  saml_relay_states_created_at_idx
  on {{ index .Options "Namespace" }}.saml_relay_states (created_at desc);

create index if not exists
  sessions_not_after_idx
  on {{ index .Options "Namespace" }}.sessions (not_after desc);
