require Logger

import Ecto.Adapters.SQL, only: [query: 3]

alias Realtime.Api
alias Realtime.Api.Tenant
alias Realtime.Env
alias Realtime.Repo
alias Realtime.Tenants

tenant_name = System.get_env("SELF_HOST_TENANT_NAME", "realtime-dev")
default_db_host = "host.docker.internal"

{:ok, _flag} = Api.upsert_feature_flag(%{name: "gcm_encryption_backfill", enabled: true})

{:ok, tenant} =
  Repo.transaction(fn ->
    case Repo.get_by(Tenant, external_id: tenant_name) do
      %Tenant{} = tenant -> Repo.delete!(tenant)
      nil -> {:ok, nil}
    end

    %Tenant{}
    |> Tenant.changeset(%{
      "name" => tenant_name,
      "external_id" => tenant_name,
      "jwt_secret" => System.get_env("API_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long"),
      "jwt_jwks" => System.get_env("API_JWT_JWKS") |> then(fn v -> if v, do: Jason.decode!(v) end),
      "extensions" => [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_name" => System.get_env("DB_NAME", "postgres"),
            "db_host" => System.get_env("DB_HOST", default_db_host),
            "db_user" => System.get_env("DB_USER", "supabase_admin"),
            "db_password" => System.get_env("DB_PASSWORD", "postgres"),
            "db_port" => System.get_env("DB_PORT", "5433"),
            "region" => "us-east-1",
            "poll_interval_ms" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "ssl_enforced" => Env.get_boolean("DB_SSL", false)
          }
        }
      ]
    })
    |> Repo.insert!()
  end)

tenant = Tenants.get_tenant_by_external_id(tenant_name)

with res when res in [:noop, :ok] <- Tenants.Migrations.run_migrations(tenant),
     :ok <- Tenants.Janitor.MaintenanceTask.run(tenant.external_id) do
  Logger.info("Tenant set-up successfully")
else
  error ->
    Logger.info("Failed to set-up tenant: #{inspect(error)}")
end
