defmodule Realtime.Repo.Migrations.AddCdcDefault do
  use Ecto.Migration

  def up do
    alter table("tenants") do
      add(:postgres_cdc_default, :string, default: "postgres_cdc_rls")
    end
  end

  def down do
    alter table("tenants") do
      remove(:postgres_cdc_default)
    end
  end
end
