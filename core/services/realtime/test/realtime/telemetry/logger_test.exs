defmodule Realtime.Telemetry.LoggerTest do
  use ExUnit.Case
  import ExUnit.CaptureLog
  alias Realtime.Telemetry.Logger, as: TelemetryLogger

  setup do
    level = Logger.level()
    Logger.configure(level: :info)
    on_exit(fn -> Logger.configure(level: level) end)
  end

  describe "logger backend initialization" do
    test "logs on telemetry event" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      assert capture_log(fn ->
               :telemetry.execute([:realtime, :connections], %{count: 1}, %{tenant: "tenant"})
             end) =~ "Billing metrics: [:realtime, :connections]"
    end

    test "ignores events without tenant" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      refute capture_log(fn ->
               :telemetry.execute([:realtime, :connections], %{count: 1}, %{})
             end) =~ "Billing metrics: [:realtime, :connections]"
    end
  end

  describe "phoenix error_rendered events" do
    test "logs 5xx responses at error level with the exception cause" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      log =
        capture_log(fn ->
          :telemetry.execute([:phoenix, :error_rendered], %{duration: 1}, %{
            status: 500,
            kind: :error,
            reason: %RuntimeError{message: "boom"},
            stacktrace: []
          })
        end)

      assert log =~ "error_code=HttpServerError [error] HttpServerError: Sent 500 response: RuntimeError - boom"
    end

    test "logs 4xx responses at warning level" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      log =
        capture_log(fn ->
          :telemetry.execute([:phoenix, :error_rendered], %{duration: 1}, %{
            status: 404,
            kind: :error,
            reason: %Phoenix.Router.NoRouteError{message: "no route found"},
            stacktrace: []
          })
        end)

      assert log =~ "[warning]"
      assert log =~ "HttpClientError"
      assert log =~ "Sent 404 response: Phoenix.Router.NoRouteError - no route found"
    end

    test "accepts atom statuses" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      log =
        capture_log(fn ->
          :telemetry.execute([:phoenix, :error_rendered], %{duration: 1}, %{
            status: :internal_server_error,
            kind: :exit,
            reason: :timeout,
            stacktrace: []
          })
        end)

      assert log =~ "[error]"
      assert log =~ "HttpServerError"
      assert log =~ "Sent 500 response: exit - :timeout"
    end
  end

  describe "handle_info/2" do
    test "ignores unexpected messages" do
      assert {:noreply, []} = TelemetryLogger.handle_info(:unexpected, [])
    end
  end

  describe "phoenix endpoint stop events" do
    test "logs the request method and path alongside the response" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      conn = %Plug.Conn{method: "GET", request_path: "/api/tenants/abc/health", status: 401, state: :sent}

      log =
        capture_log(fn ->
          :telemetry.execute([:phoenix, :endpoint, :stop], %{duration: 1}, %{conn: conn, options: []})
        end)

      assert log =~ "GET /api/tenants/abc/health - Sent 401 in "
      refute log =~ ~r/^Sent /
    end

    test "does not log when the endpoint's configured log level is false" do
      start_link_supervised!({TelemetryLogger, handler_id: "telemetry-logger-test"})

      conn = %Plug.Conn{method: "GET", request_path: "/healthcheck", status: 200, state: :sent}

      log =
        capture_log(fn ->
          :telemetry.execute([:phoenix, :endpoint, :stop], %{duration: 1}, %{conn: conn, options: [log: false]})
        end)

      assert log == ""
    end
  end
end
