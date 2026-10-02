defmodule Supavisor.Protocol.PreparedStatements.Storage do
  @moduledoc """
  Client-side storage abstraction for prepared statements.
  """

  alias Supavisor.Protocol.PreparedStatements
  alias Supavisor.Protocol.PreparedStatements.PreparedStatement

  @statement_limit 100
  @memory_limit_bytes 1_000_000

  @type t() ::
          {size :: non_neg_integer(),
           %{PreparedStatements.statement_name() => PreparedStatement.t()}}

  @spec new() :: t()
  def new do
    {0, %{}}
  end

  @spec put(t(), PreparedStatements.statement_name(), PreparedStatement.t()) ::
          {:ok, t()}
          | {:error, Supavisor.Errors.MaxPreparedStatementsError.t()}
          | {:error, Supavisor.Errors.MaxPreparedStatementsMemoryError.t()}
          | {:error, Supavisor.Errors.DuplicatePreparedStatementError.t()}
  def put({size, statements}, statement_name, statement) do
    cond do
      map_size(statements) >= @statement_limit ->
        {:error, %Supavisor.Errors.MaxPreparedStatementsError{limit: @statement_limit}}

      Map.has_key?(statements, statement_name) ->
        {:error, %Supavisor.Errors.DuplicatePreparedStatementError{name: statement_name}}

      true ->
        new_size = size + PreparedStatement.size(statement)

        if new_size > @memory_limit_bytes do
          {:error,
           %Supavisor.Errors.MaxPreparedStatementsMemoryError{
             limit_mb: @memory_limit_bytes / 1_000_000
           }}
        else
          {:ok, {new_size, Map.put(statements, statement_name, statement)}}
        end
    end
  end

  @spec get(t(), PreparedStatements.statement_name()) :: PreparedStatement.t() | nil
  def get({_size, statements}, statement_name) do
    Map.get(statements, statement_name)
  end

  @spec pop(t(), PreparedStatements.statement_name()) :: {PreparedStatement.t() | nil, t()}
  def pop({size, statements}, statement_name) do
    {statement, new_statements} = Map.pop(statements, statement_name)
    new_size = size - PreparedStatement.size(statement)
    {statement, {new_size, new_statements}}
  end

  @spec statement_count(t()) :: non_neg_integer()
  def statement_count({_size, statements}) do
    map_size(statements)
  end

  @spec statement_memory(t()) :: non_neg_integer()
  def statement_memory({size, _statements}) do
    size
  end

  @spec statement_limit() :: pos_integer()
  def statement_limit, do: @statement_limit

  @spec memory_limit_bytes() :: pos_integer()
  def memory_limit_bytes, do: @memory_limit_bytes
end
