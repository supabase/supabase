defmodule Realtime.PromEx.Plugins.PhoenixTest do
  use Realtime.DataCase, async: true
  alias Realtime.PromEx.Plugins
  alias Realtime.Integration.WebsocketClient

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_phoenix
    @impl true
    def plugins do
      [{Plugins.Phoenix, router: RealtimeWeb.Router, poll_rate: 100, metric_prefix: [:phoenix]}]
    end
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  setup do
    %{tenant: TestTenantDb.checkout_tenant_unboxed(run_migrations: true)}
  end

  describe "pooling metrics" do
    test "number of connections", %{tenant: tenant} do
      {:ok, token} = token_valid(tenant, "anon", %{})

      {:ok, _} =
        WebsocketClient.connect(
          self(),
          uri(tenant, Phoenix.Socket.V1.JSONSerializer),
          Phoenix.Socket.V1.JSONSerializer,
          [{"x-api-key", token}]
        )

      {:ok, _} =
        WebsocketClient.connect(
          self(),
          uri(tenant, Phoenix.Socket.V1.JSONSerializer),
          Phoenix.Socket.V1.JSONSerializer,
          [{"x-api-key", token}]
        )

      assert_eventually metric_value("phoenix_connections_total") >= 2
    end
  end

  describe "event metrics" do
    test "socket connected", %{tenant: tenant} do
      {:ok, token} = token_valid(tenant, "anon", %{})

      {:ok, _} =
        WebsocketClient.connect(
          self(),
          uri(tenant, Phoenix.Socket.V1.JSONSerializer),
          Phoenix.Socket.V1.JSONSerializer,
          [{"x-api-key", token}]
        )

      {:ok, _} =
        WebsocketClient.connect(
          self(),
          uri(tenant, RealtimeWeb.Socket.V2Serializer),
          RealtimeWeb.Socket.V2Serializer,
          [{"x-api-key", token}]
        )

      assert_eventually(
        metric_value("phoenix_socket_connected_duration_milliseconds_count",
          endpoint: "RealtimeWeb.Endpoint",
          result: "ok",
          serializer: "Elixir.Phoenix.Socket.V1.JSONSerializer",
          transport: "websocket"
        ) >= 1
      )

      assert metric_value("phoenix_socket_connected_duration_milliseconds_count",
               endpoint: "RealtimeWeb.Endpoint",
               result: "ok",
               serializer: "Elixir.RealtimeWeb.Socket.V2Serializer",
               transport: "websocket"
             ) >= 1
    end
  end

  defp metric_value(metric, expected_tags \\ nil) do
    MetricsHelper.search(PromEx.get_metrics(MetricsTest), metric, expected_tags)
  end
end
