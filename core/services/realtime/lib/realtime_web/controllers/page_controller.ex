defmodule RealtimeWeb.PageController do
  use RealtimeWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end

  def redirect_to_root(conn, _params) do
    query = if conn.query_string == "", do: "", else: "?" <> conn.query_string
    redirect(conn, to: "/" <> query)
  end

  def healthcheck(conn, _params) do
    conn
    |> put_status(:ok)
    |> text("ok")
  end
end
