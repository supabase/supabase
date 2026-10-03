defmodule Realtime.Integration.DistributedRealtimeChannelTest do
  # Use of Clustered
  use RealtimeWeb.ConnCase,
    async: false,
    parameterize: [%{serializer: Phoenix.Socket.V1.JSONSerializer}, %{serializer: RealtimeWeb.Socket.V2Serializer}]

  alias Forum.Muster
  alias Phoenix.Socket.Message

  alias Realtime.Tenants.Connect
  alias Realtime.Integration.WebsocketClient

  setup do
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)

    {:ok, node} = Clustered.start()
    region = Realtime.Tenants.region(tenant)
    {:ok, db_conn} = :erpc.call(node, Connect, :connect, [tenant.external_id, region])
    assert Connect.ready?(tenant.external_id)

    assert node(db_conn) == node

    wait_for_muster_ready(node, region)

    %{tenant: tenant, topic: random_string()}
  end

  describe "distributed broadcast" do
    @tag mode: :distributed
    test "it works", %{tenant: tenant, topic: topic, serializer: serializer} do
      {:ok, token} =
        generate_token(tenant, %{exp: System.system_time(:second) + 1000, role: "authenticated", sub: random_string()})

      {:ok, remote_socket} =
        WebsocketClient.connect(self(), uri(tenant, serializer, TestEnv.peer_http_port()), serializer, [
          {"x-api-key", token}
        ])

      {:ok, socket} = WebsocketClient.connect(self(), uri(tenant, serializer), serializer, [{"x-api-key", token}])

      config = %{broadcast: %{self: false}, private: false}
      topic = "realtime:#{topic}"

      :ok = WebsocketClient.join(remote_socket, topic, %{config: config})
      :ok = WebsocketClient.join(socket, topic, %{config: config})

      # Wait for both channels to have successfully joined, as a broadcast is fire
      # and forget.
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 5000
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 5000

      # Send through one socket and receive through the other (self: false)
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      :ok = WebsocketClient.send_event(remote_socket, topic, "broadcast", payload)

      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^topic}, 5000
    end
  end

  # Actually as of today (2026-09-14) this doesn't yet go through Muster, as the flag
  # isn't yet turned on by default. As we want to roll out Muster further I'm still
  # keeping the gate here.
  # Broadcasts route through Muster's region ring, so wait for the local and
  # peer node to both consider it :ready and agree on the same ring view before
  # sending anything cross-node.
  defp wait_for_muster_ready(node, region) do
    scope = :"realtime_channels_#{region}"

    assert_eventually(
      Muster.status(scope) == :ready and
        :erpc.call(node, Muster, :status, [scope]) == :ready and
        Muster.view_hash(scope) == :erpc.call(node, Muster, :view_hash, [scope]),
      timeout: to_timeout(second: 15)
    )
  end
end
