defmodule Forum.CensusTest do
  use ExUnit.Case, async: true
  alias Forum.Census

  setup do
    scope = :"test_scope#{System.unique_integer([:positive])}"

    %{scope: scope}
  end

  defp spec(scope, opts) do
    %{
      id: scope,
      start: {Census, :start_link, [scope, opts]},
      type: :supervisor
    }
  end

  describe "start_link/2" do
    test "starts forum with default partitions", %{scope: scope} do
      pid = start_supervised!({Census, [scope, []]})
      assert Process.alive?(pid)
      assert is_list(Forum.Supervisor.partitions(scope))
      assert length(Forum.Supervisor.partitions(scope)) == System.schedulers_online()
    end

    test "starts forum with custom partition count", %{scope: scope} do
      pid = start_supervised!(spec(scope, partitions: 3))
      assert Process.alive?(pid)
      assert length(Forum.Supervisor.partitions(scope)) == 3
    end

    test "raises on invalid partition count", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :partitions to be a positive integer/, fn ->
        Census.start_link(scope, partitions: 0)
      end

      assert_raise ArgumentError, ~r/expected :partitions to be a positive integer/, fn ->
        Census.start_link(scope, partitions: -1)
      end

      assert_raise ArgumentError, ~r/expected :partitions to be a positive integer/, fn ->
        Census.start_link(scope, partitions: :invalid)
      end
    end

    test "raises on invalid broadcast_interval_in_ms", %{scope: scope} do
      assert_raise ArgumentError,
                   ~r/expected :broadcast_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, broadcast_interval_in_ms: 0)
                   end

      assert_raise ArgumentError,
                   ~r/expected :broadcast_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, broadcast_interval_in_ms: -1)
                   end

      assert_raise ArgumentError,
                   ~r/expected :broadcast_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, broadcast_interval_in_ms: :invalid)
                   end
    end

    test "raises on invalid discover_interval_in_ms", %{scope: scope} do
      assert_raise ArgumentError,
                   ~r/expected :discover_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, discover_interval_in_ms: 0)
                   end

      assert_raise ArgumentError,
                   ~r/expected :discover_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, discover_interval_in_ms: -1)
                   end

      assert_raise ArgumentError,
                   ~r/expected :discover_interval_in_ms to be a positive integer/,
                   fn ->
                     Census.start_link(scope, discover_interval_in_ms: :invalid)
                   end
    end

    test "raises on invalid max_restarts", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :max_restarts/, fn ->
        Census.start_link(scope, max_restarts: -1)
      end
    end

    test "raises on invalid max_seconds", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :max_seconds/, fn ->
        Census.start_link(scope, max_seconds: 0)
      end
    end
  end

  describe "restart intensity (:max_restarts/:max_seconds)" do
    test "a tiny :max_restarts terminates the scope's own supervisor once exceeded",
         %{scope: scope} do
      sup_pid = start_supervised!(spec(scope, partitions: 2, max_restarts: 0, max_seconds: 1))
      ref = Process.monitor(sup_pid)

      [partition | _] = Forum.Supervisor.partitions(scope)
      partition_pid = Process.whereis(partition)
      Process.exit(partition_pid, :kill)

      assert_receive {:DOWN, ^ref, :process, ^sup_pid, _reason}, 1_000
    end
  end

  describe "join/3 and leave/3" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "can join a group", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Census.join(scope, :group1, pid)
      assert Census.local_member?(scope, :group1, pid)
    end

    test "can leave a group", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Census.join(scope, :group1, pid)
      assert Census.local_member?(scope, :group1, pid)

      assert :ok = Census.leave(scope, :group1, pid)
      refute Census.local_member?(scope, :group1, pid)
    end

    test "joining same group twice is idempotent", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Census.join(scope, :group1, pid)
      assert :ok = Census.join(scope, :group1, pid)
      assert Census.local_member_count(scope, :group1) == 1
    end

    test "multiple processes can join same group", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

      assert :ok = Census.join(scope, :group1, pid1)
      assert :ok = Census.join(scope, :group1, pid2)

      members = Census.local_members(scope, :group1)
      assert length(members) == 2
      assert pid1 in members
      assert pid2 in members
    end

    test "process can join multiple groups", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      assert :ok = Census.join(scope, :group1, pid)
      assert :ok = Census.join(scope, :group2, pid)

      assert Census.local_member?(scope, :group1, pid)
      assert Census.local_member?(scope, :group2, pid)
    end

    test "automatically removes member when process dies", %{scope: scope} do
      pid = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Census.join(scope, :group1, pid)
      assert Census.local_member?(scope, :group1, pid)

      Process.exit(pid, :kill)
      Process.sleep(50)

      refute Census.local_member?(scope, :group1, pid)
      assert Census.local_member_count(scope, :group1) == 0
    end
  end

  describe "local_members/2" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns empty list for non-existent group", %{scope: scope} do
      assert Census.local_members(scope, :nonexistent) == []
    end

    test "returns all members of a group", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid3 = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)
      Census.join(scope, :group2, pid3)

      members = Census.local_members(scope, :group1)
      assert length(members) == 2
      assert pid1 in members
      assert pid2 in members
      refute pid3 in members
    end
  end

  describe "local_member_count/2" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns 0 for non-existent group", %{scope: scope} do
      assert Census.local_member_count(scope, :nonexistent) == 0
    end

    test "returns correct count", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

      assert Census.local_member_count(scope, :group1) == 0

      Census.join(scope, :group1, pid1)
      assert Census.local_member_count(scope, :group1) == 1

      Census.join(scope, :group1, pid2)
      assert Census.local_member_count(scope, :group1) == 2

      Census.leave(scope, :group1, pid1)
      assert Census.local_member_count(scope, :group1) == 1
    end
  end

  describe "local_member_counts/1" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns empty map when no groups exist", %{scope: scope} do
      assert Census.local_member_counts(scope) == %{}
    end

    test "returns counts for all groups", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid3 = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)
      Census.join(scope, :group2, pid3)

      assert Census.local_member_counts(scope) == %{
               group1: 2,
               group2: 1
             }
    end
  end

  describe "local_member?/3" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns false for non-member", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      refute Census.local_member?(scope, :group1, pid)
    end

    test "returns true for member", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid)
      assert Census.local_member?(scope, :group1, pid)
    end

    test "returns false after leaving", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(scope, :group1, pid)
      Census.leave(scope, :group1, pid)

      refute Census.local_member?(scope, :group1, pid)
    end
  end

  describe "local_groups/1" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns empty list when no groups exist", %{scope: scope} do
      assert Census.local_groups(scope) == []
    end

    test "returns all groups with members", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(scope, :group1, pid1)
      Census.join(scope, :group2, pid2)
      Census.join(scope, :group3, pid1)

      groups = Census.local_groups(scope)
      assert :group1 in groups
      assert :group2 in groups
      assert :group3 in groups
      assert length(groups) == 3
    end

    test "removes group from list when last member leaves", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid)
      assert :group1 in Census.local_groups(scope)

      Census.leave(scope, :group1, pid)
      refute :group1 in Census.local_groups(scope)
    end
  end

  describe "local_group_count/1" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns 0 when no groups exist", %{scope: scope} do
      assert Census.local_group_count(scope) == 0
    end

    test "returns correct count of groups", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid1)
      Census.join(scope, :group2, pid2)
      Census.join(scope, :group3, pid2)
      Census.join(scope, :group3, pid1)
      assert Census.local_group_count(scope) == 3
      Census.leave(scope, :group2, pid2)
      assert Census.local_group_count(scope) == 2
    end
  end

  describe "member_counts/1" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "returns local counts when no peers", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)

      counts = Census.member_counts(scope)
      assert counts[:group1] == 2
    end
  end

  describe "partition distribution" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 4))
      :ok
    end

    test "distributes groups across partitions", %{scope: scope} do
      # Create multiple processes and verify they're split against different partitions
      pids = for _ <- 1..20, do: spawn_link(fn -> Process.sleep(:infinity) end)

      Enum.each(pids, fn pid ->
        Census.join(scope, pid, pid)
      end)

      # Check that multiple partitions are being used
      partition_names = Forum.Supervisor.partitions(scope)

      Enum.map(partition_names, fn partition_name ->
        assert Forum.Partition.member_counts(partition_name) > 1
      end)
    end

    test "same group always maps to same partition", %{scope: scope} do
      partition1 = Forum.Supervisor.partition(scope, :my_group)
      partition2 = Forum.Supervisor.partition(scope, :my_group)
      partition3 = Forum.Supervisor.partition(scope, :my_group)

      assert partition1 == partition2
      assert partition2 == partition3
    end
  end

  describe "sync gating" do
    setup %{scope: scope} do
      start_supervised!(spec(scope, partitions: 2))
      :ok
    end

    test "ignores counts from a peer it has not registered", %{scope: scope} do
      scope_proc = Process.whereis(Forum.Supervisor.name(scope))
      assert is_pid(scope_proc)

      # Simulate a `:sync` racing ahead of (or arriving after) registration,
      # e.g. a late broadcast after the peer's `:DOWN` was already handled.
      fake_peer = spawn(fn -> Process.sleep(:infinity) end)
      send(scope_proc, {:sync, fake_peer, %{group1: 5}})

      # Flush the mailbox: this call is handled after the :sync above.
      _ = :sys.get_state(scope_proc)

      assert Forum.Census.Scope.member_counts(scope) == %{}
    end
  end

  @aux_mod (quote do
              defmodule PeerAux do
                def start(scope) do
                  spawn(fn ->
                    {:ok, _} = Census.start_link(scope, broadcast_interval_in_ms: 50)

                    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
                    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
                    Census.join(scope, :group1, pid1)
                    Census.join(scope, :group2, pid2)
                    Census.join(scope, :group3, pid2)

                    Process.sleep(:infinity)
                  end)
                end
              end
            end)

  describe "distributed tests" do
    setup do
      scope = :"broadcast_scope#{System.unique_integer([:positive])}"
      supervisor_pid = start_supervised!(spec(scope, partitions: 2, broadcast_interval_in_ms: 50))
      {:ok, peer, node} = Peer.start_disconnected(aux_mod: @aux_mod)

      ref =
        :telemetry_test.attach_event_handlers(self(), [
          [:census, scope, :node, :up],
          [:census, scope, :node, :down]
        ])

      %{scope: scope, supervisor_pid: supervisor_pid, peer: peer, node: node, telemetry_ref: ref}
    end

    test "node up", %{scope: scope, peer: peer, node: node, telemetry_ref: telemetry_ref} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)
      Census.join(scope, :group2, pid2)

      true = Node.connect(node)
      :peer.call(peer, PeerAux, :start, [scope])

      assert_receive {[:census, ^scope, :node, :up], ^telemetry_ref, %{}, %{node: ^node}}

      # Wait for at least one broadcast interval
      Process.sleep(150)
      assert Census.group_count(scope) == 3
      groups = Census.groups(scope)

      assert length(groups) == 3
      assert :group1 in groups
      assert :group2 in groups
      assert :group3 in groups

      assert Census.member_counts(scope) == %{group1: 3, group2: 2, group3: 1}
      assert Census.member_count(scope, :group1) == 3
      assert Census.member_count(scope, :group3, node) == 1
      assert Census.member_count(scope, :group1, node()) == 2
    end

    test "node down", %{scope: scope, peer: peer, node: node, telemetry_ref: telemetry_ref} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)
      Census.join(scope, :group2, pid2)

      true = Node.connect(node)
      :peer.call(peer, PeerAux, :start, [scope])
      assert_receive {[:census, ^scope, :node, :up], ^telemetry_ref, %{}, %{node: ^node}}
      # Wait for remote scope to communicate with local
      Process.sleep(150)

      true = Node.disconnect(node)

      assert_receive {[:census, ^scope, :node, :down], ^telemetry_ref, %{}, %{node: ^node}}

      assert Census.member_counts(scope) == %{group1: 2, group2: 1}
      assert Census.member_count(scope, :group1) == 2
    end

    test "scope restart can recover", %{
      scope: scope,
      supervisor_pid: supervisor_pid,
      peer: peer,
      node: node,
      telemetry_ref: telemetry_ref
    } do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(scope, :group1, pid1)
      Census.join(scope, :group1, pid2)
      Census.join(scope, :group2, pid2)

      true = Node.connect(node)
      :peer.call(peer, PeerAux, :start, [scope])
      assert_receive {[:census, ^scope, :node, :up], ^telemetry_ref, %{}, %{node: ^node}}

      # Wait for remote scope to communicate with local
      Process.sleep(150)

      [
        {1, _, :worker, [Forum.Partition]},
        {0, _, :worker, [Forum.Partition]},
        {:scope, scope_pid, :worker, [Forum.Census.Scope]}
      ] = Supervisor.which_children(supervisor_pid)

      # Restart the scope process
      Process.monitor(scope_pid)
      Process.exit(scope_pid, :kill)
      assert_receive {:DOWN, _ref, :process, ^scope_pid, :killed}
      # Wait for recovery and communication
      Process.sleep(200)
      assert Census.group_count(scope) == 3
      groups = Census.groups(scope)
      assert length(groups) == 3
      assert :group1 in groups
      assert :group2 in groups
      assert :group3 in groups
      assert Census.member_counts(scope) == %{group1: 3, group2: 2, group3: 1}
    end
  end
end
