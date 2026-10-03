defmodule RealtimeWeb.BroadcastSingleControllerTest do
  use RealtimeWeb.ConnCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import Ecto.Query, only: [from: 2]

  alias Realtime.Api
  alias Realtime.Api.Message
  alias Realtime.Crypto
  alias Realtime.Database
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection
  alias Realtime.Tenants.Repo

  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.Endpoint

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

  defp subscribe(tenant_topic, topic, serializer \\ Phoenix.Socket.V1.JSONSerializer) do
    fastlane = RealtimeChannel.MessageDispatcher.fastlane_metadata(self(), serializer, topic, :error, "tenant_id")

    Endpoint.subscribe(tenant_topic, metadata: fastlane)
  end

  defp assert_receive_message do
    assert_receive {:socket_push, :text, data}

    data
    |> IO.iodata_to_binary()
    |> Jason.decode!()
  end

  describe "JSON broadcast" do
    test "returns 202 when JSON message is broadcasted", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "room:123"
      event = "message"
      topic = Tenants.tenant_topic(tenant, sub_topic)
      payload = %{"text" => "hello", "user" => "alice"}
      json_payload = Jason.encode!(payload)

      subscribe(topic, sub_topic)
      subscribe(topic, sub_topic, RealtimeWeb.Socket.V2Serializer)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), payload)

      assert conn.status == 202

      message = assert_receive_message()

      assert message == %{
               "event" => "broadcast",
               "payload" => %{
                 "payload" => payload,
                 "event" => event,
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => sub_topic
             }

      # Assert WebSocket binary message received with V2Serializer format
      assert_receive {:socket_push, :binary, data}

      # Verify V2 binary format:
      # Header: [type(1), topic_size(1), event_size(1), metadata_size(1), encoding(1)]
      # Body: [topic, event, metadata?, payload]
      topic_size = byte_size(sub_topic)
      event_size = byte_size(event)

      assert IO.iodata_to_binary(data) == <<
               # user broadcast type = 4
               4::size(8),
               # sizes
               topic_size::size(8),
               event_size::size(8),
               # metadata_size = 0 (no metadata)
               0::size(8),
               # json encoding = 1
               1::size(8),
               # topic and event strings
               sub_topic::binary,
               event::binary,
               # binary payload
               json_payload::binary
             >>

      refute_receive {:socket_push, _, _}
    end

    test "handles empty JSON payload", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "room:456"
      event = "empty"
      topic = Tenants.tenant_topic(tenant, sub_topic)

      subscribe(topic, sub_topic)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{})

      assert conn.status == 202

      message = assert_receive_message()

      assert message == %{
               "event" => "broadcast",
               "payload" => %{
                 "payload" => %{},
                 "event" => event,
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => sub_topic
             }

      refute_receive {:socket_push, _, _}
    end

    test "handles topics with colons", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "room:lobby:main"
      event = "message"
      topic = Tenants.tenant_topic(tenant, sub_topic)

      subscribe(topic, sub_topic)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 202

      message = assert_receive_message()

      assert message == %{
               "event" => "broadcast",
               "payload" => %{
                 "payload" => %{"data" => "test"},
                 "event" => event,
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => sub_topic
             }

      refute_receive {:socket_push, _, _}
    end

    test "returns 422 when private=true and the JWT role cannot be set in Postgres", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)

      # Only request counter is bumped; broadcast counter must NOT be incremented because no message is published.
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      sub_topic = "private:room"
      event = "secret"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event) <> "?private=true", %{
          "secret" => "data"
        })

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "RLS policy error"
    end

    test "handles private=false query param (default)", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "public:room"
      event = "message"
      topic = Tenants.tenant_topic(tenant, sub_topic)

      subscribe(topic, sub_topic)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event) <> "?private=false", %{
          "data" => "public"
        })

      assert conn.status == 202
    end

    test "returns 422 when JSON payload exceeds size limit", %{conn: conn, tenant: tenant} do
      # Drop deliveries counted by previous tests sharing this tenant
      Realtime.GenCounter.reset(Tenants.events_per_second_key(tenant))
      request_events_key = Tenants.requests_per_second_key(tenant)

      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      sub_topic = "room:large"
      event = "message"
      large_payload = %{"data" => String.duplicate("a", tenant.max_payload_size_in_kb * 1024)}

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), large_payload)

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["errors"]["payload"] == ["Payload size exceeds tenant limit"]

      {:ok, rate_counter} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      assert [0 | _] = rate_counter.bucket
    end

    test "returns 401 when JWT is expired", %{conn: conn, tenant: tenant} do
      sub_topic = "room:123"
      event = "message"
      now = System.system_time(:second)
      expired_token = generate_jwt_token(tenant, %{role: "anon", iat: now - 200, exp: now - 100})

      conn =
        conn
        |> put_req_header("authorization", "Bearer #{expired_token}")
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 401
    end

    test "returns 401 when JWT is missing", %{conn: conn, tenant: _tenant} do
      sub_topic = "room:123"
      event = "message"

      conn =
        conn
        |> delete_req_header("authorization")
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 401
    end
  end

  describe "Binary broadcast" do
    test "returns 202 when binary message is broadcasted", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "binary:room"
      event = "data"
      topic = Tenants.tenant_topic(tenant, sub_topic)
      binary_payload = <<1, 2, 3, 4, 5>>

      # Subscribe with V2Serializer to receive binary messages
      subscribe(topic, sub_topic, RealtimeWeb.Socket.V2Serializer)

      conn =
        conn
        |> put_req_header("content-type", "application/octet-stream")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), binary_payload)

      assert conn.status == 202

      # Assert binary message received with V2Serializer format
      assert_receive {:socket_push, :binary, data}

      # Verify V2 binary format:
      # Header: [type(1), topic_size(1), event_size(1), metadata_size(1), encoding(1)]
      # Body: [topic, event, metadata?, payload]
      topic_size = byte_size(sub_topic)
      event_size = byte_size(event)

      assert IO.iodata_to_binary(data) == <<
               # user broadcast type = 4
               4::size(8),
               # sizes
               topic_size::size(8),
               event_size::size(8),
               # metadata_size = 0 (no metadata)
               0::size(8),
               # binary encoding = 0
               0::size(8),
               # topic and event strings
               sub_topic::binary,
               event::binary,
               # binary payload
               binary_payload::binary
             >>
    end

    test "handles empty binary payload", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "binary:empty"
      event = "empty"

      conn =
        conn
        |> put_req_header("content-type", "application/octet-stream")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), <<>>)

      assert conn.status == 202
    end

    test "returns 422 when binary payload exceeds size limit", %{conn: conn, tenant: tenant} do
      # Drop deliveries counted by previous tests sharing this tenant
      Realtime.GenCounter.reset(Tenants.events_per_second_key(tenant))
      request_events_key = Tenants.requests_per_second_key(tenant)

      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      sub_topic = "binary:large"
      event = "data"
      large_binary = :crypto.strong_rand_bytes(tenant.max_payload_size_in_kb * 1024 + 1)

      conn =
        conn
        |> put_req_header("content-type", "application/octet-stream")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), large_binary)

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["errors"]["payload"] == ["Payload size exceeds tenant limit"]

      {:ok, rate_counter} = RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant))
      assert [0 | _] = rate_counter.bucket
    end

    test "returns 401 when JWT is expired for binary", %{conn: conn, tenant: tenant} do
      sub_topic = "binary:room"
      event = "data"
      now = System.system_time(:second)
      expired_token = generate_jwt_token(tenant, %{role: "anon", iat: now - 200, exp: now - 100})

      conn =
        conn
        |> put_req_header("authorization", "Bearer #{expired_token}")
        |> put_req_header("content-type", "application/octet-stream")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), <<1, 2, 3>>)

      assert conn.status == 401
    end
  end

  describe "Content-Type handling" do
    test "returns 415 for unsupported content type", %{conn: conn, tenant: _tenant} do
      sub_topic = "room:123"
      event = "message"

      conn =
        conn
        |> put_req_header("content-type", "text/plain")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), "plain text")

      assert conn.status == 415
      assert Jason.decode!(conn.resp_body)["error"] =~ "Unsupported Media Type"
    end

    test "handles application/json with charset", %{conn: conn, tenant: tenant} do
      broadcast_events_key = Tenants.events_per_second_key(tenant)
      request_events_key = Tenants.requests_per_second_key(tenant)

      GenCounter
      |> expect(:add, fn ^request_events_key -> :ok end)
      |> expect(:add, fn ^broadcast_events_key -> :ok end)

      sub_topic = "room:charset"
      event = "message"

      conn =
        conn
        |> put_req_header("content-type", "application/json; charset=utf-8")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 202
    end
  end

  describe "suspended tenant" do
    test "returns 403 and does not broadcast when tenant is suspended", %{conn: conn, tenant: tenant} do
      Realtime.Tenants.Cache.update_cache(%{tenant | suspend: true})

      sub_topic = "room:123"
      event = "message"
      topic = Tenants.tenant_topic(tenant, sub_topic)

      subscribe(topic, sub_topic)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 403
      assert Jason.decode!(conn.resp_body)["message"] == "Tenant is suspended"

      refute_receive {:socket_push, _, _}
    end
  end

  describe "Rate limiting" do
    test "returns 429 when rate limit is exceeded", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      events_per_second_rate = Tenants.events_per_second_rate(tenant)

      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      RateCounter
      |> stub(:new, fn _ -> {:ok, nil} end)
      |> stub(:get, fn rate ->
        case rate do
          ^events_per_second_rate ->
            {:ok, %RateCounter{avg: tenant.max_events_per_second + 1}}

          _ ->
            {:ok, %RateCounter{avg: 0}}
        end
      end)

      sub_topic = "room:rate-limited"
      event = "message"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event), %{"data" => "test"})

      assert conn.status == 429
    end
  end

  describe "Private broadcast authorization" do
    setup %{conn: conn, tenant: tenant} do
      jwt_secret = Crypto.decrypt!(tenant.jwt_secret)
      claims = %{sub: "test-user", role: "anon", exp: Joken.current_time() + 1_000}
      signer = Joken.Signer.create("HS256", jwt_secret)
      jwt = Joken.generate_and_sign!(%{}, claims, signer)

      conn =
        conn
        |> delete_req_header("authorization")
        |> put_req_header("authorization", "Bearer #{jwt}")

      {:ok, conn: conn}
    end

    test "returns 403 when anon caller has no RLS write policy", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)

      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      sub_topic = "private:room"
      event = "secret"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, sub_topic, event) <> "?private=true", %{
          "secret" => "data"
        })

      assert conn.status == 403
      assert Jason.decode!(conn.resp_body)["message"] == "Unauthorized"
    end

    test "returns 422 when authorization query is canceled", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Authorization, :get_write_authorizations, fn _, _, :broadcast ->
        {:error, :query_canceled,
         %Postgrex.Error{postgres: %{code: :query_canceled, message: "canceling statement due to user request"}}}
      end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Query canceled"
    end

    test "returns 422 when messages partition is missing", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Authorization, :get_write_authorizations, fn _, _, :broadcast -> {:error, :missing_partition} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Missing messages partition"
    end

    test "returns 429 when authorization signals connection pool exhaustion", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Authorization, :get_write_authorizations, fn _, _, :broadcast -> {:error, :increase_connection_pool} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 429
      assert Jason.decode!(conn.resp_body)["message"] == "Connection pool exhausted"
    end

    test "returns 422 when tenant database is unavailable", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Authorization, :get_write_authorizations, fn _, _, :broadcast ->
        {:error, :tenant_database_unavailable}
      end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Tenant database unavailable"
    end

    test "returns 500 for unexpected authorization errors", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Authorization, :get_write_authorizations, fn _, _, :broadcast -> {:error, "boom"} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 500
      assert Jason.decode!(conn.resp_body)["message"] == "Unable to authorize broadcast"
    end

    test "returns 422 when tenant database is initializing", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :initializing} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Tenant database initializing"
    end

    test "returns 422 when tenant database connection is initializing", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :tenant_database_connection_initializing} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Tenant database connection initializing"
    end

    test "returns 422 when tenant database has too many connections", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :tenant_db_too_many_connections} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Tenant database has too many connections"
    end

    test "returns 422 when connect rate limit is reached", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :connect_rate_limit_reached} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["message"] == "Connect rate limit reached"
    end

    test "returns 500 when an RPC error occurs while looking up the connection", %{conn: conn, tenant: tenant} do
      request_events_key = Tenants.requests_per_second_key(tenant)
      expect(GenCounter, :add, fn ^request_events_key -> :ok end)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, :timeout} end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(Routes.broadcast_single_path(conn, :broadcast, "private:room", "evt") <> "?private=true", %{"a" => 1})

      assert conn.status == 500
      assert Jason.decode!(conn.resp_body)["message"] == "RPC error"
    end
  end

  describe "broadcast persistence" do
    setup %{conn: conn, tenant: tenant} do
      enable_broadcast_persistence_flag!(tenant)
      jwt_secret = Crypto.decrypt!(tenant.jwt_secret)

      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      clean_table(db_conn, "realtime", "messages")

      claims = %{sub: random_string(), role: "authenticated", exp: Joken.current_time() + 1_000}
      signer = Joken.Signer.create("HS256", jwt_secret)
      jwt = Joken.generate_and_sign!(%{}, claims, signer)

      conn =
        conn
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer #{jwt}")
        |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})

      {:ok, conn: conn, db_conn: db_conn}
    end

    test "persist=true stores the message and does not broadcast it again from the database", %{
      conn: conn,
      db_conn: db_conn,
      tenant: tenant
    } do
      # Other tests in this module assert this tenant's events counter is 0.0
      stub(GenCounter, :add, fn _ -> :ok end)

      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      sub_topic = random_string()
      event = random_string()

      create_rls_policies(
        db_conn,
        [:authenticated_read_broadcast, :authenticated_write_broadcast, :authenticated_write_persistence],
        %{topic: sub_topic}
      )

      subscribe(Tenants.tenant_topic(tenant.external_id, sub_topic, false), sub_topic)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(
          Routes.broadcast_single_path(conn, :broadcast, sub_topic, event) <> "?private=true&persist=true",
          %{"content" => "hello"}
        )

      assert conn.status == 202
      assert_receive {:socket_push, :text, _data}, 500

      assert_eventually(
        {:ok, [%Message{topic: ^sub_topic, event: ^event, skip_broadcast: true}]} =
          Repo.all(db_conn, messages_for(sub_topic), Message)
      )

      # The stored row reaches the replication stream but must not be delivered a second time
      refute_receive {:socket_push, :text, _}, 500
    end

    test "does not store without persist=true", %{conn: conn, db_conn: db_conn} do
      stub(GenCounter, :add, fn _ -> :ok end)

      sub_topic = random_string()
      event = random_string()

      create_rls_policies(
        db_conn,
        [:authenticated_read_broadcast, :authenticated_write_broadcast, :authenticated_write_persistence],
        %{topic: sub_topic}
      )

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(
          Routes.broadcast_single_path(conn, :broadcast, sub_topic, event) <> "?private=true",
          %{"content" => "hello"}
        )

      assert conn.status == 202

      refute_eventually match?({:ok, [_ | _]}, Repo.all(db_conn, messages_for(sub_topic), Message))
    end

    test "rejects persist=true on a public broadcast", %{conn: conn} do
      stub(GenCounter, :add, fn _ -> :ok end)

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(
          Routes.broadcast_single_path(conn, :broadcast, random_string(), random_string()) <> "?persist=true",
          %{"content" => "hello"}
        )

      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["errors"]["persist"] == ["can only be used on private channels"]
    end
  end

  # Enables the `broadcast_persistence` flag for real: the flag is created and pushed into the local
  # FeatureFlags cache so the replication connection process reads it synchronously, and torn down
  # afterwards so it does not leak into other tests via the shared in-memory cache.
  defp enable_broadcast_persistence_flag!(tenant) do
    {:ok, flag} = Api.upsert_feature_flag(%{name: "broadcast_persistence", enabled: false})
    FeatureFlags.Cache.update_cache(flag)
    {:ok, tenant} = FeatureFlags.set_tenant_flag("broadcast_persistence", tenant.external_id, true)
    Realtime.Tenants.Cache.update_cache(tenant)
    on_exit(fn -> FeatureFlags.Cache.invalidate_cache("broadcast_persistence") end)
  end

  defp messages_for(topic), do: from(m in Message, where: m.topic == ^topic)

  defp generate_conn(conn, tenant) do
    now = System.system_time(:second)
    claims = %{role: "test", iat: now, exp: now + 100_000}

    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("authorization", "Bearer #{generate_jwt_token(tenant, claims)}")
    |> then(&%{&1 | host: "#{tenant.external_id}.supabase.com"})
  end
end
