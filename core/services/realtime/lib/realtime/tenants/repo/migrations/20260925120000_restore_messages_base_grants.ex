defmodule Realtime.Tenants.Migrations.RestoreMessagesBaseGrants do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT SELECT, INSERT, UPDATE ON realtime.messages TO anon;
      END IF;
    END $$;
    """)

    execute("""
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT SELECT, INSERT, UPDATE ON realtime.messages TO authenticated;
      END IF;
    END $$;
    """)

    execute("""
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT SELECT, INSERT, UPDATE ON realtime.messages TO service_role;
      END IF;
    END $$;
    """)
  end
end
