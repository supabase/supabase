defmodule RealtimeWeb.RealtimeChannel.BroadcastHandlerTest do
  use Realtime.DataCase,
    async: true,
    parameterize: [%{serializer: Phoenix.Socket.V1.JSONSerializer}, %{serializer: RealtimeWeb.Socket.V2Serializer}]

  use Mimic

  setup :set_mimic_from_context

  import Ecto.Query, only: [from: 2]
  import Generators
  import ExUnit.CaptureLog

  alias Ecto.UUID
  alias Realtime.Api.Message
  alias Realtime.FeatureFlags
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Authorization.Policies.PresencePolicies
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Repo
  alias RealtimeWeb.Endpoint
  alias RealtimeWeb.RealtimeChannel.BroadcastHandler

  setup [:initiate_tenant]

  @payload %{"event" => "test", "payload" => %{"a" => "b"}}

  describe "handle/3" do
    test "with write true policy, user is able to send message",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic, policies: %Policies{broadcast: %BroadcastPolicies{write: true}})

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_receive {:socket_push, :text, data}

        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end

      {:ok, %{avg: avg, bucket: buckets}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      # 100 sent by the socket + 100 delivered to the test process subscribed via fastlane
      assert Enum.sum(buckets) == 200
      assert avg > 0
    end

    test "with write false policy, user is not able to send message", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic, policies: %Policies{broadcast: %BroadcastPolicies{write: false}})

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(%{}, db_conn, socket)
          socket
      end

      refute_received _any

      {:ok, %{avg: avg}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      assert avg == 0.0
    end

    @tag policies: [:authenticated_read_broadcast, :authenticated_write_broadcast]
    test "with nil policy but valid user, is able to send message",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic)

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_received {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end

      {:ok, %{avg: avg, bucket: buckets}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      # 100 sent by the socket + 100 delivered to the test process subscribed via fastlane
      assert Enum.sum(buckets) == 200
      assert avg > 0.0
    end

    @tag policies: [:authenticated_read_matching_user_sub, :authenticated_write_matching_user_sub], sub: UUID.generate()
    test "with valid sub, is able to send message",
         %{topic: topic, tenant: tenant, db_conn: db_conn, sub: sub, serializer: serializer} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: nil, read: true}},
          claims: %{sub: sub}
        )

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_received {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end
    end

    @tag policies: [:authenticated_read_matching_user_sub, :authenticated_write_matching_user_sub], sub: UUID.generate()
    test "with invalid sub, is not able to send message", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: nil, read: true}},
          claims: %{sub: UUID.generate()}
        )

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(%{"a" => "b"}, db_conn, socket)
          socket
      end

      refute_receive {:socket_push, :text, _}, 120
    end

    @tag policies: [:read_matching_user_role, :write_matching_user_role], role: "anon"
    test "with valid role, is able to send message",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: nil, read: true}},
          claims: %{role: "anon"}
        )

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_received {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end
    end

    @tag policies: [:read_matching_user_role, :write_matching_user_role], role: "anon"
    test "with invalid role, is not able to send message", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: nil, read: true}},
          claims: %{role: "potato"}
        )

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(%{"a" => "b"}, db_conn, socket)
          socket
      end

      refute_receive {:socket_push, :text, _}, 120
    end

    test "with nil policy and invalid user, won't send message", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic)

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(%{}, db_conn, socket)
          socket
      end

      refute_received _any

      {:ok, %{avg: avg}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      assert avg == 0.0
    end

    @tag policies: [:authenticated_read_broadcast, :authenticated_write_broadcast]
    test "validation only runs once on nil and valid policies",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic)

      expect(Authorization, :get_write_authorizations, 1, fn conn, db_conn, auth_context, extension ->
        assert extension == :broadcast
        call_original(Authorization, :get_write_authorizations, [conn, db_conn, auth_context, extension])
      end)

      reject(&Authorization.get_write_authorizations/4)

      socket =
        for _ <- 1..100, reduce: socket do
          socket ->
            {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
            socket
        end

      assert %Policies{
               broadcast: %BroadcastPolicies{write: true},
               presence: %PresencePolicies{write: nil}
             } = socket.assigns.policies

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_receive {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end
    end

    test "validation only runs once on nil and blocking policies", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic)

      expect(Authorization, :get_write_authorizations, 1, fn conn, db_conn, auth_context, extension ->
        assert extension == :broadcast
        call_original(Authorization, :get_write_authorizations, [conn, db_conn, auth_context, extension])
      end)

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(%{}, db_conn, socket)
          socket
      end

      refute_receive _, 100
    end

    test "no ack still sends message", %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: true}},
          ack_broadcast: false
        )

      for _ <- 1..100, reduce: socket do
        socket ->
          {:noreply, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      Process.sleep(100)

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_received {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end
    end

    test "public channels are able to send messages",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_received {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end

      {:ok, %{avg: avg, bucket: buckets}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      # 100 sent by the socket + 100 delivered to the test process subscribed via fastlane
      assert Enum.sum(buckets) == 200
      assert avg > 0.0
    end

    test "public channels are able to send messages and ack",
         %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      for _ <- 1..100, reduce: socket do
        socket ->
          {:reply, :ok, socket} = BroadcastHandler.handle(@payload, db_conn, socket)
          socket
      end

      for _ <- 1..100 do
        topic = "realtime:#{topic}"
        assert_receive {:socket_push, :text, data}
        assert Jason.decode!(data) == message(serializer, topic, @payload)
      end

      {:ok, %{avg: avg, bucket: buckets}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      # 100 sent by the socket + 100 delivered to the test process subscribed via fastlane
      assert Enum.sum(buckets) == 200
      assert avg > 0.0
    end

    test "V2 json UserBroadcastPush", %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      user_broadcast_payload = %{"a" => "b"}
      json_encoded_user_broadcast_payload = Jason.encode!(user_broadcast_payload)

      {:reply, :ok, _socket} =
        BroadcastHandler.handle({"event123", :json, json_encoded_user_broadcast_payload, %{}}, db_conn, socket)

      topic = "realtime:#{topic}"
      assert_receive {:socket_push, code, data}

      if serializer == RealtimeWeb.Socket.V2Serializer do
        assert code == :binary

        assert data ==
                 <<
                   # user broadcast = 4
                   4::size(8),
                   # topic_size
                   byte_size(topic),
                   # user_event_size
                   byte_size("event123"),
                   # metadata_size
                   0,
                   # json encoding
                   1::size(8),
                   topic::binary,
                   "event123"
                 >> <> json_encoded_user_broadcast_payload
      else
        assert code == :text

        assert Jason.decode!(data) ==
                 message(serializer, topic, %{
                   "event" => "event123",
                   "payload" => user_broadcast_payload,
                   "type" => "broadcast"
                 })
      end
    end

    test "V2 binary UserBroadcastPush", %{topic: topic, tenant: tenant, db_conn: db_conn, serializer: serializer} do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      user_broadcast_payload = <<123, 456, 789>>

      {:reply, :ok, _socket} =
        BroadcastHandler.handle({"event123", :binary, user_broadcast_payload, %{}}, db_conn, socket)

      topic = "realtime:#{topic}"

      if serializer == RealtimeWeb.Socket.V2Serializer do
        assert_receive {:socket_push, :binary, data}

        assert data ==
                 <<
                   # user broadcast = 4
                   4::size(8),
                   # topic_size
                   byte_size(topic),
                   # user_event_size
                   byte_size("event123"),
                   # metadata_size
                   0,
                   # binary encoding
                   0::size(8),
                   topic::binary,
                   "event123"
                 >> <> user_broadcast_payload
      else
        # Can't receive binary payloads on V1 serializer
        refute_receive {:socket_push, _code, _data}
      end
    end

    test "increase_connection_pool from write authorization does not log UnableToSetPolicies",
         %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic)

      stub(Authorization, :get_write_authorizations, fn _, _, _, _ -> {:error, :increase_connection_pool} end)

      log =
        capture_log(fn ->
          {:noreply, _socket} = BroadcastHandler.handle(%{}, db_conn, socket)
        end)

      refute log =~ "UnableToSetPolicies"
    end

    @tag policies: [:broken_write_presence]
    test "handle failing rls policy", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic)

      log =
        capture_log(fn ->
          {:noreply, _socket} = BroadcastHandler.handle(%{}, db_conn, socket)

          {:ok, %{avg: avg}} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
          assert avg == 0.0

          refute_receive _, 200
        end)

      assert log =~ "RlsPolicyError"
    end

    test "handle payload size excedding limits in private channels", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: true}},
          ack_broadcast: false
        )

      assert {:noreply, _} =
               BroadcastHandler.handle(
                 %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 1)},
                 db_conn,
                 socket
               )

      refute_receive {:socket_push, :text, _}, 120
    end

    test "handle payload size excedding limits in public channels", %{topic: topic, tenant: tenant, db_conn: db_conn} do
      socket = socket_fixture(tenant, topic, ack_broadcast: false, private?: false)

      assert {:noreply, _} =
               BroadcastHandler.handle(
                 %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 1)},
                 db_conn,
                 socket
               )

      refute_receive {:socket_push, :text, _}, 120
    end

    test "handle payload size excedding limits in private channel and if ack it will receive error", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{broadcast: %BroadcastPolicies{write: true}},
          ack_broadcast: true
        )

      assert {:reply, {:error, :payload_size_exceeded}, _} =
               BroadcastHandler.handle(
                 %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 1)},
                 db_conn,
                 socket
               )

      refute_receive {:socket_push, :text, _}, 120
    end

    test "handle payload size excedding limits in public channels and if ack it will receive error", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket = socket_fixture(tenant, topic, ack_broadcast: true, private?: false)

      assert {:reply, {:error, :payload_size_exceeded}, _} =
               BroadcastHandler.handle(
                 %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 1)},
                 db_conn,
                 socket
               )

      refute_receive {:socket_push, :text, _}, 120
    end
  end

  describe "broadcast persistence" do
    setup do
      stub(FeatureFlags, :enabled?, fn
        "broadcast_persistence", _tenant_id -> true
        flag, tenant_id -> call_original(FeatureFlags, :enabled?, [flag, tenant_id])
      end)

      :ok
    end

    test "broadcast authorized to persist is stored and acks with its id", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      assert {:reply, {:ok, %{id: id}}, _socket} = BroadcastHandler.handle(@payload, db_conn, socket)
      expected_payload = @payload["payload"]

      assert {:ok,
              [
                %Message{
                  id: ^id,
                  topic: ^topic,
                  event: "test",
                  extension: :broadcast,
                  private: true,
                  payload: ^expected_payload,
                  skip_broadcast: true
                }
              ]} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "broadcast without ack does not wait for the message to be persisted", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: false,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      assert {:noreply, _socket} = BroadcastHandler.handle(@payload, db_conn, socket)

      assert_eventually(
        {:ok, [%Message{topic: ^topic, event: "test", skip_broadcast: true}]} =
          Repo.all(db_conn, messages_for(topic), Message)
      )
    end

    test "V2 json user broadcast authorized to persist stores the user payload", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      v2_payload = {"event123", :json, Jason.encode!(%{"a" => "b"}), %{}}

      assert {:reply, {:ok, %{id: id}}, _socket} = BroadcastHandler.handle(v2_payload, db_conn, socket)

      assert {:ok,
              [
                %Message{
                  id: ^id,
                  topic: ^topic,
                  event: "event123",
                  extension: :broadcast,
                  private: true,
                  payload: %{"a" => "b"},
                  skip_broadcast: true
                }
              ]} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "V2 json user broadcast with an invalid user payload is not persisted, and dropped for V1", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn,
      serializer: serializer
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      v2_payload = {"event123", :json, "not json at all", %{}}

      log =
        capture_log(fn ->
          assert {:reply, :ok, _socket} = BroadcastHandler.handle(v2_payload, db_conn, socket)
        end)

      case serializer do
        # V1 rejects it
        Phoenix.Socket.V1.JSONSerializer -> refute_receive {:socket_push, _encoding, _data}
        RealtimeWeb.Socket.V2Serializer -> assert_receive {:socket_push, _encoding, _data}
      end

      assert log =~ "UnableToPersistMessage"
      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "V2 binary user broadcast authorized to persist is stored as binary_payload", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      binary = <<0, 1, 2, 3>>

      assert {:reply, {:ok, %{id: id}}, _socket} =
               BroadcastHandler.handle({"event123", :binary, binary, %{}}, db_conn, socket)

      assert {:ok,
              [
                %Message{
                  id: ^id,
                  event: "event123",
                  payload: nil,
                  binary_payload: ^binary,
                  extension: :broadcast,
                  private: true,
                  skip_broadcast: true
                }
              ]} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "unsupported payload shape is delivered, not persisted, and logged", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      log =
        capture_log(fn ->
          assert {:reply, :ok, _socket} = BroadcastHandler.handle(%{"no" => "event or payload"}, db_conn, socket)
        end)

      assert log =~ "UnableToPersistMessage"
      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "persistence failure still delivers the broadcast and acks ok", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      expect(Repo, :insert, fn _conn, _changeset, _module -> {:error, :boom} end)

      socket =
        socket_fixture(tenant, topic,
          ack_broadcast: true,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: true}
          }
        )

      log =
        capture_log(fn ->
          assert {:reply, :ok, _socket} = BroadcastHandler.handle(@payload, db_conn, socket)
        end)

      assert_receive {:socket_push, :text, _data}
      assert log =~ "UnableToPersistMessage"
      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "broadcast without a persistence policy is sent but not stored", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket =
        socket_fixture(tenant, topic,
          policies: %Policies{
            broadcast: %BroadcastPolicies{write: true, persist: false}
          }
        )

      assert {:reply, :ok, _socket} = BroadcastHandler.handle(@payload, db_conn, socket)

      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "unauthorized private broadcast is not stored", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket = socket_fixture(tenant, topic, policies: %Policies{broadcast: %BroadcastPolicies{write: false}})

      assert {:noreply, _socket} = BroadcastHandler.handle(@payload, db_conn, socket)

      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "public channel broadcasts and acks but is not stored", %{
      topic: topic,
      tenant: tenant,
      db_conn: db_conn
    } do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      assert {:reply, :ok, _socket} = BroadcastHandler.handle(@payload, nil, socket)

      assert {:ok, []} = Repo.all(db_conn, messages_for(topic), Message)
    end

    test "public channel without a database connection still broadcasts and acks", %{
      topic: topic,
      tenant: tenant
    } do
      socket = socket_fixture(tenant, topic, private?: false, policies: nil)

      assert {:reply, :ok, _socket} = BroadcastHandler.handle(@payload, nil, socket)
    end
  end

  defp initiate_tenant(context) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)

    # Warm cache to avoid Cachex and Ecto.Sandbox ownership issues
    Realtime.Tenants.Cache.update_cache(tenant)

    rate = Tenants.events_per_second_rate(tenant)
    RateCounter.new(rate, tick: 100)

    {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
    assert Connect.ready?(tenant.external_id)

    topic = random_string()
    # Simulate fastlane
    fastlane =
      RealtimeWeb.RealtimeChannel.MessageDispatcher.fastlane_metadata(
        self(),
        context.serializer,
        "realtime:#{topic}",
        :warning,
        "tenant_id"
      )

    Endpoint.subscribe("realtime:#{topic}", metadata: fastlane)

    if policies = context[:policies] do
      sub = context[:sub]
      role = context[:role]
      create_rls_policies(db_conn, policies, %{topic: topic, sub: sub, role: role})
    end

    %{tenant: tenant, topic: topic, db_conn: db_conn}
  end

  defp socket_fixture(tenant, topic, opts \\ []) do
    policies = Keyword.get(opts, :policies, %Policies{broadcast: %BroadcastPolicies{write: nil, read: true}})
    ack_broadcast = Keyword.get(opts, :ack_broadcast, true)
    private? = Keyword.get(opts, :private?, true)

    default_claims = %{sub: UUID.generate(), role: "authenticated", exp: Joken.current_time() + 1_000}
    claims = Keyword.get(opts, :claims, %{})
    claims = Map.merge(default_claims, claims)

    signer = Joken.Signer.create("HS256", "secret")
    jwt = Joken.generate_and_sign!(%{}, claims, signer)

    authorization_context =
      Authorization.build_authorization_params(%{
        tenant_id: tenant.external_id,
        topic: topic,
        jwt: jwt,
        claims: claims,
        headers: [{"header-1", "value-1"}],
        role: claims.role,
        sub: claims.sub
      })

    tenant_topic = "realtime:#{topic}"
    self_broadcast = true

    %Phoenix.Socket{
      assigns: %{
        tenant_topic: tenant_topic,
        ack_broadcast: ack_broadcast,
        self_broadcast: self_broadcast,
        policies: policies,
        authorization_context: authorization_context,
        private?: private?,
        tenant: tenant.external_id
      }
    }
  end

  defp message(RealtimeWeb.Socket.V2Serializer, topic, payload), do: [nil, nil, topic, "broadcast", payload]

  defp message(Phoenix.Socket.V1.JSONSerializer, topic, payload) do
    %{"event" => "broadcast", "payload" => payload, "ref" => nil, "topic" => topic}
  end

  defp messages_for(topic), do: from(m in Message, where: m.topic == ^topic)
end
