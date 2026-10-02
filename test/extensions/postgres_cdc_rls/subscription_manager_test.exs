defmodule Extensions.PostgresCdcRls.SubscriptionManagerTest do
  # async: false due to global Mimic stubs
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Extensions.PostgresCdcRls
  alias Extensions.PostgresCdcRls.SubscriptionManager
  alias Extensions.PostgresCdcRls.Subscriptions
  alias Realtime.Database
  alias Realtime.GenRpc
  alias Realtime.PostgresCdc
  alias Realtime.Tenants.Rebalancer

  import ExUnit.CaptureLog
  import UUID, only: [uuid1: 0, string_to_binary!: 1]

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, db_conn} = Realtime.Database.connect(tenant, "realtime_test", :stop)
    Integrations.setup_postgres_changes(db_conn)
    GenServer.stop(db_conn)
    Realtime.Tenants.Cache.update_cache(tenant)

    subscribers_pids_table = :ets.new(__MODULE__, [:public, :bag])
    subscribers_nodes_table = :ets.new(__MODULE__, [:public, :set])

    args = %{
      "id" => tenant.external_id,
      "subscribers_nodes_table" => subscribers_nodes_table,
      "subscribers_pids_table" => subscribers_pids_table
    }

    publication = "supabase_realtime_test"

    # register this process with syn as if this was the WorkersSupervisor

    scope = Realtime.Syn.PostgresCdc.scope(tenant.external_id)
    :syn.register(scope, tenant.external_id, self(), %{region: "us-east-1", manager: nil, subs_pool: nil})

    {:ok, pid} = SubscriptionManager.start_link(args)
    # This serves so that we know that handle_continue has finished
    :sys.get_state(pid)
    %{args: args, pid: pid, publication: publication, tenant: tenant}
  end

  describe "subscription" do
    test "subscription", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])
      {uuid, bin_uuid, pg_change_params} = pg_change_params()

      subscriber = self()

      assert {:ok, [%Postgrex.Result{command: :insert}]} =
               Subscriptions.create(conn, publication, [pg_change_params], pid, subscriber)

      # Wait for subscription manager to process the :subscribed message
      :sys.get_state(pid)

      node = node()

      assert [{^subscriber, ^uuid, _ref, ^node}] = :ets.tab2list(args["subscribers_pids_table"])

      assert :ets.tab2list(args["subscribers_nodes_table"]) == [{bin_uuid, node}]
    end

    test "subscriber died", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])
      self = self()

      subscriber =
        spawn(fn ->
          receive do
            :stop -> :ok
          end
        end)

      {uuid1, bin_uuid1, pg_change_params1} = pg_change_params()
      {uuid2, bin_uuid2, pg_change_params2} = pg_change_params()
      {uuid3, bin_uuid3, pg_change_params3} = pg_change_params()

      assert {:ok, _} =
               Subscriptions.create(conn, publication, [pg_change_params1, pg_change_params2], pid, subscriber)

      assert {:ok, _} = Subscriptions.create(conn, publication, [pg_change_params3], pid, self())

      # Wait for subscription manager to process the :subscribed message
      :sys.get_state(pid)

      node = node()

      assert :ets.info(args["subscribers_pids_table"], :size) == 3

      assert [{^subscriber, ^uuid1, _, ^node}, {^subscriber, ^uuid2, _, ^node}] =
               :ets.lookup(args["subscribers_pids_table"], subscriber)

      assert [{^self, ^uuid3, _ref, ^node}] = :ets.lookup(args["subscribers_pids_table"], self)

      assert :ets.info(args["subscribers_nodes_table"], :size) == 3
      assert [{^bin_uuid1, ^node}] = :ets.lookup(args["subscribers_nodes_table"], bin_uuid1)
      assert [{^bin_uuid2, ^node}] = :ets.lookup(args["subscribers_nodes_table"], bin_uuid2)
      assert [{^bin_uuid3, ^node}] = :ets.lookup(args["subscribers_nodes_table"], bin_uuid3)

      send(subscriber, :stop)

      # Once the subcription manager receives the :DOWN message, only the subscription we have
      # not stopped should remain.
      assert_eventually [{^self, ^uuid3, _ref, ^node}] = :ets.tab2list(args["subscribers_pids_table"])
      assert_eventually [{^bin_uuid3, ^node}] = :ets.tab2list(args["subscribers_nodes_table"])
    end
  end

  describe "subscription deletion" do
    test "subscription is deleted when process goes away", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])
      {_uuid, _bin_uuid, pg_change_params} = pg_change_params()

      subscriber =
        spawn(fn ->
          receive do
            :stop -> :ok
          end
        end)

      %Postgrex.Result{rows: [[baseline]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])

      assert {:ok, [%Postgrex.Result{command: :insert}]} =
               Subscriptions.create(conn, publication, [pg_change_params], pid, subscriber)

      # Wait for subscription manager to process the :subscribed message
      :sys.get_state(pid)

      assert :ets.info(args["subscribers_pids_table"], :size) == 1
      assert :ets.info(args["subscribers_nodes_table"], :size) == 1

      %Postgrex.Result{rows: [[after_create]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
      assert after_create > baseline

      send(subscriber, :stop)

      assert_eventually :ets.info(args["subscribers_pids_table"], :size) == 0
      assert_eventually :ets.info(args["subscribers_nodes_table"], :size) == 0

      # Force check delete queue on manager
      send(pid, :check_delete_queue)
      :sys.get_state(pid)

      assert %Postgrex.Result{rows: [[^baseline]]} =
               Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end
  end

  describe "warm restart (re-adopt)" do
    test "keeps DB rows and re-monitors surviving subscribers", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])
      {uuid, bin_uuid, pg_change_params} = pg_change_params()

      subscriber = spawn(fn -> receive do: (:stop -> :ok) end)

      assert {:ok, _} = Subscriptions.create(conn, publication, [pg_change_params], pid, subscriber)
      :sys.get_state(pid)

      [{^subscriber, ^uuid, old_ref, _node}] = :ets.lookup(args["subscribers_pids_table"], subscriber)

      # Warm restart: the ETS tables are owned by the test (acting as WorkerSupervisor), so they
      # survive while only the manager restarts.
      new_pid = restart_manager(pid, args)
      {:ok, ^new_pid, conn2} = PostgresCdcRls.get_manager_conn(args["id"])

      # DB rows are untouched
      assert %{rows: [[count]]} =
               Postgrex.query!(conn2, "select count(*) from realtime.subscription where subscription_id = $1::uuid", [
                 bin_uuid
               ])

      assert count > 0

      # The subscriber is re-adopted with a fresh monitor
      assert [{^subscriber, ^uuid, new_ref, _node}] = :ets.lookup(args["subscribers_pids_table"], subscriber)
      assert new_ref != old_ref

      # The fresh monitor actually works: killing the subscriber cleans it up
      send(subscriber, :stop)
      Process.monitor(subscriber)
      assert_receive {:DOWN, _, :process, ^subscriber, _}, 100
      :sys.get_state(new_pid)

      assert :ets.lookup(args["subscribers_pids_table"], subscriber) == []
      assert :ets.lookup(args["subscribers_nodes_table"], bin_uuid) == []
    end

    test "does not touch the DB: orphan rows are left untouched", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])

      # A live subscription (present in both ETS and the DB)
      live = spawn_link(fn -> receive do: (:stop -> :ok) end)
      {_uuid_a, bin_a, params_a} = pg_change_params()
      assert {:ok, _} = Subscriptions.create(conn, publication, [params_a], pid, live)
      :sys.get_state(pid)

      # A DB orphan: a real row whose ETS entries we drop (mimics a {:subscribed} dropped during
      # downtime). The warm path must leave it alone — orphan cleanup is not on the restart path.
      orphan = spawn_link(fn -> receive do: (:stop -> :ok) end)
      {_uuid_b, bin_b, params_b} = pg_change_params()
      assert {:ok, _} = Subscriptions.create(conn, publication, [params_b], pid, orphan)
      :sys.get_state(pid)
      :ets.delete(args["subscribers_pids_table"], orphan)
      :ets.delete(args["subscribers_nodes_table"], bin_b)

      new_pid = restart_manager(pid, args)
      {:ok, ^new_pid, conn2} = PostgresCdcRls.get_manager_conn(args["id"])

      # Both the live subscription and the orphan rows still exist — no reconcile / wipe happened
      assert %{rows: [[count_a]]} =
               Postgrex.query!(conn2, "select count(*) from realtime.subscription where subscription_id = $1::uuid", [
                 bin_a
               ])

      assert %{rows: [[count_b]]} =
               Postgrex.query!(conn2, "select count(*) from realtime.subscription where subscription_id = $1::uuid", [
                 bin_b
               ])

      assert count_a > 0
      assert count_b > 0
    end

    test "the new manager monitors exactly the surviving subscribers", %{
      pid: pid,
      args: args,
      publication: publication
    } do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])

      sub1 = spawn(fn -> receive do: (:stop -> :ok) end)
      sub2 = spawn_link(fn -> receive do: (:stop -> :ok) end)
      {_u1, _b1, params1} = pg_change_params()
      {_u2, _b2, params2} = pg_change_params()
      assert {:ok, _} = Subscriptions.create(conn, publication, [params1], pid, sub1)
      assert {:ok, _} = Subscriptions.create(conn, publication, [params2], pid, sub2)
      :sys.get_state(pid)

      # The original manager monitors both subscribers
      assert MapSet.subset?(MapSet.new([sub1, sub2]), monitored_pids(pid))

      new_pid = restart_manager(pid, args)

      # After the warm restart the new manager monitors both surviving subscribers, and the old
      # manager (now dead) no longer holds any monitors
      assert MapSet.subset?(MapSet.new([sub1, sub2]), monitored_pids(new_pid))
      refute Process.alive?(pid)

      # The fresh monitors are wired to the new manager: when a subscriber dies, the new manager
      # drops both its monitor and its ETS entry
      send(sub1, :stop)
      Process.monitor(sub1)
      assert_receive {:DOWN, _, :process, ^sub1, _}, 100

      :sys.get_state(new_pid)
      monitored = monitored_pids(new_pid)
      refute MapSet.member?(monitored, sub1)
      assert MapSet.member?(monitored, sub2)
      assert :ets.lookup(args["subscribers_pids_table"], sub1) == []
    end
  end

  describe "cold start (empty ETS)" do
    test "deletes all subscriptions from the DB", %{pid: pid, args: args, publication: publication} do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])

      subscriber = spawn_link(fn -> receive do: (:stop -> :ok) end)
      {_uuid, _bin, params} = pg_change_params()
      assert {:ok, _} = Subscriptions.create(conn, publication, [params], pid, subscriber)
      :sys.get_state(pid)

      assert %{rows: [[seeded]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
      assert seeded > 0

      # Simulate a cold start: a fresh WorkerSupervisor hands the manager brand new, empty ETS
      # tables. The DB rows from the previous run must be wiped.
      GenServer.stop(pid)
      empty_pids = :ets.new(__MODULE__, [:public, :bag])
      empty_nodes = :ets.new(__MODULE__, [:public, :set])

      cold_args = %{
        args
        | "subscribers_pids_table" => empty_pids,
          "subscribers_nodes_table" => empty_nodes
      }

      {:ok, new_pid} = SubscriptionManager.start_link(cold_args)
      :sys.get_state(new_pid)

      {:ok, ^new_pid, conn2} = PostgresCdcRls.get_manager_conn(args["id"])
      assert %{rows: [[0]]} = Postgrex.query!(conn2, "select count(*) from realtime.subscription", [])
    end
  end

  describe "check no users" do
    test "exit is sent to manager", %{pid: pid} do
      :sys.replace_state(pid, fn state -> %{state | no_users_ts: 0} end)

      send(pid, :check_no_users)

      assert_receive {:system, {^pid, _}, {:terminate, :shutdown}}
    end
  end

  describe "message handling" do
    test "re-subscribes all subscribers when publication oids change", %{pid: pid, args: args} do
      # Force state to have different oids so the new_oids branch is triggered when
      # fetch_publication_tables returns the real oids from the database
      :sys.replace_state(pid, fn state -> %{state | oids: %{fake: :oids_that_dont_match}} end)
      :ets.insert(args["subscribers_pids_table"], {self(), UUID.uuid1(), make_ref(), node()})

      send(pid, :check_oids)

      assert_receive :postgres_subscribe, 1000
      :sys.get_state(pid)
      # Ensure the state is updated before we check the ETS tables
      assert :ets.tab2list(args["subscribers_pids_table"]) == []
      assert :ets.tab2list(args["subscribers_nodes_table"]) == []
    end

    test "keeps subscribers and oids when :check_oids fetch errors", %{pid: pid, args: args} do
      old_oids = :sys.get_state(pid).oids
      :ets.insert(args["subscribers_pids_table"], {self(), UUID.uuid1(), make_ref(), node()})

      # A fetch error must not be mistaken for a publication change: subscribers stay
      # put and no re-subscribe is triggered.
      stub(Subscriptions, :fetch_publication_tables, fn _conn, _publication -> {:error, :boom} end)

      send(pid, :check_oids)
      state = :sys.get_state(pid)

      refute_receive :postgres_subscribe, 200
      assert state.oids == old_oids
      assert match?([{_, _, _, _}], :ets.tab2list(args["subscribers_pids_table"]))
    end

    test "logs error when subscription deletion fails during check_delete_queue", %{
      pid: pid,
      args: args,
      publication: publication
    } do
      {:ok, ^pid, conn} = PostgresCdcRls.get_manager_conn(args["id"])
      {_uuid, _bin_uuid, pg_change_params} = pg_change_params()

      subscriber = spawn(fn -> receive do: (:stop -> :ok) end)
      Subscriptions.create(conn, publication, [pg_change_params], pid, subscriber)
      :sys.get_state(pid)

      stub(Subscriptions, :delete_multi, fn _conn, _ids -> {:error, :delete_failed} end)

      send(subscriber, :stop)
      Process.sleep(100)

      log =
        capture_log(fn ->
          send(pid, :check_delete_queue)
          :sys.get_state(pid)
        end)

      assert log =~ "SubscriptionDeletionFailed"
    end

    test "schedules next region check when rebalancer returns ok", %{pid: pid} do
      # In a single-node test environment, nodes are equal → Rebalancer returns :ok
      current_nodes = MapSet.new(Node.list())
      send(pid, {:check_region, current_nodes})
      :sys.get_state(pid)

      assert Process.alive?(pid)
    end

    test "calls handle_stop when wrong region detected", %{pid: pid} do
      stub(Rebalancer, :check, fn _prev, _curr, _id -> {:error, :wrong_region} end)
      stub(PostgresCdcRls, :handle_stop, fn _id, _timeout -> :ok end)

      send(pid, {:check_region, MapSet.new()})
      :sys.get_state(pid)

      assert Process.alive?(pid)
    end
  end

  test "handles empty delete queue without crashing", %{pid: pid} do
    send(pid, :check_delete_queue)
    state = :sys.get_state(pid)
    assert :queue.is_empty(state.delete_queue.queue)
  end

  test "handles unhandled messages without crashing", %{pid: pid} do
    state_before = :sys.get_state(pid)
    send(pid, :totally_unexpected_message)
    state_after = :sys.get_state(pid)
    assert state_before.id == state_after.id
  end

  describe "error handling" do
    test "stops cleanly when database connection fails", %{args: args} do
      expect(Database, :connect_db, fn _settings, _opts -> {:error, :econnrefused} end)

      pid = start_supervised!({SubscriptionManager, args}, restart: :temporary)
      ref = Process.monitor(pid)

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :econnrefused}}, 1000
    end
  end

  describe "statement timeout" do
    test "the manager's own connection carries one", %{pid: pid} do
      # Everything on this connection - the deletes, the publication-table lookups - runs
      # straight from the GenServer with no explicit :timeout of its own.
      %{conn: conn} = :sys.get_state(pid)

      assert %{rows: [["10s"]]} = Postgrex.query!(conn, "SELECT current_setting('statement_timeout')", [])
    end

    test "the subscription pool carries a tighter one", %{pid: pid, args: args} do
      # Everything on this pool goes through `Subscriptions.create/5`, whose transaction deadline
      # is 10s, so its statements get less than that.
      {:ok, ^pid, conn_pub} = PostgresCdcRls.get_manager_conn(args["id"])

      assert %{rows: [["5s"]]} = Postgrex.query!(conn_pub, "SELECT current_setting('statement_timeout')", [])
    end
  end

  describe "queue target" do
    # How long a saturated subs pool may take to answer. DBConnection drops a checkout once it has
    # been queued for more than `2 * queue_target`, and only notices at the next `queue_interval`
    # poll, so our 2s target over the 2s default interval puts the reply at ~6s at worst
    # 8 seconds seems like a good ceiling
    @shed_within 8_000

    test "a saturated pool answers well inside the caller's RPC deadline", %{
      pid: pid,
      args: args,
      tenant: tenant,
      publication: publication
    } do
      {:ok, ^pid, conn_pub} = PostgresCdcRls.get_manager_conn(args["id"])

      pool_size =
        "postgres_cdc_rls"
        |> PostgresCdc.filter_settings(tenant.extensions)
        |> Map.get("subcriber_pool_size", 4)

      TestHelpers.hold_connections!(conn_pub, pool_size)

      {_uuid, _bin_uuid, pg_change_params} = pg_change_params()

      started_at = System.monotonic_time(:millisecond)

      assert {:error, "Too many database timeouts"} =
               PostgresCdcRls.create_subscription(
                 conn_pub,
                 tenant.external_id,
                 publication,
                 pool_size,
                 [pg_change_params],
                 pid,
                 self()
               )

      elapsed = System.monotonic_time(:millisecond) - started_at

      assert elapsed < @shed_within,
             "a subscribe against a saturated pool took #{elapsed}ms to come back. It has to be shed within #{@shed_within}ms"
    end
  end

  describe "phantom subscriber cleanup" do
    test "check_active_pids queues dead pids for deletion", %{
      pid: pid,
      args: args
    } do
      subscribers_pids_table = args["subscribers_pids_table"]
      subscribers_nodes_table = args["subscribers_nodes_table"]

      dead_pid = spawn(fn -> :ok end)
      ref = Process.monitor(dead_pid)
      receive do: ({:DOWN, ^ref, :process, ^dead_pid, _} -> :ok)
      u = uuid1()
      bin_u = string_to_binary!(u)

      :ets.insert(subscribers_pids_table, {dead_pid, u, make_ref(), node()})
      :ets.insert(subscribers_nodes_table, {bin_u, node()})

      send(pid, :check_active_pids)
      state = :sys.get_state(pid)

      assert not :queue.is_empty(state.delete_queue.queue)
    end
  end

  describe "subscribers_by_node/1" do
    test "groups subscriber pids by node" do
      subscribers_pids_table = :ets.new(:table, [:public, :bag])

      test_data = [
        {:pid1, "id1", :ref, :node1},
        {:pid1, "id1.2", :ref, :node1},
        {:pid2, "id2", :ref, :node2}
      ]

      :ets.insert(subscribers_pids_table, test_data)

      assert SubscriptionManager.subscribers_by_node(subscribers_pids_table) == %{
               node1: MapSet.new([:pid1]),
               node2: MapSet.new([:pid2])
             }
    end
  end

  describe "not_alive_pids/1" do
    test "returns empty list for empty input" do
      assert SubscriptionManager.not_alive_pids(MapSet.new()) == []
    end

    test "returns empty list for all alive PIDs" do
      pid1 = spawn(fn -> Process.sleep(5000) end)
      pid2 = spawn(fn -> Process.sleep(5000) end)
      pid3 = spawn(fn -> Process.sleep(5000) end)
      assert SubscriptionManager.not_alive_pids(MapSet.new([pid1, pid2, pid3])) == []
    end

    test "returns list of dead PIDs" do
      pid1 = spawn(fn -> Process.sleep(5000) end)
      pid2 = spawn(fn -> Process.sleep(5000) end)
      pid3 = spawn(fn -> Process.sleep(5000) end)
      Process.exit(pid2, :kill)
      assert SubscriptionManager.not_alive_pids(MapSet.new([pid1, pid2, pid3])) == [pid2]
    end
  end

  describe "pop_not_alive_pids/4" do
    test "one subscription per channel" do
      subscribers_pids_table = :ets.new(:table, [:public, :bag])
      subscribers_nodes_table = :ets.new(:table, [:public, :set])

      uuid1 = uuid1()
      uuid2 = uuid1()
      uuid3 = uuid1()

      pids_test_data = [
        {:pid1, uuid1, :ref, :node1},
        {:pid1, uuid2, :ref, :node1},
        {:pid2, uuid3, :ref, :node2}
      ]

      :ets.insert(subscribers_pids_table, pids_test_data)

      nodes_test_data = [
        {string_to_binary!(uuid1), :node1},
        {string_to_binary!(uuid2), :node1},
        {string_to_binary!(uuid3), :node2}
      ]

      :ets.insert(subscribers_nodes_table, nodes_test_data)

      not_alive =
        Enum.sort(
          SubscriptionManager.pop_not_alive_pids([:pid1], subscribers_pids_table, subscribers_nodes_table, "id")
        )

      expected = Enum.sort([string_to_binary!(uuid1), string_to_binary!(uuid2)])
      assert not_alive == expected

      assert :ets.tab2list(subscribers_pids_table) == [{:pid2, uuid3, :ref, :node2}]
      assert :ets.tab2list(subscribers_nodes_table) == [{string_to_binary!(uuid3), :node2}]
    end

    test "two subscriptions per channel" do
      subscribers_pids_table = :ets.new(:table, [:public, :bag])
      subscribers_nodes_table = :ets.new(:table, [:public, :set])

      uuid1 = uuid1()
      uuid2 = uuid1()

      test_data = [
        {:pid1, uuid1, :ref, :node1},
        {:pid2, uuid2, :ref, :node2}
      ]

      :ets.insert(subscribers_pids_table, test_data)

      nodes_test_data = [
        {string_to_binary!(uuid1), :node1},
        {string_to_binary!(uuid2), :node2}
      ]

      :ets.insert(subscribers_nodes_table, nodes_test_data)

      assert SubscriptionManager.pop_not_alive_pids([:pid1], subscribers_pids_table, subscribers_nodes_table, "id") == [
               string_to_binary!(uuid1)
             ]

      assert :ets.tab2list(subscribers_pids_table) == [{:pid2, uuid2, :ref, :node2}]
      assert :ets.tab2list(subscribers_nodes_table) == [{string_to_binary!(uuid2), :node2}]
    end

    test "returns empty list when pid not found in table" do
      subscribers_pids_table = :ets.new(:table, [:public, :bag])
      subscribers_nodes_table = :ets.new(:table, [:public, :set])

      assert SubscriptionManager.pop_not_alive_pids(
               [:nonexistent_pid],
               subscribers_pids_table,
               subscribers_nodes_table,
               "tenant_id"
             ) == []
    end
  end

  describe "not_alive_pids_dist/1" do
    test "handles remote node RPC error gracefully" do
      remote_node = :some_remote@node

      stub(GenRpc, :call, fn ^remote_node, SubscriptionManager, :not_alive_pids, _pids, _opts ->
        {:error, :rpc_error, :timeout}
      end)

      log =
        capture_log(fn ->
          result = SubscriptionManager.not_alive_pids_dist(%{remote_node => MapSet.new([self()])})
          assert result == []
        end)

      assert log =~ "UnableToCheckProcessesOnRemoteNode"
    end

    test "returns pids from remote node when RPC succeeds" do
      remote_node = :some_remote@node
      dead_pid = self()

      stub(GenRpc, :call, fn ^remote_node, SubscriptionManager, :not_alive_pids, [pids_set], _opts ->
        MapSet.to_list(pids_set)
      end)

      result = SubscriptionManager.not_alive_pids_dist(%{remote_node => MapSet.new([dead_pid])})
      assert dead_pid in result
    end

    test "checks local pids directly without RPC" do
      dead_pid = spawn(fn -> :ok end)
      ref = Process.monitor(dead_pid)
      receive do: ({:DOWN, ^ref, :process, ^dead_pid, _} -> :ok)

      result = SubscriptionManager.not_alive_pids_dist(%{node() => MapSet.new([dead_pid])})
      assert dead_pid in result
    end
  end

  # Simulates a SubscriptionManager-only restart: the ETS tables in `args` are owned by the test
  # process (acting as the WorkerSupervisor) and survive, so the new manager re-adopts them.
  defp restart_manager(pid, args) do
    GenServer.stop(pid)
    {:ok, new_pid} = SubscriptionManager.start_link(args)
    :sys.get_state(new_pid)
    new_pid
  end

  # The set of processes `pid` is currently monitoring.
  defp monitored_pids(pid) do
    {:monitors, monitors} = Process.info(pid, :monitors)
    for {:process, monitored} <- monitors, into: MapSet.new(), do: monitored
  end

  defp pg_change_params do
    uuid = UUID.uuid1()

    pg_change_params = %{
      id: uuid,
      subscription_params: {"*", "public", "*", [], nil},
      claims: %{
        "exp" => System.system_time(:second) + 100_000,
        "iat" => 0,
        "role" => "anon"
      }
    }

    {uuid, UUID.string_to_binary!(uuid), pg_change_params}
  end
end
