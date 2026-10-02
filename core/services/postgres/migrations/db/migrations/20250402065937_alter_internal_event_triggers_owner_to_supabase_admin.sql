-- migrate:up
drop event trigger if exists issue_pg_net_access;

alter function extensions.grant_pg_net_access owner to supabase_admin;

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
  WHEN TAG IN ('CREATE EXTENSION')
  EXECUTE FUNCTION extensions.grant_pg_net_access();

-- migrate:down
