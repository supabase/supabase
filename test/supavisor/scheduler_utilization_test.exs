defmodule Supavisor.SchedulerUtilizationTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  alias Supavisor.SchedulerUtilization

  @table SchedulerUtilization

  describe "read/0" do
    test "returns the cached utilization written by the running poller" do
      utilization = %{
        schedulers: [
          %{type: :normal, id: 1, percent: 12.5},
          %{type: :cpu, id: 1, percent: 3.0},
          %{type: :io, id: 1, percent: 0.0}
        ],
        total_percent: 20.0,
        weighted_percent: 18.0
      }

      :ets.insert(@table, {:utilization, utilization})

      assert SchedulerUtilization.read() == utilization
    end

    test "falls back to an empty result when nothing has been sampled yet" do
      :ets.delete(@table, :utilization)

      assert SchedulerUtilization.read() == %{
               schedulers: [],
               total_percent: nil,
               weighted_percent: nil
             }
    end

    test "the running poller produces sane values on its own" do
      # The app-supervised instance ticks on `prom_poll_rate` (500ms in test);
      # wait for at least one real tick instead of relying on injected data.
      Process.sleep(600)

      assert %{schedulers: [_ | _] = schedulers, total_percent: total} =
               SchedulerUtilization.read()

      assert is_float(total)
      assert total >= 0.0

      for %{type: type, id: id, percent: percent} <- schedulers do
        assert type in [:normal, :cpu, :io]
        assert is_integer(id)
        assert is_float(percent)
        assert percent >= 0.0
      end
    end
  end

  describe "handle_info/2" do
    test "survives and logs on an unexpected message instead of crashing" do
      pid = Process.whereis(SchedulerUtilization)
      assert is_pid(pid)

      log =
        capture_log(fn ->
          send(pid, :some_unexpected_message)
          # Give the GenServer a moment to process the message before we assert.
          :sys.get_state(pid)
        end)

      assert log =~ "unexpected message"
      assert Process.alive?(pid)
      assert Process.whereis(SchedulerUtilization) == pid
    end
  end
end
