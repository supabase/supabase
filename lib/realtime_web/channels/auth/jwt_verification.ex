defmodule RealtimeWeb.JwtVerification do
  @moduledoc """
  Parse JWT and verify claims
  """

  # Matching error in Dialyzer when using Joken.peek_claims/1 but {:ok, []} is actually possible and covered by our
  # testing
  @dialyzer {:no_match, check_claims_format: 1}

  defmodule JwtAuthToken do
    @moduledoc false
    use Joken.Config

    @impl true
    def token_config do
      Application.fetch_env!(:realtime, :jwt_claim_validators)
      |> Enum.reduce(%{}, fn {claim_key, expected_val}, claims ->
        add_claim_validator(claims, claim_key, expected_val)
      end)
      |> add_claim_validator("exp")
      |> add_claim_validator("iat")
    end

    defp add_claim_validator(claims, "exp") do
      current_time = current_time()
      add_claim(claims, "exp", nil, &(is_number(&1) and &1 > current_time), message: current_time)
    end

    defp add_claim_validator(claims, "iat") do
      add_claim(claims, "iat", nil, &is_number/1)
    end

    defp add_claim_validator(claims, claim_key, expected_val) do
      add_claim(claims, claim_key, nil, &(&1 == expected_val))
    end
  end

  @hs_algorithms ["HS256", "HS384", "HS512"]
  @rs_algorithms ["RS256", "RS384", "RS512"]
  @es_algorithms ["ES256", "ES384", "ES512"]
  # RFC 8037 always sets alg to EdDSA and carries the curve in the JWK, while
  # JOSE (and Joken) also name the signer after the curve itself. Tokens minted
  # by RFC-conformant libraries arrive with the former spelling.
  @ed_algorithms ["Ed25519", "Ed448", "EdDSA"]
  @ed_curves ["Ed25519", "Ed448"]

  @doc """
  Verify JWT token and validate claims
  """
  @spec verify(binary(), binary() | nil, binary() | nil) ::
          {:ok, map()}
          | {:error, Joken.error_reason()}
          | {:error, {:error_generating_signer, binary()}}
          | {:error, :error_generating_signer}
  def verify(token, jwt_secret, jwt_jwks) when is_binary(token) do
    with {:ok, _claims} <- check_claims_format(token),
         {:ok, header} <- check_header_format(token),
         {:ok, signer} <- generate_signer(header, jwt_secret, jwt_jwks),
         {:ok, claims} <- JwtAuthToken.verify_and_validate(token, signer) do
      # JWT spec allows exp and iat to be a decimal number. This is uncommon
      # though, so most implementation round them to integer to avoid unexpected
      # type errors. So, we round it before returning.
      {:ok, round_decimal_numbers(claims)}
    else
      {:error, _e} = error -> error
    end
  end

  def verify(_token, _jwt_secret, _jwt_jwks), do: {:error, :not_a_string}

  defp check_claims_format(token) do
    case Joken.peek_claims(token) do
      {:ok, claims} when is_map(claims) -> {:ok, claims}
      {:ok, _} -> {:error, :expected_claims_map}
      {:error, :token_malformed} -> {:error, :token_malformed}
    end
  end

  defp check_header_format(token) do
    case Joken.peek_header(token) do
      {:ok, header} when is_map(header) -> {:ok, header}
      _error -> {:error, :expected_header_map}
    end
  end

  defp round_decimal_numbers(claims) do
    claims
    |> round_claim("exp")
    |> round_claim("iat")
  end

  defp round_claim(claims, key) do
    case Map.get(claims, key) do
      value when is_number(value) -> Map.put(claims, key, round(value))
      _ -> claims
    end
  end

  defp generate_signer(%{"alg" => alg, "kid" => kid}, _jwt_secret, %{
         "keys" => keys
       })
       when is_binary(kid) and alg in @rs_algorithms do
    jwk = Enum.find(keys, fn jwk -> jwk["kty"] == "RSA" and jwk["kid"] == kid end)

    case jwk do
      nil -> {:error, {:error_generating_signer, kid}}
      _ -> {:ok, Joken.Signer.create(alg, jwk)}
    end
  end

  defp generate_signer(%{"alg" => alg, "kid" => kid}, _jwt_secret, %{"keys" => keys})
       when is_binary(kid) and alg in @es_algorithms do
    jwk = Enum.find(keys, fn jwk -> jwk["kty"] == "EC" and jwk["kid"] == kid end)

    case jwk do
      nil -> {:error, {:error_generating_signer, kid}}
      _ -> {:ok, Joken.Signer.create(alg, jwk)}
    end
  end

  defp generate_signer(%{"alg" => alg, "kid" => kid}, _jwt_secret, %{"keys" => keys})
       when is_binary(kid) and alg in @ed_algorithms do
    jwk = Enum.find(keys, fn jwk -> jwk["kty"] == "OKP" and jwk["kid"] == kid end)

    case jwk do
      # Joken raises for OKP curves it cannot sign with, such as X25519.
      %{"crv" => crv} when crv in @ed_curves -> {:ok, Joken.Signer.create(alg, jwk)}
      _ -> {:error, {:error_generating_signer, kid}}
    end
  end

  # Most Supabase Auth JWTs fall in this case, as they're usually signed with
  # HS256, have a kid header, but there's no JWK as this is sensitive. In this
  # case, the jwt_secret should be used.
  defp generate_signer(%{"alg" => alg, "kid" => kid}, jwt_secret, %{
         "keys" => keys
       })
       when is_binary(kid) and alg in @hs_algorithms do
    jwk = Enum.find(keys, fn jwk -> jwk["kty"] == "oct" and jwk["kid"] == kid and is_binary(jwk["k"]) end)

    if jwk do
      case Base.url_decode64(jwk["k"], padding: false) do
        {:ok, secret} -> {:ok, Joken.Signer.create(alg, secret)}
        _ -> {:error, {:error_generating_signer, kid}}
      end
    else
      # If there's no JWK, and HS* is being used, instead of erroring, try
      # the jwt_secret instead.
      if jwt_secret,
        do: {:ok, Joken.Signer.create(alg, jwt_secret)},
        else: {:error, {:error_generating_signer, kid}}
    end
  end

  defp generate_signer(%{"alg" => alg}, nil, _jwt_jwks) when alg in @hs_algorithms do
    {:error, :error_generating_signer}
  end

  defp generate_signer(%{"alg" => alg}, jwt_secret, _jwt_jwks) when alg in @hs_algorithms do
    {:ok, Joken.Signer.create(alg, jwt_secret)}
  end

  defp generate_signer(_header, _jwt_secret, _jwt_jwks), do: {:error, :error_generating_signer}
end
