defmodule Realtime.Repo.Migrations.AddMigrationsRanToTenant do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add(:migrations_ran, :integer, default: 0)
    end
  end
end
