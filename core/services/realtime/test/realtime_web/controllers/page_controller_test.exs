defmodule RealtimeWeb.PageControllerTest do
  use RealtimeWeb.ConnCase, async: false

  import ExUnit.CaptureLog

  test "GET / renders the console page", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "Inspector - Supabase Realtime"
  end

  test "GET /inspector redirects to / preserving query params", %{conn: conn} do
    conn = get(conn, "/inspector?channel=room_a")
    assert redirected_to(conn) == "/?channel=room_a"
  end

  test "GET /inspector/new redirects to /", %{conn: conn} do
    conn = get(conn, "/inspector/new")
    assert redirected_to(conn) == "/"
  end

  test "GET /healthcheck returns ok status", %{conn: conn} do
    conn = get(conn, "/healthcheck")
    assert text_response(conn, 200) == "ok"
  end

  describe "GET /healthcheck logging behavior" do
    setup do
      original_value = Application.get_env(:realtime, :disable_healthcheck_logging, false)
      on_exit(fn -> Application.put_env(:realtime, :disable_healthcheck_logging, original_value) end)
      :ok
    end

    test "logs request when DISABLE_HEALTHCHECK_LOGGING is false", %{conn: conn} do
      Application.put_env(:realtime, :disable_healthcheck_logging, false)

      log =
        capture_log(fn ->
          conn = get(conn, "/healthcheck")
          assert text_response(conn, 200) == "ok"
        end)

      assert log =~ "GET /healthcheck"
    end

    test "does not log request when DISABLE_HEALTHCHECK_LOGGING is true", %{conn: conn} do
      Application.put_env(:realtime, :disable_healthcheck_logging, true)

      log =
        capture_log(fn ->
          conn = get(conn, "/healthcheck")
          assert text_response(conn, 200) == "ok"
        end)

      refute log =~ "GET /healthcheck"
    end

    test "logs request when DISABLE_HEALTHCHECK_LOGGING is not set (default)", %{conn: conn} do
      Application.delete_env(:realtime, :disable_healthcheck_logging)

      log =
        capture_log(fn ->
          conn = get(conn, "/healthcheck")
          assert text_response(conn, 200) == "ok"
        end)

      assert log =~ "GET /healthcheck"
    end
  end
end
