defmodule Realtime.GenCounter do
  @moduledoc """
  Process holds an ETS table where each row is a key and a counter
  """

  use GenServer

  @name __MODULE__
  @table :gen_counter

  @spec start_link(any) :: GenServer.on_start()
  def start_link(_), do: GenServer.start_link(__MODULE__, :ok, name: @name)

  @spec add(term, integer) :: integer
  def add(term), do: add(term, 1)

  def add(term, count), do: :ets.update_counter(@table, term, count, {term, 0})

  @spec get(term) :: integer
  def get(term) do
    case :ets.lookup(@table, term) do
      [{^term, value}] -> value
      [] -> 0
    end
  end

  @doc "Reset counter to 0 and return previous value"
  @spec reset(term) :: integer
  def reset(term) do
    # We might lose some updates between lookup and the update
    case :ets.lookup(@table, term) do
      [{^term, 0}] ->
        0

      [{^term, previous}] ->
        :ets.update_element(@table, term, {2, 0}, {term, 0})
        previous

      [] ->
        0
    end
  end

  @spec delete(term) :: :ok
  def delete(term) do
    :ets.delete(@table, term)
    :ok
  end

  @impl true
  def init(_) do
    table =
      :ets.new(@table, [
        :set,
        :public,
        :named_table,
        {:decentralized_counters, true},
        {:write_concurrency, :auto}
      ])

    {:ok, table}
  end
end
