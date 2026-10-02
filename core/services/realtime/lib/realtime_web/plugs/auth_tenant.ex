defmodule RealtimeWeb.AuthTenant do
  @moduledoc """
  Authorization plug to ensure that only authorized clients can connect to the their tenant's endpoints.
  """
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias Realtime.Api.Tenant

  alias RealtimeWeb.ChannelsAuthorization

  require Logger

  def init(opts), do: opts

  def call(%{assigns: %{tenant: tenant}} = conn, _opts) do
    Logger.metadata(external_id: tenant.external_id, project: tenant.external_id)

    with %Tenant{jwt_secret: jwt_secret, jwt_jwks: jwt_jwks} <- tenant,
         token when is_binary(token) <- access_token(conn),
         jwt_secret_dec <- Tenant.decrypt_jwt_secret(jwt_secret),
         {:ok, claims} <- ChannelsAuthorization.authorize_conn(token, jwt_secret_dec, jwt_jwks) do
      conn
      |> assign(:claims, claims)
      |> assign(:jwt, token)
      |> assign(:role, claims["role"])
      |> assign(:sub, claims["sub"])
    else
      {:error, {:error_generating_signer, kid}} ->
        Logger.error(
          "JwtSignerError: Failed to generate JWT signer for key ID (kid) #{inspect(kid)}, check your JWT secret or JWKS configuration"
        )

        unauthorized(conn)

      _error ->
        unauthorized(conn)
    end
  end

  def call(conn, _opts), do: unauthorized(conn)

  defp access_token(conn) do
    authorization = get_req_header(conn, "authorization")
    apikey = get_req_header(conn, "apikey")

    authorization =
      case authorization do
        [] ->
          nil

        [""] ->
          nil

        [value | _] ->
          case String.split(value, " ", parts: 2) do
            [bearer, token] -> if String.downcase(bearer) == "bearer", do: token
            _ -> nil
          end
      end

    apikey =
      case apikey do
        [] -> nil
        [value | _] -> value
      end

    cond do
      authorization -> authorization
      apikey -> apikey
      true -> nil
    end
  end

  defp unauthorized(conn),
    do: conn |> put_status(401) |> json(%{message: "Unauthorized"}) |> halt()
end
