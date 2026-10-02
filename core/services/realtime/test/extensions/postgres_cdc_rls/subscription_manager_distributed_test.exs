defmodule Extensions.PostgresCdcRls.SubscriptionManagerDistributedTest do
  # Usage of Clustered
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog

  alias Extensions.PostgresCdcRls.SubscriptionManager

  setup do
    {:ok, peer, remote_node} = Clustered.start_disconnected()
    true = Node.connect(remote_node)
    {:ok, peer: peer, remote_node: remote_node}
  end

  describe "not_alive_pids_dist/1" do
    test "returns empty list for all alive PIDs", %{remote_node: remote_node} do
      assert SubscriptionManager.not_alive_pids_dist(%{}) == []

      pid1 = spawn(fn -> Process.sleep(5000) end)
      pid2 = spawn(fn -> Process.sleep(5000) end)
      pid3 = spawn(fn -> Process.sleep(5000) end)
      pid4 = Node.spawn(remote_node, Process, :sleep, [5000])

      assert SubscriptionManager.not_alive_pids_dist(%{
               node() => MapSet.new([pid1, pid2, pid3]),
               remote_node => MapSet.new([pid4])
             }) ==
               []
    end

    test "returns list of dead PIDs", %{remote_node: remote_node} do
      pid1 = spawn(fn -> Process.sleep(5000) end)
      pid2 = spawn(fn -> Process.sleep(5000) end)
      pid3 = spawn(fn -> Process.sleep(5000) end)
      pid4 = Node.spawn(remote_node, Process, :sleep, [5000])
      pid5 = Node.spawn(remote_node, Process, :sleep, [5000])

      Process.exit(pid2, :kill)
      Process.exit(pid5, :kill)

      assert SubscriptionManager.not_alive_pids_dist(%{
               node() => MapSet.new([pid1, pid2, pid3]),
               remote_node => MapSet.new([pid4, pid5])
             }) == [pid2, pid5]
    end

    test "handles rpc error", %{remote_node: remote_node, peer: peer} do
      pid1 = spawn(fn -> Process.sleep(5000) end)
      pid2 = spawn(fn -> Process.sleep(5000) end)
      pid3 = spawn(fn -> Process.sleep(5000) end)
      pid4 = Node.spawn(remote_node, Process, :sleep, [5000])
      pid5 = Node.spawn(remote_node, Process, :sleep, [5000])

      Process.exit(pid2, :kill)

      # Stop the other node
      :peer.stop(peer)

      log =
        capture_log(fn ->
          assert SubscriptionManager.not_alive_pids_dist(%{
                   node() => MapSet.new([pid1, pid2, pid3]),
                   remote_node => MapSet.new([pid4, pid5])
                 }) == [pid2]
        end)

      assert log =~ "UnableToCheckProcessesOnRemoteNode"
    end
  end
end
