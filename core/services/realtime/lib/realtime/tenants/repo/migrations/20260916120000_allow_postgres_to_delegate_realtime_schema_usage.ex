defmodule Realtime.Tenants.Migrations.AllowPostgresToDelegateRealtimeSchemaUsage do
  @moduledoc false

  use Ecto.Migration

  def up do
    execute("GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION")
  end

  def down do
    execute("REVOKE GRANT OPTION FOR USAGE ON SCHEMA realtime FROM postgres CASCADE")
  end
end
