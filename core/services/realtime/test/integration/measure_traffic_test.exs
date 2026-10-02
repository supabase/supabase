defmodule Realtime.Integration.MeasureTrafficTest do
  use RealtimeWeb.ConnCase, async: false

  alias Phoenix.Socket.Message
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants.ReplicationConnection

  setup [:checkout_tenant_and_connect]

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

  defp get_count(event, tenant) do
    [key] = Enum.take(event, -1)

    :"TestCounter_#{tenant}"
    |> Agent.get(fn state -> get_in(state, [tenant, key]) || 0 end)
  end

  defp tick_and_get_counts(tenant) do
    tenant_id = tenant.external_id
    RateCounterHelper.tick_tenant_rate_counters!(tenant_id)

    {
      get_count([:realtime, :channel, :output_bytes], tenant_id),
      get_count([:realtime, :channel, :input_bytes], tenant_id)
    }
  end

  defp assert_counts(tenant) do
    case_wait tick_and_get_counts(tenant), timeout: 2_000, interval: 50 do
      {output_bytes, input_bytes}
      when output_bytes > 0 and input_bytes > 0 ->
        :ok
    else
      {output_bytes, input_bytes} ->
        assert output_bytes > 0, "Expected output_bytes > 0, got #{output_bytes}"
        assert input_bytes > 0, "Expected input_bytes > 0, got #{input_bytes}"
    end
  end

  describe "measure traffic" do
    setup %{tenant: tenant} do
      events = [
        [:realtime, :channel, :output_bytes],
        [:realtime, :channel, :input_bytes]
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

      measure_traffic_interval_in_ms = Application.get_env(:realtime, :measure_traffic_interval_in_ms)
      Application.put_env(:realtime, :measure_traffic_interval_in_ms, 10)
      :persistent_term.put({RealtimeWeb.UserSocket, :measure_traffic_interval_in_ms}, 10)

      on_exit(fn ->
        Application.put_env(:realtime, :measure_traffic_interval_in_ms, measure_traffic_interval_in_ms)
        :persistent_term.put({RealtimeWeb.UserSocket, :measure_traffic_interval_in_ms}, measure_traffic_interval_in_ms)
      end)

      :ok
    end

    test "measure traffic for broadcast events", %{tenant: tenant} do
      {socket, _} = get_connection(tenant)
      config = %{broadcast: %{self: true}}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Wait for join to complete
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 1000

      for _ <- 1..5 do
        WebsocketClient.send_event(socket, topic, "broadcast", %{
          "event" => "TEST",
          "payload" => %{"msg" => 1},
          "type" => "broadcast"
        })

        assert_receive %Message{
                         event: "broadcast",
                         payload: %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"},
                         topic: ^topic
                       },
                       500
      end

      assert_counts(tenant)
    end

    test "measure traffic for presence events", %{tenant: tenant} do
      {socket, _} = get_connection(tenant)
      config = %{broadcast: %{self: true}, presence: %{enabled: true}}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Wait for join to complete
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 1000

      for _ <- 1..5 do
        WebsocketClient.send_event(socket, topic, "presence", %{
          "event" => "TRACK",
          "payload" => %{name: "realtime_presence_#{:rand.uniform(1000)}", t: 1814.7000000029802},
          "type" => "presence"
        })
      end

      assert_counts(tenant)
    end

    test "measure traffic for postgres changes events", %{tenant: tenant, db_conn: db_conn} do
      Integrations.setup_postgres_changes(db_conn)
      {socket, _} = get_connection(tenant)
      config = %{broadcast: %{self: true}, postgres_changes: [%{event: "*", schema: "public"}]}
      topic = "realtime:any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Wait for join to complete
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 1000

      # Wait for postgres_changes subscription to be ready
      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "status" => "ok"
                       },
                       topic: ^topic
                     },
                     8000

      for _ <- 1..5 do
        Postgrex.query!(db_conn, "INSERT INTO test (details) VALUES ($1)", [random_string()])
      end

      for _ <- 1..5 do
        assert_receive %Message{
                         event: "postgres_changes",
                         payload: %{"data" => %{"schema" => "public", "table" => "test", "type" => "INSERT"}},
                         topic: ^topic
                       },
                       500
      end

      assert_counts(tenant)
    end

    test "measure traffic for db events", %{tenant: tenant, db_conn: db_conn} do
      {socket, _} = get_connection(tenant)
      config = %{broadcast: %{self: true}, db: %{enabled: true}}
      topic = "realtime:any"
      channel_name = "any"

      WebsocketClient.join(socket, topic, %{config: config})

      # Wait for join to complete
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 1000

      assert ReplicationConnection.ready?(tenant.external_id)

      for _ <- 1..5 do
        event = random_string()
        value = random_string()

        Postgrex.query!(
          db_conn,
          "SELECT realtime.send (json_build_object ('value', $1 :: text)::jsonb, $2 :: text, $3 :: text, FALSE::bool);",
          [value, event, channel_name]
        )

        assert_receive %Message{
                         event: "broadcast",
                         payload: %{
                           "event" => ^event,
                           "payload" => %{"value" => ^value},
                           "type" => "broadcast"
                         },
                         topic: ^topic,
                         join_ref: nil,
                         ref: nil
                       },
                       2000
      end

      assert_counts(tenant)
    end
  end
end
