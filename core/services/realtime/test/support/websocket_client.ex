# This file draws heavily from https://github.com/phoenixframework/phoenix/blob/22ef871312bd06fa591c2da04d32949ebc77f750/test/support/websocket_client.exs
# License: https://github.com/phoenixframework/phoenix/blob/22ef871312bd06fa591c2da04d32949ebc77f750/LICENSE.md

defmodule Realtime.Integration.WebsocketClient do
  @moduledoc """
  A WebSocket client used to test Phoenix.Channel
  """

  use GenServer
  import Kernel, except: [send: 2]

  defstruct [
    :conn,
    :request_ref,
    :websocket,
    :caller,
    :status,
    :resp_headers,
    :sender,
    :serializer,
    closing?: false,
    topics: %{},
    # Use different initial join_ref from ref to
    # make sure the server is not coupling them.
    join_ref: 11,
    ref: 1
  ]

  alias Phoenix.Socket.Message

  @doc """
  Starts the WebSocket client for given ws URL. `Phoenix.Socket.Message`s
  received from the server are forwarded to the sender pid.
  """
  def connect(sender, url, serializer, headers \\ []) do
    with {:ok, socket} <- GenServer.start_link(__MODULE__, {sender, serializer}),
         {:ok, :connected} <- GenServer.call(socket, {:connect, url, headers}) do
      {:ok, socket}
    end
  end

  @doc """
  Closes the socket
  """
  def close(socket), do: GenServer.cast(socket, :close)

  @doc """
  Sends an event to the WebSocket server per the message protocol.
  """
  def send_event(socket, topic, event, msg) do
    GenServer.call(socket, {:send, %Message{topic: topic, event: event, payload: msg}})
  end

  @doc """
  Sends a low-level text message to the client.
  """
  def send(socket, msg), do: GenServer.call(socket, {:send, msg})

  @doc """
  Sends a heartbeat event
  """
  def send_heartbeat(socket), do: send_event(socket, "phoenix", "heartbeat", %{})

  @doc """
  Sends a user broadcast push (V2 binary wire format, type 3). `payload` is the
  raw user payload (binary). `opts` may include `:encoding` (`:binary` (default)
  or `:json`) and `:metadata` (a map JSON-encoded into the frame).
  """
  def send_user_broadcast(socket, topic, user_event, payload, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :binary)
    metadata = Keyword.get(opts, :metadata)
    payload_tuple = {user_event, encoding, payload, metadata}
    GenServer.call(socket, {:send, %Message{topic: topic, event: "broadcast", payload: payload_tuple}})
  end

  @doc """
  Sends join event to the WebSocket server per the Message protocol
  """
  def join(socket, topic, msg), do: send_event(socket, topic, "phx_join", msg)

  @doc """
  Sends leave event to the WebSocket server per the Message protocol
  """
  def leave(socket, topic, msg), do: send_event(socket, topic, "phx_leave", msg)

  ## GenServer implementation

  @doc false
  def init({sender, serializer}) do
    state = %__MODULE__{sender: sender, serializer: serializer}
    {:ok, state}
  end

  @doc false
  def handle_call({:connect, url, headers}, from, state) do
    uri = URI.parse(url)

    http_scheme =
      case uri.scheme do
        "ws" -> :http
        "wss" -> :https
      end

    ws_scheme =
      case uri.scheme do
        "ws" -> :ws
        "wss" -> :wss
      end

    path =
      case uri.query do
        nil -> uri.path
        query -> uri.path <> "?" <> query
      end

    [subdomain, host] = String.split(uri.host, ".")

    with {:ok, conn} <- Mint.HTTP.connect(http_scheme, host, uri.port, hostname: subdomain),
         {:ok, conn, ref} <- Mint.WebSocket.upgrade(ws_scheme, conn, path, headers) do
      state = %{state | conn: conn, request_ref: ref, caller: from}
      {:noreply, state}
    else
      {:error, reason} -> {:reply, {:error, reason}, state}
      {:error, conn, reason} -> {:reply, {:error, reason}, put_in(state.conn, conn)}
    end
  end

  def handle_call({:send, msg}, _from, state) do
    {frame, state} = serialize_msg(msg, state)

    case stream_frame(state, frame) do
      {:ok, state} -> {:reply, :ok, state}
      {:error, state, reason} -> {:reply, {:error, reason}, state}
    end
  end

  @doc false
  def handle_cast(:close, state), do: do_close(state)

  defp do_close(state) do
    # Streaming a close frame may fail if the server has already closed
    # for writing.
    _ = stream_frame(state, :close)
    Mint.HTTP.close(state.conn)
    {:stop, :normal, state}
  end

  @doc false
  def handle_info(message, state) do
    case Mint.WebSocket.stream(state.conn, message) do
      {:ok, conn, responses} ->
        state = state.conn |> put_in(conn) |> handle_responses(responses)
        if state.closing?, do: do_close(state), else: {:noreply, state}

      {:error, _conn, %Mint.TransportError{reason: :closed}, _} ->
        {:stop, :normal, state}

      {:error, conn, reason, _responses} ->
        state = state.conn |> put_in(conn) |> reply({:error, reason})
        {:noreply, state}

      :unknown ->
        {:noreply, state}
    end
  end

  defp handle_responses(state, responses)

  defp handle_responses(%{request_ref: ref} = state, [{:status, ref, status} | rest]) do
    state.status
    |> put_in(status)
    |> handle_responses(rest)
  end

  defp handle_responses(%{request_ref: ref} = state, [{:headers, ref, resp_headers} | rest]) do
    state.resp_headers
    |> put_in(resp_headers)
    |> handle_responses(rest)
  end

  defp handle_responses(%{request_ref: ref} = state, [{:done, ref} | rest]) do
    case Mint.WebSocket.new(state.conn, ref, state.status, state.resp_headers) do
      {:ok, conn, websocket} ->
        %{state | conn: conn, websocket: websocket, status: nil, resp_headers: nil}
        |> reply({:ok, :connected})
        |> handle_responses(rest)

      {:error, conn, reason} ->
        state.conn
        |> put_in(conn)
        |> reply({:error, reason})
    end
  end

  defp handle_responses(%{request_ref: ref, websocket: websocket} = state, [{:data, ref, data} | rest])
       when websocket != nil do
    case Mint.WebSocket.decode(websocket, data) do
      {:ok, websocket, frames} ->
        state.websocket
        |> put_in(websocket)
        |> handle_frames(frames)
        |> handle_responses(rest)

      {:error, websocket, reason} ->
        state.websocket
        |> put_in(websocket)
        |> reply({:error, reason})
    end
  end

  defp handle_responses(state, [_response | rest]), do: handle_responses(state, rest)

  defp handle_responses(state, []), do: state

  defp handle_frames(state, frames) do
    {frames, state} =
      Enum.flat_map_reduce(frames, state, fn
        # reply to ping with pong
        {:ping, data} = frame, state ->
          {:ok, state} = stream_frame(state, {:pong, data})

          {[frame], state}

        # deserialize text and binary frames
        {:text, text}, state ->
          frame =
            case state.serializer do
              :noop -> {:text, text}
              serializer -> serializer.decode!(text, opcode: :text)
            end

          {[frame], state}

        {:binary, data}, state ->
          {[binary_decode(data)], state}

        # prepare to close the connection when a close frame is received
        {:close, code, _data}, state ->
          Kernel.send(state.sender, {:close_code, code})
          {[], put_in(state.closing?, true)}

        frame, state ->
          {[frame], state}
      end)

    Enum.each(frames, &Kernel.send(state.sender, &1))

    state
  end

  # Encodes a frame as a binary and sends it along the wire, keeping `conn`
  # and `websocket` up to date in `state`.
  defp stream_frame(state, frame) do
    with {:ok, websocket, data} <- Mint.WebSocket.encode(state.websocket, frame),
         state = put_in(state.websocket, websocket),
         {:ok, conn} <- Mint.WebSocket.stream_request_body(state.conn, state.request_ref, data) do
      {:ok, put_in(state.conn, conn)}
    else
      {:error, %Mint.WebSocket{} = websocket, reason} ->
        {:error, put_in(state.websocket, websocket), reason}

      {:error, conn, reason} ->
        {:error, put_in(state.conn, conn), reason}
    end
  end

  # reply to an open GenServer call request if there is one
  defp reply(state, response) do
    if state.caller, do: GenServer.reply(state.caller, response)
    put_in(state.caller, nil)
  end

  defp serialize_msg(msg, %{serializer: :noop} = state), do: {msg, state}

  defp serialize_msg(%Message{payload: {:binary, _}} = msg, %{ref: ref} = state) do
    {join_ref, state} = join_ref_for(msg, state)
    msg = Map.merge(msg, %{ref: to_string(ref), join_ref: to_string(join_ref)})
    {{:binary, binary_encode_push!(msg)}, put_in(state.ref, ref + 1)}
  end

  defp serialize_msg(%Message{payload: {user_event, encoding, user_payload, metadata}} = msg, %{ref: ref} = state)
       when is_binary(user_event) and encoding in [:json, :binary] and is_binary(user_payload) do
    {join_ref, state} = join_ref_for(msg, state)
    msg = Map.merge(msg, %{ref: to_string(ref), join_ref: to_string(join_ref)})

    {{:binary, binary_encode_user_broadcast_push!(msg, user_event, encoding, user_payload, metadata)},
     put_in(state.ref, ref + 1)}
  end

  defp serialize_msg(%Message{} = msg, %{ref: ref} = state) do
    {join_ref, state} = join_ref_for(msg, state)
    msg = Map.merge(msg, %{ref: to_string(ref), join_ref: to_string(join_ref)})
    {{:text, encode!(msg, state)}, put_in(state.ref, ref + 1)}
  end

  defp serialize_msg(msg, state), do: {msg, state}

  defp join_ref_for(
         %{topic: topic, event: "phx_join"},
         %{topics: topics, join_ref: join_ref} = state
       ) do
    topics = Map.put(topics, topic, join_ref)
    {join_ref, %{state | topics: topics, join_ref: join_ref + 1}}
  end

  defp join_ref_for(%{topic: topic}, %{topics: topics} = state) do
    {Map.get(topics, topic), state}
  end

  defp encode!(map, state) do
    {:socket_push, :text, chardata} = state.serializer.encode!(map)
    IO.chardata_to_string(chardata)
  end

  defp binary_encode_user_broadcast_push!(%Message{} = msg, user_event, encoding, user_payload, metadata) do
    ref = to_string(msg.ref)
    join_ref = to_string(msg.join_ref)
    metadata_bin = if metadata, do: Jason.encode!(metadata), else: <<>>
    encoding_byte = if encoding == :json, do: 1, else: 0

    <<
      3::size(8),
      byte_size(join_ref)::size(8),
      byte_size(ref)::size(8),
      byte_size(msg.topic)::size(8),
      byte_size(user_event)::size(8),
      byte_size(metadata_bin)::size(8),
      encoding_byte::size(8),
      join_ref::binary,
      ref::binary,
      msg.topic::binary,
      user_event::binary,
      metadata_bin::binary,
      user_payload::binary
    >>
  end

  defp binary_encode_push!(%Message{payload: {:binary, data}} = msg) do
    ref = to_string(msg.ref)
    join_ref = to_string(msg.join_ref)
    join_ref_size = byte_size(join_ref)
    ref_size = byte_size(ref)
    topic_size = byte_size(msg.topic)
    event_size = byte_size(msg.event)

    <<
      0::size(8),
      join_ref_size::size(8),
      ref_size::size(8),
      topic_size::size(8),
      event_size::size(8),
      join_ref::binary-size(join_ref_size),
      ref::binary-size(ref_size),
      msg.topic::binary-size(topic_size),
      msg.event::binary-size(event_size),
      data::binary
    >>
  end

  # push
  defp binary_decode(<<
         0::size(8),
         join_ref_size::size(8),
         topic_size::size(8),
         event_size::size(8),
         join_ref::binary-size(join_ref_size),
         topic::binary-size(topic_size),
         event::binary-size(event_size),
         data::binary
       >>) do
    %Message{join_ref: join_ref, topic: topic, event: event, payload: {:binary, data}}
  end

  # reply
  defp binary_decode(<<
         1::size(8),
         join_ref_size::size(8),
         ref_size::size(8),
         topic_size::size(8),
         status_size::size(8),
         join_ref::binary-size(join_ref_size),
         ref::binary-size(ref_size),
         topic::binary-size(topic_size),
         status::binary-size(status_size),
         data::binary
       >>) do
    payload = %{"status" => status, "response" => {:binary, data}}
    %Message{join_ref: join_ref, ref: ref, topic: topic, event: "phx_reply", payload: payload}
  end

  # user broadcast
  defp binary_decode(<<
         4::size(8),
         topic_size::size(8),
         user_event_size::size(8),
         metadata_size::size(8),
         user_payload_encoding::size(8),
         topic::binary-size(topic_size),
         user_event::binary-size(user_event_size),
         metadata::binary-size(metadata_size),
         user_payload::binary
       >>) do
    payload = user_broadcast_payload(user_event, user_payload_encoding, user_payload, metadata, metadata_size)
    %Message{topic: topic, event: "broadcast", payload: payload}
  end

  defp user_broadcast_payload(user_event, user_payload_encoding, user_payload, metadata, metadata_size) do
    decoded_metadata = if metadata_size > 0, do: Jason.decode!(metadata), else: %{}

    decoded_payload =
      case user_payload_encoding do
        1 -> Jason.decode!(user_payload)
        0 -> {:binary, user_payload}
      end

    %{
      "event" => user_event,
      "payload" => decoded_payload,
      "type" => "broadcast",
      "meta" => decoded_metadata
    }
  end
end
