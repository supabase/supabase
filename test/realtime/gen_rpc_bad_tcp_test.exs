defmodule Realtime.GenRpcBadTcpTest do
  # Async false due to Clustered usage.
  #
  # These tests each start a peer node with a deliberately broken gen_rpc tcp_server_port
  # to exercise connection failures. They rely on Node.list()/multicast/multicall seeing
  # exactly this one (broken) node, so they cannot share a good node with the rest of the
  # gen_rpc suite — hence they live in their own module with a per-test isolated node.
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  alias Realtime.GenRpc

  setup context do
    extra_config = context[:extra_config] || [{:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(:bad_tcp)}]
    {:ok, node} = Clustered.start(nil, extra_config: extra_config, warm_clients: false)
    %{node: node}
  end

  describe "call/5" do
    setup do
      :telemetry.attach(__MODULE__, [:realtime, :rpc], &__MODULE__.handle_telemetry/4, pid: self())
      on_exit(fn -> :telemetry.detach(__MODULE__) end)
    end

    test "bad tcp error", %{node: node} do
      current_node = node()

      log =
        capture_log(fn ->
          assert GenRpc.call(node, Map, :fetch, [%{a: 1}, :a], tenant_id: 123) == {:error, :rpc_error, :econnrefused}
        end)

      assert log =~
               ~r/project=123 external_id=123 \[error\] ErrorOnRpcCall: %{\s+error: :econnrefused,\s+mod: Map,\s+func: :fetch,\s+target:\s+:"#{node}"/

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end
  end

  describe "abcast/4" do
    test "tcp error" do
      Logger.put_process_level(self(), :debug)

      log =
        capture_log(fn ->
          assert GenRpc.abcast(Node.list(), :some_process_name, "a message", []) == :ok
          # We have to wait for gen_rpc logs to show up
          Process.sleep(100)
        end)

      assert log =~ "failed_to_connect_server"

      refute_receive _any
    end
  end

  describe "cast/5" do
    test "tcp error", %{node: node} do
      parent = self()
      Logger.put_process_level(self(), :debug)

      log =
        capture_log(fn ->
          assert GenRpc.cast(node, Kernel, :send, [parent, :sent]) == :ok
          # We have to wait for gen_rpc logs to show up
          Process.sleep(100)
        end)

      assert log =~ "failed_to_connect_server"

      refute_receive _any
    end
  end

  describe "multicast/4" do
    test "tcp error" do
      parent = self()
      Logger.put_process_level(self(), :debug)

      log =
        capture_log(fn ->
          assert GenRpc.multicast(Kernel, :send, [parent, :sent]) == :ok
          # We have to wait for gen_rpc logs to show up
          Process.sleep(100)
        end)

      assert log =~ "failed_to_connect_server"

      assert_receive :sent
      refute_receive _any
    end
  end

  describe "multicall/4" do
    setup do
      :telemetry.attach(__MODULE__, [:realtime, :rpc], &__MODULE__.handle_telemetry/4, pid: self())
      on_exit(fn -> :telemetry.detach(__MODULE__) end)
    end

    test "partial results with bad tcp error", %{node: node} do
      current_node = node()

      log =
        capture_log(fn ->
          assert GenRpc.multicall(Map, :fetch, [%{a: 1}, :a], tenant_id: 123) == [
                   {node(), {:ok, 1}},
                   {node, {:error, :rpc_error, :econnrefused}}
                 ]
        end)

      assert log =~
               ~r/project=123 external_id=123 \[error\] ErrorOnRpcCall: %{\s+error: :econnrefused,\s+mod: Map,\s+func: :fetch,\s+target:\s+:"#{node}"/

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: false,
                        mechanism: :gen_rpc
                      }}

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^current_node,
                        success: true,
                        mechanism: :gen_rpc
                      }}
    end
  end

  def handle_telemetry(event, measurements, metadata, pid: pid), do: send(pid, {event, measurements, metadata})
end
