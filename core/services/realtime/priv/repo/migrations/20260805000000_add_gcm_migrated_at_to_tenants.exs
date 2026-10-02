defmodule Realtime.Repo.Migrations.AddGcmMigratedAtToTenants do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add(:gcm_migrated_at, :utc_datetime)
    end
  end
end
