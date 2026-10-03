defmodule Supavisor.PromEx.Plugins.SchedulerTest do
  use Supavisor.E2ECase, async: false

  alias Supavisor.PromEx.Plugins.Scheduler
  alias Supavisor.SchedulerUtilization

  @moduletag telemetry: true

  @table SchedulerUtilization

  describe "polling_metrics/1" do
    test "properly exports metrics" do
      for polling_metric <- Scheduler.polling_metrics([]) do
        assert %PromEx.MetricTypes.Polling{metrics: [_ | _]} = polling_metric
        {m, f, a} = polling_metric.measurements_mfa
        assert function_exported?(m, f, length(a))

        for telemetry_metric <- polling_metric.metrics do
          assert %Telemetry.Metrics.LastValue{} = telemetry_metric
          assert telemetry_metric.description
        end
      end
    end

    test "uses poll rate option" do
      for polling_metric <- Scheduler.polling_metrics(poll_rate: 1000) do
        assert %{poll_rate: 1000} = polling_metric
      end
    end

    test "per-scheduler metric is tagged by type and id" do
      metrics = Scheduler.polling_metrics([]) |> Enum.flat_map(& &1.metrics)

      metric =
        Enum.find(
          metrics,
          &(&1.name == [:supavisor, :prom_ex, :scheduler, :utilization, :percent])
        )

      assert metric
      assert metric.tags == [:type, :id]
    end

    test "aggregate metric is tagged by kind" do
      metrics = Scheduler.polling_metrics([]) |> Enum.flat_map(& &1.metrics)

      metric =
        Enum.find(
          metrics,
          &(&1.name == [:supavisor, :prom_ex, :scheduler, :utilization_aggregate, :percent])
        )

      assert metric
      assert metric.tags == [:kind]
    end
  end

  describe "execute_metrics/0" do
    test "emits one scheduler event per row and total/weighted aggregate events" do
      utilization = %{
        schedulers: [
          %{type: :normal, id: 1, percent: 12.5},
          %{type: :cpu, id: 1, percent: 3.0}
        ],
        total_percent: 20.0,
        weighted_percent: 18.0
      }

      :ets.insert(@table, {:utilization, utilization})

      sched_ref = attach_handler([:supavisor, :prom_ex, :scheduler, :utilization])
      agg_ref = attach_handler([:supavisor, :prom_ex, :scheduler, :utilization_aggregate])

      Scheduler.execute_metrics()

      assert_receive {^sched_ref, {_, %{percent: 12.5}, %{type: :normal, id: 1}}}
      assert_receive {^sched_ref, {_, %{percent: 3.0}, %{type: :cpu, id: 1}}}
      assert_receive {^agg_ref, {_, %{percent: 20.0}, %{kind: :total}}}
      assert_receive {^agg_ref, {_, %{percent: 18.0}, %{kind: :weighted}}}
    end

    test "does not emit aggregate events when they are nil" do
      :ets.insert(
        @table,
        {:utilization, %{schedulers: [], total_percent: nil, weighted_percent: nil}}
      )

      agg_ref = attach_handler([:supavisor, :prom_ex, :scheduler, :utilization_aggregate])

      Scheduler.execute_metrics()

      refute_receive {^agg_ref, _}
    end
  end

  def handle_event(event_name, measurement, meta, {pid, ref}) do
    send(pid, {ref, {event_name, measurement, meta}})
  end

  defp attach_handler(event) do
    ref = make_ref()

    :telemetry.attach(
      {ref, :test},
      event,
      &__MODULE__.handle_event/4,
      {self(), ref}
    )

    on_exit(fn ->
      :telemetry.detach({ref, :test})
    end)

    ref
  end
end
