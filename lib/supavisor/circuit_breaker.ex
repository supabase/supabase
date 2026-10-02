defmodule Supavisor.CircuitBreaker do
  @moduledoc """
  Circuit breaker for pool operations.

  Uses two ETS tables:
  - `@blocks_table`: stores `{ets_key, blocked_until}` — the hot path for `check/2`.
    Tiny tuples, fast to copy.
  - `@windows_table`: stores `{ets_key, sliding_window}` — only touched on `record_failure/2`.
  """

  require Logger

  alias Supavisor.CircuitBreaker.SlidingWindow
  alias Supavisor.Errors.CircuitBreakerError

  @windows_table Supavisor.CircuitBreaker.Windows
  @blocks_table Supavisor.CircuitBreaker.Blocks

  @config %{
    get_secrets: %{
      max_failures: 5,
      sliding_window_seconds: 300,
      block_seconds: 30,
      explanation:
        "failed to retrieve database credentials after multiple attempts, new connections are temporarily blocked",
      propagate?: false
    },
    db_connection: %{
      max_failures: 100,
      sliding_window_seconds: 150,
      block_seconds: 30,
      explanation:
        "too many failed attempts to connect to the database, new connections are temporarily blocked",
      propagate?: false
    },
    auth_error: %{
      max_failures: 10,
      sliding_window_seconds: 150,
      block_seconds: 120,
      explanation: "too many authentication failures, new connections are temporarily blocked",
      propagate?: true
    },
    test: %{
      max_failures: 10,
      sliding_window_seconds: 15,
      block_seconds: 30,
      propagate?: false,
      explanation: "Test circuit breaker"
    }
  }

  @doc """
  Initializes the circuit breaker ETS tables.
  Called by the application supervisor.
  """
  def init do
    :ets.new(@blocks_table, [
      :named_table,
      :public,
      :set,
      read_concurrency: true,
      write_concurrency: true
    ])

    :ets.new(@windows_table, [
      :named_table,
      :public,
      :set,
      read_concurrency: true,
      write_concurrency: true
    ])
  end

  @doc """
  Records a failure for a given key and operation.
  """
  @spec record_failure(term(), atom()) :: :ok
  def record_failure(key, operation) when is_atom(operation) do
    record_failures(key, operation, 1)
  end

  defp record_failures(key, operation, count) do
    threshold = Map.fetch!(@config, operation)
    ets_key = {key, operation}
    now = System.system_time(:second)

    # Skip if already blocked — no need to re-trip.
    case :ets.lookup(@blocks_table, ets_key) do
      [{^ets_key, blocked}] when blocked > now ->
        :ok

      _ ->
        sw = get_or_create_sw(ets_key, threshold.sliding_window_seconds, now)
        estimated = SlidingWindow.record(sw, now, count)

        if estimated >= threshold.max_failures do
          block_until = now + threshold.block_seconds
          :ets.insert(@blocks_table, {ets_key, block_until})

          Logger.warning(
            "Circuit breaker opened for key=#{inspect(key)} operation=#{operation} until=#{block_until}"
          )

          threshold.propagate? && open_global(key, operation, block_until)
        end

        :ok
    end
  end

  @doc """
  Checks if a circuit breaker is open for a given key and operation.
  Returns :ok if operation is allowed, {:error, CircuitBreakerError.t()} otherwise.
  """
  @spec check(term(), atom()) :: :ok | {:error, CircuitBreakerError.t()}
  def check(key, operation) when is_atom(operation) do
    ets_key = {key, operation}

    case :ets.lookup(@blocks_table, ets_key) do
      [] ->
        :ok

      [{^ets_key, blocked}] ->
        if blocked > System.system_time(:second) do
          {:error, %CircuitBreakerError{operation: operation, blocked_until: blocked}}
        else
          :ets.delete_object(@blocks_table, {ets_key, blocked})
          :ok
        end
    end
  end

  @doc """
  Given the operation returns a list of {key, blocked_until} for which the circuit is opened.

  ## Examples

      iex> opened("tenant1", :auth_error)
      [{"tenant1", 1234567890}]

      iex> opened({"tenant1", "192.168.1.100"}, :auth_error)
      [{{"tenant1", "192.168.1.100"}, 1234567890}]

      iex> opened({"tenant1", :_}, :auth_error)
      [{{"tenant1", "192.168.1.100"}, 1234567890}, {"tenant1", "10.0.0.1"}, 1234567891}]
  """
  @spec opened(term(), atom()) :: [{term(), integer()}]
  def opened(key, operation) when is_atom(operation) do
    now = System.system_time(:second)

    :ets.match_object(@blocks_table, {{key, operation}, :_})
    |> Enum.reduce([], fn {{k, _op}, blocked}, acc ->
      if blocked > now do
        [{k, blocked} | acc]
      else
        acc
      end
    end)
  end

  @doc """
  Clears circuit breaker state for a key and operation.
  """
  @spec clear(term(), atom()) :: :ok
  def clear(key, operation) when is_atom(operation) do
    clear_local(key, operation)
    Map.fetch!(@config, operation).propagate? && clear_global(key, operation)
    :ok
  end

  @doc """
  Clears circuit breaker for a given key and operation on the current node.
  """
  @spec clear_local(term(), atom()) :: :ok
  def clear_local(key, operation) when is_atom(operation) do
    ets_key = {key, operation}
    :ets.delete(@blocks_table, ets_key)
    :ets.delete(@windows_table, ets_key)
    Logger.warning("Circuit breaker cleared for key=#{inspect(key)} operation=#{operation}")
    :ok
  end

  # Propagates the state clearing to all nodes in the cluster.
  defp clear_global(key, operation) do
    nodes = Node.list()

    nodes
    |> :erpc.multicall(__MODULE__, :clear_local, [key, operation], 10_000)
    |> then(&Enum.zip(nodes, &1))
    |> Enum.each(fn
      {node, {:ok, :ok}} ->
        Logger.debug(
          "Circuit breaker cleared for key=#{inspect(key)} operation=#{operation} node=#{node}"
        )

      {node, error} ->
        Logger.error(
          "Circuit breaker failed to clear for key=#{inspect(key)} operation=#{operation} node=#{node} error=#{inspect(error)}"
        )
    end)
  end

  @doc """
  Opens the circuit arbitrary for a given key and operation on the current node.
  """
  @spec open_local(term(), atom(), integer(), list(integer()) | nil) :: :ok
  def open_local(key, operation, blocked_until, _recent_failures \\ nil)
      when is_atom(operation) and is_integer(blocked_until) do
    ets_key = {key, operation}
    :ets.insert(@blocks_table, {ets_key, blocked_until})

    Logger.warning(
      "Circuit breaker opened for key=#{inspect(key)} operation=#{operation} until=#{blocked_until}"
    )

    :ok
  end

  # Propagates the circuit open to all nodes in the cluster.
  defp open_global(key, operation, blocked_until) do
    nodes = Node.list()

    nodes
    |> :erpc.multicall(__MODULE__, :open_local, [key, operation, blocked_until, nil], 10_000)
    |> then(&Enum.zip(nodes, &1))
    |> Enum.each(fn
      {node, {:ok, :ok}} ->
        Logger.debug(
          "Circuit breaker opened for key=#{inspect(key)} operation=#{operation} node=#{node}"
        )

      {node, error} ->
        Logger.error(
          "Circuit breaker failed to open for key=#{inspect(key)} operation=#{operation} node=#{node} error=#{inspect(error)}"
        )
    end)
  end

  @doc """
  Returns a map with the circuit breaker state for a given key and operation.
  """
  @spec info(term(), atom()) :: map()
  def info(key, operation) when is_atom(operation) do
    ets_key = {key, operation}
    config = Map.fetch!(@config, operation)
    now = System.system_time(:second)

    {status, blocked_until} =
      case :ets.lookup(@blocks_table, ets_key) do
        [{^ets_key, blocked}] when blocked > now -> {:open, blocked}
        _ -> {:closed, nil}
      end

    estimated =
      case :ets.lookup(@windows_table, ets_key) do
        [{^ets_key, sw}] -> SlidingWindow.estimated_count(sw, now)
        [] -> nil
      end

    %{
      key: key,
      operation: operation,
      status: status,
      estimated_failures: estimated,
      max_failures: config.max_failures,
      sliding_window_seconds: config.sliding_window_seconds,
      window_seconds: config.sliding_window_seconds * 2,
      block_seconds: config.block_seconds,
      blocked_until: blocked_until
    }
  end

  @doc """
  Returns the user-facing explanation for a given operation.
  """
  @spec explanation(atom()) :: String.t()
  def explanation(operation) when is_atom(operation) do
    @config
    |> Map.fetch!(operation)
    |> Map.fetch!(:explanation)
  end

  @doc """
  Removes stale entries from the circuit breaker table.
  Called periodically by the Janitor process.
  """
  @cleanup_chunk_size 100

  @spec cleanup_stale_entries() :: non_neg_integer()
  def cleanup_stale_entries do
    now = System.system_time(:second)
    match_spec = [{:_, [], [:"$_"]}]
    deleted = cleanup_chunk(:ets.select(@windows_table, match_spec, @cleanup_chunk_size), now, 0)

    if deleted > 0 do
      Logger.info("Circuit breaker cleaned up #{deleted} stale entries")
    end

    deleted
  end

  defp cleanup_chunk(:"$end_of_table", _now, deleted), do: deleted

  defp cleanup_chunk({entries, continuation}, now, deleted) do
    chunk_deleted =
      Enum.reduce(entries, 0, fn {{key, operation} = ets_key, sw}, acc ->
        pre_delete_window = SlidingWindow.window_index(sw)

        blocked = :ets.lookup_element(@blocks_table, ets_key, 2, 0)

        not_blocked = blocked == 0 or blocked < now

        stale_window = SlidingWindow.stale?(sw, now)

        if not_blocked and stale_window do
          # Delete window first — record_failure callers that already hold the
          # atomics ref will still increment it, but new callers will create a
          # fresh window.
          :ets.delete(@windows_table, ets_key)

          # Only delete the exact block tuple we observed, not a fresh one that
          # a concurrent record_failure may have inserted after our lookup.
          if blocked > 0, do: :ets.delete_object(@blocks_table, {ets_key, blocked})

          # If window_index was rotated since our staleness check, a concurrent
          # record_failure was in-flight. Replay the estimated count so those
          # failures aren't lost.
          #
          # It is safe to assume that the estimate will only contain current
          # window data
          post_delete_window = SlidingWindow.window_index(sw)

          if post_delete_window != pre_delete_window do
            estimated = SlidingWindow.estimated_count(sw, now)

            if estimated > 0 do
              record_failures(key, operation, estimated)
            end
          end

          acc + 1
        else
          acc
        end
      end)

    cleanup_chunk(:ets.select(continuation), now, deleted + chunk_deleted)
  end

  # Returns existing sw or creates a new one for the given ETS key.
  # Uses insert_new to handle concurrent creation races — only the first insert wins,
  # and the loser re-reads the winning ref.
  defp get_or_create_sw(ets_key, window_seconds, now, attempt \\ 0) do
    case :ets.lookup(@windows_table, ets_key) do
      [{^ets_key, sw}] ->
        sw

      [] ->
        sw = SlidingWindow.new(window_seconds, now)

        if :ets.insert_new(@windows_table, {ets_key, sw}) do
          sw
        else
          case :ets.lookup(@windows_table, ets_key) do
            [{^ets_key, existing_sw}] ->
              existing_sw

            [] ->
              get_or_create_sw(ets_key, window_seconds, now, attempt + 1)
          end
        end
    end
  end
end
