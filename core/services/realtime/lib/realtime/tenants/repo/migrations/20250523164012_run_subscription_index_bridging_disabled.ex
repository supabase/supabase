defmodule Realtime.Tenants.Migrations.RunSubscriptionIndexBridgingDisabled do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("""
    alter table realtime.subscription reset (index_bridging);
    """)
  end
end
