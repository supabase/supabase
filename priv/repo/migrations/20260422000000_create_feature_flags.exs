defmodule Realtime.Repo.Migrations.CreateFeatureFlags do
  use Ecto.Migration

  def change do
    create table(:feature_flags, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :enabled, :boolean, null: false, default: false
      timestamps()
    end

    create unique_index(:feature_flags, [:name])

    alter table(:tenants) do
      add :feature_flags, :map, null: false, default: %{}
    end
  end
end
