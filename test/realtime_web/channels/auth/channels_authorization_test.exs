defmodule RealtimeWeb.ChannelsAuthorizationTest do
  use ExUnit.Case, async: true

  use Mimic

  setup :set_mimic_from_context

  import Generators

  alias RealtimeWeb.ChannelsAuthorization
  alias RealtimeWeb.JwtVerification

  @secret ""
  describe "authorize_conn/3" do
    test "when token is authorized" do
      input_token = "\n token %20 1 %20 2 %20 3   "
      expected_token = "token123"

      expect(JwtVerification, :verify, 1, fn token, @secret, _jwks ->
        assert token == expected_token
        {:ok, %{}}
      end)

      assert {:ok, %{}} = ChannelsAuthorization.authorize(input_token, @secret, nil)
    end

    test "when token is unauthorized" do
      expect(JwtVerification, :verify, 1, fn _token, @secret, _jwks -> :error end)
      assert :error = ChannelsAuthorization.authorize("bad_token", @secret, nil)
    end

    test "when token is not a jwt token" do
      assert {:error, :token_malformed} = ChannelsAuthorization.authorize("bad_token", @secret, nil)
    end

    test "when token is not a string" do
      assert {:error, :invalid_token} = ChannelsAuthorization.authorize([], @secret, nil)
    end

    test "authorize_conn/3 fails when has missing headers" do
      jwt = generate_jwt_token(@secret, %{})

      assert {:error, :missing_claims} =
               ChannelsAuthorization.authorize_conn(jwt, @secret, nil)
    end
  end
end
