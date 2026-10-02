defmodule Realtime.Adapters.Postgres.ProtocolTest do
  use ExUnit.Case, async: true

  alias Realtime.Adapters.Postgres.Protocol
  alias Realtime.Adapters.Postgres.Protocol.Write
  alias Realtime.Adapters.Postgres.Protocol.KeepAlive

  test "defguard is_write/1" do
    require Protocol
    assert Protocol.is_write("w")
    refute Protocol.is_write("k")
  end

  test "defguard is_keep_alive/1" do
    require Protocol
    assert Protocol.is_keep_alive("k")
    refute Protocol.is_keep_alive("w")
  end

  describe "parse/1" do
    test "parses a write message" do
      wal_start = 100
      wal_end = 200
      clock = 300
      message = "some wal data"

      binary = <<?w, wal_start::64, wal_end::64, clock::64, message::binary>>

      assert %Write{
               server_wal_start: ^wal_start,
               server_wal_end: ^wal_end,
               server_system_clock: ^clock,
               message: ^message
             } = Protocol.parse(binary)
    end

    test "parses a keep alive message with reply now" do
      wal_end = 500
      clock = 600

      binary = <<?k, wal_end::64, clock::64, 1::8>>

      assert %KeepAlive{wal_end: ^wal_end, clock: ^clock, reply: :now} = Protocol.parse(binary)
    end

    test "parses a keep alive message with reply later" do
      wal_end = 500
      clock = 600

      binary = <<?k, wal_end::64, clock::64, 0::8>>

      assert %KeepAlive{wal_end: ^wal_end, clock: ^clock, reply: :later} = Protocol.parse(binary)
    end
  end

  describe "standby_status/5" do
    test "returns binary message with reply now" do
      [message] = Protocol.standby_status(100, 200, 300, :now, 400)

      assert <<?r, 100::64, 200::64, 300::64, 400::64, 1::8>> = message
    end

    test "returns binary message with reply later" do
      [message] = Protocol.standby_status(100, 200, 300, :later, 400)

      assert <<?r, 100::64, 200::64, 300::64, 400::64, 0::8>> = message
    end

    test "uses current_time when clock is nil" do
      [message] = Protocol.standby_status(100, 200, 300, :now)

      assert <<?r, 100::64, 200::64, 300::64, _clock::64, 1::8>> = message
    end
  end

  test "hold/0 returns empty list" do
    assert Protocol.hold() == []
  end

  test "current_time/0 returns a positive integer" do
    time = Protocol.current_time()
    assert is_integer(time)
    assert time > 0
  end
end
