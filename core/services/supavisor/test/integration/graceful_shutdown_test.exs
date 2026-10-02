defmodule Supavisor.Integration.GracefulShutdownTest do
  use Supavisor.DataCase, async: false

  require Logger
  require Supavisor

  alias Postgrex, as: P
  alias Supavisor.Manager

  @tenant "proxy_tenant1"

  defp start_proxy(db_conf) do
    {:ok, proxy} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        password: db_conf[:password],
        username: db_conf[:username] <> "." <> @tenant,
        backoff_type: :stop
      )

    on_exit(fn ->
      Process.exit(proxy, :kill)
    end)

    proxy
  end

  defp get_client_count(id) do
    manager = Supavisor.get_local_manager(id)
    state = :sys.get_state(manager)
    tid = Access.get(state, :tid)
    :ets.info(tid, :size)
  end

  defp get_client_handler_pid(id) do
    manager = Supavisor.get_local_manager(id)
    state = :sys.get_state(manager)
    tid = Access.get(state, :tid)

    [{_, client_pid, _}] = :ets.tab2list(tid)
    client_pid
  end

  setup do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    id =
      Supavisor.id(
        type: :single,
        tenant: @tenant,
        user: db_conf[:username],
        mode: :transaction,
        db: db_conf[:database]
      )

    on_exit(fn ->
      Supavisor.stop(id)
      wait_until(fn -> Supavisor.get_global_sup(id) == nil end, 5000)
    end)

    %{id: id, db_conf: db_conf}
  end

  describe "Manager.graceful_shutdown/3" do
    test "returns :ok  when no clients connected", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection to start the pool
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])
      GenServer.stop(proxy)

      # Wait for client to be removed from manager
      assert :ok = wait_until(fn -> get_client_count(id) == 0 end)

      # Graceful shutdown should return immediately
      assert :ok = Manager.graceful_shutdown(id, 5000, 6000)
    end

    test "waits for idle clients to disconnect", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])
      assert get_client_count(id) == 1
      client_pid = get_client_handler_pid(id)
      ref = Process.monitor(client_pid)

      # Graceful shutdown blocks until client disconnects
      assert :ok = Manager.graceful_shutdown(id, 5000, 6000)

      # Client handler should have been terminated
      assert_received {:DOWN, ^ref, :process, ^client_pid, :normal}
    end

    test "waits for busy clients to finish query then disconnect", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Start a slow query
      query_task =
        Task.async(fn ->
          P.query(proxy, "SELECT pg_sleep(0.5)", [])
        end)

      # Wait for client to be busy
      client_pid = get_client_handler_pid(id)
      assert :ok = wait_until(fn -> elem(:sys.get_state(client_pid), 0) == :busy end)

      # Start graceful shutdown
      shutdown_task =
        Task.async(fn ->
          Manager.graceful_shutdown(id, 5000, 6000)
        end)

      # Query should complete (graceful shutdown waits for busy clients)
      assert {:ok, %P.Result{}} = Task.await(query_task, 2000)

      # Shutdown should complete after client disconnects
      assert :ok = Task.await(shutdown_task, 2000)
    end

    test "force terminates clients when timeout is reached", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Start a very long query that won't finish before timeout
      query_task =
        Task.async(fn ->
          P.query(proxy, "SELECT pg_sleep(10)", [])
        end)

      # Wait for client to be busy
      client_pid = get_client_handler_pid(id)
      assert :ok = wait_until(fn -> elem(:sys.get_state(client_pid), 0) == :busy end)
      ref = Process.monitor(client_pid)

      # Terminate should happen fast, regardless of ongoing query
      assert :ok = Manager.graceful_shutdown(id, 100, 1000)
      assert_receive {:DOWN, ^ref, :process, ^client_pid, _reason}, 1000

      assert {:error, %Postgrex.Error{postgres: %{code: :admin_shutdown}}} =
               Task.await(query_task)
    end

    test "returns :ok immediately when already terminating with error", %{
      id: id,
      db_conf: db_conf
    } do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Mock Supavisor.stop to not stop the pool, so we guarantee that the pool didn't
      # terminate yet at the point we call Manager.graceful_shutdown/3
      :meck.new(Supavisor, [:passthrough])

      :meck.expect(Supavisor, :stop, fn _id ->
        :ok
      end)

      # Trigger error shutdown first
      error = %{"S" => "FATAL", "C" => "57P01", "M" => "test error"}
      Manager.shutdown_with_error(id, error)

      # Wait for manager to be in terminating state
      manager = Supavisor.get_local_manager(id)
      assert :ok = wait_until(fn -> :sys.get_state(manager).terminating_error != nil end)

      # Graceful shutdown should return immediately since already terminating
      assert :ok = Manager.graceful_shutdown(id, 5000, 6000)
    after
      :meck.unload(Supavisor)
    end

    test "multiple clients all receive shutdown message", %{id: id, db_conf: db_conf} do
      # Create multiple connections
      for _ <- 1..3 do
        proxy = start_proxy(db_conf)
        # Execute a query to fully establish connection
        %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])
      end

      # Wait for all clients to be connected
      assert :ok = wait_until(fn -> get_client_count(id) == 3 end)

      # Get all client handler pids and monitor them
      manager = Supavisor.get_local_manager(id)
      state = :sys.get_state(manager)
      tid = Access.get(state, :tid)

      client_pids =
        for {_, pid, _} <- :ets.tab2list(tid) do
          Process.monitor(pid)
          pid
        end

      # Graceful shutdown should terminate all clients
      assert :ok = Manager.graceful_shutdown(id, 5000, 6000)

      # All client handlers should have been terminated
      for pid <- client_pids do
        assert_receive {:DOWN, _, :process, ^pid, _reason}, 100
      end
    end

    test "rejects new connections during graceful shutdown", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Start graceful shutdown (won't complete until client disconnects)
      shutdown_task =
        Task.async(fn ->
          Manager.graceful_shutdown(id, 5000, 6000)
        end)

      # Wait for manager to be terminating
      manager = Supavisor.get_local_manager(id)
      assert :ok = wait_until(fn -> :sys.get_state(manager).terminating_error != nil end)

      # New connection should fail with cannot_connect_now error
      assert {:error, {%Postgrex.Error{postgres: %{code: :cannot_connect_now}}, _}} =
               start_supervised(
                 SingleConnection.child_spec(
                   hostname: db_conf[:hostname],
                   port: Application.get_env(:supavisor, :proxy_port_transaction),
                   database: db_conf[:database],
                   password: db_conf[:password],
                   username: db_conf[:username] <> "." <> @tenant,
                   sync_connect: true
                 )
               )

      # Cleanup
      GenServer.stop(proxy)
      assert :ok = Task.await(shutdown_task, 2000)
    end
  end

  describe "Supavisor.stop/1 with Terminator" do
    test "gracefully shuts down pool and all clients", %{id: id, db_conf: db_conf} do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Monitor the client handler to detect when it gets disconnected
      client_pid = get_client_handler_pid(id)
      ref = Process.monitor(client_pid)

      # Stop the pool - this triggers Terminator
      assert :ok = Supavisor.stop(id)

      # Client handler should receive shutdown message and disconnect
      assert_receive {:DOWN, ^ref, :process, ^client_pid, _reason}, 6000
    end

    test "Terminator sends graceful shutdown before pools are stopped", %{
      id: id,
      db_conf: db_conf
    } do
      proxy = start_proxy(db_conf)

      # Establish connection
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Start a query that will be in progress during shutdown
      query_task =
        Task.async(fn ->
          P.query(proxy, "SELECT pg_sleep(0.3)", [])
        end)

      # Wait for client to be busy
      client_pid = get_client_handler_pid(id)
      assert :ok = wait_until(fn -> elem(:sys.get_state(client_pid), 0) == :busy end)

      # Monitor the client handler
      ref = Process.monitor(client_pid)

      # Stop the pool
      assert :ok = Supavisor.stop(id)

      # Query should complete (Terminator waits for graceful shutdown)
      assert {:ok, %Postgrex.Result{}} = Task.await(query_task, 6000)

      # Client handler should be down
      assert_receive {:DOWN, ^ref, :process, ^client_pid, _reason}, 1000
    end

    test "de-registers the pool and rejects a new one on the same node until it exits", %{
      id: id,
      db_conf: db_conf
    } do
      proxy = start_proxy(db_conf)
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      query_task = Task.async(fn -> P.query(proxy, "SELECT pg_sleep(1)", []) end)
      client_pid = get_client_handler_pid(id)
      assert :ok = wait_until(fn -> elem(:sys.get_state(client_pid), 0) == :busy end)

      old_sup = Supavisor.get_global_sup(id)
      sup_ref = Process.monitor(old_sup)
      stop_task = Task.async(fn -> Supavisor.stop(id) end)

      assert :ok = wait_until(fn -> Supavisor.get_global_sup(id) == nil end)
      assert Process.alive?(old_sup)

      conn_opts = [
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        password: db_conf[:password],
        username: db_conf[:username] <> "." <> @tenant,
        sync_connect: true
      ]

      assert {:error, {%Postgrex.Error{postgres: %{code: :cannot_connect_now}}, _}} =
               start_supervised(SingleConnection.child_spec(conn_opts))

      assert {:ok, %P.Result{}} = Task.await(query_task, 2000)
      assert :ok = Task.await(stop_task, 6000)
      assert_receive {:DOWN, ^sup_ref, :process, ^old_sup, _reason}

      new_proxy = start_proxy(db_conf)
      assert %P.Result{rows: [[1]]} = P.query!(new_proxy, "SELECT 1", [])
      new_sup = Supavisor.get_global_sup(id)
      assert is_pid(new_sup)
      refute new_sup == old_sup
    end

    test "stopping a shutting down pool doesn't stop the pool registered after it", %{
      id: id,
      db_conf: db_conf
    } do
      proxy = start_proxy(db_conf)
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      query_task = Task.async(fn -> P.query(proxy, "SELECT pg_sleep(1)", []) end)
      client_pid = get_client_handler_pid(id)
      assert :ok = wait_until(fn -> elem(:sys.get_state(client_pid), 0) == :busy end)

      old_manager = Supavisor.get_local_manager(id)
      old_sup = Supavisor.get_global_sup(id)
      sup_ref = Process.monitor(old_sup)
      stop_task = Task.async(fn -> Supavisor.stop(id) end)

      assert :ok = wait_until(fn -> Supavisor.get_global_sup(id) == nil end)

      {:ok, new_sup} = Agent.start(fn -> nil end)
      :ok = :syn.register(:tenants, id, new_sup, %{})

      on_exit(fn ->
        :syn.unregister(:tenants, id)
        Process.exit(new_sup, :kill)
      end)

      assert :ok = Manager.stop_pool(old_manager)

      assert {:ok, %P.Result{}} = Task.await(query_task, 2000)
      assert :ok = Task.await(stop_task, 6000)
      assert_receive {:DOWN, ^sup_ref, :process, ^old_sup, _reason}

      assert Process.alive?(new_sup)
      assert Supavisor.get_global_sup(id) == new_sup
    end
  end
end
