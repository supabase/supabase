-- add factor_id to sessions
 alter table {{ index .Options "Namespace" }}.sessions add column if not exists factor_id uuid null;
 alter table {{ index .Options "Namespace" }}.sessions add column if not exists aal {{ index .Options "Namespace" }}.aal_level null;
