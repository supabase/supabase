defmodule Supavisor.CircuitBreaker.SlidingWindowTest do
  use ExUnit.Case, async: true

  alias Supavisor.CircuitBreaker.SlidingWindow

  require Supavisor.CircuitBreaker.SlidingWindow

  describe "record/2 within a single window" do
    test "returns 1 after first event" do
      sw = SlidingWindow.new(10, 100)
      # now=100, window_seconds=10 => window index 10, elapsed=0
      assert SlidingWindow.record(sw, 100) == 1
    end

    test "returns incremented count for successive events in same window" do
      sw = SlidingWindow.new(10, 100)
      assert SlidingWindow.record(sw, 100) == 1
      assert SlidingWindow.record(sw, 101) == 2
      assert SlidingWindow.record(sw, 109) == 3
    end
  end

  describe "adjacent window rotation (window advances by 1)" do
    test "current count moves to prev on rotation" do
      sw = SlidingWindow.new(10, 100)
      # Record 5 events in window index 10 (now=100..104)
      for t <- 100..104, do: SlidingWindow.record(sw, t)

      # Window index should be 10
      assert SlidingWindow.window_index(sw) == 10

      # Now record in window index 11 at the very start (now=110, elapsed=0)
      # After rotation: prev=5, current=1
      # elapsed=0 => weight=1.0, estimate = 5*1.0 + 1 = 6
      result = SlidingWindow.record(sw, 110)
      assert result == 6

      # Window index should have advanced
      assert SlidingWindow.window_index(sw) == 11
    end

    test "prev weight decays linearly within the window" do
      sw = SlidingWindow.new(10, 100)
      # Record 10 events in window index 10
      for t <- 100..109, do: SlidingWindow.record(sw, t)

      # Rotate into window 11, record at now=110 (elapsed=0, weight=1.0)
      # prev=10, current=1 => estimate = 10*1.0 + 1 = 11
      assert SlidingWindow.record(sw, 110) == 11

      # At now=115 (elapsed=5, weight=0.5): prev=10, current=2
      # estimate = trunc(10*0.5 + 2) = trunc(7.0) = 7
      assert SlidingWindow.record(sw, 115) == 7

      # At now=119 (elapsed=9, weight=0.1): prev=10, current=3
      # estimate = trunc(10*0.1 + 3) = trunc(4.0) = 4
      assert SlidingWindow.record(sw, 119) == 4
    end

    test "prev is fully weighted at the start of a new window" do
      sw = SlidingWindow.new(20, 100)
      # 20 events in window 5
      for t <- 100..119, do: SlidingWindow.record(sw, t)

      # Rotate to window 6 at boundary (now=120, elapsed=0, weight=1.0)
      # prev=20, current=1 => 20 + 1 = 21
      assert SlidingWindow.record(sw, 120) == 21
    end

    test "prev has zero weight at the end of the window" do
      sw = SlidingWindow.new(10, 50)
      # 8 events in window 5 (now=50..57)
      for t <- 50..57, do: SlidingWindow.record(sw, t)

      # Rotate to window 6. Record at now=69 (elapsed=9, weight=0.1)
      # prev=8, current=1 => round(8*0.1 + 1) = round(1.8) = 2
      assert SlidingWindow.record(sw, 69) == 2
    end
  end

  describe "stale window rotation (window advances by 2+)" do
    test "both counts are zeroed when window skips ahead by 2" do
      sw = SlidingWindow.new(10, 100)
      # 5 events in window 10
      for t <- 100..104, do: SlidingWindow.record(sw, t)

      # Skip to window 12 (advance by 2) at now=120 (elapsed=0)
      # Stale rotation: both prev and current are zeroed, then add 1
      # estimate = 0 + 1 = 1
      result = SlidingWindow.record(sw, 120)
      assert result == 1
      assert SlidingWindow.window_index(sw) == 12
    end

    test "both counts are zeroed when window skips ahead by many" do
      sw = SlidingWindow.new(10, 100)
      # 3 events in window 10
      for t <- 100..102, do: SlidingWindow.record(sw, t)

      # Skip to window 20 (advance by 10)
      # Both zeroed, then +1 = 1
      result = SlidingWindow.record(sw, 200)
      assert result == 1
      assert SlidingWindow.window_index(sw) == 20
    end

    test "after stale rotation, subsequent adjacent rotation works correctly" do
      sw = SlidingWindow.new(10, 100)
      # 3 events in window 10
      for t <- 100..102, do: SlidingWindow.record(sw, t)

      # Stale jump to window 20 — both zeroed, then +1 => current=1, prev=0
      assert SlidingWindow.record(sw, 200) == 1

      # Adjacent rotation to window 21 at boundary (elapsed=0, weight=1.0)
      # shift: prev=1, current=0, then +1 => current=1
      # estimate = 1*1.0 + 1 = 2
      assert SlidingWindow.record(sw, 210) == 2
    end
  end

  describe "estimation math" do
    test "interpolation with non-trivial fractional weight" do
      sw = SlidingWindow.new(60, 0)
      # 12 events in window 0
      for t <- 0..11, do: SlidingWindow.record(sw, t)

      # Rotate to window 1 at now=60+20=80 (elapsed=20, weight=40/60=2/3)
      # prev=12, current=1 => trunc(12*(2/3) + 1) = trunc(8.0 + 1) = 9
      assert SlidingWindow.record(sw, 80) == 9
    end

    test "estimation rounds the result" do
      sw = SlidingWindow.new(10, 0)
      # 7 events in window 0
      for t <- 0..6, do: SlidingWindow.record(sw, t)

      # Rotate to window 1, now=13 (elapsed=3, weight=7/10=0.7)
      # prev=7, current=1 => round(7*0.7 + 1) = round(4.9 + 1) = round(5.9) = 6
      assert SlidingWindow.record(sw, 13) == 6
    end

    test "zero events in prev window contributes nothing" do
      sw = SlidingWindow.new(10, 10)
      # No events in window 0, jump straight to window 1
      # prev=0, current=1 => 0 + 1 = 1
      assert SlidingWindow.record(sw, 10) == 1
    end
  end

  describe "no rotation (same window)" do
    test "window_index remains the same when recording in the same window" do
      sw = SlidingWindow.new(10, 100)
      SlidingWindow.record(sw, 100)
      assert SlidingWindow.window_index(sw) == 10

      SlidingWindow.record(sw, 105)
      assert SlidingWindow.window_index(sw) == 10
    end
  end

  describe "multiple rotations in sequence" do
    test "three consecutive window rotations" do
      sw = SlidingWindow.new(10, 100)

      # Window 10: 4 events
      for t <- 100..103, do: SlidingWindow.record(sw, t)

      # Window 11 at boundary: prev=4, current=1 => 4+1 = 5
      assert SlidingWindow.record(sw, 110) == 5

      # Add 2 more in window 11
      SlidingWindow.record(sw, 112)
      SlidingWindow.record(sw, 114)
      # Now: prev=4, current=3 (1 from the rotation record + 2 more)

      # Window 12 at now=125 (elapsed=5, weight=0.5): prev=3, current=1
      # estimate = round(3*0.5 + 1) = round(2.5) = 3
      assert SlidingWindow.record(sw, 125) == 3
    end
  end

  describe "estimated_count/2 (safe, without prior rotation)" do
    test "returns correct count in the same window" do
      sw = SlidingWindow.new(10, 100)
      SlidingWindow.record(sw, 100)
      SlidingWindow.record(sw, 101)

      assert SlidingWindow.estimated_count(sw, 102) == 2
    end

    test "returns faded prev when one window ahead" do
      sw = SlidingWindow.new(10, 100)
      # 5 events in window 10
      for t <- 100..104, do: SlidingWindow.record(sw, t)

      # Don't record in window 11 — just read at now=115 (elapsed=5, weight=0.5)
      # gap=1: current (5) becomes prev, faded by weight
      # round(5 * 0.5) = 3
      assert SlidingWindow.estimated_count(sw, 115) == 3
    end

    test "returns zero when two or more windows ahead" do
      sw = SlidingWindow.new(10, 100)
      for t <- 100..104, do: SlidingWindow.record(sw, t)

      # gap=2, all stale
      assert SlidingWindow.estimated_count(sw, 120) == 0
    end

    test "returns zero when many windows ahead" do
      sw = SlidingWindow.new(10, 100)
      for t <- 100..104, do: SlidingWindow.record(sw, t)

      assert SlidingWindow.estimated_count(sw, 200) == 0
    end

    test "handles adjacent window with prev and current counts" do
      sw = SlidingWindow.new(10, 100)
      # 3 events in window 10
      for t <- 100..102, do: SlidingWindow.record(sw, t)
      # 2 events in window 11 (this rotates: prev=3, current=2)
      SlidingWindow.record(sw, 110)
      SlidingWindow.record(sw, 111)

      # Read at now=125 without recording (gap=1 from window 11 to 12)
      # current=2 becomes prev, faded by weight: elapsed=5, weight=0.5
      # trunc(2 * 0.5) = 1
      assert SlidingWindow.estimated_count(sw, 125) == 1
    end
  end

  describe "concurrency" do
    test "counts are correct under concurrent writes across two windows" do
      import Bitwise

      # Run 1000 instances concurrently to increase chance of catching races
      outer_tasks =
        for _ <- 1..1_000 do
          Task.async(fn ->
            # window_seconds=10: time 100 is window 10, time 150 is window 15
            sw = SlidingWindow.new(10, 100)

            # 10 processes each emit 500 events at time 100 (window 10)
            tasks =
              for _ <- 1..10 do
                Task.async(fn ->
                  for _ <- 1..500, do: SlidingWindow.record(sw, 100)
                end)
              end

            Task.await_many(tasks, 30_000)

            # Starting window is 10, so all records land in the same window
            # with no rotation — counts should be exact.
            packed = :atomics.get(SlidingWindow.sw(sw, :ref), 1)
            current = packed &&& 0xFFFFFFFF
            assert current == 5_000
            assert packed >>> 32 == 0
            assert SlidingWindow.window_index(sw) == 10

            # 10 processes each emit 500 events at time 150 (window 15, stale rotation)
            # Stale rotation zeros both prev and current, then new events accumulate
            tasks =
              for _ <- 1..10 do
                Task.async(fn ->
                  for _ <- 1..500, do: SlidingWindow.record(sw, 150)
                end)
              end

            Task.await_many(tasks, 30_000)

            packed = :atomics.get(SlidingWindow.sw(sw, :ref), 1)
            current = packed &&& 0xFFFFFFFF
            assert current in 4_500..5_000
            assert packed >>> 32 == 0
            assert SlidingWindow.window_index(sw) == 15
          end)
        end

      Task.await_many(outer_tasks, 60_000)
    end
  end
end
