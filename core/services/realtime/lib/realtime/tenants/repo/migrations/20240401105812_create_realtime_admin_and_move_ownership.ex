defmodule Realtime.Tenants.Migrations.CreateRealtimeAdminAndMoveOwnership do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    DO
    $do$
    BEGIN
       IF EXISTS (
          SELECT FROM pg_catalog.pg_roles
          WHERE  rolname = 'supabase_realtime_admin') THEN

          RAISE NOTICE 'Role "supabase_realtime_admin" already exists. Skipping.';
       ELSE
          CREATE ROLE supabase_realtime_admin WITH NOINHERIT NOLOGIN NOREPLICATION;
       END IF;
    END
    $do$;
    """)

    execute("GRANT ALL PRIVILEGES ON SCHEMA realtime TO supabase_realtime_admin")
    execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA realtime TO supabase_realtime_admin")
    execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA realtime TO supabase_realtime_admin")
    execute("GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA realtime TO supabase_realtime_admin")

    execute("ALTER table realtime.channels OWNER to supabase_realtime_admin")
    execute("ALTER table realtime.broadcasts OWNER to supabase_realtime_admin")
    execute("ALTER table realtime.presences OWNER TO supabase_realtime_admin")
    execute("ALTER function realtime.channel_name() owner to supabase_realtime_admin")

    execute("GRANT supabase_realtime_admin TO postgres;")
  end
end
