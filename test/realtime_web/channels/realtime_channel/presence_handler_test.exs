defmodule RealtimeWeb.RealtimeChannel.PresenceHandlerTest do
  use Realtime.DataCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog
  import Generators

  alias Phoenix.Socket.Broadcast
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Authorization.Policies.PresencePolicies
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.Channels.Payloads
  alias RealtimeWeb.Endpoint
  alias RealtimeWeb.RealtimeChannel.PresenceHandler

  setup [:initiate_tenant]

  describe "is_private?/1" do
    @describetag without_db: true
    defmodule TestIsPrivate do
      import RealtimeWeb.RealtimeChannel.PresenceHandler

      def check(socket) when is_private?(socket), do: true
      def check(_socket), do: false
    end

    test "returns true if the socket is a private channel", %{tenant: tenant} do
      socket = socket_fixture(tenant, random_string(), random_string(), private?: true)
      assert TestIsPrivate.check(socket)
    end

    test "returns false if the socket is a public channel", %{tenant: tenant} do
      socket = socket_fixture(tenant, random_string(), random_string(), private?: false)
      refute TestIsPrivate.check(socket)
    end
  end

  describe "can_read_presence?/1" do
    @describetag without_db: true
    defmodule TestCanReadPresence do
      import RealtimeWeb.RealtimeChannel.PresenceHandler

      def check(socket) when can_read_presence?(socket), do: true
      def check(_socket), do: false
    end

    test "returns true if the socket is a private channel and the presence read policy is true", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{read: true}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: true)
      assert TestCanReadPresence.check(socket)
    end

    test "returns false if the socket is a private channel and the presence read policy is false", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{read: false}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: true)
      refute TestCanReadPresence.check(socket)
    end

    test "returns false if the socket is a public channel ", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{read: true}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: false)
      refute TestCanReadPresence.check(socket)

      policies = %Policies{presence: %PresencePolicies{read: false}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: false)
      refute TestCanReadPresence.check(socket)
    end
  end

  describe "can_write_presence?/1" do
    @describetag without_db: true
    defmodule TestCanWritePresence do
      import RealtimeWeb.RealtimeChannel.PresenceHandler

      def check(socket) when can_write_presence?(socket), do: true
      def check(_socket), do: false
    end

    test "returns true if the socket is a private channel and the presence write policy is true", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{write: true}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: true)
      assert TestCanWritePresence.check(socket)
    end

    test "returns false if the socket is a private channel and the presence write policy is false", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{write: false}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: true)
      refute TestCanWritePresence.check(socket)
    end

    test "returns false if the socket is a public channel and the presence write does not matter", %{tenant: tenant} do
      policies = %Policies{presence: %PresencePolicies{write: true}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: false)
      refute TestCanWritePresence.check(socket)

      policies = %Policies{presence: %PresencePolicies{write: false}}
      socket = socket_fixture(tenant, random_string(), random_string(), policies: policies, private?: false)
      refute TestCanWritePresence.check(socket)
    end
  end

  describe "join/2" do
    @describetag without_db: true

    test "presence is enabled when the client requests it, even if the tenant defaults it off", %{tenant: tenant} do
      tenant = %{tenant | presence_enabled: false}
      join = %Payloads.Join{config: %Payloads.Config{presence: %Payloads.Presence{enabled: true}}}

      assert %{presence_enabled?: true} = PresenceHandler.join(join, tenant)
    end

    test "presence is enabled when the tenant defaults it on, even if the client does not request it", %{
      tenant: tenant
    } do
      tenant = %{tenant | presence_enabled: true}
      join = %Payloads.Join{config: %Payloads.Config{presence: %Payloads.Presence{enabled: false}}}

      assert %{presence_enabled?: true} = PresenceHandler.join(join, tenant)
    end

    test "presence is disabled when neither the client nor the tenant enable it", %{tenant: tenant} do
      tenant = %{tenant | presence_enabled: false}
      join = %Payloads.Join{config: %Payloads.Config{presence: %Payloads.Presence{enabled: false}}}

      assert %{presence_enabled?: false} = PresenceHandler.join(join, tenant)
    end

    test "presence_key passes through an explicit client-provided key", %{tenant: tenant} do
      join = %Payloads.Join{config: %Payloads.Config{presence: %Payloads.Presence{key: "my-key"}}}

      assert %{presence_key: "my-key"} = PresenceHandler.join(join, tenant)
    end

    test "presence_key generates a UUID when the client does not provide one", %{tenant: tenant} do
      join = %Payloads.Join{config: %Payloads.Config{presence: %Payloads.Presence{key: nil}}}

      assert %{presence_key: key} = PresenceHandler.join(join, tenant)
      assert {:ok, _} = UUID.info(key)
    end
  end

  describe "join_rate_limits/1" do
    @describetag without_db: true

    test "presence_rate_counter matches the tenant's presence rate", %{tenant: tenant} do
      expected = Tenants.presence_events_per_second_rate(tenant)

      assert %{presence_rate_counter: ^expected} = PresenceHandler.join_rate_limits(tenant)
    end

    test "presence_client_rate_limit falls back to env config when the tenant has no override", %{tenant: tenant} do
      config = Application.get_env(:realtime, :client_presence_rate_limit)

      assert %{presence_client_rate_limit: %{max_calls: max_calls, window_ms: window_ms, counter: 0, reset_at: nil}} =
               PresenceHandler.join_rate_limits(tenant)

      assert max_calls == config[:max_calls]
      assert window_ms == config[:window_ms]
    end

    test "presence_client_rate_limit uses the tenant's max_client_presence_events_per_window override", %{
      tenant: tenant
    } do
      tenant = %{tenant | max_client_presence_events_per_window: 3}

      assert %{presence_client_rate_limit: %{max_calls: 3}} = PresenceHandler.join_rate_limits(tenant)
    end

    test "presence_client_rate_limit uses the tenant's client_presence_window_ms override", %{tenant: tenant} do
      tenant = %{tenant | client_presence_window_ms: 5_000}

      assert %{presence_client_rate_limit: %{window_ms: 5_000}} = PresenceHandler.join_rate_limits(tenant)
    end
  end

  describe "handle/2" do
    setup %{tenant: tenant} do
      on_exit(fn -> :telemetry.detach(__MODULE__) end)

      :telemetry.attach(
        __MODULE__,
        [:realtime, :tenants, :payload, :size],
        &__MODULE__.handle_telemetry/4,
        %{pid: self(), tenant: tenant}
      )
    end

    test "with true policy and is private, user can track their presence and changes", %{
      tenant: tenant,
      topic: topic
    } do
      external_id = tenant.external_id
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}

      socket =
        socket_fixture(tenant, topic, key, policies: policies)

      PresenceHandler.handle(%{"event" => "track", "payload" => %{"A" => "b", "c" => "b"}}, socket)
      topic = socket.assigns.tenant_topic

      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 30},
                      %{tenant: ^external_id, message_type: :presence}}
    end

    test "when tracking already existing user, metadata updated", %{tenant: tenant, topic: topic} do
      external_id = tenant.external_id
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies)

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "track"}, socket)

      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      payload = %{"event" => "track", "payload" => %{"content" => random_string()}}
      assert {:ok, _socket, _} = PresenceHandler.handle(payload, socket)

      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 6},
                      %{tenant: ^external_id, message_type: :presence}}

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 55},
                      %{tenant: ^external_id, message_type: :presence}}

      refute_receive _
    end

    test "tracking the same payload does nothing", %{tenant: tenant, topic: topic} do
      external_id = tenant.external_id
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies)

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "track", "payload" => %{"a" => "b"}}, socket)

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 18},
                      %{tenant: ^external_id, message_type: :presence}}

      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      assert {:ok, _socket, _} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"a" => "b"}}, socket)

      refute_receive _
    end

    test "tracking, untracking and then tracking the same payload emit events", context do
      %{tenant: tenant, topic: topic} = context
      external_id = tenant.external_id
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies)

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "track", "payload" => %{"a" => "b"}}, socket)
      assert socket.assigns.presence_track_payload == %{"a" => "b"}

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 18},
                      %{tenant: ^external_id, message_type: :presence}}

      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert %{^key => %{metas: [%{:phx_ref => _, "a" => "b"}]}} = joins

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)
      assert socket.assigns.presence_track_payload == nil

      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: %{}, leaves: leaves}}
      assert %{^key => %{metas: [%{:phx_ref => _, "a" => "b"}]}} = leaves

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "track", "payload" => %{"a" => "b"}}, socket)

      assert socket.assigns.presence_track_payload == %{"a" => "b"}

      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert %{^key => %{metas: [%{:phx_ref => _, "a" => "b"}]}} = joins

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 18},
                      %{tenant: ^external_id, message_type: :presence}}

      refute_receive _
    end

    test "with false policy and is public, user can track their presence and changes", %{tenant: tenant, topic: topic} do
      external_id = tenant.external_id
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: false, write: false}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "track"}, socket)

      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 6},
                      %{tenant: ^external_id, message_type: :presence}}
    end

    test "user can untrack when they want", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies)

      assert {:ok, socket, _} = PresenceHandler.handle(%{"event" => "track"}, socket)

      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: %{}, leaves: leaves}}
      assert Map.has_key?(leaves, key)
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "only checks write policies once on private channels", %{tenant: tenant, topic: topic} do
      expect(Authorization, :get_write_authorizations, 1, fn conn, db_conn, auth_context, extension ->
        assert extension == :presence
        call_original(Authorization, :get_write_authorizations, [conn, db_conn, auth_context, extension])
      end)

      key = random_string()
      # Use high client rate limit to test tenant-level rate limiting
      client_rate_limit = %{max_calls: 1000, window_ms: 60_000, counter: 0, reset_at: nil}
      socket = socket_fixture(tenant, topic, key, client_rate_limit: client_rate_limit)
      topic = socket.assigns.tenant_topic

      for _ <- 1..300, reduce: socket do
        socket ->
          assert {:ok, socket, _} =
                   PresenceHandler.handle(
                     %{"event" => "track", "payload" => %{"metadata" => random_string()}},
                     socket
                   )

          assert_receive %Broadcast{topic: ^topic, event: "presence_diff"}
          socket
      end
    end

    @tag policies: [:authenticated_read_presence, :authenticated_write_presence]
    test "leaves broadcast write policy unevaluated when tracking presence", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      socket = socket_fixture(tenant, topic, key)

      assert {:ok, socket, _} =
               PresenceHandler.handle(
                 %{"event" => "track", "payload" => %{"metadata" => random_string()}},
                 socket
               )

      assert %Policies{
               broadcast: %BroadcastPolicies{write: nil},
               presence: %PresencePolicies{write: true}
             } = socket.assigns.policies
    end

    test "increase_connection_pool from write authorization returns error and does not log UnableToSetPolicies",
         %{tenant: tenant, topic: topic} do
      stub(Authorization, :get_write_authorizations, fn _, _, _, _ -> {:error, :increase_connection_pool} end)

      key = random_string()
      socket = socket_fixture(tenant, topic, key)

      log =
        capture_log(fn ->
          assert {:error, :increase_connection_pool} =
                   PresenceHandler.handle(
                     %{"event" => "track", "payload" => %{"metadata" => random_string()}},
                     socket
                   )
        end)

      refute log =~ "UnableToSetPolicies"
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :broken_write_presence]
    test "handle failing rls policy", %{tenant: tenant, topic: topic} do
      expect(Authorization, :get_write_authorizations, 1, fn conn, db_conn, auth_context, extension ->
        assert extension == :presence
        call_original(Authorization, :get_write_authorizations, [conn, db_conn, auth_context, extension])
      end)

      key = random_string()
      socket = socket_fixture(tenant, topic, key)
      topic = socket.assigns.tenant_topic

      log =
        capture_log(fn ->
          assert {:error, :rls_policy_error} =
                   PresenceHandler.handle(
                     %{"event" => "track", "payload" => %{"metadata" => random_string()}},
                     socket
                   )

          refute_receive %Broadcast{topic: ^topic, event: "presence_diff"}, 1000
        end)

      assert log =~ "RlsPolicyError"
    end

    test "does not check write policies once on public channels", %{tenant: tenant, topic: topic} do
      reject(&Authorization.get_write_authorizations/4)

      key = random_string()
      policies = %Policies{broadcast: %BroadcastPolicies{read: false}}
      # Use high client rate limit to test tenant-level rate limiting
      client_rate_limit = %{max_calls: 1000, window_ms: 60_000, counter: 0, reset_at: nil}

      socket =
        socket_fixture(tenant, topic, key, policies: policies, private?: false, client_rate_limit: client_rate_limit)

      topic = socket.assigns.tenant_topic

      for _ <- 1..300, reduce: socket do
        socket ->
          assert {:ok, socket, _} =
                   PresenceHandler.handle(
                     %{"event" => "track", "payload" => %{"metadata" => random_string()}},
                     socket
                   )

          assert_receive %Broadcast{topic: ^topic, event: "presence_diff"}
          socket
      end
    end

    test "logs out non recognized events" do
      tenant = tenant_fixture()

      socket =
        socket_fixture(tenant, "topic", "presence_key",
          private?: false,
          client_rate_limit: %{max_calls: 1000, window_ms: 60_000, counter: 0, reset_at: nil}
        )

      log =
        capture_log(fn ->
          assert {:error, :unknown_presence_event} = PresenceHandler.handle(%{"event" => "unknown"}, socket)
        end)

      assert log =~ "UnknownPresenceEvent"
    end

    test "socket with presence enabled false will ignore non-track presence events in public channel", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false, enabled?: false)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)
      topic = socket.assigns.tenant_topic
      refute_receive %Broadcast{topic: ^topic, event: "presence_diff"}
    end

    test "socket with presence enabled false will ignore non-track presence events in private channel", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false, enabled?: false)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)
      topic = socket.assigns.tenant_topic
      refute_receive %Broadcast{topic: ^topic, event: "presence_diff"}
    end

    test "socket with presence disabled will enable presence on track message for public channel", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false, enabled?: false)

      refute socket.assigns.presence_enabled?

      assert {:ok, updated_socket, :resync} = PresenceHandler.handle(%{"event" => "track"}, socket)

      assert updated_socket.assigns.presence_enabled?
      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)
    end

    test "socket with presence disabled will enable presence on track message for private channel", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true, enabled?: false)

      refute socket.assigns.presence_enabled?

      assert {:ok, updated_socket, :resync} = PresenceHandler.handle(%{"event" => "track"}, socket)

      assert updated_socket.assigns.presence_enabled?
      topic = socket.assigns.tenant_topic
      assert_receive %Broadcast{topic: ^topic, event: "presence_diff", payload: %{joins: joins, leaves: %{}}}
      assert Map.has_key?(joins, key)
    end

    test "track reports no sync needed when presence is already enabled", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false, enabled?: true)

      assert socket.assigns.presence_enabled?

      assert {:ok, _updated_socket, :no_resync} = PresenceHandler.handle(%{"event" => "track"}, socket)
    end

    test "socket with presence disabled will not enable presence on untrack message", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, enabled?: false)

      refute socket.assigns.presence_enabled?

      assert {:ok, updated_socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)

      refute updated_socket.assigns.presence_enabled?
      topic = socket.assigns.tenant_topic
      refute_receive %Broadcast{topic: ^topic, event: "presence_diff"}
    end

    test "socket with presence disabled will not enable presence on unknown event", %{
      tenant: tenant,
      topic: topic
    } do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, enabled?: false)

      refute socket.assigns.presence_enabled?

      assert {:error, :unknown_presence_event} = PresenceHandler.handle(%{"event" => "unknown"}, socket)
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "rate limit is checked on private channel", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true)

      log =
        capture_log(fn ->
          for _ <- 1..1500, do: PresenceHandler.handle(%{"event" => "track"}, socket)

          {:ok, _} = RateCounterHelper.tick!(Tenants.presence_events_per_second_rate(tenant))

          assert {:error, :rate_limit_exceeded} = PresenceHandler.handle(%{"event" => "track"}, socket)
        end)

      assert log =~ "PresenceRateLimitReached"
    end

    test "rate limit is checked on public channel", %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: false)

      log =
        capture_log(fn ->
          for _ <- 1..1500, do: PresenceHandler.handle(%{"event" => "track"}, socket)

          {:ok, _} = RateCounterHelper.tick!(Tenants.presence_events_per_second_rate(tenant))

          assert {:error, :rate_limit_exceeded} = PresenceHandler.handle(%{"event" => "track"}, socket)
        end)

      assert log =~ "PresenceRateLimitReached"
    end

    test "returns error when track payload is not a map", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false)

      assert {:error, :invalid_payload} =
               PresenceHandler.handle(%{"event" => "track", "payload" => "1111"}, socket)

      topic = socket.assigns.tenant_topic
      refute_receive %Broadcast{topic: ^topic, event: "presence_diff"}
    end

    test "fails on high payload size", %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: false)
      payload_size = tenant.max_payload_size_in_kb * 1000

      payload = %{content: random_string(payload_size)}

      assert {:error, :payload_size_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => payload}, socket)
    end

    test "propagates a Connect rpc_error unchanged when authorizing an unresolved write policy on a private channel",
         %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: true)

      expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, :timeout} end)

      assert {:error, :rpc_error, :timeout} = PresenceHandler.handle(%{"event" => "track"}, socket)
    end

    test "untrack succeeds on a private channel even when Connect would fail", %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: true)

      reject(&Connect.lookup_or_start_connection/1)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "untrack"}, socket)
    end

    test "track succeeds on a private channel with an already-resolved write policy even when Connect would fail",
         %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true)

      reject(&Connect.lookup_or_start_connection/1)

      assert {:ok, _socket, _} = PresenceHandler.handle(%{"event" => "track", "payload" => %{"a" => "b"}}, socket)
    end
  end

  describe "sync/1" do
    test "syncs presence state for public channels", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: false, write: false}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: false)

      assert :ok = PresenceHandler.sync(socket)
      assert_receive {_, :text, msg}
      msg = Jason.decode!(msg)
      assert msg["event"] == "presence_state"
    end

    test "syncs presence state for private channels with read policy true", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true)

      assert :ok = PresenceHandler.sync(socket)
      assert_receive {_, :text, msg}
      msg = Jason.decode!(msg)
      assert msg["event"] == "presence_state"
    end

    test "ignores sync for private channels with read policy false", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: false, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true)

      assert :ok = PresenceHandler.sync(socket)
      refute_receive {_, :text, _}
    end

    test "ignores sync when presence is disabled", %{tenant: tenant, topic: topic} do
      key = random_string()
      policies = %Policies{presence: %PresencePolicies{read: true, write: true}}
      socket = socket_fixture(tenant, topic, key, policies: policies, private?: true, enabled?: false)

      assert :ok = PresenceHandler.sync(socket)
      refute_receive {_, :text, _}
    end

    test "respects rate limits on public channels", %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: false)

      log =
        capture_log(fn ->
          for _ <- 1..1500, do: PresenceHandler.handle(%{"event" => "track"}, socket)

          {:ok, _} = RateCounterHelper.tick!(Tenants.presence_events_per_second_rate(tenant))

          assert {:error, :rate_limit_exceeded} = PresenceHandler.handle(%{"event" => "track"}, socket)
        end)

      assert log =~ "PresenceRateLimitReached"
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "respects rate limits on private channels", %{tenant: tenant, topic: topic} do
      key = random_string()
      socket = socket_fixture(tenant, topic, key, private?: true)

      log =
        capture_log(fn ->
          for _ <- 1..1500, do: PresenceHandler.handle(%{"event" => "track"}, socket)

          {:ok, _} = RateCounterHelper.tick!(Tenants.presence_events_per_second_rate(tenant))

          assert {:error, :rate_limit_exceeded} = PresenceHandler.handle(%{"event" => "track"}, socket)
        end)

      assert log =~ "PresenceRateLimitReached"
    end
  end

  describe "per-client rate limiting" do
    @describetag without_db: true
    test "allows calls under the limit", %{tenant: tenant, topic: topic} do
      client_rate_limit = %{max_calls: 10, window_ms: 60_000, counter: 0, reset_at: nil}
      socket = socket_fixture(tenant, topic, random_string(), private?: false, client_rate_limit: client_rate_limit)

      # Make 9 calls (under limit of 10)
      socket =
        Enum.reduce(1..9, socket, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      assert %{counter: 9, max_calls: 10, window_ms: 60000, reset_at: _} = socket.assigns.presence_client_rate_limit

      # 10th call should still work
      assert {:ok, socket, _} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)

      assert %{counter: 10, max_calls: 10, window_ms: 60000, reset_at: _} = socket.assigns.presence_client_rate_limit
    end

    test "blocks calls over the limit", %{tenant: tenant, topic: topic} do
      client_rate_limit = %{max_calls: 10, window_ms: 60_000, counter: 0, reset_at: nil}
      socket = socket_fixture(tenant, topic, random_string(), private?: false, client_rate_limit: client_rate_limit)

      # Make 10 calls (at limit)
      socket =
        Enum.reduce(1..10, socket, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      # 11th call should fail
      assert {:error, :client_rate_limit_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)

      assert %{counter: 10, max_calls: 10, window_ms: 60000, reset_at: _} = socket.assigns.presence_client_rate_limit
    end

    test "rate limits work independently per socket", %{tenant: tenant, topic: topic} do
      client_rate_limit = %{max_calls: 10, window_ms: 60_000, counter: 0, reset_at: nil}
      socket1 = socket_fixture(tenant, topic, random_string(), private?: false, client_rate_limit: client_rate_limit)
      socket2 = socket_fixture(tenant, topic, random_string(), private?: false, client_rate_limit: client_rate_limit)

      socket1 =
        Enum.reduce(1..10, socket1, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      assert {:error, :client_rate_limit_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket1)

      # socket2 should still work (independent limit)
      assert {:ok, _socket, _} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket2)
    end

    test "tenant override for max_client_presence_events_per_window is applied", %{tenant: tenant, topic: topic} do
      {:ok, updated_tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{max_client_presence_events_per_window: 3})

      Realtime.Tenants.Cache.update_cache(updated_tenant)

      socket = socket_fixture(updated_tenant, topic, random_string(), private?: false)

      assert %{max_calls: 3} = socket.assigns.presence_client_rate_limit

      socket =
        Enum.reduce(1..3, socket, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      assert {:error, :client_rate_limit_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)
    end

    test "falls back to env config when tenant override is nil", %{tenant: tenant, topic: topic} do
      assert is_nil(tenant.max_client_presence_events_per_window)
      assert is_nil(tenant.client_presence_window_ms)

      config = Application.get_env(:realtime, :client_presence_rate_limit)
      expected_max_calls = config[:max_calls]
      expected_window_ms = config[:window_ms]
      socket = socket_fixture(tenant, topic, random_string(), private?: false)

      assert %{max_calls: ^expected_max_calls, window_ms: ^expected_window_ms} =
               socket.assigns.presence_client_rate_limit
    end

    test "tenant override for client_presence_window_ms is applied", %{tenant: tenant, topic: topic} do
      {:ok, updated_tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{client_presence_window_ms: 5_000})

      Realtime.Tenants.Cache.update_cache(updated_tenant)

      socket = socket_fixture(updated_tenant, topic, random_string(), private?: false)

      assert %{window_ms: 5_000} = socket.assigns.presence_client_rate_limit
    end

    test "tenant override for client_presence_window_ms respects the window", %{tenant: tenant, topic: topic} do
      {:ok, updated_tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{
          max_client_presence_events_per_window: 3,
          client_presence_window_ms: 100
        })

      Realtime.Tenants.Cache.update_cache(updated_tenant)

      socket = socket_fixture(updated_tenant, topic, random_string(), private?: false)

      assert %{max_calls: 3, window_ms: 100} = socket.assigns.presence_client_rate_limit

      socket =
        Enum.reduce(1..3, socket, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      assert {:error, :client_rate_limit_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)

      Process.sleep(101)

      assert {:ok, _socket, _} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)
    end

    test "rate limit resets after window expires", %{tenant: tenant, topic: topic} do
      # Create socket with a very short window (100ms)
      socket = socket_fixture(tenant, topic, random_string(), private?: false)

      # Override the window to be very short for testing
      short_window_config = %{
        max_calls: 3,
        window_ms: 100,
        counter: 0,
        reset_at: nil
      }

      socket = %{socket | assigns: Map.put(socket.assigns, :presence_client_rate_limit, short_window_config)}

      # Make 3 calls (at limit)
      socket =
        Enum.reduce(1..3, socket, fn _, acc_socket ->
          {:ok, updated_socket, _} =
            PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, acc_socket)

          updated_socket
        end)

      # 4th call should fail
      assert {:error, :client_rate_limit_exceeded} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)

      # Wait for window to expire
      Process.sleep(101)

      # Should be able to call again after window reset
      assert {:ok, _socket, _} =
               PresenceHandler.handle(%{"event" => "track", "payload" => %{"call" => random_string()}}, socket)
    end
  end

  # Guard-clause and per-client rate-limiting tests only inspect the socket struct, so they
  # need a tenant struct but neither a migrated database nor a live Connect. Skip that setup.
  defp initiate_tenant(%{without_db: true}) do
    tenant = tenant_fixture()
    # Warm cache to avoid Cachex and Ecto.Sandbox ownership issues
    Realtime.Tenants.Cache.update_cache(tenant)

    {:ok, tenant: tenant, topic: random_string()}
  end

  defp initiate_tenant(context) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    # Warm cache to avoid Cachex and Ecto.Sandbox ownership issues
    Realtime.Tenants.Cache.update_cache(tenant)

    {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
    assert Connect.ready?(tenant.external_id)

    topic = random_string()
    if policies = context[:policies], do: create_rls_policies(db_conn, policies, %{topic: topic})

    {:ok, tenant: tenant, topic: topic}
  end

  defp socket_fixture(tenant, topic, presence_key, opts \\ []) do
    policies =
      Keyword.get(opts, :policies, %Policies{
        broadcast: %BroadcastPolicies{read: true},
        presence: %PresencePolicies{read: true, write: nil}
      })

    private? = Keyword.get(opts, :private?, true)
    enabled? = Keyword.get(opts, :enabled?, true)
    log_level = Keyword.get(opts, :log_level, :error)

    claims = %{sub: random_string(), role: "authenticated", exp: Joken.current_time() + 1_000}
    signer = Joken.Signer.create("HS256", "secret")
    jwt = Joken.generate_and_sign!(%{}, claims, signer)

    authorization_context =
      Authorization.build_authorization_params(%{
        tenant_id: tenant.external_id,
        topic: topic,
        jwt: jwt,
        claims: claims,
        headers: [{"header-1", "value-1"}],
        role: claims.role
      })

    tenant_topic = Tenants.tenant_topic(tenant.external_id, topic)
    Endpoint.subscribe(tenant_topic)

    rate = Tenants.presence_events_per_second_rate(tenant)

    RateCounter.new(rate)

    client_rate_limit_override = Keyword.get(opts, :client_rate_limit)

    client_rate_limit =
      if client_rate_limit_override do
        client_rate_limit_override
      else
        config = Application.get_env(:realtime, :client_presence_rate_limit, max_calls: 10, window_ms: 60_000)

        max_calls =
          case tenant.max_client_presence_events_per_window do
            value when is_integer(value) and value > 0 -> value
            _ -> config[:max_calls]
          end

        window_ms =
          case tenant.client_presence_window_ms do
            value when is_integer(value) and value > 0 -> value
            _ -> config[:window_ms]
          end

        %{
          max_calls: max_calls,
          window_ms: window_ms,
          counter: 0,
          reset_at: nil
        }
      end

    %Phoenix.Socket{
      joined: true,
      topic: "realtime:#{topic}",
      transport_pid: self(),
      serializer: Phoenix.Socket.V1.JSONSerializer,
      assigns: %{
        tenant_topic: tenant_topic,
        self_broadcast: true,
        policies: policies,
        authorization_context: authorization_context,
        presence_rate_counter: rate,
        presence_client_rate_limit: client_rate_limit,
        private?: private?,
        presence_key: presence_key,
        presence_enabled?: enabled?,
        log_level: log_level,
        channel_name: topic,
        tenant: tenant.external_id
      }
    }
  end

  def handle_telemetry(event, measures, metadata, %{pid: pid, tenant: tenant}) do
    if metadata[:tenant] == tenant.external_id do
      send(pid, {:telemetry, event, measures, metadata})
    end
  end
end
