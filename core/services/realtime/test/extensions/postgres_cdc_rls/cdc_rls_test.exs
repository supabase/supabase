defmodule Extensions.PostgresCdcRlsTest do
  # async: false due to global mimic mock
  use Realtime.DataCase, async: false
  use Mimic

  import ExUnit.CaptureLog

  setup :set_mimic_from_context

  alias Extensions.PostgresCdcRls
  alias Extensions.PostgresCdcRls.ReplicationPoller
  alias Extensions.PostgresCdcRls.Subscriptions
  alias PostgresCdcRls.SubscriptionManager
  alias Postgrex
  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.PostgresCdc
  alias Realtime.RateCounter
  alias Realtime.Tenants.Rebalancer

  @cdc_module Extensions.PostgresCdcRls

  describe "Postgres extensions" do
    setup do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      Integrations.setup_postgres_changes(conn)
      GenServer.stop(conn)

      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)
      args = %{"id" => external_id, "region" => postgres_extension["region"]}

      pg_change_params = pubsub_subscribe(external_id)

      RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))
      # First time it will return nil
      PostgresCdcRls.handle_connect(args)
      # Wait for it to start
      assert_receive %{event: "ready"}, 1000

      on_exit(fn -> PostgresCdcRls.handle_stop(external_id, 10_000) end)
      {:ok, response} = PostgresCdcRls.handle_connect(args)

      # Now subscribe to the Postgres Changes
      {:ok, _} = PostgresCdcRls.handle_after_connect(response, postgres_extension, pg_change_params, external_id)

      RealtimeWeb.Endpoint.unsubscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))
      %{tenant: tenant}
    end

    test "supervisor crash must not respawn", %{tenant: tenant} do
      scope = Realtime.Syn.PostgresCdc.scope(tenant.external_id)

      sup =
        case_wait :syn.lookup(scope, tenant.external_id), timeout: 15_000, interval: 500 do
          {pid, _} when is_pid(pid) -> pid
        else
          :undefined -> flunk("PostgresCdc supervisor never registered for #{tenant.external_id}")
        end

      assert Process.alive?(sup)
      Process.monitor(sup)

      RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))
      RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.down_topic(tenant.external_id))

      Process.exit(sup, :kill)

      assert_receive {:DOWN, _, :process, ^sup, _reason}, 5000
      down_event = Realtime.Syn.PostgresCdc.down_event()
      assert_receive %{event: ^down_event}
      refute_receive %{event: "ready"}, 1000

      assert :undefined == :syn.lookup(scope, tenant.external_id)
    end

    test "Subscription manager updates oids", %{tenant: tenant} do
      {subscriber_manager_pid, conn} =
        case_wait PostgresCdcRls.get_manager_conn(tenant.external_id), timeout: 5_000, interval: 200 do
          {:ok, pid, conn} -> {pid, conn}
        else
          last -> flunk("SubscriptionManager connection never became ready. Last result: #{inspect(last)}")
        end

      %SubscriptionManager.State{oids: oids} = :sys.get_state(subscriber_manager_pid)

      Postgrex.query!(conn, "drop publication if exists supabase_realtime_test", [])
      send(subscriber_manager_pid, :check_oids)
      %{oids: oids2} = :sys.get_state(subscriber_manager_pid)
      assert !Map.equal?(oids, oids2)

      Postgrex.query!(conn, "create publication supabase_realtime_test for all tables", [])
      send(subscriber_manager_pid, :check_oids)
      %{oids: oids3} = :sys.get_state(subscriber_manager_pid)
      assert !Map.equal?(oids2, oids3)
    end

    test "Replication poller toggles slot when publication tables come and go", %{tenant: tenant} do
      [{poller_pid, _}] = Registry.lookup(ReplicationPoller.Registry, tenant.external_id)

      # Use the SubscriptionManager pub connection to drive publication state from the test —
      # the poller's own conn is owned by the poller process.
      {:ok, _manager_pid, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{slot_name: slot_name} = wait_for_poller_oids(poller_pid)

      assert %Postgrex.Result{rows: [[1]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])

      # Drop the publication: poller should drop its slot and clear oids.
      Postgrex.query!(conn, "drop publication if exists supabase_realtime_test", [])
      send(poller_pid, :check_oids)
      %{oids: oids_after_drop, poll_ref: poll_ref_after_drop} = :sys.get_state(poller_pid)
      assert oids_after_drop == %{}
      assert poll_ref_after_drop == nil

      assert %Postgrex.Result{rows: [[0]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])

      # Re-create the publication: poller should recreate the slot and repopulate oids.
      Postgrex.query!(conn, "create publication supabase_realtime_test for all tables", [])
      send(poller_pid, :check_oids)
      %{oids: oids_after_create} = :sys.get_state(poller_pid)
      refute oids_after_create == %{}

      assert %Postgrex.Result{rows: [[1]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])
    end

    test "Replication poller toggles slot when tables are removed from the publication", %{tenant: tenant} do
      [{poller_pid, _}] = Registry.lookup(ReplicationPoller.Registry, tenant.external_id)
      {:ok, _manager_pid, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{slot_name: slot_name} = wait_for_poller_oids(poller_pid)

      assert %Postgrex.Result{rows: [[1]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])

      # Publication still exists but has no tables (recreated without FOR ALL TABLES
      # since you can't ALTER ... DROP TABLE on a FOR ALL TABLES publication).
      Postgrex.query!(conn, "drop publication if exists supabase_realtime_test", [])
      Postgrex.query!(conn, "create publication supabase_realtime_test", [])

      send(poller_pid, :check_oids)
      %{oids: oids_after_empty, poll_ref: poll_ref_after_empty} = :sys.get_state(poller_pid)
      assert oids_after_empty == %{}
      assert poll_ref_after_empty == nil

      assert %Postgrex.Result{rows: [[0]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])

      # Add a table back to the publication: poller should recreate the slot and repopulate oids.
      Postgrex.query!(conn, "alter publication supabase_realtime_test add table public.test", [])

      send(poller_pid, :check_oids)
      %{oids: oids_after_add} = :sys.get_state(poller_pid)
      refute oids_after_add == %{}

      assert %Postgrex.Result{rows: [[1]]} =
               Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])
    end

    test "stop tenant supervisor", %{tenant: tenant} do
      scope = Realtime.Syn.PostgresCdc.scope(tenant.external_id)

      sup =
        case_wait :syn.lookup(scope, tenant.external_id), timeout: 5_000, interval: 500 do
          {pid, _} when is_pid(pid) -> pid
        else
          :undefined -> flunk("PostgresCdc supervisor never registered for #{tenant.external_id}")
        end

      assert Process.alive?(sup)
      PostgresCdc.stop(@cdc_module, tenant)
      assert Process.alive?(sup) == false
    end
  end

  describe "handle_after_connect/4" do
    setup do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      %{tenant: tenant}
    end

    test "rate counter raises exception returns error", %{tenant: tenant} do
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      stub(RateCounter, :get, fn _args -> raise "unexpected RateCounter failure" end)

      import ExUnit.CaptureLog

      log =
        capture_log(fn ->
          assert {:error, "Too many database timeouts"} =
                   PostgresCdcRls.handle_after_connect({:manager_pid, self()}, postgres_extension, %{}, external_id)
        end)

      assert log =~ "RateCounterError"
    end

    test "subscription error rate limit", %{tenant: tenant} do
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      stub(Subscriptions, :create, fn _conn, _publication, _subscription_list, _manager, _caller ->
        {:error, %DBConnection.ConnectionError{}}
      end)

      # Now try to subscribe to the Postgres Changes
      for _x <- 1..6 do
        assert {:error, "Too many database timeouts"} =
                 PostgresCdcRls.handle_after_connect({:manager_pid, self()}, postgres_extension, %{}, external_id)
      end

      rate = Realtime.Tenants.subscription_errors_per_second_rate(external_id, 4)

      assert {:ok, %RateCounter{id: {:channel, :subscription_errors, ^external_id}, sum: 6, limit: %{triggered: true}}} =
               RateCounterHelper.tick!(rate)

      # It won't even be called now
      reject(&Subscriptions.create/5)

      assert {:error, "Too many database timeouts"} =
               PostgresCdcRls.handle_after_connect({:manager_pid, self()}, postgres_extension, %{}, external_id)
    end

    test "a statement timeout cancellation counts as a database timeout", %{tenant: tenant} do
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      expect(Subscriptions, :create, fn _conn, _publication, _subscription_list, _manager, _caller ->
        {:error, {:database_timeout, %Postgrex.Error{postgres: %{code: :query_canceled}}}}
      end)

      assert {:error, "Too many database timeouts"} =
               PostgresCdcRls.handle_after_connect({:manager_pid, self()}, postgres_extension, %{}, external_id)

      rate = Realtime.Tenants.subscription_errors_per_second_rate(external_id, 4)

      assert {:ok, %RateCounter{id: {:channel, :subscription_errors, ^external_id}, sum: 1}} =
               RateCounterHelper.tick!(rate)
    end
  end

  describe "region rebalancing" do
    setup do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      args = %{"id" => external_id, "region" => postgres_extension["region"], check_region_interval: 100}

      %{tenant_id: tenant.external_id, args: args}
    end

    test "rebalancing needed process stops", %{tenant_id: tenant_id, args: args} do
      log =
        capture_log(fn ->
          expect(Rebalancer, :check, fn _, _, ^tenant_id -> {:error, :wrong_region} end)

          {:ok, pid} = PostgresCdcRls.start(args)
          ref = Process.monitor(pid)

          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 3000
        end)

      assert log =~ "Rebalancing Postgres Changes replication for a closer region"
    end

    test "rebalancing not needed process stays up", %{tenant_id: tenant_id, args: args} do
      stub(Rebalancer, :check, fn _, _, ^tenant_id -> :ok end)

      {:ok, pid} = PostgresCdcRls.start(args)
      ref = Process.monitor(pid)

      refute_receive {:DOWN, ^ref, :process, ^pid, _reason}, 1000
    end
  end

  describe "integration" do
    setup [:integration]

    test "subscribe inserts only", %{tenant: tenant, conn: conn} do
      on_exit(fn -> PostgresCdcRls.handle_stop(tenant.external_id, 10_000) end)

      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)
      args = %{"id" => external_id, "region" => postgres_extension["region"]}

      pg_change_params = pubsub_subscribe(external_id, "INSERT")

      # First time it will return nil
      PostgresCdcRls.handle_connect(args)
      # Wait for it to start
      assert_receive %{event: "ready"}, 3000
      {:ok, response = {manager_pid, _}} = PostgresCdcRls.handle_connect(args)

      assert_receive {
        :telemetry,
        [:realtime, :rpc],
        %{latency: _},
        %{
          mechanism: :gen_rpc,
          success: true
        }
      }

      # Now subscribe to the Postgres Changes
      Postgrex.query!(conn, "delete from realtime.subscription", [])
      {:ok, _} = PostgresCdcRls.handle_after_connect(response, postgres_extension, pg_change_params, external_id)

      assert %Postgrex.Result{num_rows: n} = Postgrex.query!(conn, "select id from realtime.subscription", [])
      assert n >= 1

      :sys.get_state(manager_pid)

      [{poller_pid, _}] = Registry.lookup(ReplicationPoller.Registry, external_id)
      wait_for_poller_oids(poller_pid)

      # Insert a record
      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])
      # Delete the record
      %{num_rows: 1} = Postgrex.query!(conn, "delete from test", [])

      assert_receive {:socket_push, :text, data}, 5000
      # No DELETE should be received
      refute_receive {:socket_push, :text, _data}, 1000

      assert %{
               "event" => "postgres_changes",
               "payload" => %{
                 "data" => %{
                   "columns" => [
                     %{"name" => "id", "type" => "int4"},
                     %{"name" => "details", "type" => "text"},
                     %{"name" => "binary_data", "type" => "bytea"}
                   ],
                   "commit_timestamp" => _,
                   "errors" => nil,
                   "record" => %{"details" => "test", "id" => ^id, "binary_data" => nil},
                   "schema" => "public",
                   "table" => "test",
                   "type" => "INSERT"
                 },
                 "ids" => _
               },
               "ref" => nil,
               "topic" => "realtime:test"
             } = Jason.decode!(data)

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)

      assert {:ok, %RateCounter{id: {:channel, :db_events, ^external_id}, bucket: bucket}} =
               RateCounterHelper.tick!(rate)

      assert Enum.sum(bucket) == 1

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: _},
        %{tenant: ^external_id, message_type: :postgres_changes}
      }
    end

    test "db events rate limit works", %{tenant: tenant, conn: conn} do
      on_exit(fn -> PostgresCdcRls.handle_stop(tenant.external_id, 10_000) end)

      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)
      args = %{"id" => external_id, "region" => postgres_extension["region"]}

      pg_change_params = pubsub_subscribe(external_id)

      # First time it will return nil
      PostgresCdcRls.handle_connect(args)
      # Wait for it to start
      assert_receive %{event: "ready"}, 1000
      {:ok, response} = PostgresCdcRls.handle_connect(args)

      # Now subscribe to the Postgres Changes
      Postgrex.query!(conn, "delete from realtime.subscription", [])
      {:ok, _} = PostgresCdcRls.handle_after_connect(response, postgres_extension, pg_change_params, external_id)
      assert %Postgrex.Result{rows: [[n]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
      assert n >= 1

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)

      log =
        capture_log(fn ->
          # increment artifically the counter to  reach the limit
          tenant.external_id
          |> Realtime.Tenants.db_events_per_second_key()
          |> Realtime.GenCounter.add(100_000_000)

          RateCounterHelper.tick!(rate)
        end)

      assert log =~ "MessagePerSecondRateLimitReached: Too many postgres changes messages per second"

      # Insert a record
      %{rows: [[_id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      refute_receive {:socket_push, :text, _}, 5000

      assert {:ok, %RateCounter{id: {:channel, :db_events, ^external_id}, bucket: bucket, limit: %{triggered: true}}} =
               RateCounterHelper.tick!(rate)

      # Nothing has changed
      assert Enum.sum(bucket) == 100_000_000
    end
  end

  @aux_mod (quote do
              defmodule Subscriber do
                # Start CDC remotely
                def subscribe(tenant) do
                  %Tenant{extensions: extensions, external_id: external_id} = tenant
                  postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)
                  args = %{"id" => external_id, "region" => postgres_extension["region"]}

                  RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))
                  # First time it will return nil
                  PostgresCdcRls.start(args)
                  # Wait for it to start
                  assert_receive %{event: "ready"}, 3000
                  {:ok, manager, conn} = PostgresCdcRls.get_manager_conn(external_id)
                  {:ok, {manager, conn}}
                end
              end
            end)
  describe "distributed integration" do
    setup [:distributed_integration]

    setup(%{tenant: tenant}) do
      {:ok, node} = Clustered.start(@aux_mod)
      {:ok, response} = :erpc.call(node, Subscriber, :subscribe, [tenant])

      on_exit(fn ->
        try do
          PostgresCdcRls.handle_stop(tenant.external_id, 5_000)
        catch
          _, _ -> :ok
        end
      end)

      %{node: node, response: response}
    end

    test "subscribe distributed mode", %{tenant: tenant, conn: conn, node: node, response: {manager_pid, _} = response} do
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      pg_change_params = pubsub_subscribe(external_id)

      Postgrex.query!(conn, "delete from realtime.subscription", [])
      {:ok, _} = PostgresCdcRls.handle_after_connect(response, postgres_extension, pg_change_params, external_id)
      assert %Postgrex.Result{rows: [[n]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
      assert n >= 1

      # Wait for subscription to be executing
      :sys.get_state(manager_pid)

      [{poller_pid, _}] = :erpc.call(node, Registry, :lookup, [ReplicationPoller.Registry, external_id])
      wait_for_poller_oids(poller_pid)

      # Insert a record
      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])
      # Delete the record
      %{num_rows: 1} = Postgrex.query!(conn, "delete from test", [])

      assert_receive {:socket_push, :text, data1}, 5000
      assert_receive {:socket_push, :text, data2}, 5000

      events = Enum.map([data1, data2], &Jason.decode!/1)

      assert Enum.any?(events, fn event ->
               match?(
                 %{
                   "event" => "postgres_changes",
                   "payload" => %{
                     "data" => %{
                       "errors" => nil,
                       "record" => %{"details" => "test", "id" => ^id, "binary_data" => nil},
                       "schema" => "public",
                       "table" => "test",
                       "type" => "INSERT"
                     }
                   },
                   "ref" => nil,
                   "topic" => "realtime:test"
                 },
                 event
               )
             end)

      assert Enum.any?(events, fn event ->
               match?(
                 %{
                   "event" => "postgres_changes",
                   "payload" => %{
                     "data" => %{
                       "errors" => nil,
                       "type" => "DELETE",
                       "old_record" => %{"id" => ^id},
                       "schema" => "public",
                       "table" => "test"
                     }
                   },
                   "ref" => nil,
                   "topic" => "realtime:test"
                 },
                 event
               )
             end)

      assert_receive {
        :telemetry,
        [:realtime, :rpc],
        %{latency: _},
        %{
          mechanism: :gen_rpc,
          origin_node: _,
          success: true,
          target_node: ^node
        }
      }
    end

    test "cdc going down on another node notifies subscribers here", %{tenant: tenant, node: remote_node} do
      %Tenant{external_id: external_id} = tenant

      RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.down_topic(external_id))

      assert_eventually {:ok, manager_pid, _conn} = PostgresCdcRls.get_manager_conn(external_id)

      assert node(manager_pid) == remote_node

      :ok = PostgresCdcRls.handle_stop(external_id, 5_000)

      down_event = Realtime.Syn.PostgresCdc.down_event()
      assert_receive %{event: ^down_event}, 5000
    end

    test "subscription error rate limit", %{tenant: tenant, node: node} do
      %Tenant{extensions: extensions, external_id: external_id} = tenant
      postgres_extension = PostgresCdc.filter_settings("postgres_cdc_rls", extensions)

      pg_change_params = pubsub_subscribe(external_id)

      # Grab a process that is not alive to cause subscriptions to error out
      pid = :erpc.call(node, :erlang, :self, [])

      # Now subscribe to the Postgres Changes multiple times to reach the rate limit
      for _ <- 1..6 do
        assert {:error, "Too many database timeouts"} =
                 PostgresCdcRls.handle_after_connect({pid, pid}, postgres_extension, pg_change_params, external_id)
      end

      rate = Realtime.Tenants.subscription_errors_per_second_rate(external_id, 4)

      assert {:ok, %RateCounter{id: {:channel, :subscription_errors, ^external_id}, limit: %{triggered: true}}} =
               RateCounterHelper.tick!(rate)

      # It won't even be called now
      reject(&Realtime.GenRpc.call/5)

      assert {:error, "Too many database timeouts"} =
               PostgresCdcRls.handle_after_connect({pid, pid}, postgres_extension, pg_change_params, external_id)
    end
  end

  defp integration(_) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, conn} = Database.connect(tenant, "realtime_test")
    Integrations.setup_postgres_changes(conn)

    on_exit(fn -> RateCounterHelper.stop(tenant.external_id) end)
    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    :telemetry.attach_many(
      __MODULE__,
      [[:realtime, :tenants, :payload, :size], [:realtime, :rpc]],
      &__MODULE__.handle_telemetry/4,
      pid: self()
    )

    RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))

    %{tenant: tenant, conn: conn}
  end

  defp distributed_integration(_) do
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
    {:ok, conn} = Database.connect(tenant, "realtime_test")
    Integrations.setup_postgres_changes(conn)

    on_exit(fn -> RateCounterHelper.stop(tenant.external_id) end)
    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    :telemetry.attach_many(
      __MODULE__,
      [[:realtime, :tenants, :payload, :size], [:realtime, :rpc]],
      &__MODULE__.handle_telemetry/4,
      pid: self()
    )

    RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.syn_topic(tenant.external_id))

    %{tenant: tenant, conn: conn}
  end

  # setup/0 already received the "ready" event, but that only reflects the
  # supervisor's manager/subs_pool metadata — it doesn't guarantee the poller
  # has finished its own :connect/:prepare continue.
  # So poll :sys.get_state until oids show up instead of asserting on the first read.
  defp wait_for_poller_oids(poller_pid) do
    case_wait :sys.get_state(poller_pid) do
      %{oids: oids} = state when map_size(oids) > 0 -> state
    else
      state -> flunk("ReplicationPoller oids never populated. Last state: #{inspect(state)}")
    end
  end

  defp pubsub_subscribe(external_id, event \\ "*") do
    pg_change_params = [
      %{
        id: UUID.uuid1(),
        params: %{"event" => event, "schema" => "public"},
        channel_pid: self(),
        claims: %{
          "exp" => System.system_time(:second) + 100_000,
          "iat" => 0,
          "ref" => "127.0.0.1",
          "role" => "anon"
        }
      }
    ]

    topic = "realtime:test"
    serializer = Phoenix.Socket.V1.JSONSerializer

    ids =
      Enum.map(pg_change_params, fn %{id: id, params: params} ->
        {UUID.string_to_binary!(id), :erlang.phash2(params)}
      end)

    subscription_metadata = {:subscriber_fastlane, self(), serializer, ids, topic, true}
    metadata = [metadata: subscription_metadata]
    :ok = PostgresCdc.subscribe(PostgresCdcRls, pg_change_params, external_id, metadata)
    pg_change_params
  end

  def handle_telemetry(event, measures, metadata, pid: pid), do: send(pid, {:telemetry, event, measures, metadata})
end
