defmodule RealtimeWeb.BroadcastControllerTest do
  use RealtimeWeb.ConnCase, async: true
  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Crypto
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Database

  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.Endpoint
  alias RealtimeWeb.TenantBroadcaster

  setup_all do
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
    %{tenant: tenant}
  end

  setup %{conn: conn, tenant: tenant} do
    # Warm cache to avoid Cachex and Ecto.Sandbox ownership issues.
    # Kept per-test so the "suspended tenant" case can't leak suspend: true into later tests.
    Realtime.Tenants.Cache.update_cache(tenant)

    conn = generate_conn(conn, tenant)

    {:ok, conn: conn}
  end

  defp subscribe(tenant_topic, topic) do
    fastlane =
      RealtimeChannel.MessageDispatcher.fastlane_metadata(
        self(),
        Phoenix.Socket.V1.JSONSerializer,
        topic,
        :error,
        "tenant_id"
      )

    Endpoint.subscribe(tenant_topic, metadata: fastlane)
  end

  defp assert_receive_messages(count) do
    Enum.map(1..count, fn _ ->
      assert_receive {:socket_push, :text, data}

      data
      |> IO.iodata_to_binary()
      |> Jason.decode!()
    end)
  end

  describe "broadcast" do
    test "returns 202 when batch of messages is broadcasted", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, 3, fn ^broadcast_events_key -> :ok end)

      # |> stub(:add, fn key -> call_original(GenCounter, :add, [key]) end)

      sub_topic_1 = "sub_topic_1"
      sub_topic_2 = "sub_topic_2"
      topic_1 = Tenants.tenant_topic(tenant, sub_topic_1)
      topic_2 = Tenants.tenant_topic(tenant, sub_topic_2)

      payload_1 = %{"data" => "data"}
      payload_2 = %{"data" => "data"}
      event_1 = "event_1"
      event_2 = "event_2"

      payload_topic_1 = %{"payload" => payload_1, "event" => event_1, "type" => "broadcast"}
      payload_topic_2 = %{"payload" => payload_2, "event" => event_2, "type" => "broadcast"}

      subscribe(topic_1, sub_topic_1)
      subscribe(topic_2, sub_topic_2)

      conn =
        post(conn, Routes.broadcast_path(conn, :broadcast), %{
          "messages" => [
            %{"topic" => sub_topic_1, "payload" => payload_1, "event" => event_1},
            %{"topic" => sub_topic_1, "payload" => payload_1, "event" => event_1},
            %{"topic" => sub_topic_2, "payload" => payload_2, "event" => event_2}
          ]
        })

      assert conn.status == 202

      messages = assert_receive_messages(3)

      assert Enum.count(messages, fn message ->
               message == %{
                 "event" => "broadcast",
                 "payload" => payload_topic_1,
                 "ref" => nil,
                 "topic" => sub_topic_1
               }
             end) == 2

      assert Enum.count(messages, fn message ->
               message == %{
                 "event" => "broadcast",
                 "payload" => payload_topic_2,
                 "ref" => nil,
                 "topic" => sub_topic_2
               }
             end) == 1

      refute_receive {:socket_push, _, _}
    end

    test "returns 422 when batch of messages includes badly formed messages", %{conn: conn, tenant: tenant} do
      # Drop deliveries counted by previous tests sharing this tenant
      Realtime.GenCounter.reset(Tenants.events_per_second_key(tenant))
      tenant_topic = Tenants.tenant_topic(tenant, "topic")

      subscribe(tenant_topic, "topic")

      conn =
        post(conn, Routes.broadcast_path(conn, :broadcast), %{
          "messages" => [
            %{
              "topic" => "topic"
            },
            %{
              "payload" => %{"data" => "data"}
            },
            %{
              "topic" => "topic",
              "payload" => %{"data" => "data"},
              "event" => "event"
            }
          ]
        })

      assert Jason.decode!(conn.resp_body) == %{
               "errors" => %{
                 "messages" => [
                   %{"payload" => ["can't be blank"], "event" => ["can't be blank"]},
                   %{"topic" => ["can't be blank"], "event" => ["can't be blank"]},
                   %{}
                 ]
               }
             }

      assert conn.status == 422

      {:ok, rate_counter} = RateCounterHelper.tick!(Tenants.requests_per_second_rate(tenant))
      assert rate_counter.avg != 0.0

      {:ok, rate_counter} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      assert [0 | _] = rate_counter.bucket

      refute_receive {:socket_push, _, _}
    end

    test "returns 422 when batch of messages includes a message that exceeds the tenant payload size", %{
      conn: conn,
      tenant: tenant
    } do
      sub_topic_1 = "sub_topic_1"
      sub_topic_2 = "sub_topic_2"

      payload_1 = %{"data" => "data"}
      payload_2 = %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 100)}
      event_1 = "event_1"
      event_2 = "event_2"

      conn =
        post(conn, Routes.broadcast_path(conn, :broadcast), %{
          "messages" => [
            %{"topic" => sub_topic_1, "payload" => payload_1, "event" => event_1},
            %{"topic" => sub_topic_1, "payload" => payload_1, "event" => event_1},
            %{"topic" => sub_topic_2, "payload" => payload_2, "event" => event_2}
          ]
        })

      assert conn.status == 422
    end
  end

  describe "suspended tenant" do
    test "returns 403 and does not broadcast when tenant is suspended", %{conn: conn, tenant: tenant} do
      Realtime.Tenants.Cache.update_cache(%{tenant | suspend: true})

      reject(&TenantBroadcaster.pubsub_broadcast/5)

      conn =
        post(conn, Routes.broadcast_path(conn, :broadcast), %{
          "messages" => [
            %{"topic" => "sub_topic", "payload" => %{"data" => "data"}, "event" => "event"}
          ]
        })

      assert conn.status == 403
      assert conn.resp_body == Jason.encode!(%{message: "Tenant is suspended"})
      assert calls(&TenantBroadcaster.pubsub_broadcast/5) == []
    end
  end

  describe "too many requests" do
    test "batch will exceed rate limit", %{conn: conn, tenant: tenant} do
      requests_rate = Tenants.requests_per_second_rate(tenant)
      events_rate = Tenants.events_per_second_rate(tenant)

      RateCounter
      |> stub(:new, fn _ -> {:ok, nil} end)
      |> stub(:get, fn
        ^requests_rate -> {:ok, %RateCounter{avg: 0}}
        ^events_rate -> {:ok, %RateCounter{avg: 10}}
      end)

      conn =
        post(conn, Routes.broadcast_path(conn, :broadcast), %{
          "messages" =>
            Stream.repeatedly(fn ->
              %{
                "topic" => Tenants.tenant_topic(tenant, "sub_topic"),
                "payload" => %{"data" => "data"},
                "event" => "event"
              }
            end)
            |> Enum.take(1000)
        })

      assert conn.status == 429

      assert conn.resp_body ==
               Jason.encode!(%{
                 message: "Too many messages to broadcast, please reduce the batch size"
               })
    end

    test "user has hit the rate limit", %{conn: conn, tenant: tenant} do
      requests_rate = Tenants.requests_per_second_rate(tenant)
      events_rate = Tenants.events_per_second_rate(tenant)

      RateCounter
      |> stub(:new, fn _ -> {:ok, nil} end)
      |> stub(:get, fn
        ^requests_rate -> {:ok, %RateCounter{avg: 0}}
        ^events_rate -> {:ok, %RateCounter{avg: 1000}}
      end)

      messages = [
        %{"topic" => Tenants.tenant_topic(tenant, "sub_topic"), "payload" => %{"data" => "data"}, "event" => "event"}
      ]

      conn = generate_conn(conn, tenant)
      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{"messages" => messages})
      assert conn.status == 429
      assert conn.resp_body == Jason.encode!(%{message: "You have exceeded your rate limit"})
    end
  end

  describe "unauthorized" do
    test "invalid token returns 401", %{conn: conn, tenant: tenant} do
      conn =
        conn
        |> delete_req_header("authorization")
        |> put_req_header("accept", "application/json")
        |> put_req_header("x-api-key", "potato")
        |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{})
      assert conn.status == 401
    end

    test "expired token returns 401", %{conn: conn, tenant: tenant} do
      now = System.system_time(:second)
      expired_token = generate_jwt_token(tenant, %{role: "anon", iat: now - 200, exp: now - 100})

      conn =
        conn
        |> delete_req_header("authorization")
        |> put_req_header("accept", "application/json")
        |> put_req_header("x-api-key", expired_token)
        |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{})
      assert conn.status == 401
    end

    test "invalid tenant returns 401", %{conn: conn} do
      conn =
        conn
        |> put_req_header("accept", "application/json")
        |> put_req_header("x-api-key", "potato")
        |> then(&%{&1 | host: "potato.supabase.com"})

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{})
      assert conn.status == 401
    end
  end

  describe "authorization for broadcast" do
    setup %{conn: conn, tenant: tenant} = context do
      jwt_secret = Crypto.decrypt!(tenant.jwt_secret)

      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      clean_table(db_conn, "realtime", "messages")

      claims = %{sub: random_string(), role: context.role, exp: Joken.current_time() + 1_000}
      signer = Joken.Signer.create("HS256", jwt_secret)

      jwt = Joken.generate_and_sign!(%{}, claims, signer)

      conn =
        conn
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer #{jwt}")
        |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})

      {:ok, conn: conn, db_conn: db_conn, tenant: tenant}
    end

    @tag role: "authenticated"
    test "user with permission to read all channels and write to them is able to broadcast", %{
      conn: conn,
      db_conn: db_conn,
      tenant: tenant
    } do
      request_events_key = Tenants.requests_per_second_key(tenant)
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      expect(TenantBroadcaster, :pubsub_broadcast, 5, fn _, _, _, _, _ -> :ok end)

      messages_to_send =
        Stream.repeatedly(fn -> generate_message_with_policies(db_conn, tenant) end)
        |> Enum.take(5)

      messages =
        Enum.map(messages_to_send, fn %{topic: topic} ->
          %{
            "topic" => topic,
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "private" => true
          }
        end)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, length(messages), fn ^broadcast_events_key -> :ok end)

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{"messages" => messages})

      broadcast_calls = calls(&TenantBroadcaster.pubsub_broadcast/5)

      Enum.each(messages_to_send, fn %{topic: topic} ->
        broadcast_topic = Tenants.tenant_topic(tenant, topic, false)

        message = %Phoenix.Socket.Broadcast{
          topic: topic,
          event: "broadcast",
          payload: %{
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "type" => "broadcast"
          }
        }

        assert Enum.any?(broadcast_calls, fn
                 [_, ^broadcast_topic, ^message, RealtimeChannel.MessageDispatcher, :broadcast] -> true
                 _ -> false
               end)
      end)

      assert conn.status == 202
    end

    @tag role: "authenticated"
    test "user with permission is also able to broadcast to open channel", %{
      conn: conn,
      db_conn: db_conn,
      tenant: tenant
    } do
      request_events_key = Tenants.requests_per_second_key(tenant)
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      expect(TenantBroadcaster, :pubsub_broadcast, 6, fn _, _, _, _, _ -> :ok end)

      channels =
        Stream.repeatedly(fn -> generate_message_with_policies(db_conn, tenant) end)
        |> Enum.take(5)

      messages =
        Enum.map(channels, fn %{topic: topic} ->
          %{
            "topic" => topic,
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "private" => true
          }
        end)

      messages =
        messages ++
          [
            %{
              "topic" => "open_channel",
              "payload" => %{"content" => "content_open_channel"},
              "event" => "event_open_channel"
            }
          ]

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, length(messages), fn ^broadcast_events_key -> :ok end)

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{"messages" => messages})

      broadcast_calls = calls(&TenantBroadcaster.pubsub_broadcast/5)

      Enum.each(channels, fn %{topic: topic} ->
        broadcast_topic = Tenants.tenant_topic(tenant, topic, false)

        message = %Phoenix.Socket.Broadcast{
          topic: topic,
          event: "broadcast",
          payload: %{
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "type" => "broadcast"
          }
        }

        assert Enum.count(broadcast_calls, fn
                 [_, ^broadcast_topic, ^message, RealtimeChannel.MessageDispatcher, :broadcast] -> true
                 _ -> false
               end) == 1
      end)

      # Check open channel
      message = %Phoenix.Socket.Broadcast{
        topic: "open_channel",
        event: "broadcast",
        payload: %{
          "payload" => %{"content" => "content_open_channel"},
          "event" => "event_open_channel",
          "type" => "broadcast"
        }
      }

      open_channel_topic = Tenants.tenant_topic(tenant, "open_channel", true)

      assert Enum.count(broadcast_calls, fn
               [_, ^open_channel_topic, ^message, RealtimeChannel.MessageDispatcher, :broadcast] -> true
               _ -> false
             end) == 1

      assert conn.status == 202
    end

    @tag role: "authenticated"
    test "user with permission to write a limited set is only able to broadcast to said set", %{
      conn: conn,
      db_conn: db_conn,
      tenant: tenant
    } do
      request_events_key = Tenants.requests_per_second_key(tenant)
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      expect(TenantBroadcaster, :pubsub_broadcast, 5, fn _, _, _, _, _ -> :ok end)

      messages_to_send =
        Stream.repeatedly(fn -> generate_message_with_policies(db_conn, tenant) end)
        |> Enum.take(5)

      no_auth_channel = message_fixture(tenant)

      messages =
        Enum.map(messages_to_send ++ [no_auth_channel], fn %{topic: topic} ->
          %{
            "topic" => topic,
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "private" => true
          }
        end)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      # remove the one message that won't be broadcasted for this user
      |> expect(:add, length(messages) - 1, fn ^broadcast_events_key -> :ok end)

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{"messages" => messages})

      broadcast_calls = calls(&TenantBroadcaster.pubsub_broadcast/5)

      Enum.each(messages_to_send, fn %{topic: topic} ->
        broadcast_topic = Tenants.tenant_topic(tenant, topic, false)

        message = %Phoenix.Socket.Broadcast{
          topic: topic,
          event: "broadcast",
          payload: %{
            "payload" => %{"content" => "payload" <> topic},
            "event" => "event" <> topic,
            "type" => "broadcast"
          }
        }

        assert Enum.count(broadcast_calls, fn
                 [_, ^broadcast_topic, ^message, RealtimeChannel.MessageDispatcher, :broadcast] -> true
                 _ -> false
               end) == 1
      end)

      assert length(broadcast_calls) == length(messages_to_send)

      assert conn.status == 202
    end

    @tag role: "anon"
    test "user without permission won't broadcast", %{conn: conn, db_conn: db_conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      reject(&TenantBroadcaster.pubsub_broadcast/5)

      messages =
        Stream.repeatedly(fn -> generate_message_with_policies(db_conn, tenant) end)
        |> Enum.take(5)

      # Duplicate messages to ensure same topics emit twice
      messages = messages ++ messages

      messages =
        Enum.map(messages, fn %{topic: topic} ->
          %{
            "topic" => topic,
            "payload" => %{"content" => random_string()},
            "event" => random_string(),
            "private" => true
          }
        end)

      GenCounter
      |> expect(:add, fn ^request_events_key -> 1 end)

      conn = post(conn, Routes.broadcast_path(conn, :broadcast), %{"messages" => messages})

      assert conn.status == 202
    end
  end

  defp generate_message_with_policies(db_conn, tenant) do
    message = message_fixture(tenant)
    create_rls_policies(db_conn, [:authenticated_read_broadcast, :authenticated_write_broadcast], message)
    message
  end

  defp generate_conn(conn, tenant) do
    now = System.system_time(:second)
    claims = %{role: "test", iat: now, exp: now + 100_000}

    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("authorization", "Bearer #{generate_jwt_token(tenant, claims)}")
    |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})
  end
end
