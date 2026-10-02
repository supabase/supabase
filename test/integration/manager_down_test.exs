defmodule Supavisor.Integration.ManagerDownTest do
  use Supavisor.DataCase, async: false

  require Supavisor
  alias Postgrex, as: P

  @tenant "proxy_tenant1"

  defp setup_proxy_connection do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    {:ok, proxy} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        password: db_conf[:password],
        username: db_conf[:username] <> "." <> @tenant
      )

    id =
      Supavisor.id(
        type: :single,
        tenant: @tenant,
        user: db_conf[:username],
        mode: :transaction,
        db: db_conf[:database]
      )

    %{proxy: proxy, id: id, db_conf: db_conf}
  end

  defp get_client_handler_pid(id) do
    manager = Supavisor.get_local_manager(id)
    state = :sys.get_state(manager)
    tid = Access.get(state, :tid)

    [{_, client_pid, _}] = :ets.tab2list(tid)
    client_pid
  end

  describe "manager DOWN handling" do
    test "when idle, transparently reconnects after manager crash" do
      %{proxy: proxy, id: id} = setup_proxy_connection()

      # Verify initial connection works
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Get the manager and kill it
      manager = Supavisor.get_local_manager(id)

      # Verify client is idle
      client_pid = get_client_handler_pid(id)
      {state, _data} = :sys.get_state(client_pid)
      assert state == :idle

      # Kill the manager (simulates crash)
      Process.exit(manager, :kill)

      # Client should transparently reconnect and still work
      assert %P.Result{rows: [[2]]} = P.query!(proxy, "SELECT 2", [])

      GenServer.stop(proxy)
    end

    test "when busy, client handler continues query" do
      %{proxy: proxy, id: id} = setup_proxy_connection()

      # Verify initial connection works
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])

      # Get the manager
      manager = Supavisor.get_local_manager(id)
      assert is_pid(manager)

      # Start a long-running query in a separate process
      test_pid = self()

      query_task =
        Task.async(fn ->
          # This will be interrupted when manager dies
          result = P.query(proxy, "SELECT pg_sleep(3)", [])
          send(test_pid, {:query_result, result})
          result
        end)

      # Give query time to start
      Process.sleep(50)

      # Verify client is busy
      client_pid = get_client_handler_pid(id)
      {state, _data} = :sys.get_state(client_pid)
      assert state == :busy

      # Kill the manager while query is running
      Process.exit(manager, :kill)

      # The query should still succeed
      assert {:ok, %Postgrex.Result{}} = Task.await(query_task, 5000)

      # Verify client is now subscribed to the new manager
      new_manager = Supavisor.get_local_manager(id)
      assert is_pid(new_manager)
      assert new_manager != manager

      {state, _data} = :sys.get_state(client_pid)
      assert state == :idle

      # Verify the client is registered with the new manager
      new_state = :sys.get_state(new_manager)
      tid = Access.get(new_state, :tid)
      clients = :ets.tab2list(tid)
      assert Enum.any?(clients, fn {_, pid, _} -> pid == client_pid end)
    end
  end
end
