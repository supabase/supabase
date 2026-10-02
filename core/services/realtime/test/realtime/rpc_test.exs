defmodule Realtime.RpcTest do
  use ExUnit.Case

  import ExUnit.CaptureLog

  alias Realtime.Rpc

  @aux_mod (quote do
              defmodule TestRpc do
                def test_raise, do: raise("test")
                def test_timeout, do: Process.sleep(200)
                def test_success, do: {:ok, "success"}
              end
            end)

  Code.eval_quoted(@aux_mod)

  def handle_telemetry(event, measurements, metadata, pid: pid), do: send(pid, {event, measurements, metadata})

  setup do
    {:ok, node} = Clustered.start(@aux_mod)
    :telemetry.attach(__MODULE__, [:realtime, :rpc], &__MODULE__.handle_telemetry/4, pid: self())
    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    %{node: node}
  end

  describe "call/5" do
    test "successful RPC call returns exactly what the original function returns", %{node: node} do
      assert {:ok, "success"} = Rpc.call(node, TestRpc, :test_success, [])
      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        mod: TestRpc,
                        func: :test_success,
                        origin_node: ^origin_node,
                        target_node: ^node
                      }}
    end

    test "raised exceptions are properly caught and logged", %{node: node} do
      assert {:badrpc, {:EXIT, {%RuntimeError{message: "test"}, [{TestRpc, :test_raise, 0, _}]}}} =
               Rpc.call(node, TestRpc, :test_raise, [])

      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        mod: TestRpc,
                        func: :test_raise,
                        origin_node: ^origin_node,
                        target_node: ^node
                      }}
    end

    test "timeouts are properly caught and logged", %{node: node} do
      assert {:badrpc, :timeout} =
               Rpc.call(node, TestRpc, :test_timeout, [], timeout: 100)

      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        mod: TestRpc,
                        func: :test_timeout,
                        origin_node: ^origin_node,
                        target_node: ^node
                      }}
    end
  end

  describe "enhanced_call/5" do
    test "successful RPC call returns exactly what the original function returns", %{node: node} do
      assert {:ok, "success"} = Rpc.enhanced_call(node, TestRpc, :test_success, [], tenant_id: "123")
      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        mod: TestRpc,
                        func: :test_success,
                        origin_node: ^origin_node,
                        target_node: ^node,
                        success: true
                      }}
    end

    test "raised exceptions are properly caught and logged", %{node: node} do
      assert capture_log(fn ->
               assert {:error, :rpc_error, %RuntimeError{message: "test"}} =
                        Rpc.enhanced_call(node, TestRpc, :test_raise, [], tenant_id: "123")
             end) =~ "project=123 external_id=123 [error] ErrorOnRpcCall"

      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: _},
                      %{
                        mod: TestRpc,
                        func: :test_raise,
                        origin_node: ^origin_node,
                        target_node: ^node,
                        success: false
                      }}
    end

    test "timeouts are properly caught and logged", %{node: node} do
      assert capture_log(fn ->
               assert {:error, :rpc_error, :timeout} =
                        Rpc.enhanced_call(node, TestRpc, :test_timeout, [], timeout: 100)
             end) =~ "ErrorOnRpcCall"

      origin_node = node()

      assert_receive {[:realtime, :rpc], %{latency: 0},
                      %{
                        mod: TestRpc,
                        func: :test_timeout,
                        origin_node: ^origin_node,
                        target_node: ^node
                      }}
    end
  end
end
