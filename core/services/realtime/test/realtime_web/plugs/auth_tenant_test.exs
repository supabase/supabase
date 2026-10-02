defmodule RealtimeWeb.AuthTenantTest do
  use RealtimeWeb.ConnCase, async: true

  import Plug.Conn
  import ExUnit.CaptureLog

  alias Realtime.Crypto
  alias RealtimeWeb.AuthTenant

  describe "without tenant" do
    test "returns 401", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end
  end

  describe "with tenant" do
    setup %{conn: conn} = context do
      tenant = tenant_fixture()
      now = System.system_time(:second)
      token = generate_jwt_token(tenant, %{role: "test", iat: now, exp: now + 100_000})

      header = Map.get(context, :header)

      api_key =
        cond do
          literal = Map.get(context, :api_key) -> literal
          header -> Map.get(context, :prefix, "Bearer ") <> token
          true -> nil
        end

      conn = if header && api_key, do: put_req_header(conn, header, api_key), else: conn

      conn = assign(conn, :tenant, tenant)
      %{conn: conn, token: token}
    end

    test "returns 401 if token isn't present in header", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end

    @tag header: "authorization"
    test "authorizes a tenant still on the legacy cipher", %{conn: conn} do
      tenant = conn.assigns.tenant
      legacy = tenant.jwt_secret |> Crypto.decrypt!() |> Crypto.encrypt!(cipher: :ecb)
      conn = conn |> assign(:tenant, %{tenant | jwt_secret: legacy}) |> AuthTenant.call(%{})

      refute conn.status
      refute conn.halted
    end

    @tag api_key: "Bearer invalid", header: "authorization"
    test "returns 401 if token in authorization header isn't valid", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end

    @tag api_key: "Bearer", header: "authorization"
    test "returns 401 when the authorization header has no token", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end

    @tag header: "authorization"
    test "returns non halted and null status if token in authorization header is valid", %{
      conn: conn
    } do
      conn = AuthTenant.call(conn, %{})
      refute conn.status
      refute conn.halted
    end

    @tag header: "authorization", prefix: "bearer "
    test "returns non halted and null status if token in authorization header is valid and case insensitive",
         %{
           conn: conn
         } do
      conn = AuthTenant.call(conn, %{})
      refute conn.status
      refute conn.halted
    end

    @tag api_key: "earer invalid", header: "authorization"
    test "returns halted and unauthorized if token is badly formatted", %{
      conn: conn
    } do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end

    @tag api_key: "invalid", header: "apikey"
    test "returns 401 if token in apikey header isn't valid", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end

    @tag header: "apikey", prefix: ""
    test "returns non halted and null status if token in apikey header is valid", %{
      conn: conn
    } do
      conn = AuthTenant.call(conn, %{})
      refute conn.status
      refute conn.halted
    end

    @tag header: "authorization"
    test "assigns jwt information on success", %{conn: conn, token: token} do
      conn = AuthTenant.call(conn, %{})
      assert conn.assigns.jwt == token
      assert conn.assigns.role == "test"
      assert %{"exp" => exp, "iat" => iat, "role" => "test"} = conn.assigns.claims
      assert is_integer(exp) and is_integer(iat)
    end
  end

  describe "with JWKS that does not match the token kid" do
    # RS256 token with header kid "key-id-1"
    @rsa_token "TEST_JWT_REDACTED"

    setup %{conn: conn} do
      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_other_kid"}]}
      tenant = tenant_fixture(%{jwt_jwks: jwks})
      %{conn: assign(conn, :tenant, tenant)}
    end

    test "logs JwtSignerError with the kid and returns 401", %{conn: conn} do
      conn = put_req_header(conn, "authorization", "Bearer " <> @rsa_token)

      log =
        capture_log(fn ->
          conn = AuthTenant.call(conn, %{})
          assert conn.status == 401
          assert conn.halted
        end)

      assert log =~ "JwtSignerError"
      assert log =~ "key-id-1"
    end
  end

  describe "with a tenant that only has a JWKS" do
    setup %{conn: conn} do
      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_other_kid"}]}
      tenant = tenant_fixture(%{jwt_secret: nil, jwt_jwks: jwks})
      now = System.system_time(:second)
      token = generate_jwt_token("another secret", %{role: "test", iat: now, exp: now + 100_000})

      %{conn: conn |> assign(:tenant, tenant) |> put_req_header("authorization", "Bearer " <> token)}
    end

    test "returns 401 for an HS256 token it has no secret to verify", %{conn: conn} do
      conn = AuthTenant.call(conn, %{})
      assert conn.status == 401
      assert conn.halted
    end
  end

  describe "with a tenant that only has a JWKS matching the token kid" do
    setup %{conn: conn} do
      secret = "jwks-only-tenant-secret"
      jwks = %{"keys" => [%{"kty" => "oct", "kid" => "oct-key-1", "k" => Base.url_encode64(secret, padding: false)}]}
      tenant = tenant_fixture(%{jwt_secret: nil, jwt_jwks: jwks})

      now = System.system_time(:second)
      signer = Joken.Signer.create("HS256", secret, %{"kid" => "oct-key-1"})
      token = Joken.generate_and_sign!(%{}, %{"role" => "test", "iat" => now, "exp" => now + 100_000}, signer)

      %{conn: conn |> assign(:tenant, tenant) |> put_req_header("authorization", "Bearer " <> token), token: token}
    end

    test "authorizes the request", %{conn: conn, token: token} do
      conn = AuthTenant.call(conn, %{})
      refute conn.halted
      assert conn.assigns.jwt == token
      assert conn.assigns.role == "test"
    end
  end
end
