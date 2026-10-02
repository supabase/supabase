defmodule Forum.PartitionTest do
  use ExUnit.Case, async: true
  alias Forum.Partition

  @scope __MODULE__

  setup do
    partition_name = Forum.Supervisor.partition_name(@scope, System.unique_integer([:positive]))
    entries_table = Forum.Supervisor.partition_entries_table(partition_name)

    ^partition_name =
      :ets.new(partition_name, [:set, :public, :named_table, read_concurrency: true])

    ^entries_table =
      :ets.new(entries_table, [:set, :public, :named_table, read_concurrency: true])

    spec = %{
      id: partition_name,
      start: {Partition, :start_link, [@scope, partition_name, entries_table]},
      type: :supervisor,
      restart: :temporary
    }

    pid = start_supervised!(spec)

    ref =
      :telemetry_test.attach_event_handlers(self(), [
        [:forum, @scope, :group, :occupied],
        [:forum, @scope, :group, :vacant]
      ])

    {:ok, partition_name: partition_name, partition_pid: pid, ref: ref}
  end

  test "members/2 returns empty list for non-existent group", %{partition_name: partition} do
    assert Partition.members(partition, :nonexistent) == []
  end

  test "member_count/2 returns 0 for non-existent group", %{partition_name: partition} do
    assert Partition.member_count(partition, :nonexistent) == 0
  end

  test "member?/3 returns false for non-member", %{partition_name: partition} do
    pid = spawn_link(fn -> Process.sleep(:infinity) end)
    refute Partition.member?(partition, :group1, pid)
  end

  test "join and query member", %{partition_name: partition, ref: ref} do
    pid = spawn_link(fn -> Process.sleep(:infinity) end)

    assert :ok = Partition.join(partition, :group9, pid)

    assert Partition.member?(partition, :group9, pid)
    assert Partition.member_count(partition, :group9) == 1
    assert pid in Partition.members(partition, :group9)
    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group9}}

    refute_receive {_, ^ref, _, _}
  end

  test "join multiple times and query member", %{partition_name: partition, ref: ref} do
    pid = spawn_link(fn -> Process.sleep(:infinity) end)

    assert :ok = Partition.join(partition, :group1, pid)
    assert :ok = Partition.join(partition, :group1, pid)
    assert :ok = Partition.join(partition, :group1, pid)

    assert Partition.member?(partition, :group1, pid)
    assert Partition.member_count(partition, :group1) == 1
    assert pid in Partition.members(partition, :group1)

    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group1}}
    refute_receive {_, ^ref, _, _}
  end

  test "occupied event only when first member joins", %{partition_name: partition, ref: ref} do
    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group1, pid2)

    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group1}}

    refute_receive {_, ^ref, _, _}
  end

  test "leave removes member", %{partition_name: partition, ref: ref} do
    pid = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid)
    assert Partition.member?(partition, :group1, pid)

    Partition.leave(partition, :group1, pid)
    refute Partition.member?(partition, :group1, pid)
    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group1}}

    assert_receive {[:forum, @scope, :group, :vacant], ^ref, %{}, %{group: :group1}}

    refute_receive {_, ^ref, _, _}
  end

  test "vacant event only when no members left", %{partition_name: partition, ref: ref} do
    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group1, pid2)

    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group1}}
    refute_receive {_, ^ref, _, _}

    Partition.leave(partition, :group1, pid1)

    refute_receive {_, ^ref, _, _}

    Partition.leave(partition, :group1, pid2)

    assert_receive {[:forum, @scope, :group, :vacant], ^ref, %{}, %{group: :group1}}
    refute_receive {_, ^ref, _, _}
  end

  test "leave multiple times removes member", %{partition_name: partition, ref: ref} do
    pid = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid)
    assert Partition.member?(partition, :group1, pid)

    Partition.leave(partition, :group1, pid)
    Partition.leave(partition, :group1, pid)
    Partition.leave(partition, :group1, pid)
    refute Partition.member?(partition, :group1, pid)
    assert_receive {[:forum, @scope, :group, :occupied], ^ref, %{}, %{group: :group1}}

    assert_receive {[:forum, @scope, :group, :vacant], ^ref, %{}, %{group: :group1}}

    refute_receive {_, ^ref, _, _}
  end

  test "member_counts returns counts for all groups", %{partition_name: partition} do
    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid3 = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group1, pid2)
    Partition.join(partition, :group2, pid3)

    counts = Partition.member_counts(partition)
    assert map_size(counts) == 2
    assert counts[:group1] == 2
    assert counts[:group2] == 1
  end

  test "groups returns all groups", %{partition_name: partition} do
    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group2, pid2)

    groups = Partition.groups(partition)
    assert :group1 in groups
    assert :group2 in groups
  end

  test "group_counts returns number of groups", %{partition_name: partition} do
    pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid3 = spawn_link(fn -> Process.sleep(:infinity) end)
    pid4 = spawn_link(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group1, pid2)
    Partition.join(partition, :group2, pid3)
    Partition.join(partition, :group3, pid4)

    assert Partition.group_count(partition) == 3
  end

  test "process death removes member from group", %{partition_name: partition} do
    pid = spawn(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid)
    assert Partition.member?(partition, :group1, pid)

    Process.exit(pid, :kill)
    Process.sleep(50)

    refute Partition.member?(partition, :group1, pid)
    assert Partition.member_count(partition, :group1) == 0
  end

  test "partition recovery monitors processes again", %{
    partition_name: partition,
    partition_pid: partition_pid
  } do
    pid1 = spawn(fn -> Process.sleep(:infinity) end)
    pid2 = spawn(fn -> Process.sleep(:infinity) end)

    Partition.join(partition, :group1, pid1)
    Partition.join(partition, :group2, pid2)

    monitors = Process.info(partition_pid, [:monitors])[:monitors] |> Enum.map(&elem(&1, 1))
    assert length(monitors)
    assert monitors |> Enum.member?(pid1)
    assert monitors |> Enum.member?(pid2)

    assert %{{:group1, ^pid1} => _ref1, {:group2, ^pid2} => _ref2} =
             :sys.get_state(partition_pid).monitors

    Process.monitor(partition_pid)
    Process.exit(partition_pid, :kill)
    assert_receive {:DOWN, _ref, :process, ^partition_pid, :killed}

    spec = %{
      id: :recover,
      start:
        {Partition, :start_link,
         [@scope, partition, Forum.Supervisor.partition_entries_table(partition)]},
      type: :supervisor
    }

    partition_pid = start_supervised!(spec)

    assert %{{:group1, ^pid1} => _ref1, {:group2, ^pid2} => _ref2} =
             :sys.get_state(partition_pid).monitors

    monitors = Process.info(partition_pid, [:monitors])[:monitors] |> Enum.map(&elem(&1, 1))
    assert length(monitors)
    assert monitors |> Enum.member?(pid1)
    assert monitors |> Enum.member?(pid2)

    assert Partition.member_count(partition, :group1) == 1
    assert Partition.member_count(partition, :group2) == 1

    assert Partition.member?(partition, :group1, pid1)
    assert Partition.member?(partition, :group2, pid2)
  end
end
