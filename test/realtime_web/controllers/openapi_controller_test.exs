defmodule RealtimeWeb.Controllers.OpenapiControllerTest do
  use RealtimeWeb.ConnCase, async: true

  describe "openapi" do
    test "returns the openapi spec", %{conn: conn} do
      conn = get(conn, ~p"/api/openapi")
      assert json_response(conn, 200)
    end
  end

  describe "swaggerui" do
    test "returns the swaggerui", %{conn: conn} do
      conn = get(conn, ~p"/swaggerui")
      assert html_response(conn, 200) =~ "Swagger UI"
    end
  end
end
