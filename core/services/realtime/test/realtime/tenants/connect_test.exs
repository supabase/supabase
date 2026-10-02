defmodule Realtime.Tenants.ConnectTest do
  # Async false due to Mimic running as global because we are spawning Connect processes
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Database
  alias Realtime.Env
  alias Realtime.Tenants
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Rebalancer
  alias Realtime.Tenants.ReplicationConnection
  alias Realtime.UsersCounter

  @replication_wait [timeout: 15_000, interval: 100]
  @slow_replication_wait [timeout: 30_000, interval: 100]
  @local_wait [timeout: 2_500, interval: 50]

  @connect_errors_bucket_len 5

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)

    %{tenant: tenant}
  end

  defp assert_process_down(pid, timeout \\ 100, reason \\ nil) do
    ref = Process.monitor(pid)

    if reason do
      assert_receive {:DOWN, ^ref, :process, ^pid, ^reason}, timeout
    else
      assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, timeout
    end
  end

  defp refute_process_down(pid, timeout \\ 500) do
    ref = Process.monitor(pid)
    refute_receive {:DOWN, ^ref, :process, ^pid, _reason}, timeout
  end

  describe "temporary process" do
    test "starts a temporary process", %{tenant: tenant} do
      assert {:ok, _} = Connect.lookup_or_start_connection(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)
      # Brutally kill the process
      Process.exit(pid, :kill)
      assert_process_down(pid)

      # Temporary process must not be registered in syn at any point after it dies, so assert the
      # absence holds.
      assert_always is_nil(Connect.whereis(tenant.external_id)), timeout: 1_000, interval: 50
    end
  end

  describe "database connection resilience" do
    test "a momentary database blip does not tear down the pool or Connect", %{tenant: tenant} do
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)

      # Terminate the pool's backend connections from a separate connection to
      # simulate a momentary blip. The durable pool uses :rand_exp backoff so it
      # reconnects instead of crashing (previously :stop + max_restarts: 0 would
      # bring the whole pool down and stop Connect).
      {:ok, killer} = Database.connect(tenant, "realtime_test", :stop)

      Postgrex.query!(
        killer,
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = 'realtime_connect'",
        []
      )

      GenServer.stop(killer)

      # Neither the pool nor Connect should go down over the blip
      refute_process_down(db_conn, 1000)
      assert Process.alive?(pid)

      # And the pool recovers so queries succeed again
      assert_eventually {:ok, _} = Postgrex.query(db_conn, "SELECT 1", []), @local_wait
      assert Process.alive?(pid)
    end

    test "a real pool disconnect opens the recovery window and reconnecting closes it", %{tenant: tenant} do
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)

      {:ok, killer} = Database.connect(tenant, "realtime_test", :stop)

      # The window opens on the disconnect and closes again once the pool reconnects.
      # Since the database itself is healthy, reconnection is near-instant, so we
      # assert on the logs rather than trying to observe the transient open state.
      log =
        capture_log(fn ->
          # Multigres multiplexes idle clients onto one backend, so the pool has to be
          # mid-query for pg_stat_activity to list a pid per connection to terminate.
          busy = Task.async(fn -> Postgrex.query(db_conn, "SELECT pg_sleep(5)", [], timeout: 15_000) end)

          assert_eventually Postgrex.query!(
                              killer,
                              "SELECT pid FROM pg_stat_activity WHERE application_name = 'realtime_connect'",
                              []
                            ).num_rows > 0,
                            @local_wait

          Postgrex.query!(
            killer,
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = 'realtime_connect'",
            []
          )

          GenServer.stop(killer)
          Task.await(busy, 15_000)

          assert_eventually {:ok, _} = Postgrex.query(db_conn, "SELECT 1", []), @local_wait
          assert_eventually :sys.get_state(pid).db_recovery_started_at == nil, @local_wait
        end)

      assert log =~ "recovery window opened"
      assert log =~ "recovery window closed"
      assert Process.alive?(pid)
    end

    test "terminates Connect when the pool stays disconnected past the recovery window", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)
      ref = Process.monitor(pid)

      # Simulate a disconnect that opened the window longer ago than it allows
      :sys.replace_state(pid, fn state ->
        %{state | db_recovery_started_at: System.monotonic_time(:millisecond) - :timer.hours(1)}
      end)

      log =
        capture_log(fn ->
          send(pid, :db_recovery_timeout)
          assert_receive {:DOWN, ^ref, :process, ^pid, _}, 2000
        end)

      assert log =~ "DatabaseConnectionRecoveryWindowExceeded"
    end
  end

  describe "list_tenants/0" do
    test "lists all tenants with active connections", %{tenant: tenant1} do
      tenant2 = TestTenantDb.checkout_tenant(run_migrations: true)
      assert {:ok, _} = Connect.lookup_or_start_connection(tenant1.external_id)
      assert {:ok, _} = Connect.lookup_or_start_connection(tenant2.external_id)

      list_tenants = Connect.list_tenants() |> MapSet.new()
      tenants = MapSet.new([tenant1.external_id, tenant2.external_id])

      assert MapSet.subset?(tenants, list_tenants)
    end
  end

  describe "handle cold start" do
    test "multiple processes connecting calling Connect.connect", %{tenant: tenant} do
      parent = self()

      # Let's slow down Connect.connect so that multiple RPC calls are executed
      stub(Connect, :connect, fn x, y, z ->
        :timer.sleep(1000)
        call_original(Connect, :connect, [x, y, z])
      end)

      connect = fn -> send(parent, Connect.lookup_or_start_connection(tenant.external_id)) end
      # Let's call enough times to potentially trigger the Connect RateCounter

      for _ <- 1..50, do: spawn(connect)

      assert_receive({:ok, pid}, 2000)

      for _ <- 1..49, do: assert_receive({:ok, ^pid})

      # Does not trigger rate limit as connections eventually succeeded

      {:ok, rate_counter} =
        tenant.external_id
        |> Tenants.connect_errors_per_second_rate()
        |> Realtime.RateCounter.get()

      assert rate_counter.sum == 0
      assert rate_counter.avg == 0.0
      assert rate_counter.limit.triggered == false
    end

    test "multiple proccesses succeed together", %{tenant: tenant} do
      parent = self()

      # Let's slow down Connect starting
      expect(Database, :check_tenant_connection, fn t, listeners ->
        :timer.sleep(1000)
        call_original(Database, :check_tenant_connection, [t, listeners])
      end)

      connect = fn -> send(parent, Connect.lookup_or_start_connection(tenant.external_id)) end

      # Start an early connect
      spawn(connect)
      :timer.sleep(100)

      # Start others
      spawn(connect)
      spawn(connect)

      # This one should block and wait for the first Connect
      {:ok, pid} = Connect.lookup_or_start_connection(tenant.external_id)

      assert_receive {:ok, ^pid}
      assert_receive {:ok, ^pid}
      assert_receive {:ok, ^pid}
    end

    test "more than the connection ready timeout passed error out", %{tenant: tenant} do
      parent = self()

      # Slow down Connect starting so it takes longer than the connection ready timeout
      expect(Database, :check_tenant_connection, fn t, listeners ->
        Process.sleep(3000)
        call_original(Database, :check_tenant_connection, [t, listeners])
      end)

      connect = fn -> send(parent, Connect.lookup_or_start_connection(tenant.external_id)) end

      spawn(connect)
      spawn(connect)

      {:error, :initializing} = Connect.lookup_or_start_connection(tenant.external_id)
      # The above call waited for the connection ready timeout
      assert_receive {:error, :initializing}
      assert_receive {:error, :initializing}

      # This one will succeed
      {:ok, _pid} = Connect.lookup_or_start_connection(tenant.external_id)
    end

    test "too many db connections", %{tenant: tenant} do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => false,
          "db_pool" => 100,
          "subcriber_pool_size" => 100,
          "subs_pool_size" => 100
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)

      parent = self()

      # Let's slow down Connect starting
      expect(Database, :check_tenant_connection, fn t, listeners ->
        :timer.sleep(1000)
        call_original(Database, :check_tenant_connection, [t, listeners])
      end)

      connect = fn -> send(parent, Connect.lookup_or_start_connection(tenant.external_id)) end

      # Start an early connect
      spawn(connect)
      :timer.sleep(100)

      # Start others
      spawn(connect)
      spawn(connect)

      # This one should block and wait for the first Connect
      {:error, :tenant_db_too_many_connections} = Connect.lookup_or_start_connection(tenant.external_id)

      assert_receive {:error, :tenant_db_too_many_connections}
      assert_receive {:error, :tenant_db_too_many_connections}
      assert_receive {:error, :tenant_db_too_many_connections}
      refute_receive _any
    end
  end

  describe "region rebalancing" do
    test "rebalancing needed process stops", %{tenant: tenant} do
      external_id = tenant.external_id

      log =
        capture_log(fn ->
          assert {:ok, db_conn} = Connect.lookup_or_start_connection(external_id, check_connect_region_interval: 100)
          expect(Rebalancer, :check, 1, fn _, _, ^external_id -> {:error, :wrong_region} end)
          reject(&Rebalancer.check/3)
          assert_process_down(db_conn, 1000, {:shutdown, :rebalancing})
        end)

      assert log =~ "Rebalancing Tenant database connection"
    end

    test "rebalancing not needed process stays up", %{tenant: tenant} do
      external_id = tenant.external_id
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(external_id, check_connect_region_interval: 100)

      stub(Rebalancer, :check, fn _, _, ^external_id -> :ok end)

      refute_process_down(db_conn)
    end
  end

  describe "lookup_or_start_connection/1" do
    test "if tenant exists and connected, returns the db connection and tracks it in ets", %{tenant: tenant} do
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert is_pid(db_conn)
      assert Connect.shutdown(tenant.external_id) == :ok
    end

    test "tracks multiple users that connect and disconnect", %{tenant: tenant1} do
      tenant2 = TestTenantDb.checkout_tenant(run_migrations: true)
      tenants = [tenant1, tenant2]

      for tenant <- tenants do
        assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)

        assert is_pid(db_conn)
        Connect.shutdown(tenant.external_id)
        assert_process_down(db_conn, 5_000)

        tenant.external_id
      end

      result = :ets.select(Connect, [{{:"$1"}, [], [:"$1"]}]) |> Enum.sort()
      assert tenant1.external_id in result
      assert tenant2.external_id in result
    end

    test "on database disconnect, returns new connection", %{tenant: tenant} do
      assert {:ok, old_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      Connect.shutdown(tenant.external_id)
      assert_process_down(old_conn)

      # syn unregisters asynchronously on shutdown, so a fresh lookup would otherwise race it.
      # This could be avoided if we called :syn.unregister/2 on shutdown.
      assert_eventually is_nil(Connect.whereis(tenant.external_id)), @local_wait

      assert {:ok, new_conn} = Connect.lookup_or_start_connection(tenant.external_id)

      on_exit(fn -> Process.exit(new_conn, :shutdown) end)

      assert new_conn != old_conn
      Connect.shutdown(tenant.external_id)
    end

    test "if tenant exists but unable to connect, returns error" do
      port = Env.unused_port()

      extensions = [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => "postgres",
            "db_password" => "postgres",
            "db_port" => "#{port}",
            "poll_interval" => 100,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "ssl_enforced" => true
          }
        }
      ]

      tenant = tenant_fixture(%{extensions: extensions})
      external_id = tenant.external_id

      assert capture_log(fn ->
               assert {:error, :tenant_database_unavailable} =
                        Connect.lookup_or_start_connection(tenant.external_id)
             end) =~ "project=#{external_id} external_id=#{external_id} [error] UnableToConnectToTenantDatabase"
    end

    test "if tenant does not exist, returns error" do
      assert {:error, :tenant_not_found} = Connect.lookup_or_start_connection("none")
    end

    test "if no users are connected to a tenant channel, stop the connection", %{
      tenant: %{external_id: tenant_id} = tenant
    } do
      {:ok, db_conn} = Connect.lookup_or_start_connection(tenant_id, check_connected_user_interval: 100)

      region = Tenants.region(tenant)

      assert_always {_, %{conn: _, region: ^region}} = :syn.lookup(Connect, tenant_id),
        timeout: 400,
        interval: 20

      assert_process_down(db_conn, 1000)

      # syn unregisters asynchronously once the process is down
      assert_eventually :syn.lookup(Connect, tenant_id) == :undefined, @local_wait
      refute Process.alive?(db_conn)
      Connect.shutdown(tenant_id)
    end

    test "if users are connected to a tenant channel, keep the connection", %{
      tenant: %{external_id: tenant_id} = tenant
    } do
      UsersCounter.add(self(), tenant_id)

      {:ok, db_conn} = Connect.lookup_or_start_connection(tenant_id, check_connected_user_interval: 10)

      # Emulate connected user
      UsersCounter.add(self(), tenant_id)
      region = Tenants.region(tenant)
      assert {pid, %{conn: conn_pid, region: ^region}} = :syn.lookup(Connect, tenant_id)

      assert_always {^pid, %{conn: ^conn_pid, region: ^region}} = :syn.lookup(Connect, tenant_id),
        timeout: 300,
        interval: 20

      assert Process.alive?(db_conn)

      Connect.shutdown(tenant_id)
    end

    test "does not shut down if a user connects on the sample that would trigger the shutdown", %{
      tenant: %{external_id: tenant_id} = tenant
    } do
      {:ok, db_conn} = Connect.lookup_or_start_connection(tenant_id, check_connected_user_interval: 60_000)
      region = Tenants.region(tenant)
      assert {pid, %{conn: ^db_conn, region: ^region}} = :syn.lookup(Connect, tenant_id)

      # The bucket seeds with [1], so it takes 10 zero samples to stop
      for _ <- 1..9 do
        send(pid, :check_connected_users)
        :sys.get_state(pid)
      end

      UsersCounter.add(self(), tenant_id)
      send(pid, :check_connected_users)

      refute_process_down(pid, 300)
      assert Process.alive?(db_conn)
      assert {^pid, %{conn: ^db_conn, region: ^region}} = :syn.lookup(Connect, tenant_id)

      Connect.shutdown(tenant_id)
    end

    test "connection is killed after user leaving", %{tenant: tenant} do
      external_id = tenant.external_id

      UsersCounter.add(self(), external_id)

      {:ok, db_conn} = Connect.lookup_or_start_connection(external_id, check_connected_user_interval: 10)
      region = Tenants.region(tenant)
      assert {_pid, %{conn: ^db_conn, region: ^region}} = :syn.lookup(Connect, external_id)
      Forum.Census.leave(:users, external_id, self())

      assert_eventually not Process.alive?(db_conn), timeout: 1_000, interval: 10
      refute Forum.Census.local_member?(:users, external_id, self())
      Connect.shutdown(external_id)
    end

    test "error if tenant is suspended" do
      tenant = tenant_fixture(suspend: true)

      assert {:error, :tenant_suspended} = Connect.lookup_or_start_connection(tenant.external_id)
    end

    test "tenant not able to connect if database has not enough connections", %{
      tenant: tenant
    } do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => false,
          "db_pool" => 100,
          "subcriber_pool_size" => 100,
          "subs_pool_size" => 100
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)

      assert capture_log(fn ->
               assert {:error, :tenant_db_too_many_connections} = Connect.lookup_or_start_connection(tenant.external_id)
             end) =~ ~r/Only \d+ available connections\. At least \d+ connections are required/
    end

    test "properly handles of failing calls by avoid creating too many connections", %{tenant: tenant} do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => true
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)

      Enum.each(1..10, fn _ ->
        Task.start(fn ->
          Connect.lookup_or_start_connection(tenant.external_id)
        end)
      end)

      send(check_db_connections_created(self(), tenant.external_id), :check)
      refute_receive :too_many_connections, 5000
    end

    test "on migrations failure, stop the process" do
      tenant = TestTenantDb.checkout_tenant(run_migrations: false)
      expect(Realtime.Tenants.Migrations, :run_migrations, fn ^tenant -> raise "error" end)

      assert {:ok, pid} = Connect.lookup_or_start_connection(tenant.external_id)
      assert_process_down(pid)
      refute Process.alive?(pid)
    end

    test "reconciles migrations_ran when database count differs from cached value", %{tenant: tenant} do
      total_migrations = Enum.count(Realtime.Tenants.Migrations.migrations())
      stale_count = tenant.migrations_ran - 5
      parent = self()

      expect(Database, :check_tenant_connection, fn t, listeners ->
        {:ok, conn, _actual_count} = call_original(Database, :check_tenant_connection, [t, listeners])
        {:ok, conn, stale_count}
      end)

      expect(Realtime.Tenants.Migrations, :run_migrations, fn tenant ->
        send(parent, {:migrations_ran_at_run, tenant.migrations_ran})
        call_original(Realtime.Tenants.Migrations, :run_migrations, [tenant])
      end)

      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      assert_receive {:migrations_ran_at_run, ^stale_count}

      updated_tenant = Tenants.get_tenant_by_external_id(tenant.external_id)
      assert updated_tenant.migrations_ran == total_migrations
    end

    test "starts broadcast handler and does not fail on existing connection", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      replication_connection_before = await_replication_connection!(tenant.external_id)
      assert Process.alive?(replication_connection_before)

      assert {:ok, replication_conn_pid_before} = await_replication_status!(tenant.external_id)

      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)

      replication_connection_after = await_replication_connection!(tenant.external_id)
      assert Process.alive?(replication_connection_after)
      assert replication_connection_before == replication_connection_after

      assert {:ok, replication_conn_pid_after} = await_replication_status!(tenant.external_id)
      assert replication_conn_pid_before == replication_conn_pid_after
    end

    test "on replication connection postgres pid being stopped, Connect module recovers it", %{tenant: tenant} do
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      replication_connection_pid = await_replication_connection!(tenant.external_id)
      Process.monitor(replication_connection_pid)

      assert Process.alive?(replication_connection_pid)
      pid = Connect.whereis(tenant.external_id)

      assert {:ok, replication_conn_before} = await_replication_status!(tenant.external_id)

      # Found by slot, not application_name, which a pooler rewrites.
      slot_name = ReplicationConnection.replication_slot_name("realtime", "messages")

      assert %{num_rows: 1} =
               Postgrex.query!(
                 db_conn,
                 "SELECT pg_terminate_backend(active_pid) FROM pg_replication_slots WHERE slot_name = $1 AND active_pid IS NOT NULL",
                 [slot_name]
               )

      assert_receive {:DOWN, _, :process, ^replication_connection_pid, _}

      assert_eventually {:error, :not_connected} = Connect.replication_status(tenant.external_id), @local_wait

      new_replication_connection_pid = await_replication_connection!(tenant.external_id, @slow_replication_wait)

      assert replication_connection_pid != new_replication_connection_pid
      assert Process.alive?(new_replication_connection_pid)
      assert Process.alive?(pid)

      assert {:ok, replication_conn_after} = await_replication_status!(tenant.external_id, @slow_replication_wait)
      assert replication_conn_before != replication_conn_after
    end

    test "on replication connection exit, Connect module recovers it", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      replication_connection_pid = await_replication_connection!(tenant.external_id)
      Process.monitor(replication_connection_pid)
      assert Process.alive?(replication_connection_pid)
      pid = Connect.whereis(tenant.external_id)

      assert {:ok, replication_conn_before} = await_replication_status!(tenant.external_id)

      Process.exit(replication_connection_pid, :kill)
      assert_receive {:DOWN, _, :process, ^replication_connection_pid, _}

      assert_eventually {:error, :not_connected} = Connect.replication_status(tenant.external_id), @local_wait

      new_replication_connection_pid = await_replication_connection!(tenant.external_id)

      assert replication_connection_pid != new_replication_connection_pid
      assert Process.alive?(new_replication_connection_pid)
      assert Process.alive?(pid)

      assert {:ok, replication_conn_after} = await_replication_status!(tenant.external_id, @slow_replication_wait)
      assert replication_conn_before != replication_conn_after
    end

    test "defers and keeps the tenant alive when replication connection times out", %{tenant: tenant} do
      expect(ReplicationConnection, :start, fn _tenant, _pid ->
        {:error, :replication_connection_timeout}
      end)

      log =
        capture_log(fn ->
          assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
          pid = Connect.whereis(tenant.external_id)
          assert_eventually :sys.get_state(pid).replication_recovery_started_at != nil, @local_wait
          refute_process_down(db_conn)
        end)

      assert log =~ "ReplicationConnectionTimeout"
      assert log =~ "Replication connection timed out during initialization"
    end

    test "handles max_wal_senders by logging the correct operational code", %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      opts = Database.opts(settings)
      parent = self()

      # PostgresReplication.start_link/1 fails outright without the table it publishes.
      {:ok, table_conn} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query!(table_conn, "CREATE TABLE public.test (id serial primary key)", [])

      # Enough connections to claim every WAL sender, read from the server
      # rather than hardcoded: the budget differs per image, and a Multigres
      # cluster spends some of it on its own replication.
      %{rows: [[max_wal_senders]]} = Postgrex.query!(table_conn, "SELECT current_setting('max_wal_senders')::int", [])

      pids =
        for i <- 0..max_wal_senders do
          replication_slot_opts =
            %PostgresReplication{
              connection_opts: opts,
              table: :all,
              output_plugin: "pgoutput",
              output_plugin_options: [proto_version: "1", publication_names: "test_#{i}_publication"],
              handler_module: Replication.TestHandler,
              publication_name: "test_#{i}_publication",
              replication_slot_name: "test_#{i}_slot"
            }

          spawn(fn ->
            {:ok, pid} = PostgresReplication.start_link(replication_slot_opts)
            send(parent, :replication_ready)

            receive do
              :stop -> Process.exit(pid, :kill)
            end
          end)
        end

      GenServer.stop(table_conn)

      # Over-provision the replication connections and only wait for enough of
      # them to report ready to occupy every WAL sender, so that Connect's own
      # replication attempt below is the one that trips max_wal_senders. We don't
      # pin to specific spawns: bringing up real replication connections is
      # timing-sensitive (especially on a loaded machine or a freshly reused
      # tenant DB), so requiring every single one to report by index is flaky.
      for _ <- 1..4, do: assert_receive(:replication_ready, 30_000)

      on_exit(fn ->
        Enum.each(pids, &send(&1, :stop))
        Process.sleep(2000)
      end)

      log =
        capture_log(fn ->
          assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
          pid = Connect.whereis(tenant.external_id)
          assert_eventually :sys.get_state(pid).replication_recovery_started_at != nil, @local_wait
          refute_process_down(db_conn)
        end)

      assert log =~ "ReplicationMaxWalSendersReached"
    end

    test "handle rpc errors gracefully" do
      expect(Realtime.Nodes, :get_node_for_tenant, fn _ -> {:ok, :potato@nohost, "us-east-1"} end)

      assert capture_log(fn -> assert {:error, :rpc_error, _} = Connect.lookup_or_start_connection("tenant") end) =~
               "project=tenant external_id=tenant [error] ErrorOnRpcCall"
    end

    test "rate limit connect when too many connections against bad database", %{tenant: tenant} do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => true
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)

      log =
        capture_log(fn ->
          res =
            for _ <- 1..10 do
              Process.sleep(250)
              Connect.lookup_or_start_connection(tenant.external_id)
            end

          assert Enum.any?(res, fn {_, res} -> res == :connect_rate_limit_reached end)
        end)

      assert log =~ "DatabaseConnectionRateLimitReached: Too many connection attempts against the tenant database"
    end

    test "rate limit connect will not trigger if connection is successful", %{tenant: tenant} do
      log =
        capture_log(fn ->
          res = for _ <- 1..20, do: Connect.lookup_or_start_connection(tenant.external_id)

          refute Enum.any?(res, fn {_, res} -> res == :tenant_db_too_many_connections end)

          # No real time passes between the calls above, so the counter's bucket never ages via
          # its own timer. Tick it forward manually to fill a full window with zero errors,
          # rather than using `Process.sleep` to let real time pass, which is slow and flaky.
          rate_counter = Tenants.connect_errors_per_second_rate(tenant)
          for _ <- 1..@connect_errors_bucket_len, do: RateCounterHelper.tick!(rate_counter)
        end)

      refute log =~ "DatabaseConnectionRateLimitReached: Too many connection attempts against the tenant database"
    end

    test "rate limit connect does not trigger for non-connection-attempt errors like db pool exhaustion",
         %{tenant: tenant} do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => false,
          "db_pool" => 100,
          "subcriber_pool_size" => 100,
          "subs_pool_size" => 100
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)
      parent = self()

      expect(Database, :check_tenant_connection, fn t, listeners ->
        :timer.sleep(1000)
        call_original(Database, :check_tenant_connection, [t, listeners])
      end)

      connect = fn -> send(parent, Connect.lookup_or_start_connection(tenant.external_id)) end

      spawn(connect)
      :timer.sleep(100)
      spawn(connect)
      spawn(connect)

      assert {:error, :tenant_db_too_many_connections} =
               Connect.lookup_or_start_connection(tenant.external_id)

      assert_receive {:error, :tenant_db_too_many_connections}
      assert_receive {:error, :tenant_db_too_many_connections}
      assert_receive {:error, :tenant_db_too_many_connections}
      refute_receive _any

      # Only 1 call_external_node failure should count toward the rate limit.
      rate_args = Tenants.connect_errors_per_second_rate(tenant.external_id)
      assert Realtime.GenCounter.get(rate_args.id) == 1
    end
  end

  describe "shutdown/1" do
    test "shutdowns all associated connections", %{tenant: tenant} do
      assert {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Process.alive?(db_conn)
      assert Connect.ready?(tenant.external_id)
      connect_pid = Connect.whereis(tenant.external_id)
      replication_connection_pid = await_replication_connection!(tenant.external_id)
      assert Process.alive?(connect_pid)
      assert Process.alive?(replication_connection_pid)

      assert {_, %{conn: ^db_conn}} = :syn.lookup(Connect, tenant.external_id)
      assert {:ok, _replication_conn_pid} = await_replication_status!(tenant.external_id)

      Connect.shutdown(tenant.external_id)
      assert_process_down(connect_pid)
      assert_process_down(replication_connection_pid)
    end

    test "if tenant does not exist, does nothing" do
      assert :ok = Connect.shutdown("none")
    end
  end

  describe "backoff configuration" do
    test "backoff is configured with correct min/max/type values", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)
      state = :sys.get_state(pid)
      assert state.backoff.min == :timer.seconds(5)
      assert state.backoff.max == :timer.minutes(5)
      assert state.backoff.type == :rand_exp
    end
  end

  describe "replication recovery" do
    test "recovery reschedules without stopping when pg_stat_activity shows existing walsender", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      pid = Connect.whereis(tenant.external_id)

      # The real replication connection is active, so pg_stat_activity returns num_rows: 1 naturally
      send(pid, :recover_replication_connection)

      assert_always Process.alive?(pid), timeout: 100, interval: 10
    end

    test "recovery stops when elapsed time exceeds 2-hour window", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)
      # Replication starts asynchronously; wait for it to settle so the async result handler
      # doesn't clobber the state we inject below.
      assert {:ok, _} = await_replication_status!(tenant.external_id)

      pid = Connect.whereis(tenant.external_id)
      ref = Process.monitor(pid)

      past_ts = System.monotonic_time(:millisecond) - :timer.hours(3)
      :sys.replace_state(pid, fn state -> %{state | replication_recovery_started_at: past_ts} end)

      log =
        capture_log(fn ->
          send(pid, :recover_replication_connection)
          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 1000
        end)

      assert log =~ "Replication recovery window exceeded"
    end

    test "recovery preserves replication_recovery_started_at across multiple crashes", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)
      # Replication starts asynchronously; wait for it to settle so the async result handler
      # doesn't clobber the state we inject below.
      assert {:ok, _} = await_replication_status!(tenant.external_id)

      pid = Connect.whereis(tenant.external_id)
      original_ts = System.monotonic_time(:millisecond) - 1000

      ref = make_ref()

      :sys.replace_state(pid, fn state ->
        %{
          state
          | replication_connection_reference: ref,
            replication_connection_pid: self(),
            replication_recovery_started_at: original_ts
        }
      end)

      send(pid, {:DOWN, ref, :process, self(), :simulated_crash})

      state = :sys.get_state(pid)
      assert state.replication_recovery_started_at == original_ts

      Connect.shutdown(tenant.external_id)
    end

    test "recovery resets replication_recovery_started_at on successful reconnection", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      pid = Connect.whereis(tenant.external_id)

      replication_pid = await_replication_connection!(tenant.external_id)
      Process.monitor(replication_pid)
      Process.exit(replication_pid, :kill)
      assert_receive {:DOWN, _, :process, ^replication_pid, _}, 1000

      assert_eventually {:error, :not_connected} = Connect.replication_status(tenant.external_id), @local_wait

      assert {:ok, _} = await_replication_status!(tenant.external_id)

      state = :sys.get_state(pid)
      assert state.replication_recovery_started_at == nil
      assert Process.alive?(pid)

      Connect.shutdown(tenant.external_id)
    end

    test "defers and recovers instead of terminating when slot is in use at startup", %{tenant: tenant} do
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      slot_name = ReplicationConnection.replication_slot_name("realtime", "messages")

      # Simulate a previous replication session still holding the slot during a
      # restart/rebalance race so the initial replication start fails.
      create_replication_slot(db_conn, slot_name, plugin: "test_decoding")

      log =
        capture_log(fn ->
          assert {:ok, _} = Connect.lookup_or_start_connection(tenant.external_id)
          pid = Connect.whereis(tenant.external_id)
          assert_eventually :sys.get_state(pid).replication_recovery_started_at != nil, @local_wait
        end)

      pid = Connect.whereis(tenant.external_id)
      assert is_pid(pid)
      assert log =~ "StartReplicationFailed"

      # Connect stays alive with the recovery window open instead of shutting down.
      refute_process_down(pid)
      state = :sys.get_state(pid)
      assert state.replication_connection_pid == nil
      assert state.replication_recovery_started_at != nil

      # Free the slot; the scheduled retry should reconnect on its own and clear
      # the recovery window.
      Postgrex.query!(db_conn, "SELECT pg_drop_replication_slot($1)", [slot_name])

      assert {:ok, _} = await_replication_status!(tenant.external_id)
      assert :sys.get_state(pid).replication_recovery_started_at == nil

      Connect.shutdown(tenant.external_id)
    end
  end

  describe "get_status/1 degraded state" do
    test "returns {:ok, conn} when replication_conn is nil in syn", %{tenant: tenant} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      assert Connect.ready?(tenant.external_id)

      tenant_id = tenant.external_id

      :syn.update_registry(Connect, tenant_id, fn _pid, meta -> %{meta | replication_conn: nil} end)

      assert {:ok, conn} = Connect.get_status(tenant_id)
      assert is_pid(conn)

      Connect.shutdown(tenant_id)
    end
  end

  describe "registers into local registry" do
    test "successfully registers a process", %{tenant: %{external_id: external_id}} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(external_id)
      assert Registry.whereis_name({Realtime.Tenants.Connect.Registry, external_id})
    end

    test "successfully unregisters a process", %{tenant: %{external_id: external_id}} do
      assert {:ok, _db_conn} = Connect.lookup_or_start_connection(external_id)
      assert Registry.whereis_name({Realtime.Tenants.Connect.Registry, external_id})
      Connect.shutdown(external_id)

      assert_eventually(
        Registry.whereis_name({Realtime.Tenants.Connect.Registry, external_id}) == :undefined,
        @local_wait
      )
    end
  end

  defp check_db_connections_created(test_pid, tenant_id) do
    spawn(fn ->
      receive do
        :check ->
          processes =
            for pid <- Process.list(),
                info = Process.info(pid),
                dict = Keyword.get(info, :dictionary, []),
                match?({DBConnection.Connection, :init, 1}, dict[:"$initial_call"]),
                Keyword.get(dict, :"$logger_metadata$")[:external_id] == tenant_id do
              pid
            end

          Process.send_after(check_db_connections_created(test_pid, tenant_id), :check, 500)

          if length(processes) > 1 do
            send(test_pid, :too_many_connections)
          end
      end
    end)
  end

  defp update_extension(tenant, extension) do
    db_port = Realtime.Crypto.decrypt!(hd(tenant.extensions).settings["db_port"])

    extensions = [
      put_in(extension, ["settings", "db_port"], db_port)
    ]

    Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})
  end

  defp await_replication_connection!(tenant_id, opts \\ @replication_wait) do
    wait! ReplicationConnection.whereis(tenant_id), opts
  end

  defp await_replication_status!(tenant_id, opts \\ @replication_wait) do
    match_wait! {:ok, _}, Connect.replication_status(tenant_id), opts
  end
end
