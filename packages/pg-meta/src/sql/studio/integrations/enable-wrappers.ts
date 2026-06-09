
import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCheckWrappersEnabledSQL = (): SafeSqlFragment => 
    safeSql`
    SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'wrappers'
    ) AS is_enabled;
    `

export const getEnableWrappersSQL = (): SafeSqlFragment =>
  safeSql`
BEGIN;

  -- Event trigger that fires when the wrappers extension is created,
  -- granting standard roles access to use it.
  CREATE OR REPLACE FUNCTION extensions.grant_wrappers_access()
  RETURNS event_trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_event_trigger_ddl_commands() AS ev
      JOIN pg_extension AS ext
      ON ev.objid = ext.oid
      WHERE ext.extname = 'wrappers'
    )
    THEN
      GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    END IF;
  END;
  $$;
  COMMENT ON FUNCTION extensions.grant_wrappers_access IS 'Grants access to wrappers';

  -- Register the event trigger only if it does not already exist
  DO
  $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_event_trigger
      WHERE evtname = 'issue_wrappers_access'
    ) THEN
      CREATE EVENT TRIGGER issue_wrappers_access ON ddl_command_end WHEN TAG IN ('CREATE EXTENSION')
      EXECUTE PROCEDURE extensions.grant_wrappers_access();
    END IF;
  END
  $$;

  -- Apply grants immediately if wrappers extension is already installed
  DO
  $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_extension
      WHERE extname = 'wrappers'
    )
    THEN
      GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    END IF;
  END
  $$;

COMMIT;
`