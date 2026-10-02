defmodule Realtime.PromEx.Plugins.DistributedTest do
  # Async false due to Clustered usage
  use ExUnit.Case, async: false

  import WaitForIt

  alias Realtime.PromEx.Plugins

  defmodule MetricsTest do
    use PromEx, otp_app: :metrics_test
    @impl true
    def plugins do
      [{Plugins.Distributed, poll_rate: 100}]
    end
  end

  setup_all do
    {:ok, node} = Clustered.start()
    start_supervised!(MetricsTest)
    # Send some data back and forth
    25 = :erpc.call(node, String, :to_integer, ["25"])

    wait!(
      metric_value(PromEx.get_metrics(MetricsTest), "dist_send_count", origin_node: node(), target_node: node),
      timeout: 2_000,
      interval: 25
    )

    %{node: node}
  end

  describe "pooling metrics" do
    setup do
      %{metrics: PromEx.get_metrics(MetricsTest)}
    end

    test "send_pending_bytes", %{metrics: metrics, node: node} do
      assert metric_value(metrics, "dist_send_pending_bytes", origin_node: node(), target_node: node) == 0
    end

    test "send_count", %{metrics: metrics, node: node} do
      value = metric_value(metrics, "dist_send_count", origin_node: node(), target_node: node)
      assert is_integer(value)
      assert value > 0
    end

    test "send_bytes", %{metrics: metrics, node: node} do
      value = metric_value(metrics, "dist_send_bytes", origin_node: node(), target_node: node)
      assert is_integer(value)
      assert value > 0
    end

    test "recv_count", %{metrics: metrics, node: node} do
      value = metric_value(metrics, "dist_recv_count", origin_node: node(), target_node: node)
      assert is_integer(value)
      assert value > 0
    end

    test "recv_bytes", %{metrics: metrics, node: node} do
      value = metric_value(metrics, "dist_recv_bytes", origin_node: node(), target_node: node)
      assert is_integer(value)
      assert value > 0
    end

    test "queue_size", %{metrics: metrics, node: node} do
      assert is_integer(metric_value(metrics, "dist_queue_size", origin_node: node(), target_node: node))
    end
  end

  defp metric_value(metrics, metric, expected_tags), do: MetricsHelper.search(metrics, metric, expected_tags)
end
