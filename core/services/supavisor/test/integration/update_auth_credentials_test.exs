defmodule Supavisor.Integration.UpdateAuthCredentialsTest do
  use SupavisorWeb.ConnCase, async: false

  require Logger
  require Supavisor

  alias Postgrex, as: P

  setup do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    %{db_conf: db_conf}
  end

  defp setup_tenant(db_conf) do
    tenant_id = "update_creds_tenant_#{System.unique_integer([:positive])}"

    {:ok, _tenant} =
      Supavisor.Tenants.create_tenant(%{
        db_database: db_conf[:database],
        db_host: to_string(db_conf[:hostname]),
        db_port: db_conf[:port],
        external_id: tenant_id,
        require_user: false,
        auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
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

    tenant_id
  end

  test "existing client connections aren't killed when updating credentials", %{db_conf: db_conf} do
    tenant_id = setup_tenant(db_conf)

    try do
      assert {:ok, proxy} =
               Postgrex.start_link(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_transaction),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{tenant_id}"
               )

      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      update_attrs = %{
        db_user: to_string(db_conf[:username]),
        db_password: to_string(db_conf[:password])
      }

      conn = gen_authenticated_conn()

      assert "" ==
               conn
               |> post("/api/tenants/#{tenant_id}/update_auth_credentials", update_attrs)
               |> response(204)

      assert %P.Result{rows: [[2]]} = P.query!(proxy, "SELECT 2", [])
      GenServer.stop(proxy)
    after
      Supavisor.Tenants.delete_tenant_by_external_id(tenant_id)
    end
  end

  test "SecretChecker reconnects with new manager credentials", %{db_conf: db_conf} do
    tenant_id = setup_tenant(db_conf)

    assert {:ok, origin} =
             Postgrex.start_link(
               hostname: db_conf[:hostname],
               port: db_conf[:port],
               database: db_conf[:database],
               password: db_conf[:password],
               username: db_conf[:username]
             )

    new_manager_user = "test_new_manager"
    new_manager_password = "new_manager_pass"

    try do
      assert {:ok, proxy} =
               Postgrex.start_link(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_transaction),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{tenant_id}"
               )

      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      Process.sleep(100)

      id =
        Supavisor.id(
          type: :single,
          tenant: tenant_id,
          user: to_string(db_conf[:username]),
          mode: :transaction,
          db: db_conf[:database]
        )

      [{secret_checker_pid, _}] =
        Registry.lookup(Supavisor.Registry.Tenants, {:secret_checker, id})

      old_state = :sys.get_state(secret_checker_pid)
      assert old_state.manager_secrets.db_user == to_string(db_conf[:username])

      P.query!(
        origin,
        "CREATE USER #{new_manager_user} WITH PASSWORD '#{new_manager_password}' SUPERUSER",
        []
      )

      Process.sleep(100)

      update_attrs = %{
        db_user: new_manager_user,
        db_password: new_manager_password
      }

      conn = gen_authenticated_conn()

      assert "" ==
               conn
               |> post("/api/tenants/#{tenant_id}/update_auth_credentials", update_attrs)
               |> response(204)

      Process.sleep(200)

      new_state = :sys.get_state(secret_checker_pid)
      assert new_state.manager_secrets.db_user == new_manager_user
      assert new_state.manager_secrets.db_password == new_manager_password
      assert Process.alive?(new_state.conn)

      GenServer.stop(proxy)
    after
      P.query!(origin, "DROP USER IF EXISTS #{new_manager_user}", [])
      GenServer.stop(origin)
      Supavisor.Tenants.delete_tenant_by_external_id(tenant_id)
    end
  end

  test "cache is cleared and re-fetch works correctly", %{db_conf: db_conf} do
    tenant_id = setup_tenant(db_conf)

    assert {:ok, origin} =
             Postgrex.start_link(
               hostname: db_conf[:hostname],
               port: db_conf[:port],
               database: db_conf[:database],
               password: db_conf[:password],
               username: db_conf[:username]
             )

    new_manager_user = "cache_test_manager"
    new_manager_password = "cache_manager_pass"
    client_user = to_string(db_conf[:username])

    try do
      Supavisor.Tenants.get_user_cache(:single, client_user, tenant_id, nil)

      cache_key = {:user_cache, :single, client_user, tenant_id, nil}
      assert {:ok, {:cached, {:ok, _}}} = Cachex.get(Supavisor.Cache, cache_key)

      P.query!(
        origin,
        "CREATE USER #{new_manager_user} WITH PASSWORD '#{new_manager_password}' SUPERUSER",
        []
      )

      Process.sleep(100)

      update_attrs = %{
        db_user: new_manager_user,
        db_password: new_manager_password
      }

      conn = gen_authenticated_conn()

      assert "" ==
               conn
               |> post("/api/tenants/#{tenant_id}/update_auth_credentials", update_attrs)
               |> response(204)

      assert {:ok, nil} = Cachex.get(Supavisor.Cache, cache_key)

      Process.sleep(200)

      assert {:ok, %{user: user, tenant: tenant}} =
               Supavisor.Tenants.get_user_cache(:single, client_user, tenant_id, nil)

      assert user.db_user == new_manager_user
      assert user.db_password == new_manager_password
      assert tenant.external_id == tenant_id
    after
      P.query!(origin, "DROP USER IF EXISTS #{new_manager_user}", [])
      GenServer.stop(origin)
      Supavisor.Tenants.delete_tenant_by_external_id(tenant_id)
    end
  end

  defp gen_authenticated_conn do
    jwt = gen_token()

    build_conn()
    |> put_req_header("accept", "application/json")
    |> put_req_header("authorization", "Bearer " <> jwt)
  end

  defp gen_token(secret \\ Application.fetch_env!(:supavisor, :api_jwt_secret)) do
    Supavisor.Jwt.Token.gen!(secret)
  end
end
