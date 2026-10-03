defmodule Realtime.Tenants.Migrations.AddUpdateGrantToChannels do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    GRANT UPDATE ON realtime.channels TO postgres, anon, authenticated, service_role
    """)
  end
end
