defmodule Realtime.Integration.MusterDrainShutdownTest do
  # async: false due to usage of Clustered
  use ExUnit.Case, async: false
  use TestHelpers

  alias Forum.Muster

  test "tearing down the peer's MusterDrainer gracefully evacuates its router role" do
    scope = Application.fetch_env!(:realtime, :muster_scope)
    local = node()

    # settle_ms kept small so drain/2's post-ack window (and thus terminate/2)
    # returns quickly; correctness doesn't depend on its length here.
    {:ok, peer} =
      Clustered.start(nil,
        name: :"muster_drain_smoke_#{System.unique_integer([:positive])}",
        extra_config: [{:realtime, :muster_drain_opts, [settle_ms: 100, timeout_ms: 5_000]}]
      )

    # Both nodes agree on the scope and converge to a 2-node :ready ring.
    assert :erpc.call(peer, Application, :fetch_env!, [:realtime, :muster_scope]) == scope

    assert_eventually Enum.sort(Muster.members(scope)) == Enum.sort([local, peer]) and Muster.status(scope) == :ready

    # Terminate the drainer child on the peer: this runs Realtime.MusterDrainer's
    # terminate/2 -> Forum.Muster.drain/2 while the peer's coordinator is alive.
    assert :ok = :erpc.call(peer, Supervisor, :terminate_child, [Realtime.Supervisor, Realtime.MusterDrainer], 30_000)

    # drain/2 stopped the peer from accepting new joins: a join on the peer for a
    # peer-local pid is rejected instead of producing occupancy no router knows about.
    peer_pid = :erpc.call(peer, :erlang, :spawn, [:timer, :sleep, [:infinity]])
    assert :erpc.call(peer, Muster, :join, [scope, :drain_probe, peer_pid]) == {:error, :draining}

    # The survivor rebalanced the peer out of its ring.
    assert_eventually Muster.members(scope) == [local]

    # It did so while the peer node was still alive and connected.
    # Not an abrupt-death :DOWN.
    assert peer in Node.list()
    assert :erpc.call(peer, Process, :whereis, [Forum.Supervisor.name(scope)]) |> is_pid()
  end
end
