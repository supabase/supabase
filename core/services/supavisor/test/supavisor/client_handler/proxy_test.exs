defmodule Supavisor.ClientHandler.ProxyTest do
  use ExUnit.Case, async: true

  require Supavisor

  import Supavisor.Asserts

  alias Supavisor.ClientHandler.Proxy

  alias Supavisor.Errors.{
    MaxConnectionsError,
    FailedToStartProxyConnectionError,
    ProxySupervisorUnavailableError
  }

  @registry Supavisor.Registry.Tenants

  setup do
    {:ok, %{id: unique_id()}}
  end

  describe "Proxy.do_start_proxy_connection/4" do
    test "starts a process", %{id: id} do
      assert {:ok, pid} = Proxy.do_start_proxy_connection(id, 200, agent_child_spec(), 3)
      assert is_pid(pid)
    end

    test "fails if retries exhausted", %{id: id} do
      assert {:error, %ProxySupervisorUnavailableError{}} =
               error =
               Proxy.do_start_proxy_connection(id, 200, agent_child_spec(), 0)

      assert_valid_error(error)
    end

    test "property: handles concurrent exits on the supervisor", %{id: id} do
      test_pid = self()

      spawn_link(fn ->
        Enum.map(1..1_000, fn _ ->
          case Registry.lookup(@registry, {:proxy_dyn_sup, id}) do
            [{pid, _}] ->
              try do
                GenServer.stop(pid, :shutdown)
              catch
                :exit, _ ->
                  :ok
              end

            [] ->
              :noop
          end

          :timer.sleep(5)
        end)
      end)

      # started linked: if this crashes, the test fails
      spawn_link(fn ->
        results =
          Enum.map(1..10_000, fn i ->
            if rem(i, 20) == 0, do: Process.sleep(1)
            Proxy.do_start_proxy_connection(id, 10_000, agent_child_spec(), 3)
          end)

        send(test_pid, {:start_results, results})
      end)

      assert_receive {:start_results, results}, 5000

      frequencies =
        Enum.frequencies_by(results, fn
          {:ok, pid} when is_pid(pid) -> :started
          error -> error
        end)

      # Even with 3 retries, we may fail sometimes when the supervisor is being stopped
      # so fast.
      assert frequencies[:started] >= 9_500

      # We should only have :started and {:error, %ProxySupervisorUnavailableError{}}
      expected_results = MapSet.new([:started, {:error, %ProxySupervisorUnavailableError{}}])
      assert MapSet.subset?(MapSet.new(Map.keys(frequencies)), expected_results)
    end

    test "crashing child", %{id: id} do
      assert {:error, %FailedToStartProxyConnectionError{}} =
               error =
               Proxy.do_start_proxy_connection(id, 200, crashing_child_spec(), 1)

      assert_valid_error(error)
    end

    test "throwing child", %{id: id} do
      assert {:error, %FailedToStartProxyConnectionError{}} =
               error =
               Proxy.do_start_proxy_connection(id, 200, throwing_child_spec(), 1)

      assert_valid_error(error)
    end

    test "exiting child", %{id: id} do
      assert {:error, %FailedToStartProxyConnectionError{}} =
               error =
               Proxy.do_start_proxy_connection(id, 200, exiting_child_spec(), 1)

      assert_valid_error(error)
    end

    test "max children", %{id: id} do
      for _ <- 1..100 do
        assert {:ok, pid} = Proxy.do_start_proxy_connection(id, 100, agent_child_spec(), 3)
        assert is_pid(pid)
      end

      assert {:error, %MaxConnectionsError{mode: :proxy, limit: 100, code: "EMAXCONN"}} =
               error = Proxy.do_start_proxy_connection(id, 100, agent_child_spec(), 3)

      assert_valid_error(error)
    end
  end

  defp unique_id,
    do:
      Supavisor.id(
        type: :single,
        tenant: "test_#{System.unique_integer([:positive])}",
        user: "user",
        mode: :transaction,
        db: "db"
      )

  defp agent_child_spec do
    %{
      id: make_ref(),
      start: {Agent, :start_link, [fn -> :ok end]},
      restart: :temporary
    }
  end

  defp crashing_child_spec do
    %{
      id: make_ref(),
      start: {Agent, :start_link, [fn -> raise "boom" end]},
      restart: :temporary
    }
  end

  defp exiting_child_spec do
    %{
      id: make_ref(),
      start: {Agent, :start_link, [fn -> exit(:whoops) end]},
      restart: :temporary
    }
  end

  defp throwing_child_spec do
    %{
      id: make_ref(),
      start:
        {Agent, :start_link,
         [
           fn ->
             throw({:wow, :rock})
             :ok
           end
         ]},
      restart: :temporary
    }
  end
end
