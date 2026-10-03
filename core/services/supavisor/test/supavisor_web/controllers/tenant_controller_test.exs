defmodule SupavisorWeb.TenantControllerTest do
  use SupavisorWeb.ConnCase, async: false

  import Supavisor.TenantsFixtures
  import ExUnit.CaptureLog

  alias Supavisor.Tenants.Tenant

  @user_valid_attrs %{
    "db_user_alias" => "some_db_user",
    "db_user" => "postgres",
    "db_password" => "postgres",
    "pool_size" => 3,
    "mode_type" => "transaction"
  }

  @create_attrs %{
    db_database: "supavisor_test",
    db_host: "localhost",
    db_port: 6432,
    external_id: "dev_tenant",
    require_user: true,
    default_parameter_status: %{"server_version" => "15.0"},
    users: [@user_valid_attrs]
  }
  @update_attrs %{
    db_database: "supavisor_test",
    db_host: "localhost",
    db_port: 6432,
    external_id: "dev_tenant",
    require_user: true,
    allow_list: ["71.209.249.38/32"],
    users: [@user_valid_attrs]
  }
  @update_upstream_attrs %{
    upstream_tls_ca: "-----BEGIN CERTIFICATE-----\nsomecert\n-----END CERTIFICATE-----"
  }
  @update_invalid_upstream_attrs %{
    upstream_tls_ca: "-----BEGIN"
  }
  @invalid_upstream_verify_attrs %{
    upstream_ssl: true,
    upstream_verify: "peer"
  }
  @invalid_attrs %{
    db_database: nil,
    db_host: nil,
    db_port: nil,
    external_id: nil
  }
  @auth_query_tenant_attrs %{
    db_database: "supavisor_test",
    db_host: "localhost",
    db_port: 6432,
    external_id: "auth_query_tenant",
    require_user: false,
    auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
    default_parameter_status: %{"server_version" => "15.0"},
    users: [
      %{
        "db_user" => "manager_user",
        "db_password" => "old_password",
        "pool_size" => 3,
        "mode_type" => "transaction",
        "is_manager" => true
      }
    ]
  }
  @update_auth_credentials_attrs %{
    db_user: "manager_user",
    db_password: "new_password"
  }

  setup %{conn: conn} do
    jwt = gen_token()

    new_conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header(
        "authorization",
        "Bearer " <> jwt
      )

    blocked_jwt = gen_token("invalid")

    blocked_conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header(
        "authorization",
        "Bearer " <> blocked_jwt
      )

    {:ok, conn: new_conn, blocked_conn: blocked_conn}
  end

  describe "create tenant" do
    test "renders tenant when data is valid", %{conn: conn} do
      assert %{data: %{external_id: "dev_tenant"}} =
               conn
               |> put(~p"/api/tenants/dev_tenant", tenant: @create_attrs)
               |> json_response(201)
               |> assert_schema("TenantData")
    end

    test "renders errors when data is invalid", %{conn: conn} do
      assert %{} !=
               conn
               |> put(~p"/api/tenants/dev_tenant", tenant: @invalid_attrs)
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end
  end

  describe "create tenant with blocked ip" do
    test "renders tenant when data is valid", %{blocked_conn: blocked_conn} do
      blocked_conn = put(blocked_conn, ~p"/api/tenants/dev_tenant", tenant: @create_attrs)

      assert blocked_conn.status == 403
    end
  end

  describe "update tenant" do
    setup [:create_tenant]

    test "renders tenant when data is valid", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      set_cache(external_id)

      assert %{data: %{external_id: ^external_id}} =
               put(conn, ~p"/api/tenants/#{external_id}", tenant: @update_attrs)
               |> json_response(200)
               |> assert_schema("TenantData")

      check_cache(external_id)

      assert %{
               data: %{
                 external_id: ^external_id,
                 db_database: "supavisor_test",
                 db_host: "localhost",
                 db_port: 6432,
                 allow_list: ["71.209.249.38/32"]
               }
             } =
               conn
               |> get(~p"/api/tenants/#{external_id}")
               |> json_response(200)
               |> assert_schema("TenantData")
    end

    test "renders tenant when data is valid and coverts cert to pem format", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{data: %{external_id: external_id}} =
               conn
               |> put(~p"/api/tenants/#{external_id}", tenant: @update_upstream_attrs)
               |> json_response(200)
               |> assert_schema("TenantData")

      assert Supavisor.Tenants.get_tenant_by_external_id(external_id).upstream_tls_ca ==
               <<178, 137, 158, 113, 234, 237>>
    end

    test "renders error when upstream_tls_ca is invalid", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{
               "error" =>
                 "Invalid 'upstream_tls_ca' certificate, reason: :cant_decode_certificate"
             } ==
               conn
               |> put(~p"/api/tenants/#{external_id}", tenant: @update_invalid_upstream_attrs)
               |> json_response(400)
               |> assert_schema("NotFound")
    end

    test "renders errors when data is invalid", %{conn: conn, tenant: tenant} do
      assert %{
               "error" =>
                 "Invalid 'upstream_verify' value, 'peer' is not allowed without certificate"
             } ==
               conn
               |> put(~p"/api/tenants/#{tenant}", tenant: @invalid_upstream_verify_attrs)
               |> json_response(400)
               |> assert_schema("NotFound")
    end

    test "renders errors", %{conn: conn, tenant: tenant} do
      assert %{} !=
               conn
               |> put(~p"/api/tenants/#{tenant}", tenant: @invalid_attrs)
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end

    test "triggers Supavisor.terminate_global/1", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      msg = "Terminate pools on update #{@update_attrs.external_id}"

      assert capture_log(fn ->
               put(conn, ~p"/api/tenants/#{external_id}", tenant: @update_attrs)
             end) =~ msg
    end
  end

  describe "delete tenant" do
    setup [:create_tenant]

    test "deletes chosen tenant", %{conn: conn, tenant: %Tenant{external_id: external_id}} do
      set_cache(external_id)
      conn = delete(conn, ~p"/api/tenants/#{external_id}")
      check_cache(external_id)
      assert response(conn, 204) == ""
    end
  end

  describe "get tenant" do
    setup [:create_tenant]

    test "returns 404 not found for non-existing tenant", %{conn: conn} do
      non_existing_tenant_id = "non_existing_tenant_id"

      assert %{"error" => "not found"} ==
               get(conn, ~p"/api/tenants/#{non_existing_tenant_id}")
               |> json_response(404)
               |> assert_schema("NotFound")
    end
  end

  describe "update auth credentials" do
    test "successfully updates credentials for auth_query tenant (require_user: false)", %{
      conn: conn
    } do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      :meck.expect(Supavisor, :update_secret_checker_credentials_global, fn _tenant,
                                                                            _user,
                                                                            _password ->
        [{:ok, :ok}]
      end)

      on_exit(fn ->
        :meck.unload(Supavisor)
      end)

      assert "" ==
               conn
               |> post(
                 ~p"/api/tenants/#{external_id}/update_auth_credentials",
                 @update_auth_credentials_attrs
               )
               |> response(204)

      updated_tenant = Supavisor.Tenants.get_tenant_by_external_id(external_id)
      manager = Enum.find(updated_tenant.users, & &1.is_manager)
      assert manager.db_password == "new_password"
    end

    test "rejects update for require_user: true tenant", %{conn: conn} do
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)

      assert %{"error" => "Cannot update credentials for tenants with require_user: true"} ==
               conn
               |> post(
                 ~p"/api/tenants/#{tenant.external_id}/update_auth_credentials",
                 @update_auth_credentials_attrs
               )
               |> json_response(400)
               |> assert_schema("NotFound")
    end

    test "returns 404 for non-existent tenant", %{conn: conn} do
      assert %{"error" => "not found"} ==
               conn
               |> post(
                 ~p"/api/tenants/non_existent_tenant/update_auth_credentials",
                 @update_auth_credentials_attrs
               )
               |> json_response(404)
               |> assert_schema("NotFound")
    end

    test "clears cache when updating credentials", %{conn: conn} do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      :meck.expect(Supavisor, :update_secret_checker_credentials_global, fn _tenant,
                                                                            _user,
                                                                            _password ->
        [{:ok, :ok}]
      end)

      on_exit(fn ->
        :meck.unload(Supavisor)
      end)

      set_cache(external_id)

      assert "" ==
               conn
               |> post(
                 ~p"/api/tenants/#{external_id}/update_auth_credentials",
                 @update_auth_credentials_attrs
               )
               |> response(204)

      check_cache(external_id)
    end

    test "accepts only db_user and db_password fields", %{conn: conn} do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      :meck.expect(Supavisor, :update_secret_checker_credentials_global, fn _tenant,
                                                                            _user,
                                                                            _password ->
        [{:ok, :ok}]
      end)

      on_exit(fn ->
        :meck.unload(Supavisor)
      end)

      params_with_extra_fields = %{
        db_user: "new_manager_user",
        db_password: "new_secure_password",
        pool_size: 999,
        is_manager: false,
        mode_type: "session"
      }

      assert "" ==
               conn
               |> post(
                 ~p"/api/tenants/#{external_id}/update_auth_credentials",
                 params_with_extra_fields
               )
               |> response(204)

      updated_tenant = Supavisor.Tenants.get_tenant_by_external_id(external_id)
      manager = Enum.find(updated_tenant.users, & &1.is_manager)
      assert manager.db_user == "new_manager_user"
      assert manager.db_password == "new_secure_password"
      assert manager.pool_size == 3
      assert manager.is_manager == true
      assert manager.mode_type == :transaction
    end

    test "returns validation error when db_user is missing", %{conn: conn} do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      invalid_params = %{db_password: "new_password"}

      assert %{"errors" => _} =
               conn
               |> post(~p"/api/tenants/#{external_id}/update_auth_credentials", invalid_params)
               |> json_response(422)
    end

    test "returns validation error when db_password is missing", %{conn: conn} do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      invalid_params = %{db_user: "new_user"}

      assert %{"errors" => _} =
               conn
               |> post(~p"/api/tenants/#{external_id}/update_auth_credentials", invalid_params)
               |> json_response(422)
    end

    test "returns validation error when both fields are missing", %{conn: conn} do
      {:ok, auth_tenant} = Supavisor.Tenants.create_tenant(@auth_query_tenant_attrs)
      external_id = auth_tenant.external_id

      assert %{"errors" => _} =
               conn
               |> post(~p"/api/tenants/#{external_id}/update_auth_credentials", %{})
               |> json_response(422)
    end
  end

  describe "list network bans" do
    setup do
      :ets.delete_all_objects(Supavisor.CircuitBreaker.Blocks)
      :ets.delete_all_objects(Supavisor.CircuitBreaker.Windows)
      :ok
    end

    test "renders a list of network bans for a tenant", %{conn: conn} do
      now = System.system_time(:second)
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)
      external_id = tenant.external_id
      ip1 = "192.168.1.100"
      ip2 = "10.0.0.50"

      for _ <- 1..10 do
        Supavisor.CircuitBreaker.record_failure({external_id, ip1}, :auth_error)
        Supavisor.CircuitBreaker.record_failure({external_id, ip2}, :auth_error)
      end

      for ip <- [ip1, ip2] do
        assert {:error, %Supavisor.Errors.CircuitBreakerError{}} =
                 Supavisor.CircuitBreaker.check({external_id, ip}, :auth_error)
      end

      assert %{banned_ipv4_addresses: bans} =
               conn
               |> get(~p"/api/tenants/#{external_id}/network_bans")
               |> json_response(200)
               |> assert_schema("NetworkBanList")

      assert length(bans) == 2

      Enum.all?(bans, fn %{banned_address: ip, banned_until: ts} ->
        assert ip in [ip1, ip2]
        assert is_integer(ts)
        assert ts > now
      end)
    end

    test "returns an empty list when there are no bans for a tenant", %{conn: conn} do
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)
      external_id = tenant.external_id

      assert %_{banned_ipv4_addresses: []} =
               conn
               |> get(~p"/api/tenants/#{external_id}/network_bans")
               |> json_response(200)
               |> assert_schema("NetworkBanList")
    end

    test "returns 404 for non-existent tenant", %{conn: conn} do
      tenant_id = "non_existent_tenant"

      assert %{"error" => "not found"} ==
               conn
               |> get(~p"/api/tenants/#{tenant_id}/network_bans")
               |> json_response(404)
               |> assert_schema("NotFound")
    end

    test "returns 403 for invalid token", %{blocked_conn: blocked_conn} do
      tenant_id = "any_tenant"
      assert %{status: 403} = get(blocked_conn, ~p"/api/tenants/#{tenant_id}/network_bans")
    end
  end

  describe "clear network bans" do
    setup do
      :ets.delete_all_objects(Supavisor.CircuitBreaker.Blocks)
      :ets.delete_all_objects(Supavisor.CircuitBreaker.Windows)
      :ok
    end

    test "clears auth error network ban", %{conn: conn} do
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)
      external_id = tenant.external_id
      ip1 = "192.168.1.100"
      ip2 = "10.0.0.50"

      for _ <- 1..10 do
        Supavisor.CircuitBreaker.record_failure({external_id, ip1}, :auth_error)
        Supavisor.CircuitBreaker.record_failure({external_id, ip2}, :auth_error)
      end

      for ip <- [ip1, ip2] do
        assert {:error, %Supavisor.Errors.CircuitBreakerError{}} =
                 Supavisor.CircuitBreaker.check({external_id, ip}, :auth_error)
      end

      assert %_{banned_ipv4_addresses: [%{banned_address: ^ip2, banned_until: ts}]} =
               conn
               |> delete(~p"/api/tenants/#{external_id}/network_bans", %{
                 ipv4_addresses: [ip1]
               })
               |> json_response(200)
               |> assert_schema("NetworkBanList")

      assert :ok =
               Supavisor.CircuitBreaker.check({external_id, ip1}, :auth_error)

      assert {:error, %Supavisor.Errors.CircuitBreakerError{blocked_until: ^ts}} =
               Supavisor.CircuitBreaker.check({external_id, ip2}, :auth_error)
    end

    test "returns 404 when tenant does not exist", %{conn: conn} do
      assert conn
             |> delete(~p"/api/tenants/nonexistent/network_bans", %{
               ipv4_addresses: ["192.168.1.100"]
             })
             |> json_response(404)
             |> assert_schema("NotFound")
    end

    test "returns empty list when no bans exist", %{conn: conn} do
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)
      external_id = tenant.external_id

      assert %_{banned_ipv4_addresses: []} =
               conn
               |> delete(~p"/api/tenants/#{external_id}/network_bans", %{
                 ipv4_addresses: ["192.168.1.100"]
               })
               |> json_response(200)
               |> assert_schema("NetworkBanList")
    end

    test "clears multiple IPs", %{conn: conn} do
      {:ok, tenant} = Supavisor.Tenants.create_tenant(@create_attrs)
      external_id = tenant.external_id
      ip1 = "192.168.1.100"
      ip2 = "192.168.1.101"
      ip3 = "192.168.1.102"

      for _ <- 1..10 do
        Supavisor.CircuitBreaker.record_failure({external_id, ip1}, :auth_error)
        Supavisor.CircuitBreaker.record_failure({external_id, ip2}, :auth_error)
        Supavisor.CircuitBreaker.record_failure({external_id, ip3}, :auth_error)
      end

      for ip <- [ip1, ip2, ip3] do
        assert {:error, %Supavisor.Errors.CircuitBreakerError{}} =
                 Supavisor.CircuitBreaker.check({external_id, ip}, :auth_error)
      end

      assert %_{banned_ipv4_addresses: [%{banned_address: ^ip3, banned_until: ts}]} =
               conn
               |> delete(~p"/api/tenants/#{external_id}/network_bans", %{
                 ipv4_addresses: [ip1, ip2]
               })
               |> json_response(200)
               |> assert_schema("NetworkBanList")

      for ip <- [ip1, ip2] do
        assert :ok =
                 Supavisor.CircuitBreaker.check({external_id, ip}, :auth_error)
      end

      assert {:error, %Supavisor.Errors.CircuitBreakerError{blocked_until: ^ts}} =
               Supavisor.CircuitBreaker.check({external_id, ip3}, :auth_error)
    end

    test "returns 403 for invalid token", %{blocked_conn: blocked_conn} do
      tenant_id = "any_tenant"

      assert %{status: 403} =
               delete(blocked_conn, ~p"/api/tenants/#{tenant_id}/network_bans", %{
                 ipv4_addresses: ["192.168.1.100"]
               })
    end
  end

  describe "health endpoint" do
    test "returns 204 when all health checks pass", %{conn: conn} do
      assert "" ==
               conn
               |> get(~p"/api/health")
               |> response(204)
    end

    test "returns 503 with failed checks when health checks fail", %{conn: conn} do
      :meck.expect(Supavisor.Health, :database_reachable?, fn -> false end)
      on_exit(fn -> :meck.unload(Supavisor.Health) end)

      assert %{status: "unhealthy", failed_checks: ["database_reachable"], timestamp: timestamp} =
               conn
               |> get(~p"/api/health")
               |> json_response(503)
               |> assert_schema("ServiceUnavailable")

      assert {:ok, _datetime, _offset} = DateTime.from_iso8601(timestamp)
    end
  end

  describe "PATCH /api/tenants/:external_id" do
    setup [:create_tenant]

    setup %{conn: conn} do
      {:ok, conn: put_req_header(conn, "content-type", "application/json")}
    end

    test "bans a tenant with banned=true and ban_reason", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{
               data: %{
                 external_id: ^external_id,
                 banned_at: banned_at,
                 ban_reason: "abuse",
                 banned_until: "2099-12-31T00:00:00Z"
               }
             } =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{
                 banned: "true",
                 ban_reason: "abuse",
                 banned_until: "2099-12-31T00:00:00Z"
               })
               |> json_response(200)
               |> assert_schema("TenantData")

      assert {:ok, dt, 0} = DateTime.from_iso8601(banned_at)
      diff = DateTime.diff(DateTime.utc_now(), dt)
      assert diff >= 0 and diff < 5
    end

    test "bans a tenant when banned is a JSON boolean true", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{data: %{external_id: ^external_id, banned_at: banned_at, ban_reason: "abuse"}} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: true, ban_reason: "abuse"})
               |> json_response(200)
               |> assert_schema("TenantData")

      assert banned_at != nil
    end

    test "unbans a tenant when banned is a JSON boolean false", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      conn
      |> patch(~p"/api/tenants/#{external_id}", %{banned: true, ban_reason: "abuse"})
      |> json_response(200)

      assert %{data: %{external_id: ^external_id, banned_at: nil, ban_reason: nil}} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: false})
               |> json_response(200)
               |> assert_schema("TenantData")
    end

    test "returns 404 for non-existent tenant", %{conn: conn} do
      assert %{"error" => "not found"} =
               conn
               |> patch(~p"/api/tenants/nonexistent_tenant", %{
                 banned: "true",
                 ban_reason: "abuse"
               })
               |> json_response(404)
               |> assert_schema("NotFound")
    end

    test "returns 422 when ban_reason is missing", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{"errors" => _} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: "true"})
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end

    test "returns 422 when ban_reason is invalid", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{"errors" => _} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: "true", ban_reason: 123})
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end

    test "returns 422 when banned is not a boolean", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{"errors" => _} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: "yes", ban_reason: "abuse"})
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end

    test "clears banned_at and ban_reason when unbanning", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      # First ban the tenant
      conn
      |> patch(~p"/api/tenants/#{external_id}", %{banned: "true", ban_reason: "abuse"})
      |> json_response(200)

      # Then unban
      assert %{
               data: %{
                 external_id: ^external_id,
                 banned_at: nil,
                 ban_reason: nil,
                 banned_until: nil
               }
             } =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{banned: "false"})
               |> json_response(200)
               |> assert_schema("TenantData")
    end

    test "returns 422 when banned_until is not a valid datetime", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{"errors" => _} =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{
                 banned: "true",
                 ban_reason: "abuse",
                 banned_until: "not-a-date"
               })
               |> json_response(422)
               |> assert_schema("UnprocessablyEntity")
    end

    test "includes banned_at and ban_reason in GET response after ban", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      conn
      |> patch(~p"/api/tenants/#{external_id}", %{banned: "true", ban_reason: "billing"})
      |> json_response(200)

      assert %{
               data: %{
                 external_id: ^external_id,
                 banned_at: banned_at,
                 ban_reason: "billing"
               }
             } =
               conn
               |> get(~p"/api/tenants/#{external_id}")
               |> json_response(200)
               |> assert_schema("TenantData")

      assert {:ok, dt, 0} = DateTime.from_iso8601(banned_at)
      diff = DateTime.diff(DateTime.utc_now(), dt)
      assert diff >= 0 and diff < 5
    end

    test "does not allow setting banned_at directly via PUT", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      # Ban should be ignored if passed through the regular PUT update
      conn
      |> put(~p"/api/tenants/#{external_id}",
        tenant: Map.put(@update_attrs, :banned_at, "2020-01-01T00:00:00Z")
      )
      |> json_response(200)

      assert %{"data" => %{"banned_at" => nil}} =
               conn
               |> get(~p"/api/tenants/#{external_id}")
               |> json_response(200)
    end

    test "clears cache so subsequent connections see the ban", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      set_cache(external_id)

      conn
      |> patch(~p"/api/tenants/#{external_id}", %{banned: "true", ban_reason: "test"})
      |> json_response(200)

      check_cache(external_id)
    end

    test "banned tenant get unbanned after deletion and re-creation", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      assert %{
               data: %{
                 external_id: ^external_id,
                 banned_at: banned_at,
                 ban_reason: "abuse"
               }
             } =
               conn
               |> patch(~p"/api/tenants/#{external_id}", %{
                 banned: "true",
                 ban_reason: "abuse"
               })
               |> json_response(200)
               |> assert_schema("TenantData")

      assert banned_at != nil

      conn
      |> delete(~p"/api/tenants/#{external_id}")
      |> response(204)

      assert %{data: %{external_id: ^external_id, banned_at: nil, ban_reason: nil}} =
               conn
               |> put(~p"/api/tenants/#{external_id}", tenant: @create_attrs)
               |> json_response(201)
               |> assert_schema("TenantData")
    end
  end

  defp create_tenant(_) do
    tenant = tenant_fixture()
    %{tenant: tenant}
  end

  defp set_cache(external_id) do
    Supavisor.Tenants.get_user_cache(:single, "user", external_id, nil)
    Supavisor.Tenants.get_tenant_cache(external_id, nil)
  end

  defp check_cache(external_id) do
    assert {:ok, nil} =
             Cachex.get(Supavisor.Cache, {:user_cache, :single, "user", external_id, nil})

    assert {:ok, nil} = Cachex.get(Supavisor.Cache, {:tenant_cache, external_id, nil})
  end

  defp gen_token(secret \\ Application.fetch_env!(:supavisor, :metrics_jwt_secret)) do
    Supavisor.Jwt.Token.gen!(secret)
  end
end
