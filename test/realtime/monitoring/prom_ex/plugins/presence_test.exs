defmodule Realtime.PromEx.Plugins.PresenceTest do
  use Realtime.DataCase, async: false

  alias Realtime.GenRpcPubSub.Worker
  alias Realtime.PromEx.Plugins.Presence

  @worker Realtime.PubSubElixir.Realtime.PubSub.Adapter_1

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_presence
    @impl true
    def plugins, do: [Presence]
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  test "sizes Phoenix.Tracker messages received via :ftl and :ftr" do
    tracker_msg = {:pub, :heartbeat, {:shard, 1}, :empty, %{}}
    ftl = Worker.forward_to_local("phx_presence:shard_1", tracker_msg, Phoenix.PubSub)
    ftr = Worker.forward_to_region("phx_presence:shard_1", tracker_msg, Phoenix.PubSub)

    bytes_before = metric_value("realtime_presence_replication_received_bytes") || 0

    send(@worker, ftl)
    send(@worker, ftr)
    :sys.get_state(@worker)

    assert metric_value("realtime_presence_replication_received_bytes") ==
             bytes_before + :erlang.external_size(ftl) + :erlang.external_size(ftr)
  end

  test "ignores non-presence topics" do
    bytes_before = metric_value("realtime_presence_replication_received_bytes") || 0

    send(@worker, Worker.forward_to_local("realtime:some_topic", :hello, Phoenix.PubSub))
    :sys.get_state(@worker)

    assert (metric_value("realtime_presence_replication_received_bytes") || 0) == bytes_before
  end

  defp metric_value(metric) do
    MetricsHelper.search(PromEx.get_metrics(MetricsTest), metric, implementation: "phoenix")
  end
end
