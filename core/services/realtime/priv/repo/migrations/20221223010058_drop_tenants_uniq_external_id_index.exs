defmodule Realtime.Repo.Migrations.DropTenantsUniqExternalIdIndex do
  use Ecto.Migration

  def change do
    execute("ALTER TABLE IF EXISTS tenants DROP CONSTRAINT IF EXISTS uniq_external_id")
  end
end
