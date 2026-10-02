defmodule Supavisor.Protocol.FrontendMessageHandler do
  @moduledoc """
  Handles PostgreSQL frontend messages.

  - Parse (P), Bind (B), Close (C), Describe (D): PreparedStatements
  - Simple Query (Q): SimpleQueryHandler
  - Execute (E), Sync (S), FunctionCall (F): forwarded unchanged

  It also counts the number of messages that produce a `ReadyForQuery` response from the backend.

  Extended protocol messages only reach a transaction boundary once the client
  sends a Sync, so `open_batch?` tracks whether one is still pending. The
  backend keeps such a batch buffered and waits for the Sync, so the connection
  must not be released while this is set, even if every response so far has
  already arrived.
  """

  @behaviour Supavisor.Protocol.MessageHandler

  alias Supavisor.Protocol.PreparedStatements
  alias Supavisor.Protocol.SimpleQueryHandler

  @rfq_producers [?Q, ?S, ?F]

  @impl true
  def handled_message_types, do: [?P, ?B, ?C, ?D, ?E, ?Q, ?S, ?F]

  @impl true
  def init_state do
    %{
      prepared_statements: PreparedStatements.init_storage(),
      rfq_producers: 0,
      open_batch?: false,
      # Prepared statements feature flag:
      translate?: true
    }
  end

  @impl true
  def handle_message(%{translate?: false} = state, tag, len, payload) do
    {:ok, state |> count_rfq_producer(tag) |> track_open_batch(tag),
     <<tag, len::32, payload::binary>>}
  end

  def handle_message(state, tag, len, payload) do
    case tag do
      ?P ->
        PreparedStatements.handle_parse_message(state.prepared_statements, len, payload)

      ?B ->
        PreparedStatements.handle_bind_message(state.prepared_statements, len, payload)

      ?C ->
        PreparedStatements.handle_close_message(state.prepared_statements, len, payload)

      ?D ->
        PreparedStatements.handle_describe_message(state.prepared_statements, len, payload)

      ?Q ->
        SimpleQueryHandler.handle_simple_query_message(state.prepared_statements, len, payload)

      tag when tag in [?E, ?S, ?F] ->
        {:ok, state.prepared_statements, <<tag, len::32, payload::binary>>}
    end
    |> case do
      {:ok, new_ps_state, result} ->
        new_state = %{state | prepared_statements: new_ps_state}
        {:ok, new_state |> count_rfq_producer(tag) |> track_open_batch(tag), result}

      error ->
        error
    end
  end

  defp count_rfq_producer(state, tag) when tag in @rfq_producers,
    do: %{state | rfq_producers: state.rfq_producers + 1}

  defp count_rfq_producer(state, _tag), do: state

  # Extended protocol messages leave the backend holding a batch until a Sync
  # reaches it. Simple Query and FunctionCall produce a ReadyForQuery of their
  # own and are unrelated to the extended protocol, so they leave this untouched.
  defp track_open_batch(state, tag) when tag in [?P, ?B, ?E, ?D, ?C],
    do: %{state | open_batch?: true}

  defp track_open_batch(state, ?S), do: %{state | open_batch?: false}

  defp track_open_batch(state, _tag), do: state
end
