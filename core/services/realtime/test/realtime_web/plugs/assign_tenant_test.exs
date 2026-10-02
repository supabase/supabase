defmodule RealtimeWeb.Plugs.AssignTenantTest do
  # Use of global otel_simple_processor
  use RealtimeWeb.ConnCase, async: false

  require OpenTelemetry.Tracer, as: Tracer

  alias Realtime.Api

  @tenant %{
    "external_id" => "external_id",
    "name" => "external_id",
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

  test "serve a 401 unauthorized when we can't find a tenant", %{conn: conn} do
    conn =
      conn
      |> Map.put(:host, "not-found-tenant.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 401
  end

  @tag :failing
  test "serve a 401 unauthorized when we have a bad request", %{conn: conn} do
    conn =
      conn
      |> Map.put(:host, "localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 401
  end

  test "assigns a tenant", %{conn: conn} do
    tenant_fixture(%{external_id: "localhost"})

    conn =
      conn
      |> Map.put(:host, "localhost.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 200
  end

  test "assigns a tenant even with lots of subdomains", %{conn: conn} do
    tenant_fixture(%{external_id: "localhost"})

    conn =
      conn
      |> Map.put(:host, "localhost.realtime.localhost.com")
      |> get(Routes.ping_path(conn, :ping))

    assert conn.status == 200
  end

  test "sets appropriate observability metadata", %{conn: conn} do
    external_id = "localhost"
    tenant_fixture(%{external_id: external_id})

    :otel_simple_processor.set_exporter(:otel_exporter_pid, self())

    # opentelemetry_phoenix expects to be a child of the originating cowboy process hence the Task here :shrug:
    Tracer.with_span "test" do
      Task.async(fn ->
        conn
        |> Map.put(:host, "localhost.localhost.com")
        |> get(Routes.ping_path(conn, :ping))

        assert Logger.metadata()[:external_id] == external_id
        assert Logger.metadata()[:project] == external_id
      end)
      |> Task.await()
    end

    assert_receive {:span, span(name: "GET /api/ping", attributes: attributes)}

    assert attributes(map: %{external_id: ^external_id}) = attributes
  end
end
