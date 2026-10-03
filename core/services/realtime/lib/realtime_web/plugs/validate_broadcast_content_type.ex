defmodule RealtimeWeb.Plugs.ValidateBroadcastContentType do
  @moduledoc """
  Validates the request `Content-Type` for the broadcast-single endpoint.

  Allowed: `application/json` and `application/octet-stream` (optionally with
  parameters such as `; charset=utf-8`). A missing header is also allowed for
  backward compatibility with callers that historically POSTed JSON without
  setting the header.

  Any other media type is rejected with a 415 response carrying a JSON body.
  """
  import Plug.Conn

  @allowed ["json", "octet-stream"]

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "content-type") do
      [] ->
        conn

      [content_type | _] ->
        case Plug.Conn.Utils.content_type(content_type) do
          {:ok, "application", subtype, _params} when subtype in @allowed ->
            conn

          _ ->
            conn
            |> put_resp_content_type("application/json")
            |> send_resp(
              415,
              Jason.encode!(%{
                error: "Unsupported Media Type. Use application/json or application/octet-stream"
              })
            )
            |> halt()
        end
    end
  end
end
