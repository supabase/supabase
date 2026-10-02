defmodule Supavisor.ConnectBackoff do
  @moduledoc """
  Tracks the timestamp of the most recent failed DB connect attempt per tenant
  pool id, in a named ETS table owned by the application supervisor.

  Lives at the application level (rather than under `TenantSupervisor`) so the
  backoff survives a pool restart. If it lived inside the tenant supervision
  tree, restarting the pool would wipe the timestamp and let new workers
  reconnect immediately — defeating the cooldown in exactly the situation it
  most needs to apply.
  """

  require Logger

  @table __MODULE__

  @stale_after_ms :timer.hours(1)
  @cleanup_chunk_size 100

  @doc """
  Initializes the named ETS table. Called from the application supervisor.
  """
  @spec init() :: :ok
  def init do
    :ets.new(@table, [
      :named_table,
      :public,
      :set,
      read_concurrency: true,
      write_concurrency: true
    ])

    :ok
  end

  @spec record_failure(Supavisor.id(), integer()) :: true
  def record_failure(id, monotonic_ms) do
    :ets.insert(@table, {id, monotonic_ms})
  end

  @spec last_failure(Supavisor.id()) :: integer() | nil
  def last_failure(id) do
    :ets.lookup_element(@table, id, 2, nil)
  end

  @doc """
  Deletes entries older than `@stale_after_ms`. Called periodically by the
  Janitor.
  """
  @spec cleanup_stale_entries() :: non_neg_integer()
  def cleanup_stale_entries do
    now = System.monotonic_time(:millisecond)
    cutoff = now - @stale_after_ms
    match_spec = [{:_, [], [:"$_"]}]
    deleted = cleanup_chunk(:ets.select(@table, match_spec, @cleanup_chunk_size), cutoff, 0)

    if deleted > 0 do
      Logger.info("ConnectBackoff cleaned up #{deleted} stale entries")
    end

    deleted
  end

  defp cleanup_chunk(:"$end_of_table", _cutoff, deleted), do: deleted

  defp cleanup_chunk({entries, continuation}, cutoff, deleted) do
    chunk_deleted =
      Enum.reduce(entries, 0, fn {id, ts}, acc ->
        if ts < cutoff do
          :ets.delete_object(@table, {id, ts})
          acc + 1
        else
          acc
        end
      end)

    cleanup_chunk(:ets.select(continuation), cutoff, deleted + chunk_deleted)
  end
end
