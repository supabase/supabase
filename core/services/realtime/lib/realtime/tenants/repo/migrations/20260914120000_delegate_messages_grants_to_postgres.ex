defmodule Realtime.Tenants.Migrations.DelegateMessagesGrantsToPostgres do
  @moduledoc false

  use Ecto.Migration

  def up do
    execute("""
    ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin
      IN SCHEMA realtime
      GRANT SELECT, INSERT ON TABLES TO postgres WITH GRANT OPTION
    """)

    execute("GRANT SELECT, INSERT ON realtime.messages TO postgres WITH GRANT OPTION")
  end

  def down do
    execute("REVOKE GRANT OPTION FOR SELECT, INSERT ON realtime.messages FROM postgres CASCADE")

    execute("""
    ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin
      IN SCHEMA realtime
      REVOKE GRANT OPTION FOR SELECT, INSERT ON TABLES FROM postgres
    """)
  end
end
