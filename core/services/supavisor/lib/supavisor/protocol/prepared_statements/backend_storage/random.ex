defmodule Supavisor.Protocol.PreparedStatements.BackendStorage.Random do
  @moduledoc """
  Backend-side prepared statement tracking with random eviction.

  Tracks which prepared statements are currently registered on a single backend
  connection. When the backend is asked to make room via `evict/2`, an
  arbitrary subset of `n` statements is evicted regardless of recency. This is
  the historical strategy preserved for side-by-side comparison with the LRU
  implementation.
  """

  @behaviour Supavisor.Protocol.PreparedStatements.BackendStorage

  alias Supavisor.Protocol.PreparedStatements

  @type t() :: %__MODULE__{set: MapSet.t(PreparedStatements.statement_name())}

  defstruct set: MapSet.new()

  @impl true
  @spec new() :: t()
  def new, do: %__MODULE__{}

  @impl true
  @spec size(t()) :: non_neg_integer()
  def size(%__MODULE__{set: set}), do: MapSet.size(set)

  @impl true
  @spec member?(t(), PreparedStatements.statement_name()) :: boolean()
  def member?(%__MODULE__{set: set}, name), do: MapSet.member?(set, name)

  @impl true
  @spec put(t(), PreparedStatements.statement_name()) :: t()
  def put(%__MODULE__{set: set} = storage, name) do
    %__MODULE__{storage | set: MapSet.put(set, name)}
  end

  @impl true
  @spec touch(t(), PreparedStatements.statement_name()) :: t()
  def touch(%__MODULE__{} = storage, _name), do: storage

  @impl true
  @spec delete(t(), PreparedStatements.statement_name()) :: t()
  def delete(%__MODULE__{set: set} = storage, name) do
    %__MODULE__{storage | set: MapSet.delete(set, name)}
  end

  @impl true
  @spec evict(t(), pos_integer()) :: {[PreparedStatements.statement_name()], t()}
  def evict(%__MODULE__{set: set} = storage, n) when n > 0 do
    evicted = Enum.take_random(set, n)
    {evicted, %__MODULE__{storage | set: MapSet.difference(set, MapSet.new(evicted))}}
  end
end
