defmodule Forum.Muster.ShardTest do
  use ExUnit.Case, async: true

  alias Forum.Muster.Shard
  alias Forum.Muster.Scope
  alias Forum.Supervisor

  setup do
    scope = :"shard_test_#{System.unique_integer([:positive])}"

    # Single partition (index 0): every group hashes to shard 0.
    partition_name = Supervisor.partition_name(scope, 0)
    entries_table = Supervisor.partition_entries_table(partition_name)
    states_table = Supervisor.shard_states_table(scope, 0)
    occupancy_table = Scope.occupancy_table_name(scope)

    # Forum.Supervisor would own these; here the test process owns them so they
    # SURVIVE a shard crash (the recovery test relies on this) and are cleaned
    # up when the test ends.
    ^entries_table =
      :ets.new(entries_table, [:ordered_set, :public, :named_table, read_concurrency: true])

    ^states_table =
      :ets.new(states_table, [:set, :public, :named_table, read_concurrency: true])

    ^occupancy_table =
      :ets.new(occupancy_table, [:set, :public, :named_table, read_concurrency: true])

    # Membership reads (Shard.member?/members/member_count/groups) resolve the
    # entries table via this persistent_term, so it must be set before any read.
    :persistent_term.put(scope, {partition_name})
    :persistent_term.put({scope, :muster_shards}, {Supervisor.shard_name(scope, 0)})

    on_exit(fn ->
      :persistent_term.erase(scope)
      :persistent_term.erase({scope, :muster_shards})
    end)

    # Ring with this node only → router is always self → joins take the
    # single-hop local path (occupancy write + register) with no RPC.
    {:ok, _ring} =
      ExHashRing.Ring.start_link(name: ring_name(scope), depth: 2, replicas: 128)

    {:ok, _} = ExHashRing.Ring.set_nodes(ring_name(scope), [node()])

    opts = [
      vacancy_cooldown_ms: 50,
      # Long so the periodic flush never fires mid-test; flush tests send
      # :flush_vacant by hand.
      vacant_flush_interval_ms: 60_000,
      rpc_timeout_ms: 500
    ]

    spec = %{
      id: Supervisor.shard_name(scope, 0),
      start: {Shard, :start_link, [scope, 0, opts]},
      type: :worker,
      restart: :temporary
    }

    pid = start_supervised!(spec)

    {:ok, scope: scope, shard: pid, opts: opts}
  end

  defp ring_name(scope), do: :"#{scope}_muster_ring"

  defp join(shard, group, pid), do: GenServer.call(shard, {:join, group, pid})
  defp leave(shard, group, pid), do: GenServer.call(shard, {:leave, group, pid})
  defp group_states(shard), do: GenServer.call(shard, :group_states)

  defp idle_pid do
    spawn_link(fn -> Process.sleep(:infinity) end)
  end

  # Poll the shard's group_states until `group` reaches `expected` (a value or a
  # 1-arity predicate). Used for transitions driven by a timer (cooldown).
  defp wait_for_group_state(shard, group, expected, timeout \\ 1_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_for_group_state(shard, group, expected, deadline)
  end

  defp do_wait_for_group_state(shard, group, expected, deadline) do
    actual = Map.get(group_states(shard), group)

    cond do
      match_state?(expected, actual) ->
        actual

      System.monotonic_time(:millisecond) >= deadline ->
        flunk(
          "group #{inspect(group)} state #{inspect(actual)} did not match #{inspect(expected)}"
        )

      true ->
        Process.sleep(5)
        do_wait_for_group_state(shard, group, expected, deadline)
    end
  end

  defp match_state?(pred, actual) when is_function(pred, 1), do: pred.(actual)
  defp match_state?(expected, actual), do: expected == actual

  ## Membership reads

  test "members/2 returns empty list for non-existent group", %{scope: scope} do
    assert Shard.members(scope, :nonexistent) == []
  end

  test "member_count/2 returns 0 for non-existent group", %{scope: scope} do
    assert Shard.member_count(scope, :nonexistent) == 0
  end

  test "member?/3 returns false for non-member", %{scope: scope} do
    assert Shard.member?(scope, :group1, idle_pid()) == false
  end

  ## join

  test "join registers a member, marks the group occupied, and writes occupancy",
       %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group9, pid)

    assert Shard.member?(scope, :group9, pid)
    assert Shard.member_count(scope, :group9) == 1
    assert pid in Shard.members(scope, :group9)
    assert group_states(shard)[:group9] == :occupied
    assert node() in Scope.occupancy(scope, :group9)
  end

  test "join multiple times keeps a single member", %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert :ok = join(shard, :group1, pid)
    assert :ok = join(shard, :group1, pid)

    assert Shard.member?(scope, :group1, pid)
    assert Shard.member_count(scope, :group1) == 1
    assert group_states(shard)[:group1] == :occupied
  end

  test "two distinct pids both join the same group", %{scope: scope, shard: shard} do
    pid1 = idle_pid()
    pid2 = idle_pid()

    assert :ok = join(shard, :group1, pid1)
    assert :ok = join(shard, :group1, pid2)

    assert Shard.member_count(scope, :group1) == 2
    assert pid1 in Shard.members(scope, :group1)
    assert pid2 in Shard.members(scope, :group1)
    assert group_states(shard)[:group1] == :occupied
  end

  ## leave

  test "leave removes the last member and enters cooldown", %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert Shard.member?(scope, :group1, pid)

    assert :ok = leave(shard, :group1, pid)

    refute Shard.member?(scope, :group1, pid)
    assert Shard.member_count(scope, :group1) == 0
    assert group_states(shard)[:group1] == :cooldown
  end

  test "leaving one of two members keeps the group occupied (no cooldown)",
       %{scope: scope, shard: shard} do
    pid1 = idle_pid()
    pid2 = idle_pid()

    assert :ok = join(shard, :group1, pid1)
    assert :ok = join(shard, :group1, pid2)

    assert :ok = leave(shard, :group1, pid1)

    assert Shard.member_count(scope, :group1) == 1
    refute Shard.member?(scope, :group1, pid1)
    assert Shard.member?(scope, :group1, pid2)
    assert group_states(shard)[:group1] == :occupied
  end

  test "leave multiple times is idempotent", %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert :ok = leave(shard, :group1, pid)
    assert :ok = leave(shard, :group1, pid)
    assert :ok = leave(shard, :group1, pid)

    refute Shard.member?(scope, :group1, pid)
    assert group_states(shard)[:group1] == :cooldown
  end

  ## cooldown / vacancy state machine

  test "cooldown expires to :vacant_queued while the group stays empty",
       %{shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert :ok = leave(shard, :group1, pid)
    assert group_states(shard)[:group1] == :cooldown

    # The cooldown timer (50ms) fires and queues the vacancy.
    assert :vacant_queued = wait_for_group_state(shard, :group1, :vacant_queued)
  end

  test "re-join during cooldown reclaims the group without leaving cooldown",
       %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert :ok = leave(shard, :group1, pid)
    assert group_states(shard)[:group1] == :cooldown

    # Re-join before the cooldown timer fires: straight back to :occupied.
    assert :ok = join(shard, :group1, pid)
    assert group_states(shard)[:group1] == :occupied
    assert Shard.member_count(scope, :group1) == 1
  end

  test "self-routed vacant flush deletes the occupancy row and forgets the group",
       %{scope: scope, shard: shard} do
    pid = idle_pid()

    assert :ok = join(shard, :group1, pid)
    assert node() in Scope.occupancy(scope, :group1)

    assert :ok = leave(shard, :group1, pid)
    assert :vacant_queued = wait_for_group_state(shard, :group1, :vacant_queued)

    # Self-routed flush deletes our own occupancy rows directly and drops the
    # group from the state machine — no RPC.
    send(shard, :flush_vacant)

    assert nil == wait_for_group_state(shard, :group1, &is_nil/1)
    refute node() in Scope.occupancy(scope, :group1)
  end

  ## groups / introspection

  test "groups/1 returns every group with a local member", %{scope: scope, shard: shard} do
    assert :ok = join(shard, :group1, idle_pid())
    assert :ok = join(shard, :group2, idle_pid())

    groups = Shard.groups(scope)
    assert :group1 in groups
    assert :group2 in groups
  end

  test ":group_states returns the per-group claim state map", %{shard: shard} do
    assert :ok = join(shard, :group1, idle_pid())
    assert :ok = join(shard, :group2, idle_pid())

    states = group_states(shard)
    assert states[:group1] == :occupied
    assert states[:group2] == :occupied
  end

  ## process death

  test "process death removes the member and drives the group toward vacancy",
       %{scope: scope, shard: shard} do
    # Not linked to the test process: killing it must not take us down.
    pid = spawn(fn -> Process.sleep(:infinity) end)

    assert :ok = join(shard, :group1, pid)
    assert Shard.member?(scope, :group1, pid)

    Process.exit(pid, :kill)

    # The monitored DOWN removes the member and (being the last) enters cooldown.
    assert :cooldown = wait_for_group_state(shard, :group1, :cooldown)
    refute Shard.member?(scope, :group1, pid)
    assert Shard.member_count(scope, :group1) == 0
  end

  ## crash recovery

  test "a restarted shard rebuilds monitors and group states from the durable tables",
       %{scope: scope, shard: shard, opts: opts} do
    pid1 = spawn(fn -> Process.sleep(:infinity) end)
    pid2 = spawn(fn -> Process.sleep(:infinity) end)

    assert :ok = join(shard, :group1, pid1)
    assert :ok = join(shard, :group2, pid2)

    # The live shard monitors both members.
    monitors = Process.info(shard, [:monitors])[:monitors] |> Enum.map(&elem(&1, 1))
    assert pid1 in monitors
    assert pid2 in monitors

    assert %{{:group1, ^pid1} => _, {:group2, ^pid2} => _} = :sys.get_state(shard).monitors

    # Kill the shard. The Supervisor-owned entries/states tables survive (the
    # test process owns them here), so a fresh shard can rebuild from them.
    Process.monitor(shard)
    Process.exit(shard, :kill)
    assert_receive {:DOWN, _ref, :process, ^shard, :killed}

    spec = %{
      id: :recover,
      start: {Shard, :start_link, [scope, 0, opts]},
      type: :worker
    }

    new_shard = start_supervised!(spec)

    # Monitors are re-installed from the durable entries table.
    monitors = Process.info(new_shard, [:monitors])[:monitors] |> Enum.map(&elem(&1, 1))
    assert pid1 in monitors
    assert pid2 in monitors

    assert %{{:group1, ^pid1} => _, {:group2, ^pid2} => _} = :sys.get_state(new_shard).monitors

    # Membership and claim state are reconciled back from the durable tables.
    assert Shard.member_count(scope, :group1) == 1
    assert Shard.member_count(scope, :group2) == 1
    assert Shard.member?(scope, :group1, pid1)
    assert Shard.member?(scope, :group2, pid2)

    states = group_states(new_shard)
    assert states[:group1] == :occupied
    assert states[:group2] == :occupied
  end
end
