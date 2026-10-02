defmodule Realtime.Repo.Migrations.EnsureJwtSecretIsText do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      modify :jwt_secret, :text, null: true
    end
  end
end
