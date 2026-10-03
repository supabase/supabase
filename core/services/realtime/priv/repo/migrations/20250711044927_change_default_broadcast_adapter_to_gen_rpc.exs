defmodule Realtime.Repo.Migrations.ChangeDefaultBroadcastAdapterToGenRpc do
  use Ecto.Migration

  def change do
    alter table("tenants") do
      modify :broadcast_adapter, :string, default: "gen_rpc", from: {:string, default: "phoenix"}
    end
  end
end
