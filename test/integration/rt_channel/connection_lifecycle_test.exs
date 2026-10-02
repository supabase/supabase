defmodule Realtime.Integration.RtChannel.ConnectionLifecycleTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [
      %{serializer: Phoenix.Socket.V1.JSONSerializer},
      %{serializer: RealtimeWeb.Socket.V2Serializer}
    ]

  import ExUnit.CaptureLog
  import Generators

  alias Forum.Muster
  alias Phoenix.Socket.Message
  alias Realtime.Api
  alias Realtime.FeatureFlags
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.UserSocket

  @moduletag :capture_log

  @service_restart_close_code 1012
  @going_away_close_code 1001

  setup [:checkout_tenant_and_connect]

  describe "socket connect - tenant not found" do
    test "logs TenantNotFound and rejects connection for unknown external_id", %{serializer: serializer} do
      external_id = "nonexistent-#{System.unique_integer([:positive])}"
      fake_tenant = %{external_id: external_id}
      # Our code does not store values that are not Tenant structs
      # but we do it here to avoid an Ecto.Sandbox issue due to the async tests
      # Because Cachex.fetch will try to call the DB when there is no cached information
      Cachex.put(Realtime.Tenants.Cache, {:get_tenant_by_external_id, external_id}, {:error, :not_found})

      log =
        capture_log(fn ->
          assert {:error, %Mint.WebSocket.UpgradeFailureError{status_code: 404}} =
                   WebsocketClient.connect(self(), uri(fake_tenant, serializer), serializer, [
                     {"x-api-key", "some-token"}
                   ])
        end)

      assert log =~ "TenantNotFound"
    end
  end

  describe "socket connect - missing api key" do
    test "logs MissingAPIKey and rejects connection when no token provided", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          assert {:error, %Mint.WebSocket.UpgradeFailureError{status_code: 401}} =
                   WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [])
        end)

      assert log =~ "MissingAPIKey"
    end
  end

  describe "socket connect - malformed token" do
    test "logs MalformedJWT and rejects connection with a 401", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          assert {:error, %Mint.WebSocket.UpgradeFailureError{status_code: 401}} =
                   WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [
                     {"x-api-key", "not-a-jwt"}
                   ])
        end)

      assert log =~ "MalformedJWT"
    end
  end

  describe "replication connection establishment" do
    test "Connect signals replication readiness on its syn topic with the replication_conn pid" do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)

      Phoenix.PubSub.subscribe(Realtime.PubSub, Connect.syn_topic(tenant.external_id))
      {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)

      assert_receive %Phoenix.Socket.Broadcast{event: "ready", payload: %{replication_conn: replication_conn}}
                     when is_pid(replication_conn),
                     5000

      assert {:ok, ^replication_conn} = Connect.replication_status(tenant.external_id)
    end

    test "clients that opt in receive the replication established system message, even after streaming has started",
         %{serializer: serializer} do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)

      Phoenix.PubSub.subscribe(Realtime.PubSub, Connect.syn_topic(tenant.external_id))
      {:ok, _db_conn} = Connect.lookup_or_start_connection(tenant.external_id)

      assert_receive %Phoenix.Socket.Broadcast{event: "ready", payload: %{replication_conn: replication_conn}}
                     when is_pid(replication_conn),
                     5000

      {socket1, _} = get_connection(tenant, serializer, role: "authenticated")
      {socket2, _} = get_connection(tenant, serializer, role: "authenticated")

      config = %{broadcast: %{self: true, replication_ready: true}, private: false}
      topic1 = "realtime:#{random_string()}"
      topic2 = "realtime:#{random_string()}"

      WebsocketClient.join(socket1, topic1, %{config: config})
      WebsocketClient.join(socket2, topic2, %{config: config})

      assert_receive %Message{event: "phx_reply", topic: ^topic1, payload: %{"status" => "ok"}}, 500
      assert_receive %Message{event: "phx_reply", topic: ^topic2, payload: %{"status" => "ok"}}, 500

      assert_receive %Message{
                       event: "system",
                       topic: ^topic1,
                       payload: %{"message" => "Replication connection established"}
                     },
                     2000

      assert_receive %Message{
                       event: "system",
                       topic: ^topic2,
                       payload: %{"message" => "Replication connection established"}
                     },
                     2000
    end
  end

  describe "socket disconnect - tenant suspension" do
    setup [:rls_context]

    test "tenant already suspended", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          change_tenant_configuration(tenant, :suspend, true)

          {:error, %Mint.WebSocket.UpgradeFailureError{status_code: 403}} =
            get_connection(tenant, serializer, role: "anon")

          refute_receive _any
        end)

      assert log =~ "RealtimeDisabledForTenant"
    end
  end

  describe "socket disconnect - configuration changes" do
    setup [:rls_context]

    test "on jwks the socket closes and sends a system message", %{tenant: tenant, topic: topic, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{jwt_jwks: %{keys: ["potato"]}})

      assert_receive {:close_code, @service_restart_close_code}, 1000

      assert_process_down(socket)
    end

    test "on jwt_secret the socket closes and sends a system message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "potato"})

      assert_receive {:close_code, @service_restart_close_code}, 1000

      assert_process_down(socket)
    end

    test "on private_only the socket closes and sends a system message", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{private_only: true})

      assert_receive {:close_code, @service_restart_close_code}, 1000

      assert_process_down(socket)
    end

    test "on other param changes the socket won't close and no message is sent", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{max_concurrent_users: 100})

      refute_receive %Message{
                       topic: ^realtime_topic,
                       event: "system",
                       payload: %{
                         "extension" => "system",
                         "message" => "Server requested disconnect",
                         "status" => "ok"
                       }
                     },
                     500

      assert :ok = WebsocketClient.send_heartbeat(socket)
      refute_receive {:close_code, @service_restart_close_code}
    end
  end

  describe "socket disconnect - token expiry" do
    setup [:rls_context]

    test "invalid JWT with expired token", %{tenant: tenant, serializer: serializer} do
      log =
        capture_log(fn ->
          assert {:error, %Mint.WebSocket.UpgradeFailureError{status_code: 401}} =
                   get_connection(tenant, serializer,
                     role: "authenticated",
                     claims: %{:exp => System.system_time(:second) - 1000},
                     params: %{log_level: :info}
                   )
        end)

      assert log =~ "InvalidJWTToken: Token has expired"
    end
  end

  describe "socket disconnect" do
    setup [:rls_context]

    test "on disconnect called, socket is killed", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}

      topics =
        for i <- 1..10 do
          topic = "realtime:#{serializer}:#{i}"
          WebsocketClient.join(socket, topic, %{config: config})

          assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500
          topic
        end

      assert :ok = WebsocketClient.send_heartbeat(socket)
      # heartbeat reply
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: "phoenix"}, 500

      UserSocket.disconnect(tenant.external_id)

      for topic <- topics do
        assert_receive %Message{
                         topic: ^topic,
                         event: "system",
                         payload: %{
                           "extension" => "system",
                           "message" => "Server requested disconnect",
                           "status" => "ok"
                         }
                       },
                       5000
      end

      assert_receive {:close_code, @service_restart_close_code}, 1000
      refute_receive _any

      assert_process_down(socket, 1000)
    end
  end

  describe "socket disconnect - tenant deleted during session" do
    setup [:rls_context]

    test "sends disconnect to socket when tenant not found during channel join", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500

      Cachex.put(Realtime.Tenants.Cache, {:get_tenant_by_external_id, tenant.external_id}, {:error, :not_found})

      realtime_topic_2 = "realtime:#{random_string()}"
      WebsocketClient.join(socket, realtime_topic_2, %{config: config})

      assert_receive {:close_code, @going_away_close_code}, 1000

      assert_process_down(socket, 1000)
    end
  end

  describe "rate limits - concurrent users" do
    setup [:rls_context]

    test "max_concurrent_users limit respected", %{tenant: tenant, serializer: serializer} do
      Tenants.get_tenant_by_external_id(tenant.external_id)
      change_tenant_configuration(tenant, :max_concurrent_users, 1)

      {socket1, _} = get_connection(tenant, serializer, role: "authenticated")
      {socket2, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      topic1 = "realtime:#{random_string()}"
      topic2 = "realtime:#{random_string()}"
      WebsocketClient.join(socket1, topic1, %{config: config})
      WebsocketClient.join(socket1, topic2, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       topic: ^topic1,
                       payload: %{"response" => %{"postgres_changes" => []}, "status" => "ok"}
                     },
                     500

      assert_receive %Message{
                       event: "phx_reply",
                       topic: ^topic2,
                       payload: %{"response" => %{"postgres_changes" => []}, "status" => "ok"}
                     },
                     500

      topic3 = "realtime:#{random_string()}"
      WebsocketClient.join(socket2, topic3, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       topic: ^topic3,
                       payload: %{
                         "response" => %{
                           "reason" => "ConnectionRateLimitReached: Too many connected users"
                         },
                         "status" => "error"
                       }
                     },
                     500

      Realtime.Tenants.Cache.update_cache(%{tenant | max_concurrent_users: 2})

      WebsocketClient.join(socket2, topic3, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       topic: ^topic3,
                       payload: %{"response" => %{"postgres_changes" => []}, "status" => "ok"}
                     },
                     500
    end
  end

  describe "rate limits - events per second" do
    setup [:rls_context]

    test "max_events_per_second limit respected", %{tenant: tenant, serializer: serializer} do
      RateCounterHelper.stop(tenant.external_id)

      log =
        capture_log(fn ->
          {socket, _} = get_connection(tenant, serializer, role: "authenticated")
          config = %{broadcast: %{self: true, ack: false}, private: false, presence: %{enabled: false}}
          realtime_topic = "realtime:#{random_string()}"

          WebsocketClient.join(socket, realtime_topic, %{config: config})
          assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500

          for _ <- 1..1000, Process.alive?(socket) do
            WebsocketClient.send_event(socket, realtime_topic, "broadcast", %{})
            assert_receive %Message{event: "broadcast", topic: ^realtime_topic}, 500
          end

          RateCounterHelper.tick_tenant_rate_counters!(tenant.external_id)

          WebsocketClient.send_event(socket, realtime_topic, "broadcast", %{})

          assert_receive %Message{event: "phx_close"}, 1000
        end)

      assert log =~ "MessagePerSecondRateLimitReached"
    end
  end

  describe "rate limits - channels per client" do
    setup [:rls_context]

    test "max_channels_per_client limit respected", %{tenant: tenant, serializer: serializer} do
      change_tenant_configuration(tenant, :max_channels_per_client, 1)

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic_1 = "realtime:#{random_string()}"
      realtime_topic_2 = "realtime:#{random_string()}"

      WebsocketClient.join(socket, realtime_topic_1, %{config: config})
      WebsocketClient.join(socket, realtime_topic_2, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"response" => %{"postgres_changes" => []}, "status" => "ok"},
                       topic: ^realtime_topic_1
                     },
                     500

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "status" => "error",
                         "response" => %{
                           "reason" => "ChannelRateLimitReached: Too many channels"
                         }
                       },
                       topic: ^realtime_topic_2
                     },
                     500

      refute_receive %Message{event: "phx_reply", topic: ^realtime_topic_2}, 500

      Realtime.Tenants.Cache.update_cache(%{tenant | max_channels_per_client: 2})

      WebsocketClient.join(socket, realtime_topic_2, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"response" => %{"postgres_changes" => []}, "status" => "ok"},
                       topic: ^realtime_topic_2
                     },
                     500
    end
  end

  describe "rate limits - joins per second" do
    setup [:rls_context]

    test "max_joins_per_second limit respected", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:#{random_string()}"

      log =
        capture_log(fn ->
          for _ <- 1..1500 do
            WebsocketClient.join(socket, realtime_topic, %{config: config})
            assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500
          end

          RateCounterHelper.tick_tenant_rate_counters!(tenant.external_id)

          WebsocketClient.join(socket, realtime_topic, %{config: config})
          assert_process_down(socket)
        end)

      assert log =~
               "project=#{tenant.external_id} external_id=#{tenant.external_id} [critical] ClientJoinRateLimitReached: Too many joins per second"

      assert length(String.split(log, "ClientJoinRateLimitReached")) <= 3
    end
  end

  describe "Muster channel join" do
    setup [:rls_context]

    test "registers the joined socket in the real Muster scope when the flag is enabled", %{
      tenant: tenant,
      serializer: serializer
    } do
      enable_muster_join_flag!()

      scope = Application.fetch_env!(:realtime, :muster_scope)
      group = tenant.external_id

      # Nothing has joined this tenant's group yet.
      assert Muster.local_member_count(scope, group) == 0

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{random_string()}"
      WebsocketClient.join(socket, topic, %{config: %{broadcast: %{self: false}, private: false}})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500

      # Once we get the reply for the join we 100% sure that the join has been registered
      assert Muster.local_member_count(scope, group) == 1
      assert [pid] = Muster.local_members(scope, group)
      assert Muster.local_member?(scope, group, pid)
      assert Muster.targets(scope, group, Muster.view_hash(scope)) == {:ok, [node()]}
    end
  end

  # Regression guard for REAL-981: Phoenix 1.8.3 started dropping any channel
  # push whose join_ref didn't match the one recorded at join time
  # (and didn't tolerate a missing one either)
  #  We run a fork with that check reverted, these tests fail if the fork's fix regresses
  # or Phoenix is ever bumped back to stock behavior without it.
  # We can bump this again after REAL-984
  describe "join_ref leniency" do
    test "presence track still gets a reply and diff with a stale or missing join_ref", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{random_string()}"
      config = %{presence: %{key: "", enabled: true}, private: false}

      WebsocketClient.join(socket, topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500
      assert_receive %Message{event: "presence_state", topic: ^topic}, 500

      stale = %{type: "presence", event: "TRACK", payload: %{name: "stale-join-ref"}}
      send_raw(socket, serializer, topic, "presence", stale, "1001", "some-other-join-ref")

      assert_receive %Message{event: "phx_reply", ref: "1001", payload: %{"status" => "ok"}, topic: ^topic}, 500
      assert_receive %Message{event: "presence_diff", topic: ^topic}, 500

      missing = %{type: "presence", event: "TRACK", payload: %{name: "missing-join-ref"}}
      send_raw(socket, serializer, topic, "presence", missing, "1002", nil)

      assert_receive %Message{event: "phx_reply", ref: "1002", payload: %{"status" => "ok"}, topic: ^topic}, 500
      assert_receive %Message{event: "presence_diff", topic: ^topic}, 500
    end

    test "acknowledged broadcast still gets a reply with a stale or missing join_ref", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      topic = "realtime:#{random_string()}"
      config = %{broadcast: %{self: true, ack: true}, private: false}

      WebsocketClient.join(socket, topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 500

      broadcast = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      send_raw(socket, serializer, topic, "broadcast", broadcast, "2001", "some-other-join-ref")
      assert_receive %Message{event: "phx_reply", ref: "2001", payload: %{"status" => "ok"}, topic: ^topic}, 500
      assert_receive %Message{event: "broadcast", payload: ^broadcast, topic: ^topic}, 500

      send_raw(socket, serializer, topic, "broadcast", broadcast, "2002", nil)
      assert_receive %Message{event: "phx_reply", ref: "2002", payload: %{"status" => "ok"}, topic: ^topic}, 500
      assert_receive %Message{event: "broadcast", payload: ^broadcast, topic: ^topic}, 500
    end
  end

  # Bypasses WebsocketClient's automatic join_ref tracking to simulate a client
  # pushing with a stale or missing (nil) join_ref after a valid join.
  defp send_raw(socket, serializer, topic, event, payload, ref, join_ref) do
    msg = %Message{topic: topic, event: event, payload: payload, ref: ref, join_ref: join_ref}
    {:socket_push, :text, chardata} = serializer.encode!(msg)
    WebsocketClient.send(socket, {:text, IO.chardata_to_string(chardata)})
  end

  # Enables the `use_muster_channel_join` flag for real (no Muster mocking): the
  # flag is created and pushed into the local FeatureFlags cache so the channel
  # process reads it synchronously, and torn down afterwards so it does not leak
  # into other async tests via the shared in-memory cache.
  defp enable_muster_join_flag! do
    {:ok, flag} = Api.upsert_feature_flag(%{name: "use_muster_channel_join", enabled: true})
    FeatureFlags.Cache.update_cache(flag)
    on_exit(fn -> FeatureFlags.Cache.invalidate_cache("use_muster_channel_join") end)
  end
end
