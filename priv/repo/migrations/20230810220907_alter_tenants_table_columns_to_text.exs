defmodule Realtime.Repo.Migrations.AlterTenantsTableColumnsToText do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      modify :name, :text
      modify :external_id, :text
      modify :jwt_secret, :text
      modify :postgres_cdc_default, :text, default: "postgres_cdc_rls"
    end
  end
end
