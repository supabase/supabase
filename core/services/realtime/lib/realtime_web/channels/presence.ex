defmodule RealtimeWeb.Presence do
  @moduledoc """
  Provides presence tracking to channels and processes.

  See the [`Phoenix.Presence`](http://hexdocs.pm/phoenix/Phoenix.Presence.html)
  docs for more details.
  """
  use Phoenix.Presence,
    otp_app: :realtime,
    pubsub_server: Realtime.PubSub,
    dispatcher: RealtimeWeb.RealtimeChannel.MessageDispatcher
end
