defmodule RealtimeWeb.Plugs.BaggageRequestId do
  @moduledoc """
  Populates request ID based on trace baggage.
  It looks for the specified `baggage_key` (default to 'request-id').

  Otherwise generates a request ID using `Plug.RequestId`
  """

  def baggage_key, do: Application.get_env(:realtime, :request_id_baggage_key, "request-id")

  alias Plug.Conn
  @behaviour Plug

  @impl true
  @doc false
  def init(opts) do
    Keyword.get(opts, :baggage_key, "request-id")
  end

  @impl true
  @doc false
  @spec call(Conn.t(), String.t()) :: Conn.t()
  def call(conn, baggage_key) do
    :otel_propagator_text_map.extract(conn.req_headers)

    with %{^baggage_key => {request_id, _}} <- :otel_baggage.get_all(),
         true <- valid_request_id?(request_id) do
      Logger.metadata(request_id: request_id)
      Conn.put_resp_header(conn, "x-request-id", request_id)
    else
      _ ->
        opts = Plug.RequestId.init([])
        Plug.RequestId.call(conn, opts)
    end
  end

  # Request IDs are opaque ASCII tokens (UUIDs, hex, base64url, ...), so we
  # accept only printable ASCII.
  defp valid_request_id?(s) when byte_size(s) in 10..200, do: printable_ascii?(s)
  defp valid_request_id?(_), do: false

  defp printable_ascii?(<<>>), do: true

  # 0x20..0x7E is the printable ASCII range: 0x20 (32) is space, the first
  # printable char, and 0x7E (126) is "~", the last. This excludes C0 controls
  # (< 0x20, e.g. newline/tab/ESC), DEL (0x7F), and every byte >= 0x80 (all
  # multibyte UTF-8 and malformed bytes).
  defp printable_ascii?(<<b, rest::binary>>) when b in 0x20..0x7E, do: printable_ascii?(rest)
  defp printable_ascii?(_), do: false
end
