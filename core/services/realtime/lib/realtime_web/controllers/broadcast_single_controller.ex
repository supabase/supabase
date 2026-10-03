defmodule RealtimeWeb.BroadcastSingleController do
  @moduledoc """
  Controller for single broadcast API endpoint.

  This API sends a single broadcast message using URL path parameters for topic and event.
  Supports both JSON and binary payloads via Content-Type header.
  """
  use RealtimeWeb, :controller
  use OpenApiSpex.ControllerSpecs

  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.SingleBroadcast
  alias RealtimeWeb.OpenApiSchemas.EmptyResponse
  alias RealtimeWeb.OpenApiSchemas.BroadcastSingleJsonParams
  alias RealtimeWeb.OpenApiSchemas.BroadcastSingleBinaryParams
  alias RealtimeWeb.OpenApiSchemas.TooManyRequestsResponse
  alias RealtimeWeb.OpenApiSchemas.UnprocessableEntityResponse

  action_fallback(RealtimeWeb.FallbackController)

  operation(:broadcast,
    summary: "Broadcasts a single message",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      topic: [
        in: :path,
        name: "topic",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example: "room:123"
      ],
      event: [
        in: :path,
        name: "event",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example: "message",
        description: "Event name for the broadcast"
      ],
      private: [
        in: :query,
        name: "private",
        schema: %OpenApiSpex.Schema{type: :boolean},
        required: false,
        example: false,
        description: "Whether this is a private broadcast (requires RLS authorization). Defaults to false."
      ]
      # TODO: uncomment when broadcast persistence is public and ready
      # persist: [
      #   in: :query,
      #   name: "persist",
      #   schema: %OpenApiSpex.Schema{type: :boolean},
      #   required: false,
      #   example: false,
      #   description:
      #     "Whether to store the broadcast in realtime.messages (requires private and RLS authorization).
      # Defaults to false."
      # ]
    ],
    request_body: %OpenApiSpex.RequestBody{
      description: "Broadcast message payload. Supports both JSON and binary formats.",
      required: true,
      content: %{
        "application/json" => %OpenApiSpex.MediaType{
          schema: BroadcastSingleJsonParams,
          example: %{"text" => "hello world", "user" => "alice"}
        },
        "application/octet-stream" => %OpenApiSpex.MediaType{
          schema: BroadcastSingleBinaryParams
        }
      }
    },
    responses: %{
      202 => EmptyResponse.response(),
      401 => EmptyResponse.response(),
      415 => EmptyResponse.response(),
      422 => UnprocessableEntityResponse.response(),
      429 => TooManyRequestsResponse.response()
    }
  )

  def broadcast(
        %{assigns: %{tenant: tenant}, body_params: %{"_binary" => binary}} = conn,
        %{"topic" => topic, "event" => event} = params
      ) do
    private = parse_boolean(params["private"])
    persist = parse_boolean(params["persist"])
    auth_params = build_auth_params(conn, tenant)

    with :ok <-
           SingleBroadcast.broadcast(auth_params, tenant, topic, event, binary, :binary,
             private: private,
             persist: persist
           ) do
      send_resp(conn, :accepted, "")
    end
  end

  def broadcast(%{assigns: %{tenant: tenant}} = conn, %{"topic" => topic, "event" => event} = params) do
    private = parse_boolean(params["private"])
    persist = parse_boolean(params["persist"])
    payload = conn.body_params
    auth_params = build_auth_params(conn, tenant)

    with :ok <-
           SingleBroadcast.broadcast(auth_params, tenant, topic, event, payload, :json,
             private: private,
             persist: persist
           ) do
      send_resp(conn, :accepted, "")
    end
  end

  defp build_auth_params(conn, tenant) do
    Authorization.build_authorization_params(%{
      tenant_id: tenant.external_id,
      headers: conn.req_headers,
      claims: conn.assigns.claims,
      role: conn.assigns.role,
      sub: conn.assigns.sub
    })
  end

  defp parse_boolean("true"), do: true
  defp parse_boolean(true), do: true
  defp parse_boolean(_), do: false
end
