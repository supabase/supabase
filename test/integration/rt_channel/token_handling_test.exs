defmodule Realtime.Integration.RtChannel.TokenHandlingTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [%{serializer: Phoenix.Socket.V1.JSONSerializer}, %{serializer: RealtimeWeb.Socket.V2Serializer}]

  import ExUnit.CaptureLog
  import Generators

  alias Phoenix.Socket.Message
  alias Realtime.Database
  alias Realtime.Integration.WebsocketClient

  @moduletag :capture_log

  setup [:checkout_tenant_and_connect]

  describe "token validation" do
    setup [:rls_context]

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "badly formatted jwt token", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [{"x-api-key", "bad_token"}])
        end)

      assert log =~ "MalformedJWT: The token provided is not a valid JWT"
    end

    test "invalid JWT with expired token", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          get_connection(tenant, serializer,
            role: "authenticated",
            claims: %{:exp => System.system_time(:second) - 1000},
            params: %{log_level: :info}
          )
        end)

      assert log =~ "InvalidJWTToken: Token has expired"
    end

    test "token required the role key", %{tenant: tenant, serializer: serializer} do
      {:ok, token} = token_no_role(tenant)

      assert {:error, %{status_code: 401}} =
               WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [{"x-api-key", token}])
    end

    test "handles connection with valid api-header but ignorable access_token payload", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      realtime_topic = "realtime:#{topic}"

      log =
        capture_log(fn ->
          {:ok, token} =
            generate_token(tenant, %{
              exp: System.system_time(:second) + 1000,
              role: "authenticated",
              sub: random_string()
            })

          {:ok, socket} = WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [{"x-api-key", token}])

          WebsocketClient.join(socket, realtime_topic, %{
            config: %{broadcast: %{self: true}, private: false},
            access_token: "sb_#{random_string()}"
          })

          assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500
        end)

      refute log =~ "MalformedJWT: The token provided is not a valid JWT"
    end

    test "missing claims close connection", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")

      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, token} = generate_token(tenant, %{:exp => System.system_time(:second) + 2000})

      # Update token to be a near expiring token
      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => token})

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "extension" => "system",
                         "message" => "Fields `role` and `exp` are required in JWT",
                         "status" => "error"
                       }
                     },
                     500

      assert_receive %Message{event: "phx_close"}
    end
  end

  describe "access token refresh" do
    setup [:rls_context]

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "on new access_token and channel is private policies are reevaluated for read policy",
         %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")

      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{
        config: %{broadcast: %{self: true}, private: true},
        access_token: access_token
      })

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, new_token} = token_valid(tenant, "anon")

      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => new_token})

      error_message = "You do not have permissions to read from this Channel topic: #{topic}"

      assert_receive %Message{
        event: "system",
        payload: %{"channel" => ^topic, "extension" => "system", "message" => ^error_message, "status" => "error"},
        topic: ^realtime_topic
      }

      assert_receive %Message{event: "phx_close", topic: ^realtime_topic}
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "on new access_token and channel is private policies are reevaluated for write policy", %{
      topic: topic,
      tenant: tenant,
      serializer: serializer
    } do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      realtime_topic = "realtime:#{topic}"
      config = %{broadcast: %{self: true}, private: true}
      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      # Checks first send which will set write policy to true
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, realtime_topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^realtime_topic}, 500

      # RLS policies changed to only allow read
      {:ok, db_conn} = Database.connect(tenant, "realtime_test")
      clean_table(db_conn, "realtime", "messages")
      create_rls_policies(db_conn, [:authenticated_read_broadcast_and_presence], %{topic: topic})

      # Set new token to recheck policies
      {:ok, new_token} =
        generate_token(tenant, %{exp: System.system_time(:second) + 1000, role: "authenticated", sub: random_string()})

      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => new_token})

      # Send message to be ignored
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, realtime_topic, "broadcast", payload)

      refute_receive %Message{
                       event: "broadcast",
                       payload: ^payload,
                       topic: ^realtime_topic
                     },
                     1500
    end

    test "on new access_token and channel is public policies are not reevaluated", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      {:ok, new_token} = token_valid(tenant, "anon")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => new_token})

      refute_receive %Message{}
    end

    test "on empty string access_token the socket sends an error message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => ""})

      assert_receive %Message{
        topic: ^realtime_topic,
        event: "system",
        payload: %{
          "extension" => "system",
          "message" => msg,
          "status" => "error"
        }
      }

      assert_receive %Message{event: "phx_close"}
      assert msg =~ "The token provided is not a valid JWT"
    end

    test "on expired access_token the socket sends an error message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      sub = random_string()

      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated", claims: %{sub: sub})

      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, token} = generate_token(tenant, %{:exp => System.system_time(:second) - 1000, sub: sub})

      log =
        capture_log(fn ->
          WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => token})

          assert_receive %Message{
            topic: ^realtime_topic,
            event: "system",
            payload: %{"extension" => "system", "message" => "Token has expired " <> _, "status" => "error"}
          }

          assert_receive %Message{event: "phx_close", topic: ^realtime_topic}
        end)

      assert log =~ "ChannelShutdown: Token has expired"
    end

    test "ChannelShutdown include sub if available in jwt claims", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      exp = System.system_time(:second) + 10_000

      {socket, access_token} =
        get_connection(tenant, serializer, role: "authenticated", claims: %{exp: exp}, params: %{log_level: :warning})

      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"
      sub = random_string()
      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500

      {:ok, token} = generate_token(tenant, %{:exp => System.system_time(:second) - 1000, sub: sub})

      log =
        capture_log([level: :warning], fn ->
          WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => token})

          assert_receive %Message{event: "system"}, 1000
          assert_receive %Message{event: "phx_close", topic: ^realtime_topic}
        end)

      assert log =~ "ChannelShutdown"
      assert log =~ "sub=#{sub}"
    end

    test "on sb prefixed access_token the socket ignores the message and respects JWT expiry time", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      sub = random_string()

      {socket, access_token} =
        get_connection(tenant, serializer,
          role: "authenticated",
          claims: %{sub: sub, exp: System.system_time(:second) + 5}
        )

      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{
        "access_token" => "sb_publishable_-fake_key"
      })

      # Check if the new token does not trigger a shutdown
      refute_receive %Message{event: "system", topic: ^realtime_topic}, 100

      # Await to check if channel respects token expiry time
      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "system", "message" => msg, "status" => "error"},
                       topic: ^realtime_topic
                     },
                     5000

      assert_receive %Message{event: "phx_close", topic: ^realtime_topic}
      assert msg =~ "Token has expired"
    end
  end

  describe "token expiry" do
    setup [:rls_context]

    test "checks token periodically", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")

      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, token} =
        generate_token(tenant, %{:exp => System.system_time(:second) + 2, role: "authenticated"})

      # Update token to be a near expiring token
      WebsocketClient.send_event(socket, realtime_topic, "access_token", %{"access_token" => token})

      # Awaits to see if connection closes automatically
      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "system", "message" => msg, "status" => "error"}
                     },
                     3000

      assert_receive %Message{event: "phx_close"}

      assert msg =~ "Token has expired"
    end

    test "token expires in between joins", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, access_token} =
        generate_token(tenant, %{:exp => System.system_time(:second) + 1, role: "authenticated"})

      # token expires in between joins so it needs to be handled by the channel and not the socket
      Process.sleep(1000)
      realtime_topic = "realtime:#{topic}"

      log =
        capture_log(fn ->
          WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

          assert_receive %Message{
                           event: "phx_reply",
                           payload: %{
                             "status" => "error",
                             "response" => %{"reason" => reason}
                           },
                           topic: ^realtime_topic
                         },
                         500

          assert reason =~ "InvalidJWTToken: Token has expired"
        end)

      assert_receive %Message{event: "phx_close"}
      assert log =~ "#{tenant.external_id}"
    end

    test "token loses claims in between joins", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      {:ok, access_token} = generate_token(tenant, %{:exp => System.system_time(:second) + 10})

      # token breaks claims in between joins so it needs to be handled by the channel and not the socket
      realtime_topic = "realtime:#{topic}"
      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "status" => "error",
                         "response" => %{
                           "reason" => "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
                         }
                       },
                       topic: ^realtime_topic
                     },
                     500

      assert_receive %Message{event: "phx_close"}
    end

    test "token is badly formatted in between joins", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, access_token} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: access_token})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      # token becomes a string in between joins so it needs to be handled by the channel and not the socket
      WebsocketClient.join(socket, realtime_topic, %{config: config, access_token: "potato"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "status" => "error",
                         "response" => %{
                           "reason" => "MalformedJWT: The token provided is not a valid JWT"
                         }
                       },
                       topic: ^realtime_topic
                     },
                     500

      assert_receive %Message{event: "phx_close"}
    end
  end
end
