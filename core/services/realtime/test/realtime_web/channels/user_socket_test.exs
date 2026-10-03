defmodule RealtimeWeb.UserSocketTest do
  use ExUnit.Case, async: true
  import ExUnit.CaptureLog
  import Plug.Test

  alias RealtimeWeb.Socket.V2Serializer
  alias RealtimeWeb.UserSocket

  @socket %Phoenix.Socket{
    serializer: V2Serializer,
    assigns: %{tenant: "test-tenant", access_token: "test-token", log_level: :error}
  }
  @state {%{channels: %{}, channels_inverse: %{}}, @socket}

  describe "disconnect/1" do
    test "returns :ok" do
      assert :ok = UserSocket.disconnect("tenant-disconnect-ok")
    end

    test "broadcasts socket drain to subscribers topic" do
      tenant_id = "tenant-disconnect-drain"
      Phoenix.PubSub.subscribe(Realtime.PubSub, UserSocket.subscribers_id(tenant_id))

      UserSocket.disconnect(tenant_id)

      assert_receive :socket_drain
    end

    test "broadcasts system disconnect message to operations topic" do
      tenant_id = "tenant-disconnect-ops"
      Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant_id)

      UserSocket.disconnect(tenant_id)

      assert_receive %Phoenix.Socket.Broadcast{
        event: "system",
        payload: %{extension: "system", status: "ok", message: "Server requested disconnect"}
      }
    end

    test "logs a warning with tenant id" do
      tenant_id = "tenant-disconnect-log"

      log =
        capture_log(fn ->
          UserSocket.disconnect(tenant_id)
        end)

      assert log =~ "Disconnecting all sockets for tenant #{tenant_id}"
    end
  end

  describe "handle_in/2 with invalid messages" do
    test "does not crash and logs when message is an array with not enough items" do
      raw = Jason.encode!(["join_ref", "ref", "topic"])

      log =
        capture_log(fn ->
          assert {:ok, @state} = UserSocket.handle_in({raw, [opcode: :text]}, @state)
        end)

      assert log =~ "MalformedWebSocketMessage"
    end

    test "does not crash and logs when message is a map" do
      raw = Jason.encode!(%{"topic" => "t", "event" => "e", "payload" => %{}})

      log =
        capture_log(fn ->
          assert {:ok, @state} = UserSocket.handle_in({raw, [opcode: :text]}, @state)
        end)

      assert log =~ "MalformedWebSocketMessage"
    end

    test "does not crash and logs when message is empty string" do
      log =
        capture_log(fn ->
          assert {:ok, @state} = UserSocket.handle_in({"", [opcode: :text]}, @state)
        end)

      assert log =~ "MalformedWebSocketMessage"
    end

    test "does not crash and logs when message is invalid JSON" do
      log =
        capture_log(fn ->
          assert {:ok, @state} = UserSocket.handle_in({"not json", [opcode: :text]}, @state)
        end)

      assert log =~ "MalformedWebSocketMessage"
    end

    test "does not crash and logs on unexpected errors" do
      log =
        capture_log(fn ->
          assert {:ok, @state} = UserSocket.handle_in({:not_a_binary, [opcode: :text]}, @state)
        end)

      assert log =~ "UnknownErrorOnWebSocketMessage"
    end
  end

  describe "handle_error/2" do
    for {reason, status, message} <- [
          {:missing_api_key, 401, "API key is missing"},
          {:expired_token, 401, "Token has expired"},
          {:missing_claims, 401, "Fields `role` and `exp` are required in JWT"},
          {:token_malformed, 401, "The token provided is not a valid JWT"},
          {:invalid_token, 401, "The token provided is not a valid JWT"},
          {:signature_error, 401, "Failed to validate JWT signature"},
          {:error_generating_signer, 401, "Failed to generate JWT signer, check your JWT secret or JWKS configuration"},
          {:tenant_suspended, 403, "Realtime was disabled for this tenant"},
          {:tenant_not_found, 404, "Tenant not found"},
          {:too_many_connections, 429, "Too many connected users"},
          {:too_many_joins, 429, "Too many joins per second"}
        ] do
      test "maps #{reason} to a #{status} JSON response" do
        conn = UserSocket.handle_error(conn(:get, "/socket/websocket"), unquote(reason))

        assert conn.status == unquote(status)
        assert Jason.decode!(conn.resp_body) == %{"error" => unquote(message)}

        assert Plug.Conn.get_resp_header(conn, "content-type") == [
                 "application/json; charset=utf-8"
               ]
      end
    end

    test "unwraps {:error, reason} tuples returned by connect/3" do
      conn = UserSocket.handle_error(conn(:get, "/socket/websocket"), {:error, :signature_error})
      assert conn.status == 401
      assert Jason.decode!(conn.resp_body) == %{"error" => "Failed to validate JWT signature"}
    end

    test "display kid on bad signer error" do
      conn =
        UserSocket.handle_error(
          conn(:get, "/socket/websocket"),
          {:error, {:error_generating_signer, "19de8c2c"}}
        )

      assert conn.status == 401

      assert Jason.decode!(conn.resp_body) ==
               %{
                 "error" =>
                   "Failed to generate JWT signer for key ID (kid) \"19de8c2c\", check your JWT secret or JWKS configuration"
               }
    end

    test "maps unknown reasons to a generic 500 JSON response" do
      conn = UserSocket.handle_error(conn(:get, "/socket/websocket"), {:error, :some_weird_reason})

      assert conn.status == 500
      assert Jason.decode!(conn.resp_body) == %{"error" => "Error connecting to Realtime"}
    end
  end
end
