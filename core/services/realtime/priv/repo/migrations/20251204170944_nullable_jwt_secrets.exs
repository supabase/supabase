defmodule Realtime.Repo.Migrations.NullableJwtSecrets do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      modify :jwt_secret, :text, null: true
    end

    create constraint(:tenants, :jwt_secret_or_jwt_jwks_required,
             check: "jwt_secret IS NOT NULL OR jwt_jwks IS NOT NULL"
           )
  end
end
