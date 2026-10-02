defmodule Realtime.Integration.RtChannel.BillableEventsTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [
      %{serializer: Phoenix.Socket.V1.JSONSerializer},
      %{serializer: RealtimeWeb.Socket.V2Serializer}
    ]

  import Generators

  alias Phoenix.Socket.Message
  alias Postgrex
  alias Realtime.Database
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants

  @moduletag :capture_log

  setup [:checkout_tenant_connect_and_setup_postgres_changes]

  setup %{tenant: tenant} do
    events = [
      [:realtime, :rate_counter, :channel, :joins],
      [:realtime, :rate_counter, :channel, :events],
      [:realtime, :rate_counter, :channel, :db_events],
      [:realtime, :rate_counter, :channel, :presence_events]
    ]

    name = :"TestCounter_#{tenant.external_id}"

    {:ok, _} =
      start_supervised(%{
        id: 1,
        start: {Agent, :start_link, [fn -> %{} end, [name: name]]}
      })

    RateCounterHelper.stop(tenant.external_id)
    on_exit(fn -> :telemetry.detach({__MODULE__, tenant.external_id}) end)
    :telemetry.attach_many({__MODULE__, tenant.external_id}, events, &__MODULE__.handle_telemetry/4, name)

    :ok
  end

  def handle_telemetry(event, measurements, metadata, name) do
    tenant = metadata[:tenant]
    [key] = Enum.take(event, -1)
    value = Map.get(measurements, :sum) || Map.get(measurements, :value) || Map.get(measurements, :size) || 0

    Agent.update(name, fn state ->
      state =
        Map.put_new(
          state,
          tenant,
          %{
            joins: 0,
            events: 0,
            db_events: 0,
            presence_events: 0,
            output_bytes: 0,
            input_bytes: 0
          }
        )

      update_in(state, [metadata[:tenant], key], fn v -> (v || 0) + value end)
    end)
  end

  describe "join events" do
    test "join events", %{tenant: tenant, serializer: serializer} do
      external_id = tenant.external_id
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, postgres_changes: [%{event: "*", schema: "public"}]}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{topic: ^topic, event: "system"}, 5000

      # Expected billed
      # 1 joins due to two sockets
      # 0 presence events
      # 0 db events as no postgres changes used
      # 0 events broadcast is not used
      assert_billed(external_id, joins: 1, presence_events: 0, db_events: 0, events: 0)
    end
  end

  describe "broadcast events" do
    test "broadcast events", %{tenant: tenant, serializer: serializer} do
      external_id = tenant.external_id
      {socket1, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}}
      topic = "realtime:any"

      WebsocketClient.join(socket1, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      # Add second client so we can test the "multiplication" of billable events
      {socket2, _} = get_connection(tenant, serializer)
      WebsocketClient.join(socket2, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      # Broadcast event
      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}

      for _ <- 1..5 do
        WebsocketClient.send_event(socket1, topic, "broadcast", payload)
        # both sockets
        assert_receive %Message{topic: ^topic, event: "broadcast", payload: ^payload}
        assert_receive %Message{topic: ^topic, event: "broadcast", payload: ^payload}
      end

      refute_receive _any

      # Expected billed
      # 2 joins due to two sockets
      # 0 presence events
      # 0 db events as no postgres changes used
      # 15 events as 5 events sent, 5 events received on client 1 and 5 events received on client 2
      assert_billed(external_id, joins: 2, presence_events: 0, db_events: 0, events: 15)
    end
  end

  describe "presence events" do
    test "presence events", %{tenant: tenant, serializer: serializer} do
      external_id = tenant.external_id
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, presence: %{enabled: true}}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", topic: ^topic}, 1000

      payload = %{
        type: "presence",
        event: "TRACK",
        payload: %{name: "realtime_presence_1", t: 1814.7000000029802}
      }

      WebsocketClient.send_event(socket, topic, "presence", payload)
      assert_receive %Message{event: "presence_diff", payload: %{"joins" => _, "leaves" => %{}}, topic: ^topic}

      # Presence events
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300

      payload = %{
        type: "presence",
        event: "TRACK",
        payload: %{name: "realtime_presence_2", t: 1814.7000000029802}
      }

      WebsocketClient.send_event(socket, topic, "presence", payload)
      assert_receive %Message{event: "presence_diff", payload: %{"joins" => _, "leaves" => %{}}, topic: ^topic}
      assert_receive %Message{event: "presence_diff", payload: %{"joins" => _, "leaves" => %{}}, topic: ^topic}

      # Expected billed
      # 2 joins due to two sockets
      # 7 presence events
      # 0 db events as no postgres changes used
      # 0 events as no broadcast used
      assert_billed(external_id, joins: 2, presence_events: 7, db_events: 0, events: 0)
    end
  end

  describe "postgres changes events" do
    test "postgres changes events", %{tenant: tenant, serializer: serializer} do
      external_id = tenant.external_id
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, postgres_changes: [%{event: "*", schema: "public"}]}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{topic: ^topic, event: "system"}, 5000

      # Add second user to test the "multiplication" of billable events
      {socket, _} = get_connection(tenant, serializer)
      WebsocketClient.join(socket, topic, %{config: config})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{topic: ^topic, event: "system"}, 5000

      tenant = Tenants.get_tenant_by_external_id(tenant.external_id)
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      # Postgres Change events
      for _ <- 1..5, do: Postgrex.query!(conn, "insert into test (details) values ('test')", [])

      for _ <- 1..10 do
        assert_receive %Message{
                         topic: ^topic,
                         event: "postgres_changes",
                         payload: %{"data" => %{"schema" => "public", "table" => "test", "type" => "INSERT"}}
                       },
                       5000
      end

      # Expected billed
      # 2 joins due to two sockets
      # 0 presence events due to two sockets
      # 10 db events due to 5 inserts events sent to client 1 and 5 inserts events sent to client 2
      # (5 for each websocket)
      # 0 events as no broadcast used
      assert_billed(external_id, joins: 2, presence_events: 0, db_events: 10, events: 0)
    end

    test "postgres changes error events", %{tenant: tenant, serializer: serializer} do
      external_id = tenant.external_id
      {socket, _} = get_connection(tenant, serializer)
      config = %{broadcast: %{self: true}, postgres_changes: [%{event: "*", schema: "none"}]}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Join events
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 300
      assert_receive %Message{topic: ^topic, event: "system"}, 5000

      # Expected billed
      # 1 joins due to one socket
      # 0 presence events due to one socket
      # 0 db events
      # 0 events as no broadcast used
      assert_billed(external_id, joins: 1, presence_events: 0, db_events: 0, events: 0)
    end
  end

  # Rate counters are incremented after the message has already been fastlaned to the transport, so
  # the `assert_receive` above can win the race against the increment.  Re-tick until the counters
  # settle rather than sampling them once.
  defp assert_billed(tenant, expected) do
    eventually(
      fn ->
        RateCounterHelper.tick_tenant_rate_counters!(tenant)
        Enum.all?(expected, fn {key, value} -> get_count(key, tenant) == value end)
      end,
      timeout: 500,
      interval: 50
    )

    for {key, value} <- expected do
      assert value == get_count(key, tenant), "expected #{value} #{key}, got #{get_count(key, tenant)}"
    end
  end

  defp get_count(key, tenant) do
    Agent.get(:"TestCounter_#{tenant}", fn state -> get_in(state, [tenant, key]) || 0 end)
  end
end
