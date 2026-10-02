defmodule Extensions.PostgresCdcRls.WorkerSupervisorTest do
  use Realtime.DataCase, async: false

  alias Extensions.PostgresCdcRls.WorkerSupervisor
  alias Extensions.PostgresCdcRls.ReplicationPoller
  alias Extensions.PostgresCdcRls.SubscriptionManager

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    extension = hd(tenant.extensions).settings

    args =
      extension
      |> Map.put("id", tenant.external_id)
      |> Map.put("region", extension["region"])

    %{args: args, tenant: tenant}
  end

  describe "start_link/1" do
    test "starts the supervisor with all children", %{args: args} do
      pid = start_link_supervised!({WorkerSupervisor, args})

      assert Process.alive?(pid)

      children = Supervisor.which_children(pid)
      child_ids = Enum.map(children, fn {id, _pid, _type, _modules} -> id end)

      assert ReplicationPoller in child_ids
      assert SubscriptionManager in child_ids
    end

    test "creates ETS tables for subscribers", %{args: args} do
      pid = start_link_supervised!({WorkerSupervisor, args})

      children = Supervisor.which_children(pid)

      replication_poller_pid =
        Enum.find_value(children, fn
          {ReplicationPoller, pid, _, _} when is_pid(pid) -> pid
          _ -> nil
        end)

      assert replication_poller_pid != nil
      assert Process.alive?(replication_poller_pid)
    end

    test "raises exception when tenant is not in cache" do
      args = %{
        "id" => "nonexistent_tenant_#{System.unique_integer()}",
        "region" => "us-east-1",
        "db_host" => "localhost",
        "db_name" => "realtime",
        "db_user" => "user",
        "db_password" => "pass",
        "db_port" => "5432"
      }

      {pid, ref} = spawn_monitor(fn -> WorkerSupervisor.start_link(args) end)
      assert_receive {:DOWN, ^ref, :process, ^pid, {%Realtime.PostgresCdc.Exception{}, _}}
    end
  end

  describe "supervisor registration" do
    test "registers in syn under the tenant scope", %{args: args, tenant: tenant} do
      start_link_supervised!({WorkerSupervisor, args})

      scope = Realtime.Syn.PostgresCdc.scope(tenant.external_id)
      assert {pid, _meta} = :syn.lookup(scope, tenant.external_id)
      assert is_pid(pid)
    end
  end

  describe "restart behaviour" do
    test "abnormal exit of ReplicationPoller restarts only itself", %{args: args} do
      sup = start_link_supervised!({WorkerSupervisor, args})

      poller = child_pid(sup, ReplicationPoller)
      manager = child_pid(sup, SubscriptionManager)

      Process.exit(poller, :kill)

      # rest_for_one restarts the poller and everything after it (the manager)
      new_poller = wait_for_restart(sup, ReplicationPoller, poller)

      assert new_poller != poller
      assert child_pid(sup, SubscriptionManager) == manager
      assert Process.alive?(sup)
    end

    test "abnormal exit of SubscriptionManager restarts only itself", %{args: args} do
      sup = start_link_supervised!({WorkerSupervisor, args})

      poller = child_pid(sup, ReplicationPoller)
      manager = child_pid(sup, SubscriptionManager)

      Process.exit(manager, :kill)

      # rest_for_one: the manager is last, so the poller is left untouched
      new_manager = wait_for_restart(sup, SubscriptionManager, manager)

      assert new_manager != manager
      assert child_pid(sup, ReplicationPoller) == poller
      assert Process.alive?(sup)
    end
  end

  describe "shutdown behaviour" do
    test "{:shutdown, _} from ReplicationPoller stops the supervisor", %{args: args} do
      # start_supervised! (not the linking variant) so the supervisor's :shutdown
      # exit does not propagate to the test process.
      sup = start_supervised!({WorkerSupervisor, args})
      ref = Process.monitor(sup)

      poller = child_pid(sup, ReplicationPoller)
      Process.exit(poller, {:shutdown, :max_retries_reached})

      assert_receive {:DOWN, ^ref, :process, ^sup, :shutdown}, 2000
    end

    test "{:shutdown, _} from SubscriptionManager stops the supervisor", %{args: args} do
      sup = start_supervised!({WorkerSupervisor, args})
      ref = Process.monitor(sup)

      manager = child_pid(sup, SubscriptionManager)
      Process.exit(manager, {:shutdown, :test})

      assert_receive {:DOWN, ^ref, :process, ^sup, :shutdown}, 2000
    end
  end

  defp child_pid(sup, id) do
    Enum.find_value(Supervisor.which_children(sup), fn
      {^id, pid, _type, _modules} when is_pid(pid) -> pid
      _ -> nil
    end)
  end

  defp wait_for_restart(sup, id, old_pid, timeout \\ 2000) do
    case_wait child_pid(sup, id), timeout: timeout, interval: 20 do
      pid when is_pid(pid) and pid != old_pid -> pid
    else
      _ -> flunk("child #{inspect(id)} was not restarted within the timeout")
    end
  end
end
