defmodule Supavisor.Repo.Migrations.CreateTenants do
  use Ecto.Migration

  def change do
    create table(:tenants, primary_key: false, prefix: "_supavisor") do
      add(:id, :binary_id, primary_key: true)
      add(:external_id, :string, null: false)
      add(:db_host, :string, null: false)
      add(:db_port, :integer, null: false)
      add(:db_database, :string, null: false)

      timestamps()
    end

    create(index(:tenants, [:external_id], unique: true, prefix: "_supavisor"))
  end
end
