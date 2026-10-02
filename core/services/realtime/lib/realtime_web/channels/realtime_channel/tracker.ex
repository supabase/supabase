defmodule RealtimeWeb.RealtimeChannel.Tracker do
  @moduledoc """
  Tracks if the user has any channels open.

  Stores in :ets table the data.

  If the user has no channels open, we kill the transport pid.
  """
  use GenServer
  require Logger

  @table :channel_tracker
  @zero_count_match [{{:"$1", :"$2"}, [{:"=<", :"$2", 0}], [:"$1"]}]
  @zero_count_delete [{{:"$1", :"$2"}, [{:"=<", :"$2", 0}], [true]}]
  @doc """
  Tracks a transport pid.
  """
  @spec track(pid()) :: integer()
  def track(pid), do: :ets.update_counter(@table, pid, 1, {pid, 0})

  @doc """
  Un-tracks a transport pid.
  """
  @spec untrack(pid()) :: integer()
  def untrack(pid), do: :ets.update_counter(@table, pid, -1, {pid, 0})

  @doc """
  Returns the number of channels open for a transport pid.
  """
  @spec count(pid()) :: integer()
  def count(pid) do
    case :ets.lookup(@table, pid) do
      [{^pid, count}] -> count
      [] -> 0
    end
  end

  @doc """
  Returns a list of all pids in the table and their count.
  """
  @spec list_pids() :: [{pid(), integer()}]
  def list_pids, do: :ets.tab2list(@table)

  def start_link(opts) do
    if :ets.whereis(@table) == :undefined do
      :ets.new(@table, [
        :set,
        :public,
        :named_table,
        {:decentralized_counters, true},
        {:write_concurrency, true}
      ])
    end

    GenServer.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    check_interval_in_ms = Keyword.fetch!(opts, :check_interval_in_ms)
    Process.send_after(self(), :check_channels, check_interval_in_ms)
    {:ok, %{check_interval_in_ms: check_interval_in_ms}}
  end

  @impl true
  def handle_info(:check_channels, state) do
    chunked_killing()
    :ets.select_delete(@table, @zero_count_delete)
    Process.send_after(self(), :check_channels, state.check_interval_in_ms)
    {:noreply, state}
  end

  defp chunked_killing(cont \\ nil) do
    result = if cont, do: :ets.select(cont), else: :ets.select(@table, @zero_count_match, 1000)

    case result do
      :"$end_of_table" ->
        :ok

      {pids, cont} ->
        Logger.info("Killing #{length(pids)} transport pids with no channels open")
        Enum.each(pids, fn pid -> if Process.alive?(pid), do: Process.exit(pid, :kill) end)
        chunked_killing(cont)
    end
  end

  def table_name, do: @table
end
