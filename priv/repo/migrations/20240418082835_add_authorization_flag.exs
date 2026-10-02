defmodule Realtime.Repo.Migrations.AddAuthorizationFlag do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :enable_authorization, :boolean, default: false
    end
  end
end
