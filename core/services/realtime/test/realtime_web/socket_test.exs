defmodule RealtimeWeb.SocketTest do
  use ExUnit.Case, async: true

  alias RealtimeWeb.Socket

  describe "collect_traffic_telemetry/4" do
    test "returns previous values unchanged when transport_pid is nil" do
      assert Socket.collect_traffic_telemetry(nil, "tenant", 42, 99) ==
               %{latest_recv: 42, latest_send: 99}
    end

    test "fires no telemetry when transport_pid is nil" do
      ref = :telemetry_test.attach_event_handlers(self(), [[:realtime, :channel, :output_bytes]])

      Socket.collect_traffic_telemetry(nil, "tenant", 0, 0)

      refute_received {[:realtime, :channel, :output_bytes], ^ref, _, _}
    end

    test "returns zero stats when transport process has no port links" do
      pid = spawn(fn -> Process.sleep(:infinity) end)

      assert Socket.collect_traffic_telemetry(pid, "tenant", 0, 0) ==
               %{latest_recv: 0, latest_send: 0}

      Process.exit(pid, :kill)
    end

    test "fires output_bytes and input_bytes telemetry with correct tenant metadata" do
      pid = spawn(fn -> Process.sleep(:infinity) end)

      ref =
        :telemetry_test.attach_event_handlers(self(), [
          [:realtime, :channel, :output_bytes],
          [:realtime, :channel, :input_bytes]
        ])

      Socket.collect_traffic_telemetry(pid, "my-tenant", 0, 0)

      assert_received {[:realtime, :channel, :output_bytes], ^ref, %{size: 0}, %{tenant: "my-tenant"}}
      assert_received {[:realtime, :channel, :input_bytes], ^ref, %{size: 0}, %{tenant: "my-tenant"}}

      Process.exit(pid, :kill)
    end

    test "delta is clamped to zero when previous stats exceed current (no negative deltas)" do
      pid = spawn(fn -> Process.sleep(:infinity) end)

      ref =
        :telemetry_test.attach_event_handlers(self(), [
          [:realtime, :channel, :output_bytes],
          [:realtime, :channel, :input_bytes]
        ])

      # No port links → latest = 0, but previous > 0 → delta would be negative without max(0, ...)
      Socket.collect_traffic_telemetry(pid, "tenant", 1000, 500)

      assert_received {[:realtime, :channel, :output_bytes], ^ref, %{size: 0}, _}
      assert_received {[:realtime, :channel, :input_bytes], ^ref, %{size: 0}, _}

      Process.exit(pid, :kill)
    end
  end
end
