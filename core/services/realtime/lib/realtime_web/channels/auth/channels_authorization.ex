defmodule RealtimeWeb.ChannelsAuthorization do
  @moduledoc """
  Check connection is authorized to access channel
  """

  @doc """
  Authorize connection to access channel
  """
  @spec authorize(binary(), binary() | nil, binary() | nil) ::
          {:ok, map()} | {:error, any()} | {:error, :expired_token, String.t()}
  def authorize(token, jwt_secret, jwt_jwks) when is_binary(token) do
    token
    |> clean_token()
    |> RealtimeWeb.JwtVerification.verify(jwt_secret, jwt_jwks)
  end

  def authorize(_token, _jwt_secret, _jwt_jwks), do: {:error, :invalid_token}

  def authorize_conn(token, jwt_secret, jwt_jwks) do
    case authorize(token, jwt_secret, jwt_jwks) do
      {:ok, claims} ->
        required = ["role", "exp"]
        claims_keys = Map.keys(claims)

        if Enum.all?(required, &(&1 in claims_keys)),
          do: {:ok, claims},
          else: {:error, :missing_claims}

      {:error, [message: validation_timer, claim: "exp", claim_val: claim_val]}
      when is_integer(validation_timer) and is_integer(claim_val) ->
        msg = "Token has expired #{validation_timer - claim_val} seconds ago"
        {:error, :expired_token, msg}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp clean_token(token), do: Regex.replace(~r/\s|\n/, URI.decode(token), "")
end
