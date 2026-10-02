alter table {{ index .Options "Namespace" }}.mfa_factors add column if not exists web_authn_credential jsonb null;
alter table {{ index .Options "Namespace" }}.mfa_factors add column if not exists web_authn_aaguid uuid null;
alter table {{ index .Options "Namespace" }}.mfa_challenges add column if not exists web_authn_session_data jsonb null;
