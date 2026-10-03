defmodule Forum.Supervisor do
  @moduledoc false
  use Supervisor

  def name(scope), do: :"#{scope}_forum"
  def supervisor_name(scope), do: :"#{scope}_forum_supervisor"
  def shards_supervisor_name(scope), do: :"#{scope}_forum_shards_supervisor"
  def partition_name(scope, partition), do: :"#{scope}_forum_partition_#{partition}"
  def partition_entries_table(partition_name), do: :"#{partition_name}_entries"

  # Forum.Muster claim shard (one per partition index; same phash2 slice).
  def shard_name(scope, index), do: :"#{scope}_muster_shard_#{index}"

  # Per-shard durable claim-state ETS table. Created and owned by this Supervisor
  # (not the shard) so the shard's group_states survive a shard crash and are
  # rebuilt + reconciled on restart. One per shard index, same phash2 slice.
  def shard_states_table(scope, index), do: :"#{scope}_muster_shard_#{index}_states"

  @spec partition(atom, Forum.group()) :: atom
  def partition(scope, group) do
    case :persistent_term.get(scope, :unknown) do
      :unknown -> raise "Forum for scope #{inspect(scope)} is not started"
      partition_names -> elem(partition_names, :erlang.phash2(group, tuple_size(partition_names)))
    end
  end

  @spec partitions(atom) :: [atom]
  def partitions(scope) do
    case :persistent_term.get(scope, :unknown) do
      :unknown -> raise "Forum for scope #{inspect(scope)} is not started"
      partition_names -> Tuple.to_list(partition_names)
    end
  end

  # The Forum.Muster claim shard owning `group`: same phash2 slice as the
  # group's partition, so shard i aligns 1:1 with partition i.
  @spec shard(atom, Forum.group()) :: atom
  def shard(scope, group) do
    case :persistent_term.get({scope, :muster_shards}, :unknown) do
      :unknown -> raise "Forum.Muster shards for scope #{inspect(scope)} are not started"
      shard_names -> elem(shard_names, :erlang.phash2(group, tuple_size(shard_names)))
    end
  end

  @spec shards(atom) :: [atom]
  def shards(scope) do
    case :persistent_term.get({scope, :muster_shards}, :unknown) do
      :unknown -> raise "Forum.Muster shards for scope #{inspect(scope)} are not started"
      shard_names -> Tuple.to_list(shard_names)
    end
  end

  @spec start_link(module, atom, pos_integer(), Keyword.t()) :: Supervisor.on_start()
  def start_link(module, scope, partitions, opts \\ []) do
    args = [module, scope, partitions, opts]
    Supervisor.start_link(__MODULE__, args, name: supervisor_name(scope))
  end

  @impl true
  def init([module, scope, partitions, opts]) do
    # The per-slice membership tables, created and owned by this long-lived
    # Supervisor (NOT by the process that writes them) so they survive that
    # process's crash and are rebuilt on restart. The layout differs per
    # primitive (see create_membership_tables/3).
    for i <- 0..(partitions - 1), do: create_membership_tables(module, scope, i)

    partition_names = for i <- 0..(partitions - 1), do: partition_name(scope, i)

    :persistent_term.put(scope, List.to_tuple(partition_names))

    scope_child = %{id: :scope, start: {module, :start_link, [scope, opts]}}

    {strategy, children} = scope_children(module, scope, partitions, opts, scope_child)

    max_restarts = Keyword.get(opts, :max_restarts, 3)
    max_seconds = Keyword.get(opts, :max_seconds, 5)

    Supervisor.init(children,
      strategy: strategy,
      max_restarts: max_restarts,
      max_seconds: max_seconds
    )
  end

  # Forum.Muster keeps NO counts table: its Forum.Muster.Shard derives "is there a
  # member" / "is the group now empty" / the member count from the entries table on
  # demand. The entries table is an :ordered_set so a group's members are
  # contiguous and those derivations are bounded prefix scans, not full-table scans.
  defp create_membership_tables(Forum.Muster.Scope, scope, i) do
    entries = partition_entries_table(partition_name(scope, i))
    ^entries = :ets.new(entries, [:ordered_set, :public, :named_table, read_concurrency: true])
    :ok
  end

  # Forum.Census's Forum.Partition keeps a denormalized O(1) counts table
  # (partition_name) alongside the entries table, rebuilt from entries on restart.
  defp create_membership_tables(_module, scope, i) do
    partition_name = partition_name(scope, i)
    entries = partition_entries_table(partition_name)

    ^entries = :ets.new(entries, [:set, :public, :named_table, read_concurrency: true])

    ^partition_name =
      :ets.new(partition_name, [:set, :public, :named_table, read_concurrency: true])

    :ok
  end

  # Forum.Muster adds, per scope: a shared ring, the router-role occupancy table,
  # and N claim shards (one per partition index). A Muster shard absorbs the
  # membership job Forum.Partition does for Census, so Muster starts NO
  # Forum.Partition processes: the shard owns the slice's entries table (created in
  # init/1, no counts table) along with its claim state.
  #
  # Supervision shape — an outer :rest_for_one, ordered to express each
  # process's dependents as everything listed after it, with the shards nested
  # under their own inner :one_for_one supervisor, and a one-shot readiness
  # sentinel as the outer's last child:
  #
  #   rest_for_one: ring, coordinator (scope), shards_supervisor, shards_ready_sentinel
  #                                             `-- one_for_one: shard_0, .. shard_n
  #
  # :rest_for_one restarts the crashed child AND every child listed after it,
  # never anything before it. :one_for_one restarts only the crashed child. That
  # gives the whole crash story for free, straight from this shape:
  #
  #   * Ring crash: restarts the ring, the coordinator, shards_supervisor, AND
  #     the sentinel (all listed after it) — restarting a :supervisor child
  #     re-runs its init, which restarts every shard fresh. The ring stores its
  #     node set in a process-owned ETS table, so a crash brings it back EMPTY,
  #     and the coordinator is the only writer that could re-seed it (only at
  #     init/rebalance, neither of which a narrower restart would trigger) — so
  #     the coordinator restarting right after it is required, not incidental.
  #   * Coordinator crash: restarts the coordinator, shards_supervisor (all
  #     shards), AND the sentinel, never the ring. One reset story: "the
  #     coordinator restarted" always means the shards did too, never a stale
  #     shard left running next to a fresh coordinator.
  #   * Shard crash: the inner one_for_one restarts ONLY that shard. The outer
  #     rest_for_one never observes the crash (shards_supervisor itself didn't
  #     crash), so no other shard, the sentinel, the coordinator, or the ring is
  #     touched. If a single shard crash-loops past the inner supervisor's own
  #     max_restarts, shards_supervisor itself terminates — the outer
  #     rest_for_one then restarts it AND the sentinel (all shards, then a
  #     fresh readiness signal), but still never the coordinator or ring, since
  #     shards_supervisor is still ahead of the sentinel in the outer list.
  #
  # shards_ready_sentinel (Forum.Muster.ShardsReadySentinel) is a one-shot step,
  # not a real process: its start_link/1 sends the coordinator
  # :muster_shards_ready and returns :ignore, so Forum.Supervisor keeps no pid
  # for it. Placed last, its start_link cannot run until shards_supervisor's
  # own init has returned — which itself only returns once every shard's init
  # has returned — so the coordinator can block on that message in its own
  # handle_continue and know, by construction rather than by polling, that
  # every shard is registered before it does anything (like a rebalance) that
  # calls into them. Because it sits after shards_supervisor in this same list,
  # every restart path above that touches the shards also re-arms it.
  #
  # The occupancy table and the per-shard durable claim-state tables are created
  # HERE (owned by this long-lived Supervisor, whose init/1 does NOT re-run when
  # a child below it restarts) rather than inside the coordinator or shard
  # processes, so they survive any restart in the shape above: the shards write
  # the occupancy table directly and rebuild their group_states from the state
  # tables. The shards rebuild from these Supervisor-owned tables (created
  # before any child starts), so they have no start-order dependency on a
  # membership process. Forum.Census gets none of these.
  defp scope_children(Forum.Muster.Scope, scope, partitions, opts, scope_child) do
    # :public so the coordinator, the local shards, and the :erpc workers running
    # the remote entry points (occupied/4, vacant_batch/4) all write it directly,
    # bypassing the coordinator mailbox; write_concurrency makes that scale.
    occupancy_table = Forum.Muster.Scope.occupancy_table_name(scope)

    ^occupancy_table =
      :ets.new(occupancy_table, [
        :ordered_set,
        :public,
        :named_table,
        read_concurrency: true,
        write_concurrency: :auto
      ])

    shard_names = for i <- 0..(partitions - 1), do: shard_name(scope, i)
    :persistent_term.put({scope, :muster_shards}, List.to_tuple(shard_names))

    shard_children =
      for i <- 0..(partitions - 1) do
        # :public (Supervisor owns it, the shard writes it).
        states_table = shard_states_table(scope, i)

        ^states_table =
          :ets.new(states_table, [:set, :public, :named_table])

        %{id: {:muster_shard, i}, start: {Forum.Muster.Shard, :start_link, [scope, i, opts]}}
      end

    # Nested so a shard crash restarts only that shard (see the comment above
    # scope_children/5's clauses): the crash never reaches this outer
    # :rest_for_one, since shards_supervisor itself doesn't crash.
    shards_supervisor_spec = %{
      id: :muster_shards_supervisor,
      start:
        {Supervisor, :start_link,
         [shard_children, [strategy: :one_for_one, name: shards_supervisor_name(scope)]]},
      type: :supervisor
    }

    # :ignore's every start (see the comment above scope_children/5's clauses),
    # so it never has a pid to restart on its own, but the outer :rest_for_one
    # re-runs its start_link whenever shards_supervisor (or anything before it)
    # is restarted, re-arming the coordinator's readiness signal.
    shards_ready_sentinel_spec = %{
      id: :muster_shards_ready_sentinel,
      start: {Forum.Muster.ShardsReadySentinel, :start_link, [scope]}
    }

    {:rest_for_one,
     [
       Forum.Muster.Scope.ring_child_spec(scope),
       scope_child,
       shards_supervisor_spec,
       shards_ready_sentinel_spec
     ]}
  end

  # Forum.Census: one Forum.Partition process per slice owns membership (entries +
  # counts tables, created in init/1). No shards, ring, or occupancy table.
  defp scope_children(_module, scope, partitions, _opts, scope_child) do
    partition_children =
      for i <- 0..(partitions - 1) do
        partition_name = partition_name(scope, i)

        %{
          id: i,
          start:
            {Forum.Partition, :start_link,
             [scope, partition_name, partition_entries_table(partition_name)]}
        }
      end

    {:one_for_one, [scope_child | partition_children]}
  end
end
