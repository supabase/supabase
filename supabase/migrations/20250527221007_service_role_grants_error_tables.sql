-- service_role needs access to content tables to run sync scripts
grant usage on schema content to service_role;
grant all on table content.service to service_role;
grant all on table content.error to service_role;
