defmodule Realtime.Repo.Migrations.AdddTenantJwtJwksColumn do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :jwt_jwks, :map, default: nil
    end
  end
end
