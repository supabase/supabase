defmodule Realtime.Repo.Migrations.AddTenantBroadcastAdapter do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :broadcast_adapter, :string, default: "phoenix"
    end
  end
end
