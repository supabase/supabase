defmodule Realtime.PromEx.Plugins.MusterTest do
  # async: false - mutates the :muster_scope app env and a shared persistent_term
  use ExUnit.Case, async: false
  use Mimic
  use TestHelpers

  alias Realtime.PromEx.Plugins

  @states ~w(ready converging rebalancing)
  @poll_interval_ms 25

  setup :set_mimic_from_context

  defmodule MetricsTest do
    use PromEx, otp_app: :metrics_test
    @impl true
    def plugins do
      [{Plugins.Muster, poll_rate: 100}]
    end
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  describe "polling metrics" do
    test "emits a one-hot gauge: 1 for the current state, 0 for the others" do
      stub(Forum.Muster, :status, fn _ -> :converging end)

      metrics = poll_until("converging")

      assert value(metrics, state: "converging") == 1
      assert value(metrics, state: "ready") == 0
      assert value(metrics, state: "rebalancing") == 0
    end

    test "reflects a state transition on the next poll" do
      stub(Forum.Muster, :status, fn _ -> :ready end)

      metrics = poll_until("ready")
      assert value(metrics, state: "ready") == 1
      assert value(metrics, state: "converging") == 0
      assert value(metrics, state: "rebalancing") == 0

      stub(Forum.Muster, :status, fn _ -> :rebalancing end)

      metrics = poll_until("rebalancing")
      assert value(metrics, state: "ready") == 0
      assert value(metrics, state: "converging") == 0
      assert value(metrics, state: "rebalancing") == 1
    end

    test "reports every state as 0 before the coordinator has published a status" do
      stub(Forum.Muster, :status, fn _ -> :unknown end)

      # There is no state to wait *for* here, so wait out whatever the previous test left in the
      # gauge and then assert the all-zero shape holds across several polls rather than sampling
      # it once.
      assert_eventually all_zero?(), interval: @poll_interval_ms
      assert_always all_zero?(), timeout: 250, interval: @poll_interval_ms
    end
  end

  # PromEx polls every 100ms, so the stub a test just installed only reaches the gauge on the next
  # poll. Waiting for the one-hot shape identifies a post-stub snapshot unambiguously.
  defp poll_until(expected_state) do
    case until(fn -> one_hot_snapshot(expected_state) end, timeout: 2_000, interval: @poll_interval_ms) do
      {:ok, metrics} -> metrics
      {:timeout, _last} -> flunk("muster_node_status never settled to a one-hot #{expected_state}")
    end
  end

  defp one_hot_snapshot(expected_state) do
    metrics = PromEx.get_metrics(MetricsTest)

    one_hot? =
      Enum.all?(@states, fn state ->
        value(metrics, state: state) == if(state == expected_state, do: 1, else: 0)
      end)

    if one_hot?, do: metrics
  end

  defp all_zero? do
    metrics = PromEx.get_metrics(MetricsTest)
    Enum.all?(@states, &(value(metrics, state: &1) == 0))
  end

  defp value(metrics, tags), do: MetricsHelper.search(metrics, "muster_node_status", tags)
end
