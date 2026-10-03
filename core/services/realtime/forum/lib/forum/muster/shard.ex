defmodule Forum.Muster.Shard do
  @moduledoc false
  # Per-group claim shard for Forum.Muster.
  #
  # There are N shards per node (N = the partition count), one per partition
  # index, looked up by `:erlang.phash2(group, N)` exactly like Forum.Census's
  # Forum.Partition. A shard owns BOTH halves of a group's local story for its
  # slice of groups:
  #
  #   1. Membership: which local pids belong to each group and the
  #      `Process.monitor` that fires when a member dies. Membership is inlined here
  #      (NOT delegated to a Forum.Partition process) and WITHOUT an O(1) counts
  #      table: the claim state machine only needs "is there ≥1 local member" and
  #      "did this removal take us to 0", both derived on demand from the entries
  #      table (an :ordered_set, so a group's members are contiguous and a bounded
  #      prefix scan answers those in ~O(members-of-group), not a full-table scan).
  #      So for Muster:
  #        * a join is a SINGLE process hop: the shard registers the member and
  #          resolves the router claim in one handler, without calling out to a
  #          separate GenServer and blocking on its reply;
  #        * the monitor that drives vacancy is owned by THIS process, so the last
  #          member leaving transitions the claim state machine directly in the
  #          DOWN handler, with no telemetry hop and no cross-process race between
  #          "count hit 0" and "the shard learns".
  #   2. The per-group claim state machine (the "have I told the router about
  #      this group?" question) so that a storm of first-member claims for
  #      distinct groups spreads across N mailboxes instead of serializing through
  #      the single Forum.Muster.Scope coordinator.
  #
  # Owns (all ETS tables are Forum.Supervisor-owned, so they SURVIVE a shard
  # crash; on restart the shard rebuilds its process-local state from them):
  #   * entries_table (`{group, pid}` keys, an :ordered_set): the SINGLE source of
  #     truth for membership. Member counts are NOT stored; they are derived from
  #     this table when needed (member_count/2, the "is the group now empty" check
  #     on removal, and the set of occupied groups during restart reconciliation).
  #   * states_table (group => group_state): the claim state machine, the SINGLE
  #     source of truth for "what have we told the router". The shard keeps no
  #     in-memory copy; it reads and writes the table directly. On restart it
  #     reconciles the table against the live member counts (see
  #     rebuild_group_states/1) and therefore never forgets an outstanding router
  #     assertion (a :cooldown / :vacant_queued / :vacant_flushing /
  #     :occupied_pending group), so no router is left holding a stale entry.
  #   * monitors: the {group, pid} => ref map for installed member monitors.
  #     Process-local (monitor refs cannot survive a crash); rebuilt from
  #     entries_table on restart.
  #   * cooldown_timers: the "recently vacant" suppression timers. Process-local
  #     for the same reason; re-armed from the table on restart. (The
  #     :occupied_pending waiters live in the table tuple; they go stale on a crash
  #     and are simply not replied to, since the callers' join calls already exited.)
  #   * A periodic vacant flush of its own :vacant_queued groups, in per-router
  #     batches; a failed batch re-queues, so the flush doubles as a
  #     self-draining retry.
  #
  # Does NOT own any cluster-coordination state. The ring, the router-role
  # occupancy table, the readiness barrier, snapshot apply, and rebalance
  # orchestration all live in Forum.Muster.Scope. A shard reads the (shared,
  # ETS-backed) ring directly and writes the (:public) occupancy table directly,
  # and it NEVER synchronously calls the coordinator, so the coordinator can
  # synchronously call shards during a rebalance without any deadlock risk.
  #
  # Write-ordering invariant (crash safety): handle_join commits the DURABLE
  # state BEFORE the externally-visible occupancy assertion, so any crash leaves
  # a state restart reconciliation can drive to consistency.
  #   * Remote router: write :occupied_pending, THEN dispatch the :occupied RPC.
  #     A crash in the dispatch/state-write window is recoverable: the durable
  #     :occupied_pending (no live member) reconciles to :vacant_queued and the
  #     flush retracts whatever row the orphaned (monitored, not linked) worker
  #     lands. Dispatching first would lose the record and strand the router row.
  #   * Local router: register the member + write :occupied, THEN write the local
  #     occupancy row LAST. A crash before the row leaves no orphan (no row); a
  #     crash after it implies the entry already exists, so rebuild_group_states
  #     re-asserts the row from the live member. Writing the row first would let a
  #     crash strand a member-less row that nothing retracts.
  use GenServer
  require Logger
  use Snabbkaffex, only: :trace

  alias ExHashRing.Ring
  alias Forum.Muster.Scope

  defmodule State do
    @moduledoc false
    @type group_state ::
            :occupied
            | :cooldown
            | :vacant_queued
            | {:occupied_pending, [{GenServer.from(), pid}]}
            | :vacant_flushing

    # The per-group state machine is NOT held here; it lives in `states_table`
    # (Supervisor-owned ETS, group => group_state), the single source of truth.
    # `monitors` and `cooldown_timers` are the only process-local state: monitor
    # refs and timer refs are runtime handles that cannot survive a crash and are
    # rebuilt from the durable tables on restart.
    @type t :: %__MODULE__{
            scope: atom,
            index: non_neg_integer,
            occupancy_table: atom,
            entries_table: atom,
            states_table: atom,
            message_module: module,
            vacancy_cooldown_ms: non_neg_integer,
            vacant_flush_interval_ms: pos_integer,
            rpc_timeout_ms: timeout,
            monitors: %{{Forum.group(), pid} => reference},
            cooldown_timers: %{Forum.group() => reference}
          }
    defstruct [
      :scope,
      :index,
      :occupancy_table,
      :entries_table,
      :states_table,
      :message_module,
      :vacancy_cooldown_ms,
      :vacant_flush_interval_ms,
      :rpc_timeout_ms,
      monitors: %{},
      cooldown_timers: %{}
    ]
  end

  @default_vacancy_cooldown_ms 30_000
  @default_vacant_flush_interval_ms 5_000
  @default_rpc_timeout_ms 5_000

  ## Membership reads (static ETS reads, no process hop, run in the caller).

  @spec member_count(atom, Forum.group()) :: non_neg_integer
  def member_count(scope, group) do
    scope
    |> entries_table_for(group)
    |> :ets.select_count([{{{group, :_}}, [], [true]}])
  end

  @spec members(atom, Forum.group()) :: [pid]
  def members(scope, group) do
    scope
    |> entries_table_for(group)
    |> :ets.select([{{{group, :"$1"}}, [], [:"$1"]}])
  end

  @spec member?(atom, Forum.group(), pid) :: boolean
  def member?(scope, group, pid) do
    scope
    |> entries_table_for(group)
    |> :ets.lookup({group, pid})
    |> case do
      [{{^group, ^pid}}] -> true
      [] -> false
    end
  end

  # Every group with ≥1 local member, derived from the entries tables. On the
  # :ordered_set a group's entries are contiguous, so the projected groups come out
  # sorted and `Enum.dedup` collapses the per-member duplicates cheaply.
  @spec groups(atom) :: [Forum.group()]
  def groups(scope) do
    scope
    |> Forum.Supervisor.partitions()
    |> Enum.flat_map(fn partition ->
      partition
      |> Forum.Supervisor.partition_entries_table()
      |> :ets.select([{{{:"$1", :_}}, [], [:"$1"]}])
      |> Enum.dedup()
    end)
  end

  defp entries_table_for(scope, group) do
    scope
    |> Forum.Supervisor.partition(group)
    |> Forum.Supervisor.partition_entries_table()
  end

  @spec start_link(atom, non_neg_integer, Keyword.t()) :: GenServer.on_start()
  def start_link(scope, index, opts \\ []) do
    GenServer.start_link(__MODULE__, [scope, index, opts],
      name: Forum.Supervisor.shard_name(scope, index)
    )
  end

  @impl true
  def init([scope, index, opts]) do
    vacancy_cooldown_ms = Keyword.get(opts, :vacancy_cooldown_ms, @default_vacancy_cooldown_ms)

    vacant_flush_interval_ms =
      Keyword.get(opts, :vacant_flush_interval_ms, @default_vacant_flush_interval_ms)

    rpc_timeout_ms = Keyword.get(opts, :rpc_timeout_ms, @default_rpc_timeout_ms)
    message_module = Keyword.get(opts, :message_module, Forum.Adapter.ErlDist)

    entries_table =
      Forum.Supervisor.partition_entries_table(Forum.Supervisor.partition_name(scope, index))

    state = %State{
      scope: scope,
      index: index,
      occupancy_table: Scope.occupancy_table_name(scope),
      entries_table: entries_table,
      states_table: Forum.Supervisor.shard_states_table(scope, index),
      message_module: message_module,
      vacancy_cooldown_ms: vacancy_cooldown_ms,
      vacant_flush_interval_ms: vacant_flush_interval_ms,
      rpc_timeout_ms: rpc_timeout_ms
    }

    # Re-install member monitors from the durable entries table FIRST, then
    # reconcile the claim state machine against the live membership it implies.
    state = state |> rebuild_membership() |> rebuild_group_states()
    {:ok, state, {:continue, :schedule}}
  end

  @impl true
  def handle_continue(:schedule, state) do
    schedule_vacant_flush(state)
    {:noreply, state}
  end

  # Re-install the process-local member monitors from the durable entries table
  # (Supervisor-owned, so it survived our crash) by re-`Process.monitor`ing every
  # surviving entry. A pid that died while we were down is monitored here and its
  # immediate DOWN (queued after init) drives the normal removal + vacancy path.
  defp rebuild_membership(state) do
    monitors =
      state.entries_table
      |> :ets.tab2list()
      |> Enum.reduce(%{}, fn {{group, pid}}, acc ->
        ref = Process.monitor(pid, tag: {:DOWN, group})
        Map.put(acc, {group, pid}, ref)
      end)

    %{state | monitors: monitors}
  end

  # On (re)start, reconcile the state machine (which lives in the durable states
  # table, Supervisor-owned, so it survived our crash) against the live
  # membership the entries table implies (the set of groups with ≥1 member). The
  # states table is the source of truth, so we reconcile it IN PLACE; we do not
  # rebuild a separate copy. We RETAIN the empty-group "outstanding assertion"
  # states, so a group we had told a router about
  # (:cooldown / :vacant_queued / :vacant_flushing / :occupied_pending) is still
  # driven to retraction after the restart, and no router is left believing we hold
  # a group we don't.
  #
  # The two transient parts of the state the table cannot carry across a crash are
  # reconstructed:
  #   * cooldown TIMER refs (process-local): re-armed fresh here for :cooldown.
  #   * :occupied_pending WAITERS: the froms in the stored tuple are stale (their
  #     join GenServer.calls already exited when we crashed; callers retry). We never
  #     reply to them; we just resolve the group from the live count.
  defp rebuild_group_states(state) do
    live = occupied_group_set(state)
    durable = all_group_states(state)

    # The old timer refs died with us; re-arm fresh ones as we reconcile.
    state = %{state | cooldown_timers: %{}}

    state =
      Enum.reduce(durable, state, fn {group, durable_state}, st ->
        reconcile_group(st, group, durable_state, MapSet.member?(live, group))
      end)

    # Safety net: a crash between register_member's entry write and the state write
    # can leave a live member with no state entry. Adopt those as :occupied.
    state =
      Enum.reduce(live, state, fn group, st ->
        if get_group_state(st, group) == nil,
          do: put_group_state(st, group, :occupied),
          else: st
      end)

    # Re-assert the occupancy row for every live group whose router is THIS node.
    # The join handler writes the local occupancy row LAST, so a crash mid-join
    # can leave a live local-router member with no row; this restores the
    # invariant "live local-router member ⟹ occupancy row present". The fresh seq
    # is strictly higher than any pre-crash write, so upsert_if_newer wins (and is
    # a harmless bump for rows that already exist). Remote-router groups need no
    # re-assertion: their row lives on another node, untouched by our crash.
    Enum.each(live, fn group ->
      if router_from_state(state, group) == node() do
        Scope.upsert_if_newer(
          state.occupancy_table,
          {group, node()},
          next_seq(),
          local_scope_pid(state)
        )
      end
    end)

    state
  end

  # The set of groups in this slice that currently have ≥1 live member, derived
  # from the entries table (one scan at init; the :ordered_set makes the projection
  # sorted so dedup is cheap).
  defp occupied_group_set(state) do
    state.entries_table
    |> :ets.select([{{{:"$1", :_}}, [], [:"$1"]}])
    |> MapSet.new()
  end

  # Reconcile one stored entry against the current live membership, writing the
  # result back to the table. A live member always wins back to :occupied (the
  # router rightly believes we hold it); an empty group drives toward retraction.
  defp reconcile_group(state, group, durable_state, occupied?) do
    cond do
      occupied? ->
        # Live member present: hold it. Covers a re-join during our downtime and
        # any state whose group turned out to still be occupied.
        put_group_state(state, group, :occupied)

      durable_state in [:occupied, :cooldown] ->
        # Was occupied (or cooling down) and is now empty: re-enter cooldown so a
        # quick re-join still costs no RPC; the timer drives it to :vacant_queued.
        # This is also where a :vacant event dropped while we were restarting gets
        # caught (the durable :occupied + empty count reveals it).
        enter_cooldown(state, group)

      true ->
        # :vacant_queued / :vacant_flushing / :occupied_pending, all now empty.
        # Queue a vacant: the next flush retracts our router row (a no-op DELETE if
        # nothing was ever written). For :occupied_pending the in-flight :occupied
        # RPC may or may not have landed; :vacant_queued retracts it either way, and
        # a retrying caller re-claims with a strictly higher seq (the INSERT wins).
        # For :vacant_flushing the in-flight batch worker died with us; re-queue.
        put_group_state(state, group, :vacant_queued)
    end
  end

  defp enter_cooldown(state, group) do
    ref = Process.send_after(self(), {:vacancy_expired, group}, state.vacancy_cooldown_ms)
    state = %{state | cooldown_timers: Map.put(state.cooldown_timers, group, ref)}
    put_group_state(state, group, :cooldown)
  end

  ## handle_call

  # Local source: Muster.join asking us to register a member and (if it is the
  # first) claim this group on its router. Handles every group_state: an
  # already-:occupied group just registers the member, a :cooldown / :vacant_*
  # group is reclaimed without re-notifying the router where possible, and nil
  # dispatches the :occupied claim.
  @impl true
  def handle_call({:join, group, pid}, from, state) do
    handle_join(group, pid, from, state)
  end

  # Local source: Muster.leave removing a member. Mirrors a member DOWN.
  def handle_call({:leave, group, pid}, _from, state) do
    {:reply, :ok, remove_member(state, group, pid)}
  end

  # Coordinator-driven rebalance (synchronous). The coordinator has already
  # flipped :status to :rebalancing and swapped the ring to `new_members` before
  # calling us, so:
  #   * find_node/2 returns the NEW router, find_historical_node(_, _, 1) the OLD.
  #   * because our mailbox is FIFO, every in-flight claim's occupancy write /
  #     :occupied dispatch was processed before this call, so the held set we
  #     return is COMPLETE: the coordinator can build a complete per-router
  #     snapshot from it (the "one complete snapshot per source" invariant).
  #
  # We do three things and reply with our held set:
  #   1) Normalize an in-flight vacant batch (:vacant_flushing) back to
  #      :vacant_queued so the next flush re-routes it to the post-rebalance
  #      router; the in-flight worker's result lands in the catch-all and is
  #      dropped.
  #   2) Settle every :occupied_pending group whose router CHANGED: register the
  #      waiters and reply :ok optimistically, then move to :occupied. Safe (and
  #      done here rather than after the snapshot dispatch) because :status is
  #      :rebalancing throughout, so senders flood (router/2) rather than target a
  #      not-yet-populated occupancy row. The coordinator includes these groups in
  #      the snapshot it sends right after gathering us. Their original
  #      (old-router) :occupied worker's reply lands in handle_occupied_done's
  #      catch-all (state is :occupied by then) and is dropped.
  #   3) Return held groups (:occupied | :cooldown | :occupied_pending) for the
  #      coordinator to snapshot.
  def handle_call({:rebalance, _new_members}, _from, state) do
    tp_span(:muster_rebalance_gather, %{scope: state.scope, node: node(), index: state.index}) do
      state = normalize_pending_for_rebalance(state)
      state = settle_moved_pending(state)
      {:reply, {:held, held_groups(state)}, state}
    end
  end

  # Introspection: the coordinator folds every shard's group_states together to
  # answer Muster.dump/1 and the :status call used by tests.
  def handle_call(:group_states, _from, state) do
    {:reply, Map.new(all_group_states(state)), state}
  end

  ## handle_info

  # A monitored local member died. Remove it (entry + counter + monitor); if it was
  # the last member of the group, remove_member/3 drives the vacancy transition
  # directly, with no telemetry and no cross-process hop.
  @impl true
  def handle_info({{:DOWN, group}, _ref, :process, pid, _reason}, state) do
    {:noreply, remove_member(state, group, pid)}
  end

  # Cooldown timer fired for `group`.
  def handle_info({:vacancy_expired, group}, state) do
    handle_vacancy_expired(group, state)
  end

  # Worker reported back the result of a claim (:occupied) RPC.
  def handle_info({{:occupied_done, group}, _ref, :process, _pid, exit_reason}, state) do
    handle_occupied_done(group, worker_result(exit_reason), state)
  end

  # Worker reported back the result of a batched :vacant flush to one router.
  def handle_info({{:vacant_batch_done, groups}, _ref, :process, _pid, exit_reason}, state) do
    {:noreply, handle_vacant_batch_done(groups, worker_result(exit_reason), state)}
  end

  # Periodic flush of queued vacancies.
  def handle_info(:flush_vacant, state) do
    tp(:muster_flush_tick, %{scope: state.scope, node: node(), index: state.index})
    state = flush_vacant(state)
    schedule_vacant_flush(state)
    {:noreply, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  ## State machine: join

  defp handle_join(group, pid, from, state) do
    case get_group_state(state, group) do
      nil ->
        router_node = router_from_state(state, group)

        if router_node == node() do
          Logger.debug(
            "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: local router, occupied"
          )

          # Durable membership + state FIRST, the occupancy row (the externally
          # visible assertion) LAST. A crash before the row leaves no orphan; a
          # crash after it implies the entry already exists, so restart
          # reconciliation re-asserts the row from the live member (see
          # rebuild_group_states). Writing the row first would let a crash strand
          # a row with no member that nothing retracts.
          state = register_member(state, group, pid)
          state = put_group_state(state, group, :occupied)

          Scope.upsert_if_newer(
            state.occupancy_table,
            {group, node()},
            next_seq(),
            local_scope_pid(state)
          )

          {:reply, :ok, state}
        else
          Logger.debug(
            "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: dispatching :occupied to router #{inspect(router_node)}"
          )

          # Durable :occupied_pending BEFORE dispatching the RPC. If we crash in
          # this window the orphaned worker's INSERT may still land on the router,
          # but restart reconciliation finds the durable :occupied_pending (no live
          # member) and drives it to :vacant_queued, whose flush retracts the row.
          # Writing the state after dispatch would lose that record and strand the
          # router row (nothing left to drive its retraction).
          state = put_group_state(state, group, {:occupied_pending, [{from, pid}]})
          dispatch_rpc(:occupied, group, router_node, state)
          {:noreply, state}
        end

      :occupied ->
        Logger.debug("Muster[#{node()}|#{state.scope}] join #{inspect(group)}: already occupied")

        state = register_member(state, group, pid)
        {:reply, :ok, state}

      :cooldown ->
        Logger.debug(
          "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: reclaim from cooldown (no RPC)"
        )

        state = cancel_cooldown(state, group)
        state = register_member(state, group, pid)

        # "No RPC" assumes the router already knows we hold this group. That
        # assumption does not survive a coordinator restart when we are our OWN
        # router: init/1 resets the ring to `[node()]`, so we can be our own
        # router again for a group whose self row was tombstoned while it was
        # routed elsewhere during our downtime, and rebuild_group_states only
        # re-asserts self rows for groups with LIVE members (this one had none
        # while cooling down), so the row for this group would otherwise stay
        # stale. One cheap, idempotent ETS write closes the gap: a fresh seq
        # either re-raises an already-correct row (no-op) or repairs a stale
        # one. A REMOTE router needs no such guard: reaching a multi-node view
        # again implies a rebalance that re-announced held groups, :cooldown
        # included.
        if router_from_state(state, group) == node() do
          Scope.upsert_if_newer(
            state.occupancy_table,
            {group, node()},
            next_seq(),
            local_scope_pid(state)
          )
        end

        {:reply, :ok, put_group_state(state, group, :occupied)}

      {:occupied_pending, waiters} ->
        Logger.debug(
          "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: parked behind in-flight :occupied (#{length(waiters) + 1} waiter(s))"
        )

        {:noreply, put_group_state(state, group, {:occupied_pending, [{from, pid} | waiters]})}

      vacant when vacant in [:vacant_queued, :vacant_flushing] ->
        # Reclaim a group we were releasing. For :vacant_queued nothing is in
        # flight. For :vacant_flushing a vacant batch DELETE is in flight, but we
        # do NOT wait for it: the :occupied we dispatch now is dispatched after
        # that batch, so next_seq/0 gives it a strictly higher seq, and the
        # router's seq guard makes the INSERT win over the racing (lower-seq)
        # DELETE regardless of arrival order (see the versioning note above
        # Scope.occupied/4). The in-flight batch's eventual :vacant_batch_done
        # lands in handle_vacant_batch_done's catch-all (state is no longer
        # :vacant_flushing) and is dropped. Both the batch and the re-claim are
        # dispatched from THIS shard (same group → same shard), so their dispatch
        # order, and thus their seq order, is well defined.
        router_node = router_from_state(state, group)

        if router_node == node() do
          Logger.debug(
            "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: reclaim from #{vacant}, local router"
          )

          # Same write ordering as the nil branch: membership + state first, the
          # occupancy row last (crash-safe; see the nil branch above).
          state = register_member(state, group, pid)
          state = put_group_state(state, group, :occupied)

          Scope.upsert_if_newer(
            state.occupancy_table,
            {group, node()},
            next_seq(),
            local_scope_pid(state)
          )

          {:reply, :ok, state}
        else
          Logger.debug(
            "Muster[#{node()}|#{state.scope}] join #{inspect(group)}: reclaim from #{vacant}, dispatching :occupied to router #{inspect(router_node)}"
          )

          # Durable :occupied_pending before dispatch (crash-safe; see nil branch).
          state = put_group_state(state, group, {:occupied_pending, [{from, pid}]})
          dispatch_rpc(:occupied, group, router_node, state)
          {:noreply, state}
        end
    end
  end

  ## Membership writes (the monitor that drives vacancy is owned by this shard).

  # Register a (now-claimed) local member: insert the entry and monitor the pid
  # (tagged so its DOWN routes back here). Doing this inside the shard, rather than
  # in the caller after a claim returns, guarantees the monitored entry is
  # installed as part of resolving the join, so the router is never left believing
  # we hold a group that has no live local member (e.g. if the caller dies right
  # after the join). If `pid` is already dead the monitor's immediate DOWN drives
  # the normal removal + :vacant -> :cooldown retraction.
  defp register_member(state, group, pid) do
    if :ets.insert_new(state.entries_table, {{group, pid}}) do
      ref = Process.monitor(pid, tag: {:DOWN, group})
      %{state | monitors: Map.put(state.monitors, {group, pid}, ref)}
    else
      state
    end
  end

  # Remove a local member (via leave or its monitored DOWN): drop the entry and
  # tear down the monitor. When that was the LAST member of the group (none remain
  # in the entries table) this is the local vacancy, so we drive the claim state
  # machine: a group we still hold (:occupied) enters cooldown; in any other state
  # it was already empty, so there is nothing asserted to retract.
  defp remove_member(state, group, pid) do
    vacated? =
      case :ets.lookup(state.entries_table, {group, pid}) do
        [{{^group, ^pid}}] ->
          :ets.delete(state.entries_table, {group, pid})
          empty_group?(state, group)

        [] ->
          Logger.warning(
            "Muster[#{node()}|#{state.scope}] Trying to remove an unknown process #{inspect(pid)}"
          )

          false
      end

    state = demonitor_member(state, group, pid)
    if vacated?, do: on_local_vacant(state, group), else: state
  end

  # Whether `group` has no remaining local members. On the :ordered_set a bounded
  # select with limit 1 seeks straight to the group's key range and stops at the
  # first hit, so this is ~O(log n) rather than a full-table scan.
  defp empty_group?(state, group) do
    :ets.select(state.entries_table, [{{{group, :_}}, [], [true]}], 1) == :"$end_of_table"
  end

  defp demonitor_member(state, group, pid) do
    case Map.pop(state.monitors, {group, pid}) do
      {nil, _} ->
        state

      {ref, monitors} ->
        Process.demonitor(ref, [:flush])
        %{state | monitors: monitors}
    end
  end

  # The group's last local member just left. If we still hold it, enter cooldown
  # so a quick re-join costs no RPC; otherwise the count was already 0 and the
  # state machine is mid-retraction, so there is nothing to do.
  defp on_local_vacant(state, group) do
    case get_group_state(state, group) do
      :occupied ->
        Logger.debug(
          "Muster[#{node()}|#{state.scope}] #{inspect(group)} vacant locally, entering cooldown (#{state.vacancy_cooldown_ms}ms)"
        )

        enter_cooldown(state, group)

      _ ->
        state
    end
  end

  defp handle_vacancy_expired(group, state) do
    case get_group_state(state, group) do
      :cooldown ->
        # Cooldown elapsed while still empty. A re-join during cooldown would have
        # cancelled this timer and moved the group back to :occupied in handle_join
        # (joins and membership now share this process), so reaching here means the
        # slice is genuinely still vacant, so no live-count recheck is needed. Queue
        # the vacancy; the periodic flush groups all queued vacancies by current
        # router, sends one batched RPC per router, and re-queues any that fail.
        Logger.debug(
          "Muster[#{node()}|#{state.scope}] cooldown expired for #{inspect(group)}, queued for vacant flush"
        )

        state = %{state | cooldown_timers: Map.delete(state.cooldown_timers, group)}
        {:noreply, put_group_state(state, group, :vacant_queued)}

      _ ->
        {:noreply, state}
    end
  end

  defp handle_occupied_done(group, result, state) do
    case get_group_state(state, group) do
      {:occupied_pending, waiters} ->
        case result do
          :ok ->
            Logger.debug(
              "Muster[#{node()}|#{state.scope}] :occupied confirmed for #{inspect(group)}, replying :ok to #{length(waiters)} waiter(s)"
            )

            # Register each waiter's pid only now that the router has been told,
            # then reply. On failure we never register (below), preserving the
            # "pid not registered on rpc_failed" contract.
            state =
              Enum.reduce(waiters, state, fn {from, pid}, st ->
                st = register_member(st, group, pid)
                GenServer.reply(from, :ok)
                st
              end)

            {:noreply, put_group_state(state, group, :occupied)}

          _ ->
            Logger.debug(
              "Muster[#{node()}|#{state.scope}] :occupied RPC failed for #{inspect(group)}: #{inspect(result)}, replying error to #{length(waiters)} waiter(s)"
            )

            Enum.each(waiters, fn {from, _pid} -> GenServer.reply(from, {:error, :rpc_failed}) end)

            # Queue a vacant instead of forgetting the group outright: :erpc does
            # not cancel remote execution on a timeout, so the router may have
            # already committed the INSERT by the time we see the error. The next
            # flush retracts whatever may have landed (a no-op tombstone if
            # nothing did), the same recovery the crash-window analysis above
            # relies on for this exact orphan.
            {:noreply, put_group_state(state, group, :vacant_queued)}
        end

      _ ->
        # Out-of-band (e.g. the group was settled by a rebalance, now :occupied,
        # before this old-router worker returned). Drop.
        {:noreply, state}
    end
  end

  # Result of one batched :vacant flush. For each group still in
  # :vacant_flushing: on success drop it; on failure re-queue it so the next
  # flush retries (this is what drains stale router entries). A group that was
  # re-claimed while the batch was in flight is no longer :vacant_flushing
  # (handle_join moved it straight to :occupied/:occupied_pending), so it falls
  # through the catch-all here; the seq guard already kept the in-flight DELETE
  # from clobbering its fresh :occupied INSERT.
  defp handle_vacant_batch_done(groups, result, state) do
    success? = not match?({:error, _}, result)

    if success? do
      Logger.debug(
        "Muster[#{node()}|#{state.scope}] vacant batch of #{length(groups)} group(s) acknowledged by router"
      )
    else
      Logger.warning(
        "Muster[#{node()}|#{state.scope}] vacant batch RPC failed for #{length(groups)} group(s): #{inspect(result)}, re-queuing"
      )
    end

    Enum.reduce(groups, state, fn group, st ->
      case get_group_state(st, group) do
        :vacant_flushing ->
          if success?,
            do: delete_group_state(st, group),
            else: put_group_state(st, group, :vacant_queued)

        _ ->
          st
      end
    end)
  end

  # Collect every :vacant_queued group, bucket by current router, and send one
  # batched RPC per remote router (self-routed groups are tombstoned locally with
  # the same seq guard). The queued groups stay in :vacant_queued only until a
  # flush moves them to :vacant_flushing; a failed batch returns them to
  # :vacant_queued.
  defp flush_vacant(state) do
    queued = groups_in_state(state, :vacant_queued)

    case queued do
      [] ->
        state

      _ ->
        by_router = Enum.group_by(queued, &router_from_state(state, &1))

        Logger.debug(
          "Muster[#{node()}|#{state.scope}] flushing #{length(queued)} vacant group(s) across #{map_size(by_router)} router(s)"
        )

        by_router
        |> Enum.reduce(state, fn {router_node, groups}, st ->
          if router_node == node() do
            # Self-routed: retract our own rows with the SAME seq-guarded tombstone
            # the remote path uses (Scope.vacant_batch/5), NOT a hard :ets.delete.
            # flush and any re-claim for the same group both run in THIS shard, so a
            # hard delete would not race a local re-insert -- but the coordinator's
            # rebalance self-upsert is a DIFFERENT writer (in Scope) that a hard
            # delete does race: do_rebalance stamps snapshot_seq, gathers the shards
            # in order, and only afterwards upserts its local self-rows at that
            # (older) seq. A group we reported held can vacate and flush while the
            # coordinator is still blocked gathering a later shard; a hard delete
            # discards the seq high-water mark, so that late, lower-seq upsert
            # resurrects the row via insert_new as a permanent member-less phantom.
            # The tombstone leaves a fresh (higher-seq) high-water mark the stale
            # upsert loses to, exactly as it does for a remote router.
            Scope.vacant_batch(st.scope, groups, node(), next_seq(), local_scope_pid(st))
            Enum.reduce(groups, st, fn g, s -> delete_group_state(s, g) end)
          else
            dispatch_vacant_batch(groups, router_node, st)
            Enum.reduce(groups, st, fn g, s -> put_group_state(s, g, :vacant_flushing) end)
          end
        end)
    end
  end

  ## Rebalance helpers

  # Run during the coordinator's synchronous {:rebalance} gather.
  #
  # :vacant_queued entries are kept as-is (handled by the catch-all): we don't
  # hold the group, so it is not announced, but the next flush after the ring
  # updates sends the vacant to the group's *current* router, which drains any
  # stale entry the old router still holds.
  #
  # :vacant_flushing (a batch RPC in flight) is rewritten to :vacant_queued so
  # the next flush re-sends to the post-rebalance router; the in-flight worker's
  # result lands in handle_vacant_batch_done's catch-all and is dropped.
  defp normalize_pending_for_rebalance(state) do
    Enum.reduce(groups_in_state(state, :vacant_flushing), state, fn group, st ->
      put_group_state(st, group, :vacant_queued)
    end)
  end

  # Settle every :occupied_pending group whose router changed: reply :ok to the
  # waiters and move to :occupied. Groups whose router did NOT change are left
  # alone: their original in-flight worker is still talking to the correct
  # router, so handle_occupied_done will settle them normally.
  defp settle_moved_pending(state) do
    Enum.reduce(pending_groups(state), state, fn {group, waiters}, st ->
      if router_changed?(st, group) do
        st =
          Enum.reduce(waiters, st, fn {from, pid}, s ->
            s = register_member(s, group, pid)
            GenServer.reply(from, :ok)
            s
          end)

        put_group_state(st, group, :occupied)
      else
        st
      end
    end)
  end

  defp router_changed?(state, group) do
    ring = ring_name(state.scope)
    {:ok, new_dest} = Ring.find_node(ring, group)
    {:ok, old_dest} = Ring.find_historical_node(ring, group, 1)
    new_dest != old_dest
  end

  ## RPC dispatch

  defp dispatch_rpc(:occupied, group, router_node, state) do
    spawn_rpc_worker(
      state,
      router_node,
      :occupied,
      [state.scope, group, node(), next_seq(), local_scope_pid(state)],
      {:occupied_done, group}
    )

    # Ordering anchor for the dispatch→state-write window. handle_join writes the
    # durable :occupied_pending BEFORE calling us, so by the time this fires the
    # worker is in flight AND the claim is already recoverable: a crash here
    # reconciles to :vacant_queued on restart and the flush retracts any row the
    # orphaned worker lands. muster_distributed_test.exs injects a crash at this
    # point to prove exactly that.
    tp(:muster_occupied_dispatched, %{
      scope: state.scope,
      node: node(),
      group: group,
      router: router_node
    })

    :ok
  end

  defp dispatch_vacant_batch(groups, router_node, state) do
    spawn_rpc_worker(
      state,
      router_node,
      :vacant_batch,
      [state.scope, groups, node(), next_seq(), local_scope_pid(state)],
      {:vacant_batch_done, groups}
    )
  end

  # The local Scope coordinator's CURRENT incarnation pid, read fresh at
  # dispatch/write time (never cached). See the writer-attribution note above
  # Scope.upsert_if_newer/4. `nil` if Scope has not registered yet (a narrow
  # startup window); such rows just never match a DOWN's exact-pid wipe.
  defp local_scope_pid(state), do: Process.whereis(Forum.Supervisor.name(state.scope))

  # spawn_opt with monitor + tag gives us atomic spawn+monitor and uses the
  # worker's exit reason as the result channel, so any termination surfaces as a
  # single tagged DOWN message. The RPC targets Forum.Muster.Scope on the remote
  # router (occupied/4 and vacant_batch/4 are the router-role entry points there;
  # they write the :public occupancy table directly, bypassing the coordinator
  # mailbox). Mirrors gen_rpc's async_call pattern.
  defp spawn_rpc_worker(state, router_node, function, args, tag) do
    message_module = state.message_module
    scope = state.scope
    rpc_timeout = state.rpc_timeout_ms

    {_pid, _ref} =
      :erlang.spawn_opt(
        fn ->
          result =
            try do
              message_module.call(scope, router_node, Scope, function, args, rpc_timeout)
            catch
              kind, reason -> {:error, {kind, reason}}
            end

          exit({:rpc_result, result})
        end,
        [{:monitor, [{:tag, tag}]}]
      )

    :ok
  end

  defp worker_result({:rpc_result, r}), do: r
  defp worker_result(:noproc), do: {:error, :worker_noproc}
  defp worker_result(other), do: {:error, {:worker_exit, other}}

  ## Misc

  defp schedule_vacant_flush(state) do
    Process.send_after(self(), :flush_vacant, state.vacant_flush_interval_ms)
    :ok
  end

  defp cancel_cooldown(state, group) do
    {timer_ref, new_timers} = Map.pop(state.cooldown_timers, group)
    if timer_ref, do: Process.cancel_timer(timer_ref)
    %{state | cooldown_timers: new_timers}
  end

  # The states table is the single source of truth: these helpers read and write it
  # directly. put/delete also emit :muster_group_state so trace-based tests can
  # synchronize on per-group transitions (state: nil = forgotten) instead of
  # polling. They return `state` unchanged (the table is the state); callers thread
  # it through unchanged so the existing {:noreply, put_group_state(...)} shape and
  # any concurrent monitors/cooldown_timers update both keep working.
  defp get_group_state(state, group) do
    case :ets.lookup(state.states_table, group) do
      [{^group, value}] -> value
      [] -> nil
    end
  end

  # All {group, group_state} pairs in this shard's slice. Only for callers that
  # genuinely need EVERY entry (rebuild reconciliation, the :group_states dump);
  # callers that want a single state should `:ets.select` for it (helpers below) so
  # the filter runs in the table, not in Elixir over a full copy. The table is
  # single-writer (this shard), so a plain tab2list needs no snapshot guarantees.
  defp all_group_states(state), do: :ets.tab2list(state.states_table)

  # Groups currently in exactly `value` (an atom state: :occupied / :cooldown /
  # :vacant_queued / :vacant_flushing). Matched and projected to the group key in
  # the ETS engine.
  defp groups_in_state(state, value) do
    :ets.select(state.states_table, [{{:"$1", value}, [], [:"$1"]}])
  end

  # Groups the coordinator must snapshot during a rebalance, those we still hold:
  # :occupied, :cooldown, or {:occupied_pending, _}. One multi-clause select.
  defp held_groups(state) do
    :ets.select(state.states_table, [
      {{:"$1", :occupied}, [], [:"$1"]},
      {{:"$1", :cooldown}, [], [:"$1"]},
      {{:"$1", {:occupied_pending, :_}}, [], [:"$1"]}
    ])
  end

  # {group, waiters} for every {:occupied_pending, waiters} group, projecting both
  # the key and the waiter list out of the matched tuple.
  defp pending_groups(state) do
    :ets.select(state.states_table, [
      {{:"$1", {:occupied_pending, :"$2"}}, [], [{{:"$1", :"$2"}}]}
    ])
  end

  defp put_group_state(state, group, value) do
    tp(:muster_group_state, %{scope: state.scope, node: node(), group: group, state: value})
    :ets.insert(state.states_table, {group, value})
    state
  end

  defp delete_group_state(state, group) do
    tp(:muster_group_state, %{scope: state.scope, node: node(), group: group, state: nil})
    :ets.delete(state.states_table, group)
    state
  end

  defp router_from_state(state, group) do
    {:ok, n} = Ring.find_node(ring_name(state.scope), group)
    n
  end

  # Per-source monotonic occupancy stamp. VM-global and strictly increasing, so
  # it reflects dispatch order on this node and survives restarts. Only ever
  # compared at a router for the same {group, source} key, all of whose writes
  # originate on this node, so the comparison is always within one VM's
  # sequence. See the occupancy-row versioning note above Scope.occupied/4.
  defp next_seq, do: :erlang.unique_integer([:monotonic])

  defp ring_name(scope), do: :"#{scope}_muster_ring"
end
