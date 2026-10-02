defmodule Realtime.Integration.TracingTest do
  # Async due to usage of global otel_simple_processor
  use RealtimeWeb.ConnCase, async: false

  @parent_id "b7ad6b7169203331"
  @traceparent "00-0af7651916cd43dd8448eb211c80319c-#{@parent_id}-01"
  @span_parent_id Integer.parse(@parent_id, 16) |> elem(0)

  # This is doing a blackbox approach because tracing is not captured with normal Phoenix controller tests
  # We need cowboy, endpoint and router to trigger their telemetry events

  test "traces basic HTTP request with phoenix and cowboy information" do
    :otel_simple_processor.set_exporter(:otel_exporter_pid, self())
    url = RealtimeWeb.Endpoint.url() <> "/healthcheck"

    baggage_request_id = UUID.uuid4()

    response =
      Req.get!(url, headers: [{"traceparent", @traceparent}, {"baggage", "sb-request-id=#{baggage_request_id}"}])

    assert_receive {:span, span(name: "GET /healthcheck", attributes: attributes, parent_span_id: @span_parent_id)}

    assert attributes(
             map: %{
               "http.request.method": :GET,
               "http.response.status_code": 200,
               "http.route": "/healthcheck",
               "phoenix.action": :healthcheck,
               "phoenix.plug": RealtimeWeb.PageController,
               "url.path": "/healthcheck",
               "url.scheme": :http
             }
           ) = attributes

    assert %{"x-request-id" => [^baggage_request_id]} = response.headers
  end
end
