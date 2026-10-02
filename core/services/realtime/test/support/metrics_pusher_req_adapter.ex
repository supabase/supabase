defmodule Realtime.MetricsPusherReqAdapter do
  @moduledoc """
  Req adapter that dispatches `Realtime.MetricsPusher` requests to its `Req.Test` stub
  without touching the request body.

  Since Req 0.6, the built-in `:plug` adapter (now `Req.Plug`) transparently gunzips any
  request body sent with a `content-encoding` header and drops that header before building
  the `Plug.Conn` handed to the plug/stub. That makes it impossible for a stub to assert
  that a request was actually compressed on the wire, which is exactly what the
  MetricsPusher tests need. This adapter mirrors what the old `run_plug/1` step did before
  that change: build the `Plug.Conn` straight from the raw request body/headers and
  dispatch to the `Req.Test` stub.

  Wired up as a module rather than a function because Req 0.7 deprecated function adapters.
  """

  @stub Realtime.MetricsPusher

  @spec run(Req.Request.t()) :: {Req.Request.t(), Req.Response.t()}
  def run(request) do
    body = IO.iodata_to_binary(request.body || "")
    headers = for {header, values} <- request.headers, value <- values, do: {header, value}

    conn =
      %Plug.Conn{}
      |> Req.Plug.Adapter.conn(request.method, request.url, body)
      |> Map.replace!(:req_headers, headers)
      |> Req.Test.call(Req.Test.init(@stub))

    response = Req.Response.new(status: conn.status, headers: conn.resp_headers, body: conn.resp_body)

    {request, response}
  end
end
