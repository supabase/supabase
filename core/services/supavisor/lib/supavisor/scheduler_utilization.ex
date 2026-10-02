defmodule Supavisor.SchedulerUtilization do
  @moduledoc """
  Owns the BEAM's `scheduler_wall_time` flag and periodically samples
  per-scheduler CPU utilization, caching the result in ETS for cheap reads.

  The flag is tied to the process that enables it: if that process dies, the
  BEAM silently turns it back off (see `m::scheduler`). Keeping the flag and
  the sample-diffing loop in a single supervised process means a crash just
  re-enables the flag and reseeds the baseline on restart, instead of the
  metric silently going stale.
  """

  use GenServer

  require Logger

  @table __MODULE__
  @default_interval :timer.seconds(15)

  @type scheduler_type :: :normal | :cpu | :io
  @type scheduler_row :: %{type: scheduler_type(), id: pos_integer(), percent: float()}
  @type utilization :: %{
          schedulers: [scheduler_row()],
          total_percent: float() | nil,
          weighted_percent: float() | nil
        }

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Returns the most recently sampled scheduler utilization."
  @spec read() :: utilization()
  def read do
    case :ets.lookup(@table, :utilization) do
      [{:utilization, value}] -> value
      [] -> %{schedulers: [], total_percent: nil, weighted_percent: nil}
    end
  rescue
    ArgumentError -> %{schedulers: [], total_percent: nil, weighted_percent: nil}
  end

  @impl true
  def init(opts) do
    interval = Keyword.get(opts, :interval, @default_interval)

    :ets.new(@table, [:named_table, :public, read_concurrency: true])

    schedule_tick(interval)

    {:ok, %{interval: interval, sample: enable_and_sample()}}
  end

  @impl true
  def handle_info(:tick, state) do
    new_sample = enable_and_sample()

    with prev when not is_nil(prev) <- state.sample,
         next when not is_nil(next) <- new_sample do
      :ets.insert(@table, {:utilization, to_utilization(:scheduler.utilization(prev, next))})
    else
      _ ->
        Logger.warning(
          "SchedulerUtilization: scheduler_wall_time sample unavailable, skipping this tick"
        )
    end

    schedule_tick(state.interval)
    {:noreply, %{state | sample: new_sample}}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.error("SchedulerUtilization received unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp enable_and_sample do
    _ = :erlang.system_flag(:scheduler_wall_time, true)

    case :scheduler.get_sample_all() do
      :undefined -> nil
      sample -> sample
    end
  end

  defp schedule_tick(interval), do: Process.send_after(self(), :tick, interval)

  defp to_utilization(raw) do
    acc = %{schedulers: [], total_percent: nil, weighted_percent: nil}

    # `:scheduler.utilization/2` also returns a `Percent` element, but it's a
    # pre-formatted charlist (e.g. `~c"2.1%"`) meant for humans, not a number
    # usable as a metric — so we derive our own percent from the raw ratio.
    raw
    |> Enum.reduce(acc, fn
      {:total, ratio, _percent}, acc ->
        %{acc | total_percent: ratio * 100}

      {:weighted, ratio, _percent}, acc ->
        %{acc | weighted_percent: ratio * 100}

      {type, id, ratio, _percent}, acc ->
        %{acc | schedulers: [%{type: type, id: id, percent: ratio * 100} | acc.schedulers]}
    end)
    |> then(&%{&1 | schedulers: Enum.reverse(&1.schedulers)})
  end
end
