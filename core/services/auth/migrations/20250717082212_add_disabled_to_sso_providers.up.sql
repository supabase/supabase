do $$ begin

    alter table only {{ index .Options "Namespace" }}.sso_providers
        add column if not exists disabled boolean null;

    create index if not exists sso_providers_resource_id_pattern_idx
        on {{ index .Options "Namespace" }}.sso_providers
            (resource_id text_pattern_ops);
end $$;
