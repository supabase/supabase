defmodule Realtime.Tenants.Migrations.RealtimeSubscriptionUnlogged do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("""
    -- Commented to have oriole compatability
    -- ALTER TABLE realtime.subscription SET UNLOGGED;
    """)
  end
end
