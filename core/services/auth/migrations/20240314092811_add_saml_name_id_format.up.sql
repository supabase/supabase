do $$ begin
alter table {{ index .Options "Namespace" }}.saml_providers add column if not exists name_id_format text null;
end $$
