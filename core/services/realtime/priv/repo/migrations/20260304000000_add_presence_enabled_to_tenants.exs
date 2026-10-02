defmodule Realtime.Repo.Migrations.AddPresenceEnabledToTenants do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :presence_enabled, :boolean, default: false, null: false
    end
  end
end
