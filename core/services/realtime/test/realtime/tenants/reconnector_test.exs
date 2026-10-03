defmodule Realtime.Tenants.ReconnectorTest do
  use Realtime.DataCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Reconnector
  alias Realtime.UsersCounter
  alias RealtimeWeb.Endpoint

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)

    %{tenant: tenant}
  end

  describe "periodic reconnect check" do
    test "restarts Connect when this node still has connected users", %{tenant: tenant} do
      {:ok, reconnector} = Reconnector.start_link([])

      assert {:ok, _} = Connect.lookup_or_start_connection(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)

      user_pid = spawn(fn -> Process.sleep(:infinity) end)
      UsersCounter.add(user_pid, tenant.external_id)

      Endpoint.subscribe(Connect.syn_topic(tenant.external_id))

      Process.exit(pid, :kill)
      assert_receive %{event: "connect_down"}, 5000

      send(reconnector, :check)

      assert_receive %{event: "ready", payload: %{pid: new_pid}}, 5000
      assert new_pid != pid
      assert Connect.whereis(tenant.external_id) == new_pid
    end

    test "does not restart Connect when this node has no connected users", %{tenant: tenant} do
      {:ok, reconnector} = Reconnector.start_link([])

      assert {:ok, _} = Connect.lookup_or_start_connection(tenant.external_id)
      pid = Connect.whereis(tenant.external_id)

      Endpoint.subscribe(Connect.syn_topic(tenant.external_id))

      Process.exit(pid, :kill)
      assert_receive %{event: "connect_down"}, 5000

      send(reconnector, :check)

      refute_receive %{event: "ready"}, 500
      refute Connect.whereis(tenant.external_id)
    end

    test "logs a warning when Connect had an RPC error", %{tenant: tenant} do
      %{external_id: tenant_id} = tenant
      {:ok, reconnector} = Reconnector.start_link([])

      user_pid = spawn(fn -> Process.sleep(:infinity) end)
      UsersCounter.add(user_pid, tenant_id)

      test_pid = self()

      # Holds the reconnect task until it is monitored, so its exit reason can be asserted
      stub(Connect, :lookup_or_start_connection, fn
        ^tenant_id ->
          send(test_pid, {:reconnecting, self()})
          receive do: (:continue -> {:error, :rpc_error, :timeout})

        other_tenant_id ->
          call_original(Connect, :lookup_or_start_connection, [other_tenant_id])
      end)

      allow(Connect, self(), reconnector)
      send(reconnector, :check)

      assert_receive {:reconnecting, task_pid}, 5000
      ref = Process.monitor(task_pid)

      log =
        capture_log(fn ->
          send(task_pid, :continue)
          assert_receive {:DOWN, ^ref, :process, ^task_pid, :normal}
        end)

      assert log =~ "Reconnector could not restart connection for #{tenant_id}: :timeout"
    end
  end
end
