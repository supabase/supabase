defmodule RealtimeWeb.LiveDashboardTest do
  use RealtimeWeb.ConnCase
  import Generators
  import Mimic

  setup :set_mimic_from_context

  describe "live_dashboard with basic_auth" do
    setup do
      user = random_string()
      password = random_string()

      Application.put_env(:realtime, :dashboard_auth, :basic_auth)
      Application.put_env(:realtime, :dashboard_credentials, {user, password})

      on_exit(fn ->
        Application.delete_env(:realtime, :dashboard_auth)
        Application.delete_env(:realtime, :dashboard_credentials)
      end)

      %{user: user, password: password}
    end

    test "with credentials renders view", %{conn: conn, user: user, password: password} do
      path =
        conn
        |> using_basic_auth(user, password)
        |> get("/admin/dashboard")
        |> redirected_to(302)

      conn = conn |> recycle() |> using_basic_auth(user, password) |> get(path)

      assert html_response(conn, 200) =~ "Dashboard"
    end

    test "without credentials returns 401", %{conn: conn} do
      assert conn |> get("/admin/dashboard") |> response(401)
    end

    test "with wrong credentials returns 401", %{conn: conn} do
      assert conn |> using_basic_auth("wrong", "wrong") |> get("/admin/dashboard") |> response(401)
    end
  end

  describe "live_dashboard with zta" do
    setup do
      Application.put_env(:realtime, :dashboard_auth, :zta)

      on_exit(fn -> Application.delete_env(:realtime, :dashboard_auth) end)
    end

    test "with valid cf token renders view", %{conn: conn} do
      stub(NimbleZTA.Cloudflare, :authenticate, fn _name, conn -> {conn, %{email: "user@example.com"}} end)

      path = conn |> get("/admin/dashboard") |> redirected_to(302)
      conn = conn |> recycle() |> get(path)

      assert html_response(conn, 200) =~ "Dashboard"
    end

    test "without cf token returns 403", %{conn: conn} do
      stub(NimbleZTA.Cloudflare, :authenticate, fn _name, conn -> {conn, nil} end)

      assert conn |> get("/admin/dashboard") |> response(403)
    end

    test "when zta service is unavailable returns 503", %{conn: conn} do
      stub(NimbleZTA.Cloudflare, :authenticate, fn _name, _conn -> exit(:noproc) end)

      assert conn |> get("/admin/dashboard") |> response(503)
    end
  end

  defp using_basic_auth(conn, username, password) do
    header_content = "Basic " <> Base.encode64("#{username}:#{password}")
    put_req_header(conn, "authorization", header_content)
  end
end
