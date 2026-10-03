defmodule SupavisorWeb.PoolControllerTest do
  use SupavisorWeb.ConnCase, async: false

  describe "POST /api/rebalance" do
    setup %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", "Bearer " <> gen_token())
        |> put_req_header("content-type", "application/json")

      {:ok, conn: conn}
    end

    test "moves no pools when the cluster has a single node", %{conn: conn} do
      assert %{moves: [], errors: %{}} =
               conn
               |> post(~p"/api/rebalance", "{}")
               |> json_response(200)
               |> assert_schema("Rebalance")
    end

    test "returns 422 when max_concurrency is not positive", %{conn: conn} do
      assert %{"errors" => [%{"source" => %{"pointer" => "/max_concurrency"}}]} =
               conn
               |> post(~p"/api/rebalance", Jason.encode!(%{max_concurrency: 0}))
               |> json_response(422)
    end

    test "returns 422 when dry_run is not a boolean", %{conn: conn} do
      assert %{"errors" => [%{"source" => %{"pointer" => "/dry_run"}}]} =
               conn
               |> post(~p"/api/rebalance", Jason.encode!(%{dry_run: "yes"}))
               |> json_response(422)
    end
  end

  defp gen_token do
    Supavisor.Jwt.Token.gen!(Application.fetch_env!(:supavisor, :api_jwt_secret))
  end
end
