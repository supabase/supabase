defmodule RealtimeWeb.Socket.V2Serializer do
  @moduledoc """
  Custom serializer that is a superset of Phoenix's V2 JSONSerializer
  that handles user broadcast and user broadcast push
  """

  @behaviour Phoenix.Socket.Serializer

  @push 0
  @reply 1
  @broadcast 2
  @user_broadcast_push 3
  @user_broadcast 4

  alias Phoenix.Socket.{Message, Reply, Broadcast}
  alias RealtimeWeb.Socket.UserBroadcast

  @impl true
  def fastlane!(%UserBroadcast{} = msg) do
    metadata =
      if msg.metadata do
        Phoenix.json_library().encode!(msg.metadata)
      else
        msg.metadata
      end

    topic_size = byte_size!(msg.topic, :topic, 255)
    user_event_size = byte_size!(msg.user_event, :user_event, 255)
    metadata_size = byte_size!(metadata, :metadata, 255)
    user_payload_encoding = if msg.user_payload_encoding == :json, do: 1, else: 0

    bin = <<
      @user_broadcast::size(8),
      topic_size::size(8),
      user_event_size::size(8),
      metadata_size::size(8),
      user_payload_encoding::size(8),
      msg.topic::binary-size(topic_size),
      msg.user_event::binary-size(user_event_size),
      metadata || <<>>::binary-size(metadata_size),
      msg.user_payload::binary
    >>

    {:socket_push, :binary, bin}
  end

  def fastlane!(%Broadcast{payload: {:binary, data}} = msg) do
    topic_size = byte_size!(msg.topic, :topic, 255)
    event_size = byte_size!(msg.event, :event, 255)

    bin = <<
      @broadcast::size(8),
      topic_size::size(8),
      event_size::size(8),
      msg.topic::binary-size(topic_size),
      msg.event::binary-size(event_size),
      data::binary
    >>

    {:socket_push, :binary, bin}
  end

  def fastlane!(%Broadcast{payload: %{}} = msg) do
    data = Phoenix.json_library().encode_to_iodata!([nil, nil, msg.topic, msg.event, msg.payload])
    {:socket_push, :text, data}
  end

  def fastlane!(%Broadcast{payload: invalid}) do
    raise ArgumentError, "expected broadcasted payload to be a map, got: #{inspect(invalid)}"
  end

  @impl true
  def encode!(%Reply{payload: {:binary, data}} = reply) do
    status = to_string(reply.status)
    join_ref = to_string(reply.join_ref)
    ref = to_string(reply.ref)
    join_ref_size = byte_size!(join_ref, :join_ref, 255)
    ref_size = byte_size!(ref, :ref, 255)
    topic_size = byte_size!(reply.topic, :topic, 255)
    status_size = byte_size!(status, :status, 255)

    bin = <<
      @reply::size(8),
      join_ref_size::size(8),
      ref_size::size(8),
      topic_size::size(8),
      status_size::size(8),
      join_ref::binary-size(join_ref_size),
      ref::binary-size(ref_size),
      reply.topic::binary-size(topic_size),
      status::binary-size(status_size),
      data::binary
    >>

    {:socket_push, :binary, bin}
  end

  def encode!(%Reply{} = reply) do
    data = [
      reply.join_ref,
      reply.ref,
      reply.topic,
      "phx_reply",
      %{status: reply.status, response: reply.payload}
    ]

    {:socket_push, :text, Phoenix.json_library().encode_to_iodata!(data)}
  end

  def encode!(%Message{payload: {:binary, data}} = msg) do
    join_ref = to_string(msg.join_ref)
    join_ref_size = byte_size!(join_ref, :join_ref, 255)
    topic_size = byte_size!(msg.topic, :topic, 255)
    event_size = byte_size!(msg.event, :event, 255)

    bin = <<
      @push::size(8),
      join_ref_size::size(8),
      topic_size::size(8),
      event_size::size(8),
      join_ref::binary-size(join_ref_size),
      msg.topic::binary-size(topic_size),
      msg.event::binary-size(event_size),
      data::binary
    >>

    {:socket_push, :binary, bin}
  end

  # Reuse fastlane! @user_broadcast framing which is the only decodable format by SDK
  def encode!(%Message{payload: {user_event, :binary, user_payload, metadata}, topic: topic}) do
    fastlane!(%UserBroadcast{
      topic: topic,
      user_event: user_event,
      user_payload: user_payload,
      user_payload_encoding: :binary,
      metadata: metadata
    })
  end

  def encode!(%Message{payload: %{}} = msg) do
    data = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload]
    {:socket_push, :text, Phoenix.json_library().encode_to_iodata!(data)}
  end

  def encode!(%Message{payload: invalid}) do
    raise ArgumentError, "expected payload to be a map, got: #{inspect(invalid)}"
  end

  @impl true
  def decode!(raw_message, opts) do
    case Keyword.fetch(opts, :opcode) do
      {:ok, :text} -> decode_text(raw_message)
      {:ok, :binary} -> decode_binary(raw_message)
    end
  end

  defp decode_text(raw_message) do
    case Phoenix.json_library().decode!(raw_message) do
      [join_ref, ref, topic, event, payload | _] ->
        %Message{topic: topic, event: event, payload: payload, ref: ref, join_ref: join_ref}

      other ->
        raise Phoenix.Socket.InvalidMessageError,
              "expected V2 array, got: #{inspect(other, limit: 200, printable_limit: 200)}"
    end
  end

  defp decode_binary(<<
         @push::size(8),
         join_ref_size::size(8),
         ref_size::size(8),
         topic_size::size(8),
         event_size::size(8),
         join_ref::binary-size(join_ref_size),
         ref::binary-size(ref_size),
         topic::binary-size(topic_size),
         event::binary-size(event_size),
         data::binary
       >>) do
    %Message{
      topic: topic,
      event: event,
      payload: {:binary, data},
      ref: ref,
      join_ref: join_ref
    }
  end

  defp decode_binary(<<
         @user_broadcast_push::size(8),
         join_ref_size::size(8),
         ref_size::size(8),
         topic_size::size(8),
         user_event_size::size(8),
         metadata_size::size(8),
         user_payload_encoding::size(8),
         join_ref::binary-size(join_ref_size),
         ref::binary-size(ref_size),
         topic::binary-size(topic_size),
         user_event::binary-size(user_event_size),
         metadata::binary-size(metadata_size),
         user_payload::binary
       >>) do
    user_payload_encoding = if user_payload_encoding == 0, do: :binary, else: :json

    metadata =
      if metadata_size > 0 do
        Phoenix.json_library().decode!(metadata)
      else
        %{}
      end

    # Encoding as Message because that's how Phoenix Socket and Channel.Server expects things to show up
    # Here we abuse the payload field to carry a tuple of (user_event, user payload encoding, user payload, metadata)
    %Message{
      topic: topic,
      event: "broadcast",
      payload: {user_event, user_payload_encoding, user_payload, metadata},
      ref: ref,
      join_ref: join_ref
    }
  end

  defp byte_size!(nil, _kind, _max), do: 0

  defp byte_size!(bin, kind, max) do
    case byte_size(bin) do
      size when size <= max ->
        size

      oversized ->
        raise ArgumentError, """
        unable to convert #{kind} to binary.

            #{inspect(bin)}

        must be less than or equal to #{max} bytes, but is #{oversized} bytes.
        """
    end
  end
end
