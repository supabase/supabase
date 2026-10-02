defmodule Supavisor.Protocol.MessageStreamer do
  @moduledoc """
  Handles streaming PostgreSQL protocol messages and delegates to a message handler.

  This module handles the low-level packet parsing, buffering, and streaming logic,
  while delegating actual message processing to a handler that implements the
  MessageHandler behaviour.
  """

  require Record

  Record.defrecord(
    :stream_state,
    handler_module: nil,
    handler_state: nil,
    pending_bin: <<>>,
    pkts: [],
    in_flight_pkt: nil
  )

  @type stream_state() ::
          record(:stream_state,
            handler_module: module(),
            handler_state: any(),
            pending_bin: binary(),
            pkts: [binary() | tuple()],
            in_flight_pkt: {tag :: binary(), remaining_len :: non_neg_integer()} | nil
          )

  @type pkt() :: binary()

  @doc """
  Creates a new stream state with the given handler module.
  """
  @spec new_stream_state(module()) :: stream_state()
  def new_stream_state(handler_module) do
    stream_state(
      handler_module: handler_module,
      handler_state: handler_module.init_state(),
      pending_bin: <<>>,
      pkts: [],
      in_flight_pkt: nil
    )
  end

  @doc """
  Handles incoming packet data and returns processed packets.

  Errors are dependent on the message handler implementation
  """
  @spec handle_packets(stream_state(), pkt()) ::
          {:ok, stream_state(), [pkt() | tuple()]}
          | {:error, atom()}
          | {:error, atom(), term()}
  def handle_packets(acc, binary) do
    case do_handle_packets(acc, binary) do
      {:ok, acc} ->
        {:ok, stream_state(acc, pkts: []), Enum.reverse(stream_state(acc, :pkts))}

      error ->
        error
    end
  end

  defp do_handle_packets(acc, binary) do
    case acc do
      stream_state(in_flight_pkt: {_tag, _len}) ->
        handle_in_flight(acc, binary)

      stream_state(pending_bin: "") ->
        handle_pkt(acc, binary)

      stream_state(pending_bin: pending_bin) ->
        handle_pkt(stream_state(acc, pending_bin: ""), pending_bin <> binary)
    end
  end

  defp handle_in_flight(acc, binary) do
    {tag, remaining_len} = stream_state(acc, :in_flight_pkt)

    case binary do
      # Message is complete
      <<rest_of_message::binary-size(remaining_len), rest::binary>> ->
        new_stream_state =
          stream_state(acc,
            pkts: [rest_of_message | stream_state(acc, :pkts)],
            in_flight_pkt: nil
          )

        do_handle_packets(new_stream_state, rest)

      # Message is incomplete, continue in flight
      rest_of_message ->
        new_stream_state =
          stream_state(acc,
            pkts: [rest_of_message | stream_state(acc, :pkts)],
            in_flight_pkt: {tag, remaining_len - byte_size(rest_of_message)}
          )

        {:ok, new_stream_state}
    end
  end

  defp handle_pkt(acc, binary) do
    case binary do
      <<tag, len::32, payload::binary-size(len - 4), rest::binary>> ->
        case handle_message(acc, tag, len, payload) do
          {:ok, new_handler_state, pkt} ->
            do_handle_packets(
              stream_state(acc,
                pkts: [pkt | stream_state(acc, :pkts)],
                handler_state: new_handler_state
              ),
              rest
            )

          err ->
            err
        end

      # Incomplete message with known len
      <<tag, len::32, _rest::binary>> = bin ->
        handler_module = stream_state(acc, :handler_module)
        handled_message_types = handler_module.handled_message_types()

        # If we are interested in the content, we store it in pending so we can handle it later
        if tag in handled_message_types do
          {:ok, stream_state(acc, pending_bin: bin)}
        else
          {:ok,
           stream_state(acc,
             pkts: [bin | stream_state(acc, :pkts)],
             in_flight_pkt: {tag, len + 1 - byte_size(bin)}
           )}
        end

      # Incomplete message
      bin ->
        {:ok, stream_state(acc, pending_bin: bin)}
    end
  end

  defp handle_message(acc, tag, len, payload) do
    handler_module = stream_state(acc, :handler_module)
    handler_state = stream_state(acc, :handler_state)
    handled_message_types = handler_module.handled_message_types()

    if tag in handled_message_types do
      handler_module.handle_message(handler_state, tag, len, payload)
    else
      # Pass through unchanged for messages we're not interested in
      {:ok, handler_state, <<tag, len::32, payload::binary>>}
    end
  end

  def update_state(acc, fun) do
    new_handler_state = fun.(stream_state(acc, :handler_state))
    stream_state(acc, handler_state: new_handler_state)
  end
end
