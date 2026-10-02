defmodule RealtimeWeb.Plugs.Parsers.OctetStream do
  @moduledoc """
  `Plug.Parsers` implementation for `application/octet-stream` request bodies.

  The raw binary body is placed in `conn.body_params` under the `"_binary"`
  key, mirroring how `Plug.Parsers.JSON` exposes non-map top-level JSON via
  `"_json"`.

  Supports the same options as `Plug.Conn.read_body/2`: `:length`,
  `:read_length`, `:read_timeout`, and `:body_reader`. Defaults inherit from
  `Plug.Conn.read_body/2` (8 MB max length).
  """

  @behaviour Plug.Parsers

  @impl true
  def init(opts) do
    Keyword.pop(opts, :body_reader, {Plug.Conn, :read_body, []})
  end

  @impl true
  def parse(conn, "application", "octet-stream", _headers, {{mod, fun, args}, opts}) do
    case apply(mod, fun, [conn, opts | args]) do
      {:ok, body, conn} ->
        {:ok, %{"_binary" => body}, conn}

      {:more, _data, conn} ->
        {:error, :too_large, conn}

      {:error, :timeout} ->
        raise Plug.TimeoutError

      {:error, _} ->
        raise Plug.BadRequestError
    end
  end

  def parse(conn, _type, _subtype, _headers, _opts) do
    {:next, conn}
  end
end
