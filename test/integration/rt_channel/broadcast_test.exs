defmodule Realtime.Integration.RtChannel.BroadcastTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [
      %{serializer: Phoenix.Socket.V1.JSONSerializer},
      %{serializer: RealtimeWeb.Socket.V2Serializer}
    ]

  import ExUnit.CaptureLog
  import Generators

  alias Phoenix.Socket.Message
  alias Postgrex
  alias Realtime.Api
  alias Realtime.Database
  alias Realtime.FeatureFlags
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection

  @moduletag :capture_log

  @fanout_event [:realtime, :broadcast, :fanout, :node_delivery]

  setup [:checkout_tenant_and_connect]

  describe "public broadcast" do
    setup [:rls_context]

    test "public broadcast", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, private: false}
      topic = "realtime:any"
      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500
    end

    @tag serializer: RealtimeWeb.Socket.V2Serializer
    test "a V2 json user broadcast with an invalid payload is dropped for a V1 subscriber", %{tenant: tenant} do
      topic = "realtime:any"
      config = %{broadcast: %{self: false}, private: false}

      {v2_sender, _} = get_connection(tenant, RealtimeWeb.Socket.V2Serializer)
      {v1_receiver, _} = get_connection(tenant, Phoenix.Socket.V1.JSONSerializer)

      WebsocketClient.join(v2_sender, topic, %{config: config})
      WebsocketClient.join(v1_receiver, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      WebsocketClient.send_user_broadcast(v2_sender, topic, "evt", "not json at all", encoding: :json)
      refute_receive %Message{event: "broadcast"}, 500

      # valid JSON still delivers
      WebsocketClient.send_user_broadcast(v2_sender, topic, "evt", ~s|{"a":1}|, encoding: :json)

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^topic,
                       payload: %{"event" => "evt", "payload" => %{"a" => 1}, "type" => "broadcast"}
                     },
                     1000
    end

    test "broadcast to another tenant does not get mixed up", %{tenant: tenant, serializer: serializer} do
      other_tenant = TestTenantDb.checkout_tenant(run_migrations: true)

      Realtime.Tenants.Cache.update_cache(other_tenant)

      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: false}, private: false}
      topic = "realtime:any"
      WebsocketClient.join(socket, topic, %{config: config})

      {other_socket, _} = get_connection(other_tenant, serializer)
      WebsocketClient.join(other_socket, topic, %{config: config})

      # Both sockets joined
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, topic, "broadcast", payload)

      # No message received
      refute_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500
    end

    @tag policies: []
    test "lack of connection to database error does not impact public channels", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      topic = "realtime:#{topic}"
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, topic, %{config: %{broadcast: %{self: true}, private: false}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      {service_role_socket, _} = get_connection(tenant, serializer, role: "service_role")
      WebsocketClient.join(service_role_socket, topic, %{config: %{broadcast: %{self: false}, private: false}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      log =
        capture_log(fn ->
          :syn.update_registry(Connect, tenant.external_id, fn _pid, meta -> %{meta | conn: nil} end)
          payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
          WebsocketClient.send_event(service_role_socket, topic, "broadcast", payload)
          assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500
        end)

      refute log =~ "UnableToHandleBroadcast"
    end
  end

  describe "private broadcast" do
    setup [:rls_context]

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "private broadcast with valid channel with permissions sends message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"
      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence],
         serializer: RealtimeWeb.Socket.V2Serializer
    test "private broadcast with binary payload and ack returns reply and delivers self-broadcast", %{
      tenant: tenant,
      topic: topic,
      serializer: RealtimeWeb.Socket.V2Serializer = serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true, ack: true}, private: true}
      full_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, full_topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 500

      binary = <<0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x11, 0x22, 0x33>>
      event = "my-binary-event"

      WebsocketClient.send_user_broadcast(socket, full_topic, event, binary, encoding: :binary)

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 500

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^full_topic,
                       payload: %{
                         "event" => ^event,
                         "payload" => {:binary, ^binary},
                         "type" => "broadcast"
                       }
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence],
         topic: "topic"
    test "private broadcast with valid channel a colon character sends message and won't intercept in public channels",
         %{topic: topic, tenant: tenant, serializer: serializer} do
      {anon_socket, _} = get_connection(tenant, serializer, role: "anon")
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      valid_topic = "realtime:#{topic}"
      malicious_topic = "realtime:private:#{topic}"

      WebsocketClient.join(socket, valid_topic, %{config: %{broadcast: %{self: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^valid_topic}, 300

      WebsocketClient.join(anon_socket, malicious_topic, %{config: %{broadcast: %{self: true}, private: false}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^malicious_topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, valid_topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^valid_topic}, 500
      refute_receive %Message{event: "broadcast"}
    end

    @tag policies: [:authenticated_read_broadcast_and_presence]
    test "private broadcast with valid channel no write permissions won't send message but will receive message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"

      {service_role_socket, _} = get_connection(tenant, serializer, role: "service_role")
      WebsocketClient.join(service_role_socket, topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      WebsocketClient.send_event(socket, topic, "broadcast", payload)
      refute_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500

      WebsocketClient.send_event(service_role_socket, topic, "broadcast", payload)
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500
    end

    @tag policies: []
    test "private broadcast with valid channel and no read permissions won't join", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      config = %{private: true}
      expected = "Unauthorized: You do not have permissions to read from this Channel topic: #{topic}"

      topic = "realtime:#{topic}"
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")

      log =
        capture_log(fn ->
          WebsocketClient.join(socket, topic, %{config: config})

          assert_receive %Message{
                           topic: ^topic,
                           event: "phx_reply",
                           payload: %{
                             "response" => %{
                               "reason" => ^expected
                             },
                             "status" => "error"
                           }
                         },
                         300

          refute_receive %Message{event: "phx_reply", topic: ^topic}, 300
        end)

      assert log =~ expected
    end

    @tag policies: [:authenticated_read_broadcast_and_presence]
    test "handles lack of connection to database error on private channels", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      topic = "realtime:#{topic}"
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, topic, %{config: %{broadcast: %{self: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      {service_role_socket, _} = get_connection(tenant, serializer, role: "service_role")
      WebsocketClient.join(service_role_socket, topic, %{config: %{broadcast: %{self: false}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      log =
        capture_log(fn ->
          :syn.update_registry(Connect, tenant.external_id, fn _pid, meta -> %{meta | conn: nil} end)
          payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
          WebsocketClient.send_event(service_role_socket, topic, "broadcast", payload)
          # Wait past the (test-configured) connection-ready timeout to confirm nothing is delivered
          refute_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 3000
        end)

      assert log =~ "UnableToHandleBroadcast"
    end
  end

  describe "broadcast persistence" do
    setup [:rls_context]

    setup %{tenant: tenant} do
      enable_broadcast_persistence_flag!(tenant)
      :ok
    end

    test "public broadcast is delivered but not stored", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, private: false}
      full_topic = "realtime:#{topic}"
      WebsocketClient.join(socket, full_topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, full_topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      assert {:ok, %Postgrex.Result{rows: []}} =
               Postgrex.query(db_conn, "SELECT id FROM realtime.messages WHERE topic = $1", [topic])
    end

    test "a broadcast on a topic matching the persistence policy is delivered and stored", %{
      tenant: tenant,
      db_conn: db_conn,
      serializer: serializer
    } do
      allow_broadcast(db_conn)
      allow_persistence(db_conn, "realtime.topic() LIKE 'stored:%'")

      topic = "stored:#{random_string()}"
      full_topic = "realtime:#{topic}"
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_event(socket, full_topic, "broadcast", payload)

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "ok", "response" => %{"id" => id}},
                       topic: ^full_topic
                     },
                     500

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      assert {:ok, %Postgrex.Result{rows: [[^id, ^topic]]}} =
               Postgrex.query(db_conn, "SELECT id::text, topic FROM realtime.messages WHERE topic = $1", [topic])
    end

    @tag serializer: RealtimeWeb.Socket.V2Serializer
    test "a binary broadcast is stored as binary_payload and replayed as a binary frame", %{
      tenant: tenant,
      db_conn: db_conn,
      serializer: RealtimeWeb.Socket.V2Serializer = serializer
    } do
      allow_broadcast(db_conn)
      allow_persistence(db_conn, "realtime.topic() LIKE 'stored:%'")

      topic = "stored:#{random_string()}"
      full_topic = "realtime:#{topic}"
      binary = <<0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x11>>
      event = "my-binary-event"

      {sender, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(sender, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_user_broadcast(sender, full_topic, event, binary, encoding: :binary)

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "ok", "response" => %{"id" => id}},
                       topic: ^full_topic
                     },
                     500

      assert {:ok, %Postgrex.Result{rows: [[^binary, nil]]}} =
               Postgrex.query(db_conn, "SELECT binary_payload, payload FROM realtime.messages WHERE topic = $1", [
                 topic
               ])

      {joiner, _} = get_connection(tenant, serializer, role: "authenticated")

      WebsocketClient.join(joiner, full_topic, %{
        config: %{private: true, broadcast: %{replay: %{limit: 10, since: 0}}}
      })

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 500

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^full_topic,
                       payload: %{
                         "event" => ^event,
                         "payload" => {:binary, ^binary},
                         "type" => "broadcast",
                         "meta" => %{"id" => ^id, "replayed" => true}
                       }
                     },
                     1_000
    end

    test "a stored broadcast is replayed to a client joining later", %{
      tenant: tenant,
      db_conn: db_conn,
      serializer: serializer
    } do
      allow_broadcast(db_conn)
      allow_persistence(db_conn, "realtime.topic() LIKE 'stored:%'")

      topic = "stored:#{random_string()}"
      full_topic = "realtime:#{topic}"
      event = "TEST"
      user_payload = %{"msg" => 1}
      payload = %{"event" => event, "payload" => user_payload, "type" => "broadcast"}

      {sender, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(sender, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_event(sender, full_topic, "broadcast", payload)

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "ok", "response" => %{"id" => id}},
                       topic: ^full_topic
                     },
                     500

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      {joiner, _} = get_connection(tenant, serializer, role: "authenticated")

      WebsocketClient.join(joiner, full_topic, %{
        config: %{private: true, broadcast: %{replay: %{limit: 10, since: 0}}}
      })

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 500

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^full_topic,
                       payload: %{
                         "event" => ^event,
                         "payload" => ^user_payload,
                         "type" => "broadcast",
                         "meta" => %{"id" => ^id, "replayed" => true}
                       }
                     },
                     1_000
    end

    test "a broadcast on a topic not matching the persistence policy is delivered but not stored", %{
      tenant: tenant,
      db_conn: db_conn,
      serializer: serializer
    } do
      allow_broadcast(db_conn)
      allow_persistence(db_conn, "realtime.topic() LIKE 'stored:%'")

      topic = "other:#{random_string()}"
      full_topic = "realtime:#{topic}"
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_event(socket, full_topic, "broadcast", payload)
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      assert {:ok, %Postgrex.Result{rows: []}} =
               Postgrex.query(db_conn, "SELECT id FROM realtime.messages WHERE topic = $1", [topic])
    end

    test "dropping the persistence policy stops new broadcasts from being stored", %{
      tenant: tenant,
      db_conn: db_conn,
      serializer: serializer
    } do
      allow_broadcast(db_conn)
      allow_persistence(db_conn, "realtime.topic() LIKE 'stored:%'")

      topic = "stored:#{random_string()}"
      full_topic = "realtime:#{topic}"
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_event(socket, full_topic, "broadcast", payload)
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok", "response" => %{"id" => _id}}}, 500
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      assert {:ok, %Postgrex.Result{rows: [[1]]}} =
               Postgrex.query(db_conn, "SELECT count(*)::int FROM realtime.messages WHERE topic = $1", [topic])

      Postgrex.query!(db_conn, "DROP POLICY persist_store ON realtime.messages", [])

      {socket2, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket2, full_topic, %{config: %{broadcast: %{self: true, ack: true}, private: true}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^full_topic}, 300

      WebsocketClient.send_event(socket2, full_topic, "broadcast", payload)
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      assert {:ok, %Postgrex.Result{rows: [[1]]}} =
               Postgrex.query(db_conn, "SELECT count(*)::int FROM realtime.messages WHERE topic = $1", [topic])
    end
  end

  describe "broadcast replay" do
    setup [:rls_context]

    @tag policies: [:authenticated_read_broadcast_and_presence], serializer: RealtimeWeb.Socket.V2Serializer
    test "replays binary messages as binary frames", %{
      tenant: tenant,
      topic: topic,
      serializer: RealtimeWeb.Socket.V2Serializer = serializer
    } do
      binary = <<0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF>>
      event = "bin"

      %{id: id} =
        message_fixture(tenant, %{
          "event" => event,
          "extension" => "broadcast",
          "topic" => topic,
          "private" => true,
          "binary_payload" => binary
        })

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: %{private: true, broadcast: %{replay: %{limit: 10, since: 0}}}})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "ok"},
                       topic: ^topic,
                       join_ref: join_ref
                     },
                     500

      assert is_binary(join_ref)

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^topic,
                       join_ref: nil,
                       payload: %{
                         "event" => ^event,
                         "payload" => {:binary, ^binary},
                         "type" => "broadcast",
                         "meta" => %{"id" => ^id, "replayed" => true}
                       }
                     },
                     1_000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence], serializer: RealtimeWeb.Socket.V2Serializer
    test "replays binary and json messages in insertion order", %{
      tenant: tenant,
      topic: topic,
      serializer: RealtimeWeb.Socket.V2Serializer = serializer
    } do
      binary = <<1, 2, 3>>
      value = random_string()

      %{id: binary_id} =
        message_fixture(tenant, %{
          "event" => "bin",
          "extension" => "broadcast",
          "topic" => topic,
          "private" => true,
          "binary_payload" => binary
        })

      %{id: json_id} =
        message_fixture(tenant, %{
          "event" => "json",
          "extension" => "broadcast",
          "topic" => topic,
          "private" => true,
          "payload" => %{"value" => value}
        })

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: %{private: true, broadcast: %{replay: %{limit: 10, since: 0}}}})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^topic,
                       payload: %{
                         "event" => "bin",
                         "payload" => {:binary, ^binary},
                         "type" => "broadcast",
                         "meta" => %{"id" => ^binary_id, "replayed" => true}
                       }
                     },
                     1000

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^topic,
                       payload: %{
                         "event" => "json",
                         "payload" => %{"value" => ^value},
                         "type" => "broadcast",
                         "meta" => %{"id" => ^json_id, "replayed" => true}
                       }
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence], serializer: Phoenix.Socket.V1.JSONSerializer
    test "binary messages are skipped on V1 sockets", %{
      tenant: tenant,
      topic: topic,
      serializer: Phoenix.Socket.V1.JSONSerializer = serializer
    } do
      value = random_string()

      message_fixture(tenant, %{
        "event" => "bin",
        "extension" => "broadcast",
        "topic" => topic,
        "private" => true,
        "binary_payload" => <<1, 2, 3>>
      })

      %{id: json_id} =
        message_fixture(tenant, %{
          "event" => "json",
          "extension" => "broadcast",
          "topic" => topic,
          "private" => true,
          "payload" => %{"value" => value}
        })

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: %{private: true, broadcast: %{replay: %{limit: 10, since: 0}}}})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500

      assert_receive %Message{
                       event: "broadcast",
                       topic: ^topic,
                       payload: %{
                         "event" => "json",
                         "payload" => %{"value" => ^value},
                         "meta" => %{"id" => ^json_id, "replayed" => true}
                       }
                     },
                     1000

      refute_receive %Message{event: "broadcast", payload: %{"event" => "bin"}}, 500
    end
  end

  describe "broadcast fan-out telemetry" do
    setup [:rls_context, :attach_fanout_telemetry]

    test "a broadcast sent by a connected client is measured locally with hit=true", %{
      tenant: tenant,
      serializer: serializer,
      fanout_ref: ref
    } do
      external_id = tenant.external_id
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, private: false}
      topic = "realtime:any"
      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 500

      # The sending node dispatches locally without going through the Worker, but must still
      # emit the fan-out metric. hit=true because the node holds the client's connection.
      assert_receive {@fanout_event, ^ref, %{local_tenant_users: count}, %{tenant: ^external_id, hit: true}}, 500
      assert count >= 1
    end

    test "a broadcast with no local subscribers is measured locally with hit=false", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      fanout_ref: ref
    } do
      external_id = tenant.external_id
      assert ReplicationConnection.ready?(external_id)

      # No socket is connected for this tenant, so the publishing node holds no connection -> hit=false.
      value = random_string()
      event = random_string()

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send (json_build_object ('value', $1 :: text)::jsonb, $2 :: text, $3 :: text, FALSE::bool);",
        [value, event, topic]
      )

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: 0}, %{tenant: ^external_id, hit: false}}, 2000
    end
  end

  describe "trigger-based broadcast changes" do
    setup [:rls_context, :setup_trigger]

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "broadcast insert event changes on insert in table with trigger", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      table_name: table_name,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      assert ReplicationConnection.ready?(tenant.external_id)

      value = random_string()
      Postgrex.query!(db_conn, "INSERT INTO #{table_name} (details) VALUES ($1)", [value])

      record = %{"details" => value, "id" => 1}

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => "INSERT",
                         "payload" => %{
                           "old_record" => nil,
                           "operation" => "INSERT",
                           "record" => ^record,
                           "schema" => "public",
                           "table" => ^table_name
                         },
                         "type" => "broadcast"
                       },
                       topic: ^topic
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence],
         requires_data: true,
         requires_pg_140006: true
    test "broadcast update event changes on update in table with trigger", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      table_name: table_name,
      serializer: serializer
    } do
      value = random_string()
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      new_value = random_string()

      assert ReplicationConnection.ready?(tenant.external_id)

      Postgrex.query!(db_conn, "INSERT INTO #{table_name} (details) VALUES ($1)", [value])
      Postgrex.query!(db_conn, "UPDATE #{table_name} SET details = $1 WHERE details = $2", [new_value, value])

      old_record = %{"details" => value, "id" => 1}
      record = %{"details" => new_value, "id" => 1}

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => "UPDATE",
                         "payload" => %{
                           "old_record" => ^old_record,
                           "operation" => "UPDATE",
                           "record" => ^record,
                           "schema" => "public",
                           "table" => ^table_name
                         },
                         "type" => "broadcast"
                       },
                       topic: ^topic
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence],
         requires_pg_140006: true
    test "broadcast delete event changes on delete in table with trigger", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      table_name: table_name,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      value = random_string()

      assert ReplicationConnection.ready?(tenant.external_id)

      Postgrex.query!(db_conn, "INSERT INTO #{table_name} (details) VALUES ($1)", [value])
      Postgrex.query!(db_conn, "DELETE FROM #{table_name} WHERE details = $1", [value])

      record = %{"details" => value, "id" => 1}

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => "DELETE",
                         "payload" => %{
                           "old_record" => ^record,
                           "operation" => "DELETE",
                           "record" => nil,
                           "schema" => "public",
                           "table" => ^table_name
                         },
                         "type" => "broadcast"
                       },
                       topic: ^topic
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "broadcast event when function 'send' is called with private topic", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      full_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, full_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      value = random_string()
      event = random_string()

      assert ReplicationConnection.ready?(tenant.external_id)

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send (jsonb_build_object ('value', $1 :: text), $2 :: text, $3 :: text, TRUE::bool);",
        [value, event, topic]
      )

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => ^event,
                         "payload" => %{"value" => ^value},
                         "type" => "broadcast"
                       },
                       topic: ^full_topic,
                       join_ref: nil,
                       ref: nil
                     },
                     1000
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "broadcast event when function 'send_binary' is called", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      full_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, full_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      binary = <<0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF, 0x01, 0x02>>
      event = random_string()

      assert ReplicationConnection.ready?(tenant.external_id)

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send_binary($1::bytea, $2::text, $3::text, TRUE::bool);",
        [binary, event, topic]
      )

      case serializer do
        RealtimeWeb.Socket.V2Serializer ->
          assert_receive %Message{
                           event: "broadcast",
                           payload: %{
                             "event" => ^event,
                             "payload" => {:binary, ^binary},
                             "type" => "broadcast",
                             "meta" => %{"id" => _}
                           },
                           topic: ^full_topic
                         },
                         1000

        Phoenix.Socket.V1.JSONSerializer ->
          # V1 cannot represent binary payloads; the broadcast is dropped for this socket.
          refute_receive %Message{event: "broadcast"}, 500
      end
    end

    test "broadcast event when function 'send' is called with public topic", %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      full_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, full_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      value = random_string()
      event = random_string()

      assert ReplicationConnection.ready?(tenant.external_id)

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send (json_build_object ('value', $1 :: text)::jsonb, $2 :: text, $3 :: text, FALSE::bool);",
        [value, event, topic]
      )

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => ^event,
                         "payload" => %{"value" => ^value},
                         "type" => "broadcast"
                       },
                       topic: ^full_topic
                     },
                     1000
    end
  end

  defp attach_fanout_telemetry(_context) do
    %{fanout_ref: :telemetry_test.attach_event_handlers(self(), [@fanout_event])}
  end

  defp setup_trigger(%{tenant: tenant, topic: topic}) do
    {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
    random_name = String.downcase("test_#{random_string()}")
    query = "CREATE TABLE #{random_name} (id serial primary key, details text)"
    Postgrex.query!(db_conn, query, [])

    query = """
    CREATE OR REPLACE FUNCTION broadcast_changes_for_table_#{random_name}_trigger ()
    RETURNS TRIGGER
    AS $$
    DECLARE
    topic text;
    BEGIN
    topic = '#{topic}';
    PERFORM
      realtime.broadcast_changes (topic, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD, TG_LEVEL);
    RETURN NULL;
    END;
    $$
    LANGUAGE plpgsql;
    """

    Postgrex.query!(db_conn, query, [])

    query = """
    CREATE TRIGGER broadcast_changes_for_#{random_name}_table
    AFTER INSERT OR UPDATE OR DELETE ON #{random_name}
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_changes_for_table_#{random_name}_trigger ();
    """

    Postgrex.query!(db_conn, query, [])

    on_exit(fn ->
      {:ok, cleanup_conn} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query!(cleanup_conn, "DROP TABLE #{random_name} CASCADE", [])
      GenServer.stop(cleanup_conn)
    end)

    %{table_name: random_name, db_conn: db_conn}
  end

  @test_namespaces "(realtime.topic() LIKE 'stored:%' OR realtime.topic() LIKE 'other:%')"

  defp allow_broadcast(db_conn) do
    create_message_policy(db_conn, "persist_read", "FOR SELECT TO authenticated USING #{@test_namespaces}")

    create_message_policy(
      db_conn,
      "persist_send",
      "FOR INSERT TO authenticated WITH CHECK (realtime.messages.extension = 'broadcast' AND #{@test_namespaces})"
    )
  end

  defp allow_persistence(db_conn, check_expr) do
    create_message_policy(
      db_conn,
      "persist_store",
      "FOR INSERT TO authenticated WITH CHECK (realtime.messages.extension = 'persistence' AND #{check_expr})"
    )
  end

  defp create_message_policy(db_conn, name, definition) do
    Postgrex.query!(db_conn, "CREATE POLICY #{name} ON realtime.messages #{definition}", [])
  end

  # Enables the `broadcast_persistence` flag for real: the flag is created and pushed into the local
  # FeatureFlags cache so the channel and replication connection processes read it synchronously, and
  # torn down afterwards so it does not leak into other tests via the shared in-memory cache.
  defp enable_broadcast_persistence_flag!(tenant) do
    {:ok, flag} = Api.upsert_feature_flag(%{name: "broadcast_persistence", enabled: false})
    FeatureFlags.Cache.update_cache(flag)
    {:ok, tenant} = FeatureFlags.set_tenant_flag("broadcast_persistence", tenant.external_id, true)
    Realtime.Tenants.Cache.update_cache(tenant)
    on_exit(fn -> FeatureFlags.Cache.invalidate_cache("broadcast_persistence") end)
  end
end
