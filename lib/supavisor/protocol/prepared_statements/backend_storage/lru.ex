defmodule Supavisor.Protocol.PreparedStatements.BackendStorage.LRU do
  @moduledoc """
  Backend-side prepared statement tracking with LRU eviction.

  Tracks which prepared statements are currently registered on a single backend
  connection. Each statement is associated with a monotonically increasing
  sequence number representing its last use. When the backend is asked to make
  room via `evict/2`, statements with the smallest sequence numbers are
  removed first.

  `put/2` (called on `Parse`) and `touch/2` (called on `Bind` for a statement
  already known to the backend) refresh a statement's recency. `delete/2`
  removes a statement explicitly, for example when the client sends `Close`.
  """

  @behaviour Supavisor.Protocol.PreparedStatements.BackendStorage

  alias Supavisor.Protocol.PreparedStatements

  @type t() :: %__MODULE__{
          counter: non_neg_integer(),
          seq_by_name: %{PreparedStatements.statement_name() => non_neg_integer()}
        }

  defstruct counter: 0, seq_by_name: %{}

  @impl true
  @spec new() :: t()
  def new, do: %__MODULE__{}

  @impl true
  @spec size(t()) :: non_neg_integer()
  def size(%__MODULE__{seq_by_name: seq_by_name}), do: map_size(seq_by_name)

  @impl true
  @spec member?(t(), PreparedStatements.statement_name()) :: boolean()
  def member?(%__MODULE__{seq_by_name: seq_by_name}, name) do
    Map.has_key?(seq_by_name, name)
  end

  @doc """
  Registers a statement or refreshes its recency if it is already present.
  """
  @impl true
  @spec put(t(), PreparedStatements.statement_name()) :: t()
  def put(%__MODULE__{counter: counter, seq_by_name: seq_by_name}, name) do
    next = counter + 1
    %__MODULE__{counter: next, seq_by_name: Map.put(seq_by_name, name, next)}
  end

  @doc """
  Marks a statement as recently used. No-op if the statement is not tracked.
  """
  @impl true
  @spec touch(t(), PreparedStatements.statement_name()) :: t()
  def touch(%__MODULE__{seq_by_name: seq_by_name} = storage, name) do
    if Map.has_key?(seq_by_name, name), do: put(storage, name), else: storage
  end

  @impl true
  @spec delete(t(), PreparedStatements.statement_name()) :: t()
  def delete(%__MODULE__{seq_by_name: seq_by_name} = storage, name) do
    %__MODULE__{storage | seq_by_name: Map.delete(seq_by_name, name)}
  end

  @doc """
  Removes up to `n` least recently used statements and returns their names.
  """
  @impl true
  @spec evict(t(), pos_integer()) :: {[PreparedStatements.statement_name()], t()}
  def evict(%__MODULE__{seq_by_name: seq_by_name} = storage, n) when n > 0 do
    oldest =
      seq_by_name
      |> Enum.sort_by(fn {_name, seq} -> seq end)
      |> Enum.take(n)
      |> Enum.map(fn {name, _seq} -> name end)

    {oldest, %__MODULE__{storage | seq_by_name: Map.drop(seq_by_name, oldest)}}
  end
end
