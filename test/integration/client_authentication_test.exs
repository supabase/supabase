defmodule Supavisor.Integration.ClientAuthenticationTest do
  use SupavisorWeb.ConnCase, async: false

  require Supavisor

  import ExUnit.CaptureLog

  alias Supavisor.ClientAuthentication
  alias Supavisor.ClientAuthentication.RefreshLimiter
  alias Supavisor.ClientAuthentication.ValidationSecrets
  alias Supavisor.Secrets.ManagerSecrets
  alias Supavisor.Tenants.Tenant

  defp unique_id(suffix) do
    Supavisor.id(
      type: :single,
      tenant: "ca_test_#{suffix}_#{System.unique_integer([:positive])}",
      user: "postgres",
      mode: :transaction,
      db: "postgres",
      search_path: nil
    )
  end

  describe "fetch_validation_secrets/3 (require_user: false, SecretChecker not started fallback)" do
    setup do
      db_conf = Application.get_env(:supavisor, Supavisor.Repo)
      tenant_id = "ca_test_fallback_#{System.unique_integer([:positive])}"

      {:ok, _tenant} =
        Supavisor.Tenants.create_tenant(%{
          db_database: db_conf[:database],
          db_host: to_string(db_conf[:hostname]),
          db_port: db_conf[:port],
          external_id: tenant_id,
          require_user: false,
          auth_query:
            "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1 AND current_database() = '#{db_conf[:database]}'",
          default_parameter_status: %{"server_version" => "15.0"},
          users: [
            %{
              "db_user" => to_string(db_conf[:username]),
              "db_password" => to_string(db_conf[:password]),
              "pool_size" => 3,
              "mode_type" => "transaction",
              "is_manager" => true
            }
          ]
        })

      tenant = Supavisor.Tenants.get_tenant_by_external_id(tenant_id)
      manager_user = Enum.find(tenant.users, & &1.is_manager)

      %{db_conf: db_conf, tenant: tenant, manager_user: manager_user}
    end

    test "logs project/user metadata at :info level when falling through to auth_query", %{
      db_conf: db_conf,
      tenant: tenant,
      manager_user: manager_user
    } do
      db_user = to_string(db_conf[:username])

      id =
        Supavisor.id(
          type: :single,
          tenant: tenant.external_id,
          user: db_user,
          mode: :transaction,
          db: db_conf[:database]
        )

      log =
        capture_log([level: :info], fn ->
          assert {:ok, %ValidationSecrets{}} =
                   ClientAuthentication.fetch_validation_secrets(id, tenant, manager_user)
        end)

      assert log =~ "SecretChecker not started, using a one-off auth_query connection"
      assert log =~ "project=#{tenant.external_id}"
      assert log =~ "user=#{db_user}"
    end
  end

  describe "handle_wrong_password/3 (RefreshLimiter rate-limited)" do
    test "logs at :warning level once the limit is exceeded" do
      id = unique_id("rate_limited")
      tenant = %Tenant{external_id: Supavisor.id(id, :tenant)}
      db_user = Supavisor.id(id, :user)
      manager_secrets = %ManagerSecrets{db_user: "postgres", db_password: "postgres"}

      # set the metadata mimicking the ClientHandler behaviour
      Logger.metadata(project: tenant.external_id, user: db_user)

      # @cache_refresh_limit is 3 — exhaust it so the next check is rate-limited.
      Enum.each(1..3, fn _ -> assert :ok = RefreshLimiter.check(id) end)

      log =
        capture_log([level: :warning], fn ->
          assert {:error, :rate_limited} =
                   ClientAuthentication.handle_wrong_password(id, tenant, manager_secrets)
        end)

      assert log =~ "ClientHandler: Cache refresh rate-limited, skipping secret check"
      assert log =~ "project=#{tenant.external_id}"
      assert log =~ "user=#{db_user}"
    end
  end
end
