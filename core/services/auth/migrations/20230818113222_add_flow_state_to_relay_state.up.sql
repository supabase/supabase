alter table {{ index .Options "Namespace" }}.saml_relay_states add column if not exists flow_state_id uuid references {{ index .Options "Namespace" }}.flow_state(id) on delete cascade default null;
