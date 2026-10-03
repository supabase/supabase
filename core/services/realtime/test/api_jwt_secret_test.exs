defmodule RealtimeWeb.ApiJwtSecretTest do
  use RealtimeWeb.ConnCase, async: false

  test "no api key", %{conn: conn} do
    previous = Application.get_env(:realtime, :api_jwt_secret)
    Application.put_env(:realtime, :api_jwt_secret, nil)
    on_exit(fn -> Application.put_env(:realtime, :api_jwt_secret, previous) end)

    conn = get(conn, Routes.tenant_path(conn, :index))
    assert conn.status == 403
  end

  test "api key is right", %{conn: conn} do
    api_jwt_secret = Application.get_env(:realtime, :api_jwt_secret)
    jwt = generate_jwt_token(api_jwt_secret)
    conn = Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> jwt)
    conn = get(conn, Routes.tenant_path(conn, :index))
    assert conn.status == 200
  end

  describe "secret rotation" do
    setup do
      previous = Application.get_env(:realtime, :api_jwt_secret)
      Application.put_env(:realtime, :api_jwt_secret, ["current_secret", "next_secret"])
      on_exit(fn -> Application.put_env(:realtime, :api_jwt_secret, previous) end)
      :ok
    end

    test "api key signed with current secret", %{conn: conn} do
      jwt = generate_jwt_token("current_secret")
      conn = Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> jwt)
      conn = get(conn, Routes.tenant_path(conn, :index))
      assert conn.status == 200
    end

    test "api key signed with next secret", %{conn: conn} do
      jwt = generate_jwt_token("next_secret")
      conn = Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> jwt)
      conn = get(conn, Routes.tenant_path(conn, :index))
      assert conn.status == 200
    end

    test "api key signed with unknown secret", %{conn: conn} do
      jwt = generate_jwt_token("unknown_secret")
      conn = Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> jwt)
      conn = get(conn, Routes.tenant_path(conn, :index))
      assert conn.status == 403
    end

    test "no secrets configured", %{conn: conn} do
      Application.put_env(:realtime, :api_jwt_secret, [])
      jwt = generate_jwt_token("current_secret")
      conn = Plug.Conn.put_req_header(conn, "authorization", "Bearer " <> jwt)
      conn = get(conn, Routes.tenant_path(conn, :index))
      assert conn.status == 403
    end
  end
end
