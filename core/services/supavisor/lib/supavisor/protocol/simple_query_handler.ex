defmodule Supavisor.Protocol.SimpleQueryHandler do
  @moduledoc """
  Handles PostgreSQL Simple Query (Q) messages.

  This module processes simple query messages and enforces restrictions,
  such as preventing the use of PREPARE statements in simple queries.
  """

  require Logger

  @type pkt() :: binary()

  @prepared_statements_stmts MapSet.new([
                               "DeallocateStmt",
                               "PrepareStmt",
                               "ExecuteStmt"
                             ])

  @doc """
  Handles a Simple Query (Q) message.

  Validates the query and returns an error if PREPARE statements are detected,
  otherwise passes the query through unchanged.
  """
  @spec handle_simple_query_message(any(), non_neg_integer(), binary()) ::
          {:ok, any(), pkt()} | {:error, Supavisor.Errors.SimpleQueryNotSupportedError.t()}
  def handle_simple_query_message(state, len, payload) do
    # Some clients may send null terminators
    clean_payload = String.trim_trailing(payload, <<0>>)

    case Supavisor.PgParser.statement_types(clean_payload) do
      {:ok, types} ->
        if MapSet.disjoint?(MapSet.new(types), @prepared_statements_stmts) do
          {:ok, state, <<?Q, len::32, payload::binary>>}
        else
          {:error, %Supavisor.Errors.SimpleQueryNotSupportedError{}}
        end

      {:error, error} ->
        Logger.debug(
          "Failed to parse simple query: #{inspect(error)}, payload: #{inspect(clean_payload)}"
        )

        {:ok, state, <<?Q, len::32, payload::binary>>}
    end
  end
end
