-- Spock Extension Initialization
-- This migration creates the Spock extension which is required for bi-directional replication
-- The extension will be created regardless of whether replication is configured

-- Create Spock extension
CREATE EXTENSION IF NOT EXISTS spock;

-- Create event trigger to auto-add new tables to replication set
-- This ensures tables created via spock.replicate_ddl() are automatically replicated
CREATE OR REPLACE FUNCTION spock_auto_add_table_to_repset() RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    -- Skip if we're in a replicating session (receiving DDL from another node)
    IF current_setting('spock.replicating', true) IS DISTINCT FROM 'on' THEN
        FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'spock', '_realtime', '_analytics', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'vault', 'extensions', 'pgbouncer', 'auth', 'storage', 'supabase_functions', '_supabase')
            AND command_tag = 'CREATE TABLE'
            AND object_type = 'table'
        LOOP
            BEGIN
                -- Add table to default replication set
                PERFORM spock.repset_add_table('default', obj.object_identity, true);
                RAISE NOTICE 'Spock: Auto-added table % to default replication set', obj.object_identity;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Spock: Could not add % to replication set: %', obj.object_identity, SQLERRM;
            END;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS spock_auto_repset_trigger;
CREATE EVENT TRIGGER spock_auto_repset_trigger ON ddl_command_end
    EXECUTE FUNCTION spock_auto_add_table_to_repset();
