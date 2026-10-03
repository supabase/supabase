defmodule Realtime.Tenants.Migrations.SubscriptionIndexBridgingDisabled do
  @moduledoc false
  use Ecto.Migration

  def change do
    """
    alter table realtime.subscription reset (index_bridging);
    """
  end
end
