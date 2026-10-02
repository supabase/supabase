defmodule Realtime.GenRpcMetricsTest do
  # Async false due to Clustered usage
  use ExUnit.Case, async: false

  alias Realtime.GenRpcMetrics

  setup_all do
    {:ok, node} = Clustered.start()
    %{node: node}
  end

  describe "info/0 while connected" do
    test "per node metric", %{node: node} do
      # We need to generate some load on gen_rpc first
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 2)

      assert %{
               ^node => %{
                 connections: _,
                 queue_size: _,
                 inet_stats: %{
                   recv_oct: _,
                   recv_cnt: _,
                   recv_max: _,
                   recv_avg: _,
                   recv_dvi: _,
                   send_oct: _,
                   send_cnt: _,
                   send_max: _,
                   send_avg: _,
                   send_pend: _
                 }
               }
             } = GenRpcMetrics.info()
    end

    test "metric matches on both sides", %{node: node} do
      # Establish a baseline on both accumulators first. A socket seen for the
      # first time contributes 0, so the cumulative counters are only comparable
      # across the window *after* both sides have observed the sockets once.
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
      :erpc.call(node, Realtime.GenRpc, :call, [node(), String, :to_integer, ["25"], [key: 1]])
      local_before = GenRpcMetrics.info()[node][:inet_stats]
      remote_before = :erpc.call(node, GenRpcMetrics, :info, [])[node()][:inet_stats]

      # Generate a known amount of bidirectional load.
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 2)
      :erpc.call(node, Realtime.GenRpc, :call, [node(), String, :to_integer, ["25"], [key: 1]])

      local_metrics = GenRpcMetrics.info()[node][:inet_stats]
      remote_metrics = :erpc.call(node, GenRpcMetrics, :info, [])[node()][:inet_stats]

      assert Map.keys(local_metrics) == [
               :send_pend,
               :recv_avg,
               :recv_cnt,
               :recv_dvi,
               :recv_max,
               :recv_oct,
               :send_avg,
               :send_cnt,
               :send_max,
               :send_oct
             ]

      assert local_metrics[:connections] == remote_metrics[:connections]

      # avg/max are instantaneous gauges (current sum across live sockets), so
      # they are compared as absolute values.
      assert_in_delta local_metrics[:send_avg], remote_metrics[:recv_avg], 200
      assert_in_delta local_metrics[:recv_avg], remote_metrics[:send_avg], 200
      assert_in_delta local_metrics[:send_max], remote_metrics[:recv_max], 1000
      assert_in_delta local_metrics[:recv_max], remote_metrics[:send_max], 1000

      # oct/cnt are cumulative counters carrying a per-accumulator baseline
      # offset, so the invariant is that the *delta* over the window matches:
      # what one side sent equals what the other received.
      local_sent_oct = local_metrics[:send_oct] - local_before[:send_oct]
      local_recv_oct = local_metrics[:recv_oct] - local_before[:recv_oct]
      remote_sent_oct = remote_metrics[:send_oct] - remote_before[:send_oct]
      remote_recv_oct = remote_metrics[:recv_oct] - remote_before[:recv_oct]

      assert_in_delta local_sent_oct, remote_recv_oct, 1000
      assert_in_delta local_recv_oct, remote_sent_oct, 1000

      local_sent_cnt = local_metrics[:send_cnt] - local_before[:send_cnt]
      local_recv_cnt = local_metrics[:recv_cnt] - local_before[:recv_cnt]
      remote_sent_cnt = remote_metrics[:send_cnt] - remote_before[:send_cnt]
      remote_recv_cnt = remote_metrics[:recv_cnt] - remote_before[:recv_cnt]

      assert_in_delta local_sent_cnt, remote_recv_cnt, 10
      assert_in_delta local_recv_cnt, remote_sent_cnt, 10
    end

    test "cumulative counters are monotonic across polls", %{node: node} do
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
      before = GenRpcMetrics.info()[node][:inet_stats]

      for i <- 1..10, do: Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: i)
      later = GenRpcMetrics.info()[node][:inet_stats]

      for key <- [:recv_oct, :recv_cnt, :send_oct, :send_cnt] do
        assert later[key] >= before[key],
               "#{key} decreased across polls: #{before[key]} -> #{later[key]}"
      end
    end

    test "counters keep accumulating when the gen_rpc client is killed and reconnects", %{node: node} do
      # ~1MB payload sent to the remote node, so send_oct grows by a clear ~1MB
      # per call. A large first batch builds up a substantial send_oct total.
      payload = String.duplicate("x", 1_000_000)

      # Warm up so the current socket has a baseline; otherwise the first sight
      # of it contributes 0 and the batch below would not be counted into `before`.
      GenRpcMetrics.info()
      for _ <- 1..8, do: Realtime.GenRpc.call(node, String, :length, [payload], key: 1)
      before = GenRpcMetrics.info()[node][:inet_stats]
      # Let the remote node poll the current socket too, so the imminent reset
      # doesn't under-count bytes that only our side had observed (keeps the
      # shared peer's local/remote counters in sync for other tests).
      :erpc.call(node, GenRpcMetrics, :info, [])

      # Kill the gen_rpc client process for this node. Its TCP socket dies with
      # it and the next call spins up a fresh client whose :inet.getstat counters
      # restart from 0. Summing only live sockets would collapse send_oct back to
      # a single small batch. The per-node accumulator must carry the old total.
      client = :gen_rpc_client.where_is({node, {:call, 1}})
      assert is_pid(client), "expected a gen_rpc call client for #{inspect(node)}"
      ref = Process.monitor(client)
      Process.exit(client, :kill)
      assert_receive {:DOWN, ^ref, :process, ^client, _}, 1_000

      # Reconnect on a brand-new socket. This first poll retains the pre-kill
      # total AND establishes a baseline for the fresh socket: a socket seen for
      # the first time contributes 0, so the traffic it carries only starts
      # counting from the *next* poll.
      for _ <- 1..2, do: Realtime.GenRpc.call(node, String, :length, [payload], key: 1)
      after_reconnect = GenRpcMetrics.info()[node][:inet_stats]

      # Every cumulative counter must be monotonic across the reset. send_oct is
      # the strong signal here: it was ~8MB before, and a fresh socket carrying
      # only the small post-kill batch could never reach that on its own, so this
      # only holds because the accumulator retained the pre-kill total.
      for key <- [:recv_oct, :recv_cnt, :send_oct, :send_cnt] do
        assert after_reconnect[key] >= before[key],
               "#{key} dropped after gen_rpc client restart: #{before[key]} -> #{after_reconnect[key]}"
      end

      # Push more traffic on the now-baselined socket and poll again. This proves
      # the accumulator doesn't just retain the old total but keeps counting on
      # top of it after the restart. send_oct must grow by ~2MB (the two 1MB
      # calls), which the fresh socket can only contribute once it has a baseline.
      for _ <- 1..2, do: Realtime.GenRpc.call(node, String, :length, [payload], key: 1)
      later = GenRpcMetrics.info()[node][:inet_stats]

      for key <- [:recv_oct, :recv_cnt, :send_oct, :send_cnt] do
        assert later[key] >= after_reconnect[key],
               "#{key} dropped across post-restart polls: #{after_reconnect[key]} -> #{later[key]}"
      end

      assert later[:send_oct] - after_reconnect[:send_oct] >= 1_000_000,
             "post-restart send_oct did not accumulate new traffic: " <>
               "#{after_reconnect[:send_oct]} -> #{later[:send_oct]}"
    end
  end

  describe "info/0 pruning" do
    test "drops the accumulator for a node that leaves the cluster", %{node: node} do
      # Generate load and poll so a real accumulator exists for the connected node.
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 2)
      GenRpcMetrics.info()
      assert Map.has_key?(:sys.get_state(GenRpcMetrics).totals, node)

      # Actually drop the node from the cluster. A second peer can't be spun up
      # (it would need the same gen_rpc port as the shared node), so we take the
      # shared node down and reconnect it below so the rest of the suite is
      # unaffected regardless of test run order.
      :ok = :net_kernel.monitor_nodes(true)
      true = :erlang.disconnect_node(node)
      assert_receive {:nodedown, ^node}, 5_000

      # A poll rebuilds `totals` from the live node set, so a node that has left
      # the cluster is pruned instead of accumulating forever.
      GenRpcMetrics.info()
      refute Map.has_key?(:sys.get_state(GenRpcMetrics).totals, node)

      # Restore the shared node (and its gen_rpc client) for the other tests.
      true = Node.connect(node)
      assert_receive {:nodeup, ^node}, 5_000
      :ok = :net_kernel.monitor_nodes(false)
      Realtime.GenRpc.call(node, String, :to_integer, ["25"], key: 1)
    end
  end
end
