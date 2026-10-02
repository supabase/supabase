defmodule RealtimeWeb.Plugs.RateLimiterTest do
  use RealtimeWeb.ConnCase

  alias Realtime.Api

  @tenant %{
    "external_id" => "localhost",
    "name" => "localhost",
    "max_events_per_second" => 0,
    "extensions" => [
      %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "db_port" => "6432",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1"
        }
      }
    ],
    "postgres_cdc_default" => "postgres_cdc_rls",
    "jwt_secret" => "new secret"
  }

  setup %{conn: conn} do
    conn =
      conn
      |> put_req_header("accept", "application/json")

    {:ok, _tenant} = Api.create_tenant(@tenant)

    {:ok, conn: conn}
  end

  test "serve a 429 when rate limit is set to 0", %{conn: conn} do
    conn =
      conn
      |> Map.put(:host, "localhost.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 429
  end

  test "serve a 200 when rate limit is set to 100", %{conn: conn} do
    {:ok, _tenant} = Api.update_tenant_by_external_id(@tenant["external_id"], %{"max_events_per_second" => 100})

    conn =
      conn
      |> Map.put(:host, "localhost.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 200
  end

  test "passes through when tenant is not in assigns", %{conn: conn} do
    alias RealtimeWeb.Plugs.RateLimiter

    result = RateLimiter.call(conn, [])

    refute result.halted
  end

  test "sets rate limit headers on 429 response", %{conn: conn} do
    conn =
      conn
      |> Map.put(:host, "localhost.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 429
    assert get_resp_header(conn, "x-rate-limit") == ["0"]
    assert get_resp_header(conn, "x-rate-rolling") != []
  end
end
