defmodule Realtime.Tenants.Migrations.RevokeRealtimeSchemaGrantOptionFromRealtimeAdmin do
  @moduledoc false

  use Ecto.Migration

  def up do
    execute("REVOKE GRANT OPTION FOR ALL ON SCHEMA realtime FROM supabase_realtime_admin CASCADE")
  end

  def down do
    execute("GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin WITH GRANT OPTION")
  end
end
