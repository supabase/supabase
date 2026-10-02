defmodule Realtime.Adapters.Postgres.Protocol do
  @moduledoc """
  This module is responsible for parsing the Postgres WAL messages.
  """
  alias Realtime.Adapters.Postgres.Protocol.Write
  alias Realtime.Adapters.Postgres.Protocol.KeepAlive

  defguard is_write(value) when binary_part(value, 0, 1) == <<?w>>
  defguard is_keep_alive(value) when binary_part(value, 0, 1) == <<?k>>

  def parse(<<?w, server_wal_start::64, server_wal_end::64, server_system_clock::64, message::binary>>) do
    %Write{
      server_wal_start: server_wal_start,
      server_wal_end: server_wal_end,
      server_system_clock: server_system_clock,
      message: message
    }
  end

  def parse(<<?k, wal_end::64, clock::64, reply::8>>) do
    reply =
      case reply do
        0 -> :later
        1 -> :now
      end

    %KeepAlive{wal_end: wal_end, clock: clock, reply: reply}
  end

  @doc """
  Message to send to the server to request a standby status update.

  Check https://www.postgresql.org/docs/current/protocol-replication.html#PROTOCOL-REPLICATION-STANDBY-STATUS-UPDATE for more information
  """
  @spec standby_status(integer(), integer(), integer(), :now | :later, integer() | nil) :: [
          binary()
        ]
  def standby_status(last_wal_received, last_wal_flushed, last_wal_applied, reply, clock \\ nil)

  def standby_status(last_wal_received, last_wal_flushed, last_wal_applied, reply, nil) do
    standby_status(last_wal_received, last_wal_flushed, last_wal_applied, reply, current_time())
  end

  def standby_status(last_wal_received, last_wal_flushed, last_wal_applied, reply, clock) do
    reply =
      case reply do
        :now -> 1
        :later -> 0
      end

    [
      <<?r, last_wal_received::64, last_wal_flushed::64, last_wal_applied::64, clock::64, reply::8>>
    ]
  end

  @doc """
  Message to send the server to not do any operation since the server can wait
  """
  def hold, do: []

  @epoch DateTime.to_unix(~U[2000-01-01 00:00:00Z], :microsecond)
  def current_time, do: System.os_time(:microsecond) - @epoch
end
