defmodule Realtime.Repo.Migrations.RemoveEnableAuthorizationFlag do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      remove :enable_authorization
    end
  end
end
