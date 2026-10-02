defmodule Replication.TestHandler do
  @behaviour PostgresReplication.Handler
  import PostgresReplication.Protocol
  alias PostgresReplication.Protocol.KeepAlive

  @impl true
  def call(message, _metadata) when is_write(message) do
    :noreply
  end

  def call(message, _metadata) when is_keep_alive(message) do
    reply =
      case parse(message) do
        %KeepAlive{reply: :now, wal_end: wal_end} ->
          wal_end = wal_end + 1
          standby(wal_end, wal_end, wal_end, :now)

        _ ->
          hold()
      end

    {:reply, reply}
  end

  def call(_, _), do: :noreply
end
