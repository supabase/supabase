defmodule Realtime.MusterDrainerTest do
  use ExUnit.Case, async: true

  alias Forum.Muster

  setup do
    scope = :"drainer_test_#{System.unique_integer([:positive])}"

    # Singleton scope: no peers to evacuate to, so drain replies :ok immediately.
    start_supervised!({Forum.Muster, [scope, [singleton_promotion_timeout_ms: 100]]})

    %{scope: scope}
  end

  test "terminating the drainer runs Muster.drain and stops accepting joins", %{scope: scope} do
    pid = spawn(fn -> Process.sleep(:infinity) end)

    # Sanity: joins are accepted before any drain.
    assert Muster.join(scope, "before_drain", pid) == :ok

    # The app already runs a Realtime.MusterDrainer under its own name, so give
    # this test instance a distinct registered name.
    drainer = start_supervised!({Realtime.MusterDrainer, scope: scope, name: :"drainer_#{scope}"})

    # Terminate it the way the app supervisor would on shutdown; its trap_exit +
    # terminate/2 runs the drain.
    :ok = stop_supervised!(Realtime.MusterDrainer)
    refute Process.alive?(drainer)

    # drain/2 stopped this node accepting joins, so a racing join fails loudly
    # instead of creating a member no router knows about.
    assert Muster.join(scope, "after_drain", pid) == {:error, :draining}
  end
end
