defmodule Realtime.Tenants.Migrations.RemoveUnusedPublications do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("""
    DO $$
    DECLARE
      r RECORD;
    BEGIN
    FOR r IN
        SELECT pubname FROM pg_publication WHERE pubname LIKE 'realtime_messages%' or pubname LIKE 'supabase_realtime_messages%'
    LOOP
        EXECUTE 'DROP PUBLICATION IF EXISTS ' || quote_ident(r.pubname) || ';' ;
    END LOOP;
    END $$;
    """)
  end
end
