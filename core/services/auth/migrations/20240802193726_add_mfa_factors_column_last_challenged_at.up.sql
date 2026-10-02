alter table {{ index .Options "Namespace" }}.mfa_factors add column if not exists last_challenged_at timestamptz unique default null;
