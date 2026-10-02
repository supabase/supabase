defmodule SupavisorWeb.PoolController do
  use SupavisorWeb, :controller
  use OpenApiSpex.ControllerSpecs

  require Logger

  alias SupavisorWeb.OpenApiSchemas.{Rebalance, RebalanceParams, UnprocessablyEntity}

  plug OpenApiSpex.Plug.CastAndValidate, json_render_error_v2: true, replace_params: false
  plug :put_view, SupavisorWeb.PoolJSON

  @authorization [
    in: :header,
    name: :authorization,
    schema: %OpenApiSpex.Schema{type: :string},
    required: true,
    example:
      "Bearer TEST_JWT_REDACTED"
  ]

  operation(:rebalance,
    summary: "Rebalance pools across the cluster",
    description: """
    Moves every pool to the node it would be started on now.

    Pools stay on the node they started on, so pools started while only part of the
    cluster was up are concentrated on the first nodes. The clients of a moved pool
    are disconnected, and start the pool on its new node when they reconnect.

    Pools are stopped in the background. The response lists the pools being moved.
    """,
    parameters: [authorization: @authorization],
    request_body: RebalanceParams.params(),
    responses: %{
      200 => Rebalance.response(),
      422 => UnprocessablyEntity.response()
    }
  )

  def rebalance(conn, _params) do
    opts =
      for {key, value} <-
            Map.take(conn.private.open_api_spex.body_params, [:dry_run, :max_concurrency]),
          value != nil,
          do: {key, value}

    Logger.warning("Rebalancing pools: #{inspect(opts)}")

    render(conn, :rebalance, result: Supavisor.rebalance(opts))
  end
end
