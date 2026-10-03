defmodule Supavisor.PromEx.Plugins.OsMonTest do
  use Supavisor.E2ECase, async: false

  alias Supavisor.PromEx.Plugins.OsMon

  @moduletag telemetry: true

  describe "polling_metrics/1" do
    test "properly exports metrics" do
      for polling_metric <- OsMon.polling_metrics([]) do
        assert %PromEx.MetricTypes.Polling{metrics: [_ | _]} = polling_metric
        {m, f, a} = polling_metric.measurements_mfa
        assert function_exported?(m, f, length(a))

        for telemetry_metric <- polling_metric.metrics do
          assert Enum.any?(
                   [
                     Telemetry.Metrics.Distribution,
                     Telemetry.Metrics.Counter,
                     Telemetry.Metrics.LastValue,
                     Telemetry.Metrics.Sum
                   ],
                   fn struct -> is_struct(telemetry_metric, struct) end
                 )

          assert telemetry_metric.description
        end
      end
    end

    test "uses poll rate option" do
      for polling_metric <- OsMon.polling_metrics(poll_rate: 1000) do
        assert %{poll_rate: 1000} = polling_metric
      end
    end
  end

  describe "disk metric definitions" do
    test "defines total/available/used_percent tagged by mountpoint" do
      metrics =
        OsMon.polling_metrics([])
        |> Enum.flat_map(& &1.metrics)

      for suffix <- [:total, :available, :used_percent] do
        name = [:supavisor, :prom_ex, :osmon, :disk, suffix]
        metric = Enum.find(metrics, &(&1.name == name))

        assert metric, "expected a disk #{suffix} metric named #{inspect(name)}"
        assert metric.tags == [:mountpoint]
      end
    end
  end

  describe "disk/0" do
    test "returns byte totals and capacity per mountpoint" do
      assert [_ | _] = disks = OsMon.disk()

      for {mountpoint, measurements} <- disks do
        assert is_binary(mountpoint)

        assert %{total: total, available: available, capacity: capacity} = measurements
        assert is_integer(total) and total >= 0
        assert is_integer(available) and available >= 0
        assert available <= total
        assert capacity in 0..100
      end
    end
  end

  describe "execute_disk_metrics/0" do
    test "emits a disk event per filesystem, each tagged with its mountpoint" do
      ref = attach_handler([:prom_ex, :plugin, :osmon, :disk])

      assert :ok = OsMon.execute_disk_metrics()

      events = drain_events(ref)
      assert events != []

      for {measurement, meta} <- events do
        assert %{total: total, available: available, capacity: capacity} = measurement
        assert is_integer(total)
        assert is_integer(available)
        assert capacity in 0..100

        assert %{mountpoint: mountpoint} = meta
        assert is_binary(mountpoint)
      end

      received = MapSet.new(events, fn {_measurement, meta} -> meta.mountpoint end)
      expected = MapSet.new(OsMon.disk(), fn {mountpoint, _} -> mountpoint end)
      assert MapSet.subset?(expected, received)
    end
  end

  def handle_event(event_name, measurement, meta, {pid, ref}) do
    send(pid, {ref, {event_name, measurement, meta}})
  end

  defp drain_events(ref, acc \\ []) do
    receive do
      {^ref, {[:prom_ex, :plugin, :osmon, :disk], measurement, meta}} ->
        drain_events(ref, [{measurement, meta} | acc])
    after
      100 -> Enum.reverse(acc)
    end
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
