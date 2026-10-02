defmodule Realtime.Repo.Migrations.CreateTenants do
  use Ecto.Migration

  def change do
    create table(:tenants, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:name, :string)
      add(:external_id, :string)
      add(:jwt_secret, :string, size: 500)
      add(:max_concurrent_users, :integer, default: 10_000)
      timestamps()
    end

    create(index(:tenants, [:external_id], unique: true))
  end
end
