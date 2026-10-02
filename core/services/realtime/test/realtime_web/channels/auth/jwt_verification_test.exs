defmodule RealtimeWeb.JwtVerificationTest do
  # async: false due to mock usage and changing application env
  use Realtime.DataCase, async: false

  alias RealtimeWeb.JwtVerification
  alias RealtimeWeb.Joken.CurrentTime.Mock

  @jwt_secret "secret"
  @alg "HS256"

  setup_all do
    Application.put_env(:realtime, :jwt_secret, @jwt_secret)
    Application.put_env(:realtime, :jwt_claim_validators, %{})
    :ok
  end

  setup do
    start_supervised(Mock)

    # Route Joken's current_time/0 through the Mock so Mock.freeze/0 actually
    # controls the clock the code under test sees. Without this the mock is a
    # no-op and exp/iat assertions flake on second boundaries.
    previous_adapter = Application.get_env(:joken, :current_time_adapter)
    Application.put_env(:joken, :current_time_adapter, Mock)

    on_exit(fn ->
      Application.put_env(:realtime, :jwt_claim_validators, %{})

      if previous_adapter do
        Application.put_env(:joken, :current_time_adapter, previous_adapter)
      else
        Application.delete_env(:joken, :current_time_adapter)
      end
    end)

    :ok
  end

  describe "verify/3" do
    test "when token is not a string" do
      assert {:error, :not_a_string} = JwtVerification.verify([], @jwt_secret, nil)
    end

    test "when token is a badly formatted string fails" do
      invalid_token = "bad_token"

      assert {:error, :token_malformed} =
               JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token has invalid format fails" do
      invalid_token = Base.encode64("{}")

      assert {:error, :token_malformed} =
               JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token header is not a map" do
      invalid_token =
        Base.encode64("[]") <> "." <> Base.encode64("{}") <> "." <> Base.encode64("<<\"sig\">>")

      assert {:error, _reason} = JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token claims is not a map" do
      invalid_token =
        Base.encode64("{}") <> "." <> Base.encode64("[]") <> "." <> Base.encode64("<<\"sig\">>")

      assert {:error, _reason} = JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token header does not have kid or alg" do
      invalid_token =
        Base.encode64(~s[{"kid": "mykid123"}]) <>
          "." <> Base.encode64("{}") <> "." <> Base.encode64(~s[<<"sig">>])

      assert {:error, _reason} = JwtVerification.verify(invalid_token, @jwt_secret, nil)

      invalid_token =
        Base.encode64(~s[{"alg": "HS256"}]) <>
          "." <> Base.encode64("{}") <> "." <> Base.encode64(~s[<<"sig">>])

      assert {:error, _reason} = JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token header alg is not allowed" do
      invalid_token =
        Base.encode64(~s[{"alg": "ZZ999"}]) <>
          "." <> Base.encode64("{}") <> "." <> Base.encode64(~s[<<"sig">>])

      assert {:error, _reason} = JwtVerification.verify(invalid_token, @jwt_secret, nil)
    end

    test "when token is valid and alg is HS256" do
      signer = Joken.Signer.create("HS256", @jwt_secret)

      token = Joken.generate_and_sign!(%{}, %{}, signer)

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "when token is valid and alg is HS384" do
      signer = Joken.Signer.create("HS384", @jwt_secret)

      token = Joken.generate_and_sign!(%{}, %{}, signer)

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "when token is valid and alg is HS512" do
      signer = Joken.Signer.create("HS512", @jwt_secret)

      token = Joken.generate_and_sign!(%{}, %{}, signer)

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "when token has expired we return current time as the message so we can use it in expiration calculations" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      current_time = 1_610_086_801
      Mock.freeze(current_time)

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> current_time end}},
          %{},
          signer
        )

      assert {:error, [message: current_time, claim: "exp", claim_val: 1_610_086_801]} =
               JwtVerification.verify(token, @jwt_secret, nil)

      assert is_integer(current_time)

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> current_time - 1 end}},
          %{},
          signer
        )

      assert {:error, [message: current_time, claim: "exp", claim_val: _]} =
               JwtVerification.verify(token, @jwt_secret, nil)

      assert is_integer(current_time)
    end

    test "when token has not expired" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()

      token =
        Joken.generate_and_sign!(
          %{
            "exp" => %Joken.Claim{generate: fn -> current_time + 1 end}
          },
          %{},
          signer
        )

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "rejects token with expired exp encoded as a string" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()
      claim_val = to_string(current_time - 60)

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> claim_val end}},
          %{},
          signer
        )

      assert {:error, [message: ^current_time, claim: "exp", claim_val: ^claim_val]} =
               JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "rejects token with future exp encoded as a string" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()
      claim_val = to_string(current_time + 1000)

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> claim_val end}},
          %{},
          signer
        )

      assert {:error, [message: ^current_time, claim: "exp", claim_val: ^claim_val]} =
               JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "rejects token with iat encoded as a string" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()
      claim_val = to_string(current_time)

      token =
        Joken.generate_and_sign!(
          %{
            "exp" => %Joken.Claim{generate: fn -> current_time + 1000 end},
            "iat" => %Joken.Claim{generate: fn -> claim_val end}
          },
          %{},
          signer
        )

      assert {:error, [message: "Invalid token", claim: "iat", claim_val: ^claim_val]} =
               JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "accepts token with numeric exp and iat" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()

      token =
        Joken.generate_and_sign!(
          %{
            "exp" => %Joken.Claim{generate: fn -> current_time + 1000 end},
            "iat" => %Joken.Claim{generate: fn -> current_time end}
          },
          %{},
          signer
        )

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "accepts token with exp but without iat" do
      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> current_time + 1000 end}},
          %{},
          signer
        )

      assert {:ok, claims} = JwtVerification.verify(token, @jwt_secret, nil)
      refute Map.has_key?(claims, "iat")
    end

    test "when token claims match expected claims from :jwt_claim_validators config" do
      Application.put_env(:realtime, :jwt_claim_validators, %{
        "iss" => "Tester",
        "aud" => "www.test.com"
      })

      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()

      token =
        Joken.generate_and_sign!(
          %{
            "exp" => %Joken.Claim{generate: fn -> current_time + 1 end},
            "iss" => %Joken.Claim{generate: fn -> "Tester" end},
            "aud" => %Joken.Claim{generate: fn -> "www.test.com" end},
            "sub" => %Joken.Claim{generate: fn -> "tester@test.com" end}
          },
          %{},
          signer
        )

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "when token claims do not match expected claims from :jwt_claim_validators config" do
      Application.put_env(:realtime, :jwt_claim_validators, %{
        "iss" => "Issuer",
        "aud" => "www.test.com"
      })

      signer = Joken.Signer.create(@alg, @jwt_secret)

      Mock.freeze()
      current_time = Mock.current_time()

      token =
        Joken.generate_and_sign!(
          %{
            "exp" => %Joken.Claim{generate: fn -> current_time + 1 end},
            "iss" => %Joken.Claim{generate: fn -> "Tester" end},
            "aud" => %Joken.Claim{generate: fn -> "www.test.com" end},
            "sub" => %Joken.Claim{generate: fn -> "tester@test.com" end}
          },
          %{},
          signer
        )

      assert {:error, [message: "Invalid token", claim: "iss", claim_val: "Tester"]} =
               JwtVerification.verify(token, @jwt_secret, nil)
    end

    test "using RS256 JWK" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "RSA",
            "n" =>
              "6r1mKwCalvJ0NyThyQkBr5huFILwwhXcxtsdlw-WybNz4avzODQwLFkA-b2fnnfdFgualV2NdcvoJSo1bzVGCWWqwWKWdTQKFjtcjAIC4FnhOv5ynNF9Ub-11ORDd1aiq_4XKNA4GaS1HqBekVDAAvJYy99Jz0CkLx4NU_VrS0U9sOQzUAhy2MwZCx2kZ3SWKEMjjEIkbvIb22IdRTyuFsAndKGpyzhw-MalnU5P2hOig-QApNBc0WJtTHTAa4PLQ6v_5jNc5PzCwP8jGK9SlrSF-GOnx9BVBX9t-AIDp-BviKbtY7y-pku6-f7HSiS2T3iAJkHXPm9E_NwwhWzMJQ",
            "e" => "AQAB",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      # Check that the signature is valid even though time may be off.
      assert JwtVerification.verify(token, @jwt_secret, jwks) != {:error, :signature_error}
    end

    test "using RS256 JWK but wrong signature" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "RSA",
            "n" =>
              "6r1mKwCalvJ0NyThyQkBr5huFILwwhXcxtsdlw-WybNz4avzODQwLFkA-b2fnnfdFgualV2NdcvoJSo1bzVGCWWqwWKWdTQKFjtcjAIC4FnhOv5ynNF9Ub-11ORDd1aiq_4XKNA4GaS1HqBekVDAAvJYy99Jz0CkLx4NU_VrS0U9sOQzUAhy2MwZCx2kZ3SWKEMjjEIkbvIb22IdRTyuFsAndKGpyzhw-MalnU5P2hOig-QApNBc0WJtTHTAa4PLQ6v_5jNc5PzCwP8jGK9SlrSF-GOnx9BVBX9t-AIDp-BviKbtY7y-pku6-f7HSiS2T3iAJkHXPm9E_NwwhWzMJQ",
            "e" => "AQAB",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      assert JwtVerification.verify(token, @jwt_secret, jwks) == {:error, :signature_error}
    end

    test "using ES256 JWK" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "EC",
            "x" => "iX_niXPSL2nW-9IyCELzyceAtuE3B98pWML5tQGACD4",
            "y" => "kT02DoLhXx6gtpkbrN8XwQ2wtzE6cDBaqlWgVXIeqV0",
            "crv" => "P-256",
            "d" => "FBVYnsYA2C3FTggEwV8kCRMo4FLl220_cWY2RdXyb_8",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      # Check that the signature is valid even though time may be off.
      assert {:error, [message: _, claim: "exp", claim_val: _]} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "using ES256 JWK with wrong signature" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "EC",
            "x" => "iX_niXPSL2nW-9IyCELzyceAtuE3B98pWML5tQGACD4",
            "y" => "kT02DoLhXx6gtpkbrN8XwQ2wtzE6cDBaqlWgVXIeqV0",
            "crv" => "P-256",
            "d" => "FBVYnsYA2C3FTggEwV8kCRMo4FLl220_cWY2RdXyb_8",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      assert JwtVerification.verify(token, @jwt_secret, jwks) == {:error, :signature_error}
    end

    test "using HS256 JWK" do
      jwks = %{
        "keys" => [
          %{
            "alg" => "HS256",
            "k" =>
              "WWpiUEVXK2I4dVM1djkzMS9TWTNmb2RtcUtiZVh3NnBHS0JaS1JDMGpaODdhVHpaZ3N0Ly9yMG0wU1M4Z1U4OFE0aGdwclBMMzVRRU5ya253TWxhUlE9PQ",
            "key_ops" => ["verify"],
            "kid" => "4FcGwlBxkBV1bSZw",
            "kty" => "oct"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      # Check that the signature is valid even though time may be off.
      assert {:error, [message: _, claim: "exp", claim_val: _]} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "using JWT without typ header parameter" do
      jwks = %{
        "keys" => [
          %{
            "alg" => "RS256",
            "e" => "AQAB",
            "kid" => "sso_oidc_key_pair_01K20X7J43ZV31EKZMG7X3KW7K",
            "kty" => "RSA",
            "n" =>
              "uyc8QVrMjJTZEZoGNIJrugvf6j3iZ2Uz2IEgFuHCeC5AbM4BwZ4V1JshcW2CRs8uAmEdnH_-jiibayGmoND7OLziZJZsLir_8_kZSc5jjJ-IVFMzB1XXKze44HB3IOpcaPW1IOx0NfSI6-xOFinX7yApTZxXxmLFMEXtOWVsY_MPMrjThfvCSqesDGLRGKCn_DA4Hhaixf4NG-etGUOiavHNpqfREM7td-9caWpIyo7acWcgfYyhkxZbuYRINje1V66HWIdzzZ8uhfLXm-85LZdaWn9J83OHh3TEQW2SIAfHSNZkwXu6h5ndd_ciWxTWuvU3yjWkS-k4C8dXB--bZQ",
            "use" => "sig",
            "x5t#S256" => "HmlJQWnNuujjOdcRTCu5amk1pttdFRMBR7Rl4zplobA"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      assert {:error, [message: _, claim: "exp", claim_val: _]} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "using HS256 JWK with wrong signature" do
      jwks = %{
        "keys" => [
          %{
            "alg" => "HS256",
            "k" =>
              "WWpiUEVXK2I4dVM1djkzMS9TWTNmb2RtcUtiZVh3NnBHS0JaS1JDMGpaODdhVHpaZ3N0Ly9yMG0wU1M4Z1U4OFE0aGdwclBMMzVRRU5ya253TWxhUlE9PQ",
            "key_ops" => ["verify"],
            "kid" => "4FcGwlBxkBV1bSZw",
            "kty" => "oct"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      assert JwtVerification.verify(token, @jwt_secret, jwks) == {:error, :signature_error}
    end

    test "returns error when no matching JWK is found for RSA algorithm" do
      # Replace with a valid JWT structure
      token =
        "TEST_JWT_REDACTED"

      jwt_secret = "secret"
      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_other_kid"}]}

      assert {:error, {:error_generating_signer, "key-id-1"}} = JwtVerification.verify(token, jwt_secret, jwks)
    end

    test "returns error when no matching JWK is found for EC algorithm" do
      # Replace with a valid JWT structure
      token =
        "TEST_JWT_REDACTED"

      jwt_secret = "secret"
      jwks = %{"keys" => [%{"kty" => "EC", "kid" => "some_other_kid"}]}

      assert {:error, {:error_generating_signer, "key-id-1"}} = JwtVerification.verify(token, jwt_secret, jwks)
    end

    test "returns error when no matching JWK is found for OKP algorithm" do
      # Replace with a valid JWT structure
      token =
        "TEST_JWT_REDACTED"

      jwt_secret = "secret"
      jwks = %{"keys" => [%{"kty" => "OKP", "kid" => "some_other_kid"}]}

      assert {:error, {:error_generating_signer, "key-id-1"}} = JwtVerification.verify(token, jwt_secret, jwks)
    end

    test "returns error without kid when the header has no kid" do
      header = Base.url_encode64(Jason.encode!(%{"alg" => "RS256", "typ" => "JWT"}), padding: false)
      claims = Base.url_encode64(Jason.encode!(%{"exp" => 9_999_999_999}), padding: false)
      token = "#{header}.#{claims}.signature"

      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_kid"}]}

      assert {:error, :error_generating_signer} = JwtVerification.verify(token, "secret", jwks)
    end

    test "using EdDSA(Ed25519) JWK" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "OKP",
            "crv" => "Ed25519",
            "x" => "hR5rgn8NeZtkO6c5zBqQWFskBWnkBGa8c1Noa1L7FRw",
            "d" => "B760w5vOLrntFkIfGZRy7di_WPIYymxTjxufHiuHY0g",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      # Check that the signature is valid even though time may be off.
      assert {:error, [message: _, claim: "exp", claim_val: _]} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "using EdDSA(Ed25519) JWK with wrong signature" do
      jwks = %{
        "keys" => [
          %{
            "kty" => "OKP",
            "crv" => "Ed25519",
            "x" => "hR5rgn8NeZtkO6c5zBqQWFskBWnkBGa8c1Noa1L7FRw",
            "d" => "B760w5vOLrntFkIfGZRy7di_WPIYymxTjxufHiuHY0g",
            "kid" => "key-id-1"
          }
        ]
      }

      token =
        "TEST_JWT_REDACTED"

      assert JwtVerification.verify(token, @jwt_secret, jwks) == {:error, :signature_error}
    end

    test "returns error for an EdDSA alg whose JWK has no supported curve" do
      jwk = %{"kty" => "OKP", "crv" => "X25519", "kid" => "ed-key-1"}
      header = Base.url_encode64(Jason.encode!(%{"alg" => "EdDSA", "kid" => "ed-key-1"}), padding: false)
      claims = Base.url_encode64(Jason.encode!(%{"exp" => 9_999_999_999}), padding: false)
      token = "#{header}.#{claims}.signature"

      assert {:error, _} = JwtVerification.verify(token, @jwt_secret, %{"keys" => [jwk]})
    end

    test "returns error for unsupported algorithm with kid and jwks" do
      header = Base.url_encode64(Jason.encode!(%{"alg" => "PS256", "kid" => "key-1"}), padding: false)
      claims = Base.url_encode64(Jason.encode!(%{"exp" => 9_999_999_999}), padding: false)
      token = "#{header}.#{claims}.signature"

      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "key-1"}]}

      assert {:error, _} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "falls back to jwt_secret when HS256 kid has no matching JWK" do
      Mock.freeze()
      current_time = Mock.current_time()

      signer = Joken.Signer.create("HS256", @jwt_secret)

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> current_time + 100 end}},
          %{},
          signer
        )

      jwks = %{"keys" => [%{"kty" => "oct", "kid" => "wrong-kid"}]}

      assert {:ok, _claims} = JwtVerification.verify(token, @jwt_secret, jwks)
    end

    test "returns error for HS256 when there is no jwt_secret" do
      header = Base.url_encode64(Jason.encode!(%{"alg" => "HS256"}), padding: false)
      claims = Base.url_encode64(Jason.encode!(%{"exp" => 9_999_999_999}), padding: false)
      token = "#{header}.#{claims}.signature"

      assert {:error, :error_generating_signer} = JwtVerification.verify(token, nil, nil)
    end

    test "returns error when HS256 kid has no matching JWK and there is no jwt_secret" do
      header = Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "kid" => "key-1"}), padding: false)
      claims = Base.url_encode64(Jason.encode!(%{"exp" => 9_999_999_999}), padding: false)
      token = "#{header}.#{claims}.signature"

      jwks = %{"keys" => [%{"kty" => "oct", "kid" => "wrong-kid"}]}

      assert {:error, {:error_generating_signer, "key-1"}} = JwtVerification.verify(token, nil, jwks)
    end

    test "verifies HS256 against a matching oct JWK when there is no jwt_secret" do
      Mock.freeze()
      current_time = Mock.current_time()

      secret = "jwks-only-secret"
      signer = Joken.Signer.create("HS256", secret, %{"kid" => "jwks-key"})

      token =
        Joken.generate_and_sign!(
          %{"exp" => %Joken.Claim{generate: fn -> current_time + 100 end}},
          %{},
          signer
        )

      jwks = %{
        "keys" => [%{"kty" => "oct", "kid" => "jwks-key", "k" => Base.url_encode64(secret, padding: false)}]
      }

      assert {:ok, _claims} = JwtVerification.verify(token, nil, jwks)
    end
  end
end
