defmodule Supavisor.PromEx.Plugins.Scheduler do
  @moduledoc """
  Exposes per-scheduler CPU utilization sampled by `Supavisor.SchedulerUtilization`.

  This plugin only reads the latest cached sample; it does not touch the
  `scheduler_wall_time` flag itself.
  """

  use PromEx.Plugin

  alias Supavisor.SchedulerUtilization

  @event_scheduler [:supavisor, :prom_ex, :scheduler, :utilization]
  @event_aggregate [:supavisor, :prom_ex, :scheduler, :utilization_aggregate]
  @prefix [:supavisor, :prom_ex]

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      Polling.build(
        :supavisor_scheduler_utilization_events,
        poll_rate,
        {__MODULE__, :execute_metrics, []},
        [
          last_value(
            @prefix ++ [:scheduler, :utilization, :percent],
            event_name: @event_scheduler,
            description:
              "Percentage of wall-clock time each BEAM scheduler spent busy, sampled between polls.",
            measurement: :percent,
            tags: [:type, :id]
          ),
          last_value(
            @prefix ++ [:scheduler, :utilization_aggregate, :percent],
            event_name: @event_aggregate,
            description:
              "Aggregate scheduler utilization: total across normal and dirty-CPU schedulers, and weighted by logical processors available.",
            measurement: :percent,
            tags: [:kind]
          )
        ]
      )
    ]
  end

  @doc false
  def execute_metrics do
    %{schedulers: schedulers, total_percent: total, weighted_percent: weighted} =
      SchedulerUtilization.read()

    Enum.each(schedulers, fn %{type: type, id: id, percent: percent} ->
      :telemetry.execute(@event_scheduler, %{percent: percent}, %{type: type, id: id})
    end)

    if total, do: :telemetry.execute(@event_aggregate, %{percent: total}, %{kind: :total})

    if weighted,
      do: :telemetry.execute(@event_aggregate, %{percent: weighted}, %{kind: :weighted})
  end
end
