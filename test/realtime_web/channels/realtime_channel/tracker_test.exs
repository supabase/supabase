defmodule RealtimeWeb.RealtimeChannel.TrackerTest do
  # It kills websockets when no channels are open
  # It can affect other tests
  use Realtime.DataCase, async: false
  alias RealtimeWeb.RealtimeChannel.Tracker

  setup do
    start_supervised!({Tracker, check_interval_in_ms: 100})
    :ets.delete_all_objects(Tracker.table_name())
    :ok
  end

  describe "track/2" do
    test "is able to track channels per transport pid" do
      pid = self()
      Tracker.track(pid)

      assert Tracker.count(pid) == 1
    end

    test "is able to track multiple channels per transport pid" do
      pid = self()
      Tracker.track(pid)
      Tracker.track(pid)

      assert Tracker.count(pid) == 2
    end
  end

  describe "untrack/1" do
    test "is able to untrack a transport pid" do
      pid = self()
      Tracker.track(pid)
      Tracker.untrack(pid)

      assert Tracker.count(pid) == 0
    end
  end

  describe "count/1" do
    test "is able to count the number of channels per transport pid" do
      pid = self()
      Tracker.track(pid)
      Tracker.track(pid)

      assert Tracker.count(pid) == 2
    end
  end

  describe "list_pids/0" do
    test "is able to list all pids in the table and their count" do
      pid = self()
      Tracker.track(pid)
      Tracker.track(pid)

      assert Tracker.list_pids() == [{pid, 2}]
    end
  end

  test "kills tracked pid when no channels are open" do
    assert Tracker.table_name() |> :ets.tab2list() |> length() == 0

    pids =
      for _ <- 1..10_500 do
        pid = spawn(fn -> :timer.sleep(:infinity) end)

        Tracker.track(pid)
        Tracker.untrack(pid)

        # Check random negative numbers
        Enum.random([true, false]) && Tracker.untrack(pid)
        pid
      end

    assert_eventually Enum.all?(pids, &(not Process.alive?(&1))), timeout: 2_000, interval: 25
    assert_eventually Tracker.table_name() |> :ets.tab2list() |> length() == 0, timeout: 2_000, interval: 25
  end
end
