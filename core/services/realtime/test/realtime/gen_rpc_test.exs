defmodule Realtime.GenRpcTest do
  # Async false due to Clustered usage
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  alias Realtime.GenRpc

  # Booting a peer node is expensive (~seconds) and generic across these tests, so start one
  # shared node for the whole module and reuse it. async: false already serializes the module.
  # Bad-TCP / port-error variants live in Realtime.GenRpcBadTcpTest since they need an isolated
  # node that must not appear in Node.list()/multicast results here.
  setup_all do
    {:ok, node} = Clustered.start()

    %{node: node}
  end

  describe "call/5" do
    setup do
      :telemetry.attach(__MODULE__, [:realtime, :rpc], &__MODULE__.handle_telemetry/4, pid: self())
      on_exit(fn -> :telemetry.detach(__MODULE__) end)
    end

    test "returns the result calling local node" do
      current_node = node()

      assert GenRpc.call(current_node, Map, :fetch, [%{a: 1}, :a], tenant_id: "123") == {:ok, 1}

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^current_node,
                        success: true,
                        mechanism: :gen_rpc
                      }}
    end

    test "returns the result with an error tuple calling local node" do
      current_node = node()

      assert GenRpc.call(current_node, File, :open, ["/not-existing.file"], tenant_id: "123") == {:error, :enoent}

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^current_node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "returns the result calling remote node", %{node: node} do
      current_node = node()
      assert GenRpc.call(node, Map, :fetch, [%{a: 1}, :a], tenant_id: "123") == {:ok, 1}

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: true,
                        mechanism: :gen_rpc
                      }}
    end

    test "returns the result with an error tuple calling remote node", %{node: node} do
      current_node = node()

      assert GenRpc.call(node, File, :open, ["/not-existing.file"], tenant_id: "123") == {:error, :enoent}

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "local node timeout error" do
      current_node = node()

      log =
        capture_log(fn ->
          assert GenRpc.call(current_node, Process, :sleep, [500], timeout: 100, tenant_id: 123) ==
                   {:error, :rpc_error, :timeout}
        end)

      assert log =~
               "project=123 external_id=123 [error] ErrorOnRpcCall: %{error: :timeout, mod: Process, func: :sleep, target: :\"#{current_node}\"}"

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^current_node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "remote node timeout error", %{node: node} do
      current_node = node()

      log =
        capture_log(fn ->
          assert GenRpc.call(node, Process, :sleep, [500], timeout: 100, tenant_id: 123) ==
                   {:error, :rpc_error, :timeout}
        end)

      assert log =~
               ~r/project=123 external_id=123 \[error\] ErrorOnRpcCall: %{\s+error: :timeout,\s+mod: Process,\s+func: :sleep,\s+target:\s+:"#{node}"/

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "local node exception" do
      current_node = node()

      assert {:error, :rpc_error, _} = GenRpc.call(current_node, Map, :fetch!, [%{}, :a], tenant_id: "123")

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^current_node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "remote node exception", %{node: node} do
      current_node = node()

      assert {:error, :rpc_error, _} = GenRpc.call(node, Map, :fetch!, [%{}, :a], tenant_id: "123")

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end

    test "bad node" do
      node = :"unknown@1.1.1.1"

      log =
        capture_log(fn ->
          assert GenRpc.call(node, Map, :fetch, [%{a: 1}, :a], tenant_id: 123) == {:error, :rpc_error, :badnode}
        end)

      assert log =~
               ~r/project=123 external_id=123 \[error\] ErrorOnRpcCall: %{+error: :badnode, mod: Map, func: :fetch, target: :"#{node}"/
    end
  end

  describe "abcast/4" do
    test "abcast to registered process", %{node: node} do
      name =
        System.unique_integer()
        |> to_string()
        |> String.to_atom()

      :erlang.register(name, self())

      # Use erpc to make the other node abcast to this one
      :erpc.call(node, GenRpc, :abcast, [[node()], name, "a message", []])

      assert_receive "a message"
      refute_receive _any
    end

    test "abcast to registered process on the local node" do
      name =
        System.unique_integer()
        |> to_string()
        |> String.to_atom()

      :erlang.register(name, self())

      assert GenRpc.abcast([node()], name, "a message", []) == :ok

      assert_receive "a message"
      refute_receive _any
    end
  end

  describe "cast/5" do
    test "apply on a local node" do
      parent = self()

      assert GenRpc.cast(node(), Kernel, :send, [parent, :sent]) == :ok

      assert_receive :sent
      refute_receive _any
    end

    test "apply on a remote node", %{node: node} do
      parent = self()

      assert GenRpc.cast(node, Kernel, :send, [parent, :sent]) == :ok

      assert_receive :sent
      refute_receive _any
    end

    test "bad node does nothing" do
      node = :"unknown@1.1.1.1"

      parent = self()

      assert GenRpc.cast(node, Kernel, :send, [parent, :sent]) == :ok

      refute_receive _any
    end
  end

  describe "multicast/4" do
    test "evals everywhere" do
      parent = self()

      assert GenRpc.multicast(Kernel, :send, [parent, :sent]) == :ok

      assert_receive :sent
      assert_receive :sent
      refute_receive _any
    end
  end

  describe "multicall/4" do
    setup do
      :telemetry.attach(__MODULE__, [:realtime, :rpc], &__MODULE__.handle_telemetry/4, pid: self())
      on_exit(fn -> :telemetry.detach(__MODULE__) end)
    end

    test "returns the result of the function call per node", %{node: node} do
      current_node = node()

      assert GenRpc.multicall(Map, :fetch, [%{a: 1}, :a], tenant_id: "123") == [
               {current_node, {:ok, 1}},
               {node, {:ok, 1}}
             ]

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        origin_node: ^current_node,
                        target_node: ^node,
                        success: true,
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

    test "timeout error", %{node: node} do
      current_node = node()

      log =
        capture_log(fn ->
          assert GenRpc.multicall(Process, :sleep, [500], timeout: 100, tenant_id: 123) == [
                   {current_node, {:error, :rpc_error, :timeout}},
                   {node, {:error, :rpc_error, :timeout}}
                 ]
        end)

      assert log =~
               "project=123 external_id=123 [error] ErrorOnRpcCall: %{error: :timeout, mod: Process, func: :sleep, target: :\"#{current_node}\"}"

      assert log =~
               ~r/project=123 external_id=123 \[error\] ErrorOnRpcCall: %{\s+error: :timeout,\s+mod: Process,\s+func: :sleep,\s+target:\s+:"#{node}"/

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
                        success: false,
                        mechanism: :gen_rpc
                      }}
    end
  end

  def handle_telemetry(event, measurements, metadata, pid: pid), do: send(pid, {event, measurements, metadata})
end
