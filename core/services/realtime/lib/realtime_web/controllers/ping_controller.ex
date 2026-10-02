defmodule RealtimeWeb.PingController do
  use RealtimeWeb, :controller

  def ping(conn, _params) do
    json(conn, %{message: "Success"})
  end
end
