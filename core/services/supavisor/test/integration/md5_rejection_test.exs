defmodule Supavisor.Integration.Md5RejectionTest do
  use Supavisor.DockerComposeMd5Case, async: false
  use Supavisor.DataCase, async: false

  require Logger

  alias Postgrex, as: P

  @moduletag :integration_docker

  @md5_db_port 7544

  setup do
    on_exit(fn -> Process.sleep(100) end)
    :ok
  end

  defp create_auth_query_tenant do
    random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    tenant_id = "md5_reject_#{System.unique_integer([:positive])}_#{random_suffix}"

    {:ok, _tenant} =
      Supavisor.Tenants.create_tenant(%{
        db_database: "postgres",
        db_host: "localhost",
        db_port: @md5_db_port,
        external_id: tenant_id,
        require_user: false,
        auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
        default_parameter_status: %{"server_version" => "15.0"},
        upstream_ssl: false,
        enforce_ssl: false,
        users: [
          %{
            "db_user" => "manager_user",
            "db_password" => "manager_password",
            "pool_size" => 3,
            "mode_type" => "transaction",
            "is_manager" => true
          }
        ]
      })

    on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)

    tenant_id
  end

  defp create_require_user_tenant(db_user, db_password) do
    random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    tenant_id = "md5_pass_#{System.unique_integer([:positive])}_#{random_suffix}"

    {:ok, _tenant} =
      Supavisor.Tenants.create_tenant(%{
        db_database: "postgres",
        db_host: "localhost",
        db_port: @md5_db_port,
        external_id: tenant_id,
        require_user: true,
        default_parameter_status: %{"server_version" => "15.0"},
        upstream_ssl: false,
        enforce_ssl: false,
        users: [
          %{
            "db_user" => db_user,
            "db_password" => db_password,
            "pool_size" => 3,
            "mode_type" => "transaction",
            "is_manager" => true
          }
        ]
      })

    on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)

    tenant_id
  end

  defp connect_to_proxy(tenant_id, username, password) do
    with {:error, {error, _}} <-
           start_supervised(
             {SingleConnection,
              hostname: "localhost",
              port: Application.get_env(:supavisor, :proxy_port_transaction),
              database: "postgres",
              password: password,
              username: "#{username}.#{tenant_id}",
              pool_size: 1}
           ) do
      {:error, error}
    end
  end

  test "auth_query rejects MD5 user with clear error" do
    tenant_id = create_auth_query_tenant()

    assert {:error,
            %P.Error{
              postgres: %{
                code: :internal_error,
                severity: "FATAL",
                pg_code: "XX000",
                message: "(EAUTHSECRETS) failed to retrieve authentication secrets: " <> rest
              }
            }} = connect_to_proxy(tenant_id, "md5_user", "md5_password")

    assert rest =~ "MD5 authentication is not supported"
  end

  test "require_user tenant can still connect when upstream uses MD5 auth" do
    tenant_id = create_require_user_tenant("md5_user", "md5_password")

    assert {:ok, pid} = connect_to_proxy(tenant_id, "md5_user", "md5_password")
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end
end
