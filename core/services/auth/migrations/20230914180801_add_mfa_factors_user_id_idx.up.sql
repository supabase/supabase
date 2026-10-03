create index if not exists mfa_factors_user_id_idx on {{ index .Options "Namespace" }}.mfa_factors(user_id);
