defmodule Realtime.Adapters.Postgres.Protocol.KeepAlive do
  @moduledoc """
  Primary keepalive message (B)
  Byte1('k')
  Identifies the message as a sender keepalive.

  Int64
  The current end of WAL on the server.

  Int64
  The server's system clock at the time of transmission, as microseconds since midnight on 2000-01-01.

  Byte1
  1 means that the client should reply to this message as soon as possible, to avoid a timeout disconnect. 0 otherwise.

  The receiving process can send replies back to the sender at any time, using one of the following message formats (also in the payload of a CopyData message):
  """
  @type t :: %__MODULE__{
          wal_end: integer(),
          clock: integer(),
          reply: :now | :await
        }
  defstruct [:wal_end, :clock, :reply]
end
