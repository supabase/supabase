defmodule Realtime.Tenants.Migrations.GrantRealtimeUsageToAuthenticatedRole do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("grant usage on schema realtime to authenticated;")
  end
end
