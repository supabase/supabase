defmodule RealtimeWeb.Socket.UserBroadcast do
  @moduledoc """
  Defines a message sent from pubsub to channels and vice-versa.

  The message format requires the following keys:

    * `:topic` - The string topic or topic:subtopic pair namespace, for example "messages", "messages:123"
    * `:user_event`- The string user event name, for example "my-event"
    * `:user_payload_encoding`- :json or :binary
    * `:user_payload` - The actual message payload

  Optionally metadata which is a map to be JSON encoded
  """

  alias Phoenix.Socket.Broadcast

  @type t :: %__MODULE__{}
  defstruct topic: nil, user_event: nil, user_payload: nil, user_payload_encoding: nil, metadata: nil

  @spec convert_to_json_broadcast(t) :: {:ok, Broadcast.t()} | {:error, String.t()}
  def convert_to_json_broadcast(%__MODULE__{user_payload_encoding: :json} = user_broadcast) do
    # The payload bytes are emitted verbatim as a Jason.Fragment, so we must
    # confirm they are a single well-formed JSON value with no trailing content
    # before trusting them.
    case Jason.decode(user_broadcast.user_payload) do
      {:ok, _} ->
        payload = %{
          "event" => user_broadcast.user_event,
          "payload" => Jason.Fragment.new(user_broadcast.user_payload),
          "type" => "broadcast"
        }

        payload =
          if user_broadcast.metadata do
            Map.put(payload, "meta", user_broadcast.metadata)
          else
            payload
          end

        {:ok, %Broadcast{event: "broadcast", payload: payload, topic: user_broadcast.topic}}

      {:error, _} ->
        {:error, "User payload is not valid JSON"}
    end
  end

  def convert_to_json_broadcast(%__MODULE__{}), do: {:error, "User payload encoding is not JSON"}
end
