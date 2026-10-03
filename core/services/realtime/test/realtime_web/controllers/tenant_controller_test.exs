defmodule RealtimeWeb.TenantControllerTest do
  # Can't run async true because under the hood Cachex is used and it doesn't see Ecto.Sandbox
  # Also using global otel_simple_processor
  use RealtimeWeb.ConnCase, async: false

  use Mimic

  import ExUnit.CaptureLog
  require OpenTelemetry.Tracer, as: Tracer

  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.Database
  alias Realtime.PromEx.Plugins.Tenants
  alias Realtime.Tenants
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Connect
  alias Realtime.UsersCounter

  @invalid_attrs %{external_id: nil, jwt_secret: nil, extensions: [], name: nil}

  setup context do
    %{conn: conn} = context
    key = Application.get_env(:realtime, :api_jwt_secret)
    jwt = generate_jwt_token(key)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", "Bearer #{jwt}")

    :otel_simple_processor.set_exporter(:otel_exporter_pid, self())

    {:ok, conn: conn}
  end

  defp with_tenant(_context) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    %{tenant: tenant}
  end

  describe "show tenant" do
    setup [:with_tenant]

    test "removes db_password", %{conn: conn, tenant: tenant} do
      conn = get(conn, ~p"/api/tenants/#{tenant.external_id}")
      response = json_response(conn, 200)
      refute get_in(response, ["data", "extensions", Access.at(0), "settings", "db_password"])
    end

    test "returns not found on non existing tenant", %{conn: conn} do
      conn = get(conn, ~p"/api/tenants/no")
      response = json_response(conn, 404)
      assert response == %{"message" => "not found"}
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
      Tracer.with_span "test" do
        Task.async(fn ->
          get(conn, ~p"/api/tenants/#{external_id}")

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "GET /api/tenants/:tenant_id", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end
  end

  describe "create tenant with post" do
    test "run migrations on creation and encrypts credentials", %{conn: conn} do
      external_id = random_string()
      {:ok, port} = TestTenantDb.checkout()

      assert nil == Tenants.get_tenant_by_external_id(external_id)

      attrs = default_tenant_attrs(port)
      attrs = Map.put(attrs, "external_id", external_id)

      conn = post(conn, ~p"/api/tenants", tenant: attrs)

      assert %{"id" => _id, "external_id" => ^external_id} = json_response(conn, 201)["data"]

      [%{"settings" => settings}] = json_response(conn, 201)["data"]["extensions"]

      assert Crypto.decrypt!(settings["db_host"]) == "127.0.0.1"
      assert Crypto.decrypt!(settings["db_name"]) == "postgres"
      assert Crypto.decrypt!(settings["db_user"]) == "supabase_admin"
      refute settings["db_password"]

      assert_eventually Tenants.get_tenant_by_external_id(external_id).migrations_ran > 0

      assert %{broadcast_adapter: :gen_rpc, extensions: [%{settings: settings}]} =
               Tenants.get_tenant_by_external_id(external_id)

      assert Crypto.decrypt!(settings["db_password"]) == "postgres"
    end
  end

  describe "create tenant with put" do
    test "run migrations on creation and encrypts credentials", %{conn: conn} do
      external_id = random_string()
      {:ok, port} = TestTenantDb.checkout()

      assert nil == Tenants.get_tenant_by_external_id(external_id)

      attrs = default_tenant_attrs(port)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)

      assert %{"id" => _id, "external_id" => ^external_id} = json_response(conn, 201)["data"]
      [%{"settings" => settings}] = json_response(conn, 201)["data"]["extensions"]

      assert Crypto.decrypt!(settings["db_host"]) == "127.0.0.1"
      assert Crypto.decrypt!(settings["db_name"]) == "postgres"
      assert Crypto.decrypt!(settings["db_user"]) == "supabase_admin"
      refute settings["db_password"]

      assert_eventually Tenants.get_tenant_by_external_id(external_id).migrations_ran > 0

      assert %{extensions: [%{settings: settings}]} = Tenants.get_tenant_by_external_id(external_id)
      assert Crypto.decrypt!(settings["db_password"]) == "postgres"
    end
  end

  describe "upsert with post" do
    setup [:with_tenant]

    test "renders tenant when data is valid", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port)
      attrs = Map.put(attrs, "external_id", external_id)
      conn = post(conn, ~p"/api/tenants", tenant: attrs)
      assert %{"id" => _id, "external_id" => ^external_id} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert ^external_id = json_response(conn, 200)["data"]["external_id"]
      assert 200 = json_response(conn, 200)["data"]["max_concurrent_users"]
      assert 100 = json_response(conn, 200)["data"]["max_channels_per_client"]
      assert 100 = json_response(conn, 200)["data"]["max_events_per_second"]
      assert 100 = json_response(conn, 200)["data"]["max_joins_per_second"]
    end

    test "can set max_client_presence_events_per_window", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port) |> Map.put("max_client_presence_events_per_window", 42)
      attrs = Map.put(attrs, "external_id", external_id)

      conn = post(conn, ~p"/api/tenants", tenant: attrs)
      assert %{"max_client_presence_events_per_window" => 42} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert 42 = json_response(conn, 200)["data"]["max_client_presence_events_per_window"]
    end

    test "max_client_presence_events_per_window defaults to nil", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert is_nil(json_response(conn, 200)["data"]["max_client_presence_events_per_window"])
    end

    test "can set client_presence_window_ms", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port) |> Map.put("client_presence_window_ms", 5_000)
      attrs = Map.put(attrs, "external_id", external_id)

      conn = post(conn, ~p"/api/tenants", tenant: attrs)
      assert %{"client_presence_window_ms" => 5_000} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert 5_000 = json_response(conn, 200)["data"]["client_presence_window_ms"]
    end

    test "client_presence_window_ms defaults to nil", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert is_nil(json_response(conn, 200)["data"]["client_presence_window_ms"])
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants", tenant: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "returns 403 when jwt is invalid", %{conn: conn} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = post(conn, ~p"/api/tenants", tenant: default_tenant_attrs(5000))
      assert response(conn, 403)
    end
  end

  describe "upsert with put" do
    setup [:with_tenant]

    test "renders tenant when data is valid", %{tenant: tenant, conn: conn} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert %{"id" => _id, "external_id" => ^external_id} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.tenant_path(conn, :show, external_id))
      assert ^external_id = json_response(conn, 200)["data"]["external_id"]
      assert 200 = json_response(conn, 200)["data"]["max_concurrent_users"]
      assert 100 = json_response(conn, 200)["data"]["max_channels_per_client"]
      assert 100 = json_response(conn, 200)["data"]["max_events_per_second"]
      assert 100 = json_response(conn, 200)["data"]["max_joins_per_second"]
    end

    test "can update max_client_presence_events_per_window", %{tenant: tenant, conn: conn} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port) |> Map.put("max_client_presence_events_per_window", 99)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert %{"max_client_presence_events_per_window" => 99} = json_response(conn, 200)["data"]
    end

    test "can update client_presence_window_ms", %{tenant: tenant, conn: conn} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port) |> Map.put("client_presence_window_ms", 10_000)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert %{"client_presence_window_ms" => 10_000} = json_response(conn, 200)["data"]
    end

    test "can update presence_enabled", %{tenant: tenant, conn: conn} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)

      assert tenant.presence_enabled == false

      attrs = default_tenant_attrs(port) |> Map.put("presence_enabled", true)
      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert %{"presence_enabled" => true} = json_response(conn, 200)["data"]

      updated_tenant = Realtime.Api.get_tenant_by_external_id(external_id, use_replica?: false)
      assert updated_tenant.presence_enabled == true
    end

    test "postgres_changes_pool is stored as subcriber_pool_size and overrides it", %{tenant: tenant, conn: conn} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port) |> put_extension_setting("subcriber_pool_size", 3)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert [%{"settings" => %{"subcriber_pool_size" => 3}}] = json_response(conn, 200)["data"]["extensions"]

      attrs = put_extension_setting(attrs, "postgres_changes_pool", 10)

      conn = put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)
      assert [%{"settings" => settings}] = json_response(conn, 200)["data"]["extensions"]
      assert settings["subcriber_pool_size"] == 10
      refute Map.has_key?(settings, "postgres_changes_pool")
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = put(conn, ~p"/api/tenants/#{random_string()}", tenant: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "returns 403 when jwt is invalid", %{conn: conn} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = put(conn, ~p"/api/tenants/external_id", tenant: default_tenant_attrs(5000))
      assert response(conn, 403)
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id
      port = tenant_db_port(tenant)
      attrs = default_tenant_attrs(port)

      # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
      Tracer.with_span "test" do
        Task.async(fn ->
          put(conn, ~p"/api/tenants/#{external_id}", tenant: attrs)

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "PUT /api/tenants/:tenant_id", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end
  end

  describe "delete tenant" do
    setup [:with_tenant]

    test "deletes chosen tenant", %{conn: conn, tenant: tenant} do
      {:ok, _pid} = Connect.lookup_or_start_connection(tenant.external_id)

      assert Connect.ready?(tenant.external_id)

      # `ReplicationConnection.ready?/1` already waits for up to 5s
      # Give the outer wait enough headroom for a couple of attempts,
      # since it's async and can take a while, especially in CI
      assert_eventually Realtime.Tenants.ReplicationConnection.ready?(tenant.external_id), timeout: 15_000

      assert Cache.get_tenant_by_external_id(tenant.external_id)
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)

      slot_name = Realtime.Tenants.ReplicationConnection.replication_slot_name("realtime", "messages")

      assert_eventually {:ok, %{rows: [_row]}} =
                          Postgrex.query(
                            db_conn,
                            "SELECT slot_name FROM pg_replication_slots WHERE slot_name = $1",
                            [slot_name]
                          )

      conn = delete(conn, ~p"/api/tenants/#{tenant.external_id}")
      assert response(conn, 204)

      refute Cache.get_tenant_by_external_id(tenant.external_id)
      refute Tenants.get_tenant_by_external_id(tenant.external_id)

      # Slot teardown happens after the delete responds.
      assert_eventually {:ok, %{rows: []}} =
                          Postgrex.query(
                            db_conn,
                            "SELECT slot_name FROM pg_replication_slots WHERE slot_name = $1",
                            [slot_name]
                          )
    end

    test "does not read the replica", %{conn: conn, tenant: tenant} do
      # A tenant created moments ago may not have reached the replica yet. Reading it there would
      # answer 204 without deleting anything, so the lookup has to hit the primary.
      Mimic.reject(&Realtime.Repo.Replica.replica/0)

      conn = delete(conn, ~p"/api/tenants/#{tenant.external_id}")
      assert response(conn, 204)

      refute Realtime.Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
    end

    test "tenant doesn't exist", %{conn: conn} do
      conn = delete(conn, ~p"/api/tenants/nope")
      assert response(conn, 204)
    end

    test "returns 403 when jwt is invalid", %{conn: conn, tenant: tenant} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = delete(conn, ~p"/api/tenants/#{tenant.external_id}")
      assert response(conn, 403) == ""
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
      Tracer.with_span "test" do
        Task.async(fn ->
          delete(conn, ~p"/api/tenants/#{external_id}")

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "DELETE /api/tenants/:tenant_id", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end
  end

  describe "reload tenant" do
    setup [:with_tenant]

    test "reload when tenant does exist", %{conn: conn, tenant: %{external_id: external_id} = tenant} do
      Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> external_id)

      [%{settings: settings}] = tenant.extensions
      settings = Map.put(settings, "id", external_id)
      {:ok, _} = Extensions.PostgresCdcRls.start(settings)
      wait_on_postgres_cdc_rls(external_id)

      {:ok, manager_pid, _} = Extensions.PostgresCdcRls.get_manager_conn(external_id)
      {:ok, connect_pid} = Connect.lookup_or_start_connection(external_id)
      Process.monitor(manager_pid)
      Process.monitor(connect_pid)

      assert Process.alive?(manager_pid)
      assert Process.alive?(connect_pid)

      %{status: status} = post(conn, ~p"/api/tenants/#{external_id}/reload")

      assert status == 204

      assert_receive %Phoenix.Socket.Broadcast{
        payload: %{message: "Server requested disconnect", status: "ok", extension: "system"},
        event: "system"
      }

      assert_receive {:DOWN, _, :process, ^manager_pid, _}
      assert_receive {:DOWN, _, :process, ^connect_pid, _}

      refute Process.alive?(manager_pid)
      refute Process.alive?(connect_pid)
    end

    test "reload when tenant does not exist", %{conn: conn} do
      %{status: status} = post(conn, ~p"/api/tenants/nope/reload")
      assert status == 404
    end

    test "returns 403 when jwt is invalid", %{conn: conn, tenant: tenant} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = post(conn, ~p"/api/tenants/#{tenant.external_id}/reload")
      assert response(conn, 403) == ""
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
      Tracer.with_span "test" do
        Task.async(fn ->
          post(conn, ~p"/api/tenants/#{tenant.external_id}/reload")

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "POST /api/tenants/:tenant_id/reload", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end
  end

  describe "shutdown Connect module for tenant" do
    setup [:with_tenant]

    test "shuts down Connect process when tenant exists", %{conn: conn, tenant: %{external_id: external_id}} do
      Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> external_id)

      {:ok, connect_pid} = Connect.lookup_or_start_connection(external_id)
      Process.monitor(connect_pid)

      assert Process.alive?(connect_pid)

      %{status: status} = post(conn, ~p"/api/tenants/#{external_id}/shutdown")

      assert status == 204
      assert_receive {:DOWN, _, :process, ^connect_pid, _}
      refute Process.alive?(connect_pid)
    end

    test "returns 204 when tenant exists but Connect is not running", %{conn: conn, tenant: %{external_id: external_id}} do
      %{status: status} = post(conn, ~p"/api/tenants/#{external_id}/shutdown")
      assert status == 204
    end

    test "returns 404 when tenant does not exist", %{conn: conn} do
      %{status: status} = post(conn, ~p"/api/tenants/nope/shutdown")
      assert status == 404
    end

    test "returns 403 when jwt is invalid", %{conn: conn, tenant: tenant} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = post(conn, ~p"/api/tenants/#{tenant.external_id}/shutdown")
      assert response(conn, 403) == ""
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id

      Tracer.with_span "test" do
        Task.async(fn ->
          post(conn, ~p"/api/tenants/#{tenant.external_id}/shutdown")

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "POST /api/tenants/:tenant_id/shutdown", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end
  end

  describe "health check tenant" do
    setup [:with_tenant]

    setup do
      previous_region = Application.get_env(:realtime, :region)
      Application.put_env(:realtime, :region, "us-east-1")
      on_exit(fn -> Application.put_env(:realtime, :region, previous_region) end)
    end

    test "health check when tenant does not exist", %{conn: conn} do
      %{status: status} = get(conn, ~p"/api/tenants/nope/health")
      assert status == 404
    end

    test "healthy tenant with 0 client connections", %{
      conn: conn,
      tenant: %Tenant{external_id: external_id}
    } do
      conn = get(conn, ~p"/api/tenants/#{external_id}/health")
      data = json_response(conn, 200)["data"]
      Connect.shutdown(external_id)

      assert %{
               "healthy" => true,
               "db_connected" => false,
               "replication_connected" => false,
               "connected_cluster" => 0,
               "region" => "us-east-1",
               "node" => "#{node()}"
             } == data
    end

    test "unhealthy tenant with 1 client connections and no db connection", %{
      conn: conn,
      tenant: %Tenant{external_id: ext_id}
    } do
      # Fake adding a connected client here
      # No connection to the tenant database
      UsersCounter.add(self(), ext_id)

      conn = get(conn, ~p"/api/tenants/#{ext_id}/health")
      data = json_response(conn, 200)["data"]

      assert %{
               "healthy" => false,
               "db_connected" => false,
               "replication_connected" => false,
               "connected_cluster" => 1,
               "region" => "us-east-1",
               "node" => "#{node()}"
             } == data
    end

    test "healthy tenant with db connection but no replication connection", %{
      conn: conn,
      tenant: %Tenant{external_id: ext_id}
    } do
      {:ok, db_conn} = Connect.lookup_or_start_connection(ext_id)
      # Fake adding a connected client here
      UsersCounter.add(self(), ext_id)

      # Fake a db connection without replication (replication_conn: nil)
      :syn.register(Realtime.Tenants.Connect, ext_id, self(), %{conn: nil, region: "us-east-1", replication_conn: nil})

      :syn.update_registry(Realtime.Tenants.Connect, ext_id, fn _pid, meta ->
        %{meta | conn: db_conn}
      end)

      conn = get(conn, ~p"/api/tenants/#{ext_id}/health")
      data = json_response(conn, 200)["data"]

      assert %{
               "healthy" => true,
               "db_connected" => true,
               "replication_connected" => false,
               "connected_cluster" => 1,
               "region" => "us-east-1",
               "node" => "#{node()}"
             } == data
    end

    test "healthy tenant with db and replication connection", %{conn: conn, tenant: %Tenant{external_id: ext_id}} do
      {:ok, db_conn} = Connect.lookup_or_start_connection(ext_id)
      # Fake adding a connected client here
      UsersCounter.add(self(), ext_id)

      # Fake a db connection with replication_conn in syn metadata
      :syn.register(Realtime.Tenants.Connect, ext_id, self(), %{conn: nil, region: "us-east-1", replication_conn: nil})

      :syn.update_registry(Realtime.Tenants.Connect, ext_id, fn _pid, meta ->
        %{meta | conn: db_conn, replication_conn: self()}
      end)

      conn = get(conn, ~p"/api/tenants/#{ext_id}/health")
      data = json_response(conn, 200)["data"]

      assert %{
               "healthy" => true,
               "db_connected" => true,
               "replication_connected" => true,
               "connected_cluster" => 1,
               "region" => "us-east-1",
               "node" => "#{node()}"
             } == data
    end

    test "returns 403 when jwt is invalid", %{conn: conn, tenant: tenant} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")
      assert response(conn, 403) == ""
    end

    test "triggers migrations without blocking and self heals eventually", %{conn: conn} do
      tenant = TestTenantDb.checkout_tenant(run_migrations: false)

      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      assert {:error, _} = Postgrex.query(db_conn, "SELECT * FROM realtime.messages", [])

      conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")

      assert %{"healthy" => false, "db_connected" => false, "replication_connected" => false, "connected_cluster" => 0} =
               json_response(conn, 200)["data"]

      assert_eventually {:ok, %{healthy: true}} = Realtime.Tenants.health_check(tenant.external_id)

      assert {:ok, %{rows: []}} = Postgrex.query(db_conn, "SELECT * FROM realtime.messages", [])

      conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")

      assert %{"healthy" => true, "db_connected" => false, "replication_connected" => false, "connected_cluster" => 0} =
               json_response(conn, 200)["data"]
    end

    test "sets appropriate observability metadata", %{conn: conn, tenant: tenant} do
      external_id = tenant.external_id
      # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
      Tracer.with_span "test" do
        Task.async(fn ->
          get(conn, ~p"/api/tenants/#{tenant.external_id}/health")

          assert Logger.metadata()[:external_id] == external_id
          assert Logger.metadata()[:project] == external_id
        end)
        |> Task.await()
      end

      assert_receive {:span, span(name: "GET /api/tenants/:tenant_id/health", attributes: attributes)}

      assert attributes(map: %{external_id: ^external_id}) = attributes
    end

    test "logs request when DISABLE_HEALTHCHECK_LOGGING is false", %{conn: conn, tenant: tenant} do
      original_value = Application.get_env(:realtime, :disable_healthcheck_logging, false)
      Application.put_env(:realtime, :disable_healthcheck_logging, false)
      on_exit(fn -> Application.put_env(:realtime, :disable_healthcheck_logging, original_value) end)

      log =
        capture_log(fn ->
          conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")
          assert json_response(conn, 200)
        end)

      assert log =~ "GET /api/tenants"
      assert log =~ "/health"
    end

    test "does not log request when DISABLE_HEALTHCHECK_LOGGING is true", %{conn: conn, tenant: tenant} do
      original_value = Application.get_env(:realtime, :disable_healthcheck_logging, false)
      Application.put_env(:realtime, :disable_healthcheck_logging, true)
      on_exit(fn -> Application.put_env(:realtime, :disable_healthcheck_logging, original_value) end)

      log =
        capture_log(fn ->
          conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")
          assert json_response(conn, 200)
        end)

      refute log =~ "GET /api/tenants"
      refute log =~ "/health"
    end

    test "logs request when DISABLE_HEALTHCHECK_LOGGING is not set (default)", %{conn: conn, tenant: tenant} do
      original_value = Application.get_env(:realtime, :disable_healthcheck_logging, false)
      Application.delete_env(:realtime, :disable_healthcheck_logging)
      on_exit(fn -> Application.put_env(:realtime, :disable_healthcheck_logging, original_value) end)

      log =
        capture_log(fn ->
          conn = get(conn, ~p"/api/tenants/#{tenant.external_id}/health")
          assert json_response(conn, 200)
        end)

      assert log =~ "GET /api/tenants"
      assert log =~ "/health"
    end
  end

  describe "bulk health check" do
    setup [:with_tenant]

    test "partitions refs into present and missing", %{conn: conn, tenant: %Tenant{external_id: external_id}} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => [external_id, "nope"]})

      assert %{"present" => [^external_id], "missing" => ["nope"]} = json_response(conn, 200)
    end

    test "all refs present", %{conn: conn, tenant: %Tenant{external_id: external_id}} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => [external_id]})

      assert %{"present" => [^external_id], "missing" => []} = json_response(conn, 200)
    end

    test "all refs missing", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => ["nope", "also-nope"]})

      assert %{"present" => [], "missing" => ["nope", "also-nope"]} = json_response(conn, 200)
    end

    test "empty refs", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => []})

      assert %{"present" => [], "missing" => []} = json_response(conn, 200)
    end

    test "duplicate refs are deduplicated", %{conn: conn, tenant: %Tenant{external_id: external_id}} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => [external_id, external_id, "nope", "nope"]})

      assert %{"present" => [^external_id], "missing" => ["nope"]} = json_response(conn, 200)
    end

    test "returns 422 when refs exceeds the maximum", %{conn: conn} do
      refs = Enum.map(1..501, &"ref-#{&1}")
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => refs})

      assert json_response(conn, 422) == %{"message" => "refs exceeds the maximum of 500"}
    end

    test "returns 422 when refs contains a non-string", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => ["ok", 1]})

      assert json_response(conn, 422) == %{"message" => "refs must be a list of strings"}
    end

    test "returns 422 when refs is not a list", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => "nope"})

      assert json_response(conn, 422) == %{"message" => "refs is required"}
    end

    test "returns 422 when refs is absent", %{conn: conn} do
      conn = post(conn, ~p"/api/tenants/health", %{})

      assert json_response(conn, 422) == %{"message" => "refs is required"}
    end

    test "returns 503 when the master region is unreachable", %{conn: conn, tenant: tenant} do
      previous_region = Application.get_env(:realtime, :region)
      previous_master_region = Application.get_env(:realtime, :master_region)
      Application.put_env(:realtime, :region, "ap-southeast-2")
      Application.put_env(:realtime, :master_region, "us-east-1")

      on_exit(fn ->
        Application.put_env(:realtime, :region, previous_region)
        Application.put_env(:realtime, :master_region, previous_master_region)
      end)

      expect(Realtime.Nodes, :node_from_region, fn "us-east-1", _key -> {:ok, :"master@127.0.0.1"} end)
      expect(Realtime.GenRpc, :call, fn _node, _mod, _fun, _args, _opts -> {:error, :rpc_error, :timeout} end)

      conn = post(conn, ~p"/api/tenants/health", %{"refs" => [tenant.external_id]})

      assert json_response(conn, 503) == %{"message" => "unable to reach the tenants database"}
    end

    test "returns 403 when jwt is invalid", %{conn: conn} do
      conn = put_req_header(conn, "authorization", "Bearer potato")
      conn = post(conn, ~p"/api/tenants/health", %{"refs" => []})

      assert response(conn, 403) == ""
    end
  end

  defp default_tenant_attrs(port) do
    %{
      "extensions" => [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => "supabase_admin",
            "db_password" => "postgres",
            "db_port" => "#{port}",
            "poll_interval" => 100,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "ssl_enforced" => false
          }
        }
      ],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "jwt_secret" => "new secret"
    }
  end

  defp put_extension_setting(%{"extensions" => [extension]} = attrs, key, value) do
    %{attrs | "extensions" => [update_in(extension, ["settings"], &Map.put(&1, key, value))]}
  end

  defp wait_on_postgres_cdc_rls(external_id) do
    case_wait Extensions.PostgresCdcRls.get_manager_conn(external_id), timeout: 1_000, interval: 100 do
      {:ok, _, _} -> :ok
    else
      last ->
        raise "Postgres CDC RLS manager connection not established for " <>
                "#{external_id} within 1000ms. Last result: #{inspect(last)}"
    end
  end

  defp tenant_db_port(tenant) do
    {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
    settings.port
  end
end
