defmodule Realtime.Tenants.Migrations.AddInsertAndDeleteGrantToChannels do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    GRANT INSERT, DELETE ON realtime.channels TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT INSERT ON realtime.broadcasts TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT USAGE ON SEQUENCE realtime.broadcasts_id_seq TO postgres, anon, authenticated, service_role
    """)
  end
end
