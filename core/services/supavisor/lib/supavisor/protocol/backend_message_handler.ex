defmodule Supavisor.Protocol.BackendMessageHandler do
  @moduledoc """
  Message handler for PostgreSQL backend messages.

  Handles messages that need special processing:

  - `ParseComplete`, `CloseComplete`, `ParameterDescription`: prepared statement management.
    We use a queue to manage the actions that need to be performed on these messages, and
    actions may be inserted through `Supavisor.Protocol.MessageHandler.update_state/2`.
  - `ErrorResponse`: FATAL/PANIC errors are detected and stored in the handler state so the
    DbHandler can read the error reason before the connection closes.
  - `ReadyForQuery`: the number seen and the last transaction status are recorded,
    so the DbHandler can tell when every reply in a pipelined batch has been received.
  """

  @behaviour Supavisor.Protocol.MessageHandler

  require Record
  require Supavisor.Protocol.Server, as: Server

  Record.defrecord(:handler_state,
    action_queue: :queue.new(),
    fatal_error: nil,
    rfq_count: 0,
    last_rfq_status: nil
  )

  @impl true
  def handled_message_types do
    [?1, ?3, ?t, ?Z, ?E]
  end

  @impl true
  def init_state do
    handler_state()
  end

  @impl true
  def handle_message(state, ?E, len, payload) do
    pkt = <<?E, len::32, payload::binary>>
    error = Server.decode_error_response(payload)

    fatal = if error["S"] in ["FATAL", "PANIC"], do: error
    {:ok, handler_state(state, fatal_error: fatal), pkt}
  end

  def handle_message(state, tag, len, payload) do
    state = maybe_record_ready_for_query(state, tag, payload)
    action_queue = handler_state(state, :action_queue)
    message_type = message_type(tag)
    {injected_pkts, action_queue} = maybe_inject(action_queue)

    case :queue.out(action_queue) do
      {{:value, {:intercept, ^message_type}}, updated_queue} ->
        {:ok, handler_state(state, action_queue: updated_queue), injected_pkts}

      {{:value, {:forward, ^message_type}}, updated_queue} ->
        {:ok, handler_state(state, action_queue: updated_queue),
         [injected_pkts, <<tag, len::32, payload::binary>>]}

      _other ->
        {:ok, handler_state(state, action_queue: action_queue),
         [injected_pkts, <<tag, len::32, payload::binary>>]}
    end
  end

  defp maybe_inject(action_queue) do
    case :queue.out(action_queue) do
      {{:value, {:inject, :parse}}, updated_queue} ->
        {Server.parse_complete_message(), updated_queue}

      _other ->
        {[], action_queue}
    end
  end

  defp maybe_record_ready_for_query(state, ?Z, <<status::8>>),
    do:
      handler_state(state,
        rfq_count: handler_state(state, :rfq_count) + 1,
        last_rfq_status: status
      )

  defp maybe_record_ready_for_query(state, _tag, _payload), do: state

  defp message_type(?1), do: :parse
  defp message_type(?3), do: :close
  defp message_type(?t), do: :parameter_description
  defp message_type(?Z), do: :ready_for_query
end
