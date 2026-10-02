defmodule Supavisor.PromEx.Plugins.TenantTest do
  use Supavisor.E2ECase, async: false

  require Supavisor
  import ExUnit.CaptureLog
  alias Supavisor.PromEx.Plugins.Tenant
  alias Supavisor.PromEx.Plugins.TenantTest.FakePool

  @moduletag telemetry: true

  describe "polling_metrics/1" do
    test "properly exports metric" do
      for polling_metric <- Tenant.polling_metrics([]) do
        assert %PromEx.MetricTypes.Polling{metrics: [_ | _]} = polling_metric
        {m, f, a} = polling_metric.measurements_mfa
        assert function_exported?(m, f, length(a))

        for telemetry_metric <- polling_metric.metrics do
          assert Enum.any?(
                   [
                     Telemetry.Metrics.Distribution,
                     Telemetry.Metrics.Counter,
                     Telemetry.Metrics.LastValue,
                     Telemetry.Metrics.Sum
                   ],
                   fn struct -> is_struct(telemetry_metric, struct) end
                 )

          assert telemetry_metric.description
        end
      end
    end

    test "uses poll rate option" do
      for polling_metric <- Tenant.polling_metrics(poll_rate: 1000) do
        assert %{poll_rate: 1000} = polling_metric
      end
    end
  end

  describe "client_handler state transitions" do
    setup ctx do
      create_instance([__MODULE__, ctx.line])
    end

    test "emits state transition events", ctx do
      tenant = ctx.external_id
      ref = attach_handler([:supavisor, :client_handler, :state])

      start_supervised!(
        {SingleConnection,
         hostname: "localhost",
         port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
         database: ctx.db,
         username: ctx.user,
         password: "postgres"}
      )

      assert_receive {^ref, {[:supavisor, :client_handler, :state], %{duration: _}, meta}}
      assert %{from_state: :handshake, to_state: :auth_scram_first_wait, tenant: ^tenant} = meta

      assert_receive {^ref, {[:supavisor, :client_handler, :state], %{duration: _}, meta}}

      assert %{
               from_state: :auth_scram_first_wait,
               to_state: :auth_scram_final_wait,
               tenant: ^tenant
             } = meta

      assert_receive {^ref, {[:supavisor, :client_handler, :state], %{duration: _}, meta}}
      assert %{from_state: :auth_scram_final_wait, to_state: :connecting, tenant: ^tenant} = meta

      assert_receive {^ref, {[:supavisor, :client_handler, :state], %{duration: _}, meta}}
      assert %{from_state: :connecting, to_state: :idle, tenant: ^tenant} = meta
    end
  end

  describe "execute_client_connections_lifetime" do
    setup ctx do
      create_instance([__MODULE__, ctx.line])
    end

    test "emits event for active client connections", ctx do
      start_supervised!(
        {SingleConnection,
         hostname: "localhost",
         port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
         database: ctx.db,
         username: ctx.user,
         password: "postgres"}
      )

      ref = attach_handler([:supavisor, :client, :connection, :lifetime])
      assert :ok = Tenant.execute_client_connections_lifetime()

      assert_receive {^ref, {[:supavisor, :client, :connection, :lifetime], measurement, meta}}

      assert %{lifetime: lifetime} = measurement
      assert lifetime >= 0

      assert meta == %{
               tenant: ctx.db,
               user: String.split(ctx.user, ".") |> List.first(),
               mode: :transaction,
               type: :single,
               db_name: ctx.db,
               search_path: nil,
               app_name: ""
             }
    end
  end

  describe "execute_tenant_metrics/0" do
    test "aggregates clients with different upstream_tls into one count" do
      base_id =
        Supavisor.id(
          type: :single,
          tenant: "metrics_tls_test",
          user: "test_user",
          mode: :transaction,
          db: "test_db",
          search_path: nil,
          upstream_tls: false
        )

      tls_id = Supavisor.id(base_id, upstream_tls: true)

      # Register 3 clients without TLS and 2 with TLS
      test_pid = self()
      ids = [base_id, base_id, base_id, tls_id, tls_id]

      for {id, i} <- Enum.with_index(ids) do
        start_supervised!(
          {Task,
           fn ->
             Registry.register(Supavisor.Registry.TenantClients, id,
               app_name: "myapp",
               include_app_name: true
             )

             send(test_pid, :registered)
             Process.sleep(:infinity)
           end},
          id: :"client_#{i}"
        )
      end

      for _ <- 1..length(ids), do: assert_receive(:registered, 1_000)

      ref = attach_handler([:supavisor, :connections])
      Tenant.execute_tenant_metrics()

      assert_receive {^ref, {[:supavisor, :connections], %{active: 5}, meta}}

      assert meta == %{
               tenant: "metrics_tls_test",
               user: "test_user",
               mode: :transaction,
               type: :single,
               db_name: "test_db",
               search_path: nil,
               app_name: "myapp"
             }

      refute_receive {^ref, {[:supavisor, :connections], %{active: 3}, _}}
      refute_receive {^ref, {[:supavisor, :connections], %{active: 2}, _}}
    end

    test "groups clients by app_name" do
      id =
        Supavisor.id(
          type: :single,
          tenant: "metrics_app_name_test",
          user: "test_user",
          mode: :transaction,
          db: "test_db",
          search_path: nil,
          upstream_tls: false
        )

      test_pid = self()

      clients = [
        {id, [app_name: "webapp", include_app_name: true]},
        {id, [app_name: "webapp", include_app_name: true]},
        {id, [app_name: "worker", include_app_name: true]},
        {id, [app_name: "", include_app_name: true]}
      ]

      for {{reg_id, meta}, i} <- Enum.with_index(clients) do
        start_supervised!(
          {Task,
           fn ->
             Registry.register(Supavisor.Registry.TenantClients, reg_id, meta)
             send(test_pid, :registered)
             Process.sleep(:infinity)
           end},
          id: :"app_name_client_#{i}"
        )
      end

      for _ <- 1..length(clients), do: assert_receive(:registered, 1_000)

      ref = attach_handler([:supavisor, :connections])
      Tenant.execute_tenant_metrics()

      events =
        Enum.reduce_while(1..10, [], fn _, acc ->
          receive do
            {^ref,
             {[:supavisor, :connections], measurement, %{tenant: "metrics_app_name_test"} = meta}} ->
              {:cont, [{measurement, meta} | acc]}
          after
            100 -> {:halt, acc}
          end
        end)

      by_app = Map.new(events, fn {%{active: count}, %{app_name: app}} -> {app, count} end)
      assert map_size(by_app) == 3
      assert by_app["webapp"] == 2
      assert by_app["worker"] == 1
      assert by_app[""] == 1
    end

    test "does not publish app_name when include_app_name is false or absent" do
      id =
        Supavisor.id(
          type: :single,
          tenant: "metrics_app_name_off_test",
          user: "test_user",
          mode: :transaction,
          db: "test_db",
          search_path: nil,
          upstream_tls: false
        )

      clients = [
        {id, [app_name: "webapp", include_app_name: false]},
        {id, [app_name: "worker"]}
      ]

      for {{reg_id, meta}, i} <- Enum.with_index(clients) do
        start_supervised!(
          {Task,
           fn ->
             Registry.register(Supavisor.Registry.TenantClients, reg_id, meta)
             Process.sleep(:infinity)
           end},
          id: :"app_name_off_client_#{i}"
        )
      end

      ref = attach_handler([:supavisor, :connections])
      Tenant.execute_tenant_metrics()

      assert_receive {^ref, {[:supavisor, :connections], %{active: 2}, %{app_name: ""}}}
      refute_receive {^ref, {[:supavisor, :connections], _, %{app_name: "webapp"}}}
      refute_receive {^ref, {[:supavisor, :connections], _, %{app_name: "worker"}}}
    end
  end

  describe "execute_tenant_proxy_metrics/0" do
    test "aggregates proxy clients with different upstream_tls into one count" do
      base_id =
        Supavisor.id(
          type: :single,
          tenant: "proxy_metrics_tls_test",
          user: "test_user",
          mode: :transaction,
          db: "test_db",
          search_path: nil,
          upstream_tls: false
        )

      tls_id = Supavisor.id(base_id, upstream_tls: true)

      test_pid = self()
      ids = [base_id, base_id, tls_id]

      for {id, i} <- Enum.with_index(ids) do
        start_supervised!(
          {Task,
           fn ->
             Registry.register(Supavisor.Registry.TenantProxyClients, id,
               app_name: "proxyapp",
               include_app_name: true
             )

             send(test_pid, :registered)
             Process.sleep(:infinity)
           end},
          id: :"proxy_client_#{i}"
        )
      end

      for _ <- 1..length(ids), do: assert_receive(:registered, 1_000)

      ref = attach_handler([:supavisor, :proxy, :connections])
      Tenant.execute_tenant_proxy_metrics()

      assert_receive {^ref, {[:supavisor, :proxy, :connections], %{active: 3}, meta}}

      assert meta == %{
               tenant: "proxy_metrics_tls_test",
               user: "test_user",
               mode: :transaction,
               type: :single,
               db_name: "test_db",
               search_path: nil,
               app_name: "proxyapp"
             }

      refute_receive {^ref, {[:supavisor, :proxy, :connections], %{active: 2}, _}}
      refute_receive {^ref, {[:supavisor, :proxy, :connections], %{active: 1}, _}}
    end
  end

  describe "execute_pool_metrics/0" do
    setup ctx do
      create_instance([__MODULE__, ctx.line])
    end

    test "reports idle: 1 after transaction query completes", %{db: tenant} = ctx do
      conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      ref = attach_handler([:supavisor, :pool, :connections])
      Tenant.execute_pool_metrics()

      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 1, checked_out: 0},
                       %{tenant: ^tenant} = meta}}

      assert meta == %{
               tenant: ctx.db,
               user: String.split(ctx.user, ".") |> List.first(),
               mode: :transaction,
               type: :single,
               db_name: ctx.db,
               search_path: nil
             }
    end

    test "reports checked_out: 1 during an open transaction", %{db: tenant} = ctx do
      conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      {:ok, _} = SingleConnection.query(conn, "BEGIN")

      ref = attach_handler([:supavisor, :pool, :connections])
      Tenant.execute_pool_metrics()

      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 0, checked_out: 1},
                       %{tenant: ^tenant, mode: :transaction}}}
    end

    test "reports checked_out: 1 for an active session connection", %{db: tenant} = ctx do
      conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_session),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      ref = attach_handler([:supavisor, :pool, :connections])
      Tenant.execute_pool_metrics()

      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 0, checked_out: 1},
                       %{tenant: ^tenant, mode: :session}}}
    end

    test "logs an error if pool status request times out", %{db: tenant} = ctx do
      conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_session),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      pid =
        Supavisor.get_local_pool(
          Supavisor.id(
            type: :single,
            tenant: ctx.external_id,
            user: String.split(ctx.user, ".") |> List.first(),
            mode: :session,
            db: ctx.external_id
          )
        )

      :sys.suspend(pid)

      ref = attach_handler([:supavisor, :pool, :connections])

      assert capture_log(fn -> Tenant.execute_pool_metrics() end) =~
               "Failed to get pool status for #{ctx.external_id}(#{inspect(pid)}): {:timeout"

      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 0, checked_out: 0},
                       %{tenant: ^tenant}}}
    end

    test "reports metrics for the remaining pools if a status for a single one times out",
         %{db: tenant} = ctx do
      session_conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_session),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      {:ok, _} = SingleConnection.query(session_conn, "SELECT 1")

      session_pid =
        Supavisor.get_local_pool(
          Supavisor.id(
            type: :single,
            tenant: ctx.external_id,
            user: String.split(ctx.user, ".") |> List.first(),
            mode: :session,
            db: ctx.external_id
          )
        )

      :sys.suspend(session_pid)

      transaction_conn =
        start_supervised!(
          {SingleConnection,
           hostname: "localhost",
           port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
           database: ctx.db,
           username: ctx.user,
           password: "postgres"}
        )

      Task.start_link(fn -> SingleConnection.query(transaction_conn, "SELECT pg_sleep(2)") end)

      ref = attach_handler([:supavisor, :pool, :connections])
      Tenant.execute_pool_metrics()

      # Still receives metrics for the timed-out pool (with 0 connections)
      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 0, checked_out: 0},
                       %{tenant: ^tenant, mode: :session}}}

      # And also receives metrics for the other pool
      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 0, checked_out: 1},
                       %{tenant: ^tenant, mode: :transaction}}}
    end

    test "aggregates multiple pools with the same id into one event" do
      id =
        Supavisor.id(
          type: :cluster,
          tenant: "pool_cluster_test",
          user: "test_user",
          mode: :transaction,
          db: "test_db",
          search_path: nil,
          upstream_tls: false
        )

      # Simulate cluster mode: two pools registered under the same canonical id
      # but with different replica_type and pool_index (as TenantSupervisor does).
      for {replica_type, idx, status} <- [
            {:primary, 0, {:ready, _idle = 3, 0, _checked_out = 1}},
            {:replica, 1, {:ready, _idle = 1, 0, _checked_out = 2}}
          ] do
        start_supervised!(
          {FakePool, {{:pool, replica_type, idx, id}, status}},
          id: :"fake_pool_#{idx}"
        )
      end

      ref = attach_handler([:supavisor, :pool, :connections])
      Tenant.execute_pool_metrics()

      # idle: 3+1=4, checked_out: 1+2=3, exactly ONE event (not two)
      assert_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 4, checked_out: 3},
                       %{tenant: "pool_cluster_test", mode: :transaction}}}

      refute_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 3, checked_out: 1},
                       %{tenant: "pool_cluster_test", mode: :transaction}}}

      refute_receive {^ref,
                      {[:supavisor, :pool, :connections], %{idle: 1, checked_out: 2},
                       %{tenant: "pool_cluster_test", mode: :transaction}}}
    end
  end

  def handle_event(event_name, measurement, meta, {pid, ref}) do
    send(pid, {ref, {event_name, measurement, meta}})
  end

  defp attach_handler(event) do
    ref = make_ref()

    :telemetry.attach(
      {ref, :test},
      event,
      &__MODULE__.handle_event/4,
      {self(), ref}
    )

    on_exit(fn ->
      :telemetry.detach({ref, :test})
    end)

    ref
  end

  defmodule FakePool do
    @moduledoc false
    use GenServer

    def start_link({registry_key, status}),
      do: GenServer.start_link(__MODULE__, {registry_key, status})

    @impl true
    def init({registry_key, status}) do
      Registry.register(Supavisor.Registry.Tenants, registry_key, :primary)
      {:ok, status}
    end

    @impl true
    def handle_call(:status, _from, status), do: {:reply, status, status}
  end
end
