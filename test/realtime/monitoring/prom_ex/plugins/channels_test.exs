defmodule Realtime.PromEx.Plugins.ChannelsTest do
  use Realtime.DataCase, async: false

  alias Realtime.PromEx.Plugins.Channels
  alias RealtimeWeb.RealtimeChannel.Logging

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_channels
    @impl true
    def plugins do
      [Channels]
    end
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  test "counts channel errors with tenant tag in prometheus" do
    tenant_id = random_string()
    socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}
    error = "TestError"

    previous_value = metric_value("realtime_channel_error", code: error, tenant: tenant_id) || 0
    Logging.maybe_log_error(socket, error, "test error")
    assert metric_value("realtime_channel_error", code: error, tenant: tenant_id) == previous_value + 1
  end

  test "does not count warnings in the error metric" do
    tenant_id = random_string()
    socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}
    error = "TestWarning"

    Logging.maybe_log_warning(socket, error, "test warning")
    assert metric_value("realtime_channel_error", code: error, tenant: tenant_id) == nil
  end

  defp metric_value(metric, expected_tags) do
    MetricsHelper.search(PromEx.get_metrics(MetricsTest), metric, expected_tags)
  end
end
