defmodule SupavisorWeb.OpenApiTest do
  use SupavisorWeb.ConnCase, async: true

  test "GET /swaggerui", %{conn: conn} do
    conn = get(conn, "/swaggerui")
    assert response(conn, 200)
    assert conn.resp_body =~ "SwaggerUI"
  end

  test "GET /api/openapi", %{conn: conn} do
    conn = get(conn, "/api/openapi")
    assert response(conn, 200)
    # Check that it's a valid JSON response containing the openapi version
    assert %{"openapi" => _} = Jason.decode!(conn.resp_body)
  end
end
