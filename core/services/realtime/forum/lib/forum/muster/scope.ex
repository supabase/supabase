defmodule Forum.Muster.Scope do
  @moduledoc false
  # Per-node cluster coordinator for Forum.Muster.
  #
  # The per-group claim state machine lives in the N Forum.Muster.Shard
  # processes (one per partition index). This process owns only the rare,
  # node-wide cluster-coordination concerns:
  #
  #   * Cluster view (sorted node list) + the :status / :view_hash
  #     persistent_terms read by Forum.Muster.router/2 and can_decide?/2.
  #     This process is the SOLE writer of those terms and of the ring's node
  #     set, which is exactly why sharding the claim path cannot weaken those
  #     two guarantees.
  #   * Router-role occupancy table: when this node is the router for a group,
  #     the set of source nodes that hold it. :public so :erpc workers running
  #     the remote entry points (occupied/4, vacant_batch/4) and the local
  #     shards write it directly.
  #   * The readiness barrier: member_views, owed_snapshots, applied_snapshot_seq.
  #   * Snapshot apply ({:apply_snapshot}), serialized through this one process.
  #   * Rebalance orchestration (do_rebalance), the view heartbeat, and the
  #     stale-router-entry sweep.
  #
  # Rebalance gathers each shard's held groups with a SYNCHRONOUS GenServer.call
  # ({:rebalance, ...}); the slow snapshot RPCs it then dispatches stay
  # fire-and-forget, so this loop never blocks on a remote RPC. Shards never call
  # back into this process, so the synchronous gather cannot deadlock.
  use GenServer
  require Logger
  use Snabbkaffex, only: :trace

  alias ExHashRing.Ring

  @default_rpc_timeout_ms 5_000
  @default_view_heartbeat_interval_ms 10_000
  @default_rebalance_gather_timeout_ms 15_000
  @default_shards_ready_timeout_ms 5_000
  @singleton_promotion_timeout_multiplier 3

  # A vacancy tombstone is kept this many multiples of rpc_timeout_ms before the
  # GC sweep reaps it: long enough that an orphaned, un-cancelled :occupied/
  # snapshot RPC (whose only delay is scheduling/network, bounded by the erpc
  # timeout in a healthy cluster) can no longer land and resurrect the row.
  @tombstone_window_multiplier 5

  defmodule State do
    @moduledoc false
    @type t :: %__MODULE__{
            scope: atom,
            message_module: module,
            view_heartbeat_interval_ms: pos_integer,
            singleton_promotion_timeout_ms: pos_integer,
            rpc_timeout_ms: timeout,
            rebalance_gather_timeout_ms: timeout,
            shards_ready_timeout_ms: pos_integer,
            tombstone_window_ms: pos_integer,
            occupancy_table: atom,
            members: [node],
            peers: %{pid => reference},
            member_views: %{node => {non_neg_integer | :in_transition, integer, pid}},
            owed_snapshots: %{node => integer},
            applied_snapshot_seq: %{node => {integer, pid}},
            view_seq: integer,
            pending_round: nil | %{target: [node], awaiting: MapSet.t(), seq: integer},
            leaving: boolean,
            leave_from: nil | GenServer.from(),
            leave_pending: MapSet.t(),
            settle_ms: non_neg_integer
          }
    defstruct [
      :scope,
      :message_module,
      :view_heartbeat_interval_ms,
      :singleton_promotion_timeout_ms,
      :rpc_timeout_ms,
      :rebalance_gather_timeout_ms,
      :shards_ready_timeout_ms,
      :tombstone_window_ms,
      :occupancy_table,
      # Two-phase view adoption. When growing the cluster view we do NOT swap the
      # ring immediately; we first PREPARE the OLD view's members (the only nodes
      # that could be stale routers for this transition) via a `note_transition`
      # RPC that INVALIDATES our member_views entry on them, and only COMMIT (swap
      # the ring, run do_rebalance) once every one of them has acked. That orders
      # "every old-view member knows we are leaving the view" strictly before "we
      # route joins under the new view", closing the stale-ready-router miss. nil
      # when no view change is in flight; otherwise the target view, the set of
      # old members we are still awaiting acks from, and this round's seq
      # (stale-round acks are dropped). A membership change mid-round supersedes it
      # (fresh seq).
      pending_round: nil,
      members: [],
      peers: %{},
      # Barrier bookkeeping: each peer's most-recently-announced
      # {cluster-view hash, seq watermark} (via a :rebalance_marker, or seeded
      # on the discovery handshake). Newest-seq-wins, never reset, so an
      # announcement that arrives before we adopt that view is retained, and a
      # stale announcement arriving late (markers travel on more than one
      # channel) cannot regress a newer one. We are "ready" (and our occupancy
      # table can be trusted as a router) once every member's latest view agrees
      # with ours. The watermark is the seq of the peer's last announce round.
      member_views: %{},
      # Our own announce watermark, sent alongside every view announcement: the
      # seq of our last snapshot round (or of init's re-announce).
      view_seq: 0,
      # Routers we have an in-flight, fire-and-forget :receive_node_state
      # snapshot to, each stamped with the snapshot_seq of the round that
      # dispatched it. While a node is in here, announce_view must NOT send it a
      # bare view marker: the marker for an owed node is carried by the snapshot
      # itself, after its data is applied. A bare marker arriving first would let
      # the node count us as "agreed" before our occupancy data lands. Cleared by
      # the snapshot worker's :node_state_done on success; the seq stamp lets a
      # later rebalance that re-owes the same node keep the obligation even if an
      # earlier round's acknowledgement arrives afterwards.
      owed_snapshots: %{},
      # Router-role bookkeeping: the highest snapshot seq we have applied from
      # each source node (see handle_call({:apply_snapshot, ...})). A snapshot
      # whose seq is not strictly greater is a stale, reordered round and is
      # dropped wholesale. This is what makes a *sequence* of overlapping
      # rebalances safe, since the apply is serialized through this process and a
      # late round can never resurrect a group a newer round already dropped.
      applied_snapshot_seq: %{},
      # Graceful cluster-leave (see Forum.Muster.drain/2). While `leaving` is
      # true this node is draining: every OUTBOUND self-assertion (heartbeat
      # announce, re-discovery, discover-ack, nodeup-discovery) is suppressed so
      # no peer re-pairs us after we announced leaving; INBOUND coordination RPCs
      # are deliberately still serviced through the whole drain + settle window.
      # `leave_from` parks the drain/2 caller (replied to asynchronously so the
      # coordinator loop never blocks); `leave_pending` is the set of peer NODES
      # we still await an ack from -- a peer is removed the moment it acks OR
      # departs (crash), so the settle window opens exactly when it empties;
      # `settle_ms` the post-ack in-flight-drain window stashed at drain time.
      leaving: false,
      leave_from: nil,
      leave_pending: MapSet.new(),
      settle_ms: 0
    ]
  end

  ## Public helpers (read paths used by Forum.Muster from the caller's process)

  @doc false
  # Returns the list of nodes (as known by the local router state) holding
  # `group`. Internal read backing `Forum.Muster.targets/3`; callers should go
  # through that (or `Forum.Muster.can_decide?/2`) so the readiness barrier is
  # honored, never trusting this table directly.
  @spec occupancy(atom, Forum.group()) :: [node]
  def occupancy(scope, group) do
    # :present rows only (a tombstone, whose meta is an integer timestamp, reads as absent).
    :ets.select(occupancy_table_name(scope), [{{{group, :"$1"}, :_, :present, :_}, [], [:"$1"]}])
  end

  @doc false
  # Occupancy ETS table name. Public so Forum.Muster.Shard can write it directly.
  @spec occupancy_table_name(atom) :: atom
  def occupancy_table_name(scope), do: :"#{scope}_muster_occupancy"

  # Group-state labels held in each shard's states table as bare atoms
  # (`{:occupied_pending, _}` is a tuple and counted separately).
  @atom_group_states [:occupied, :cooldown, :vacant_queued, :vacant_flushing]

  @doc false
  # Count of present occupancy rows (router-role table size). tombstones
  # are excluded
  @spec occupancy_row_count(atom) :: non_neg_integer
  def occupancy_row_count(scope) do
    :ets.select_count(occupancy_table_name(scope), [{{{:_, :_}, :_, :present, :_}, [], [true]}])
  end

  @doc false
  @spec occupancy_rows_by_node(atom) :: %{node => non_neg_integer}
  def occupancy_rows_by_node(scope) do
    table = occupancy_table_name(scope)
    {:ok, nodes} = Ring.get_nodes(ring_name(scope))

    Map.new(nodes, fn n ->
      {n, :ets.select_count(table, [{{{:_, n}, :_, :present, :_}, [], [true]}])}
    end)
  end

  @doc false
  # Per-label group-state counts, summed across every shard's tables.
  #
  # `:total` is the SUM of the per-label counts, NOT a separate :ets.info(:size)
  # read. The labels are exhaustive (every value the states table can hold), so
  # the sum equals the row count, and deriving it this way keeps the breakdown
  # internally consistent (total == sum of parts) rather than racing a separate
  # size read against the concurrently-mutated table.
  @spec group_state_counts(atom) :: %{atom => non_neg_integer}
  def group_state_counts(scope) do
    tables = state_tables(scope)

    atom_counts =
      Map.new(@atom_group_states, fn label ->
        {label, sum_over(tables, &:ets.select_count(&1, [{{:_, label}, [], [true]}]))}
      end)

    counts =
      Map.put(
        atom_counts,
        :occupied_pending,
        sum_over(tables, &:ets.select_count(&1, [{{:_, {:occupied_pending, :_}}, [], [true]}]))
      )

    Map.put(counts, :total, counts |> Map.values() |> Enum.sum())
  end

  defp state_tables(scope) do
    n = length(Forum.Supervisor.shards(scope))
    for i <- 0..(n - 1), do: Forum.Supervisor.shard_states_table(scope, i)
  end

  defp sum_over(tables, fun), do: Enum.reduce(tables, 0, fn t, acc -> acc + fun.(t) end)

  # Occupancy rows are a uniform last-writer-wins-by-seq register, keyed by
  # {group, source} and shaped {{group, source}, seq, meta, writer}:
  #
  #   * meta == :present        : the source holds local members of the group.
  #   * meta == <created_at ms>  : a TOMBSTONE. The source vacated the group as of
  #     `seq`. Kept (not deleted) so the seq guard works in BOTH directions. The
  #     covered direction is a stale, lower-seq DELETE losing to a live INSERT; the
  #     reverse is a stale, lower-seq INSERT (an `occupied`/snapshot whose RPC was
  #     orphaned and, because :erpc does not cancel, lands late) which must NOT
  #     resurrect a vacated group. Physically removing the row would discard the
  #     high-water seq and let that late INSERT win via insert_new. Tombstones are
  #     reaped by a periodic, time-windowed sweep (reap_tombstones/1) once older
  #     than the longest an in-flight RPC could still be (a multiple of
  #     rpc_timeout_ms, see default_tombstone_window/1).
  #   * `writer` is the pid of the source's Scope coordinator INCARNATION that
  #     produced this row (see handle_info({:DOWN, ...}) below). Only one Scope
  #     can be live per node at a time, so a row whose `writer` differs from a
  #     dying pid was necessarily produced by a different (live or later)
  #     incarnation and must not be wiped alongside it, regardless of what has
  #     or hasn't been registered as a peer yet.
  #
  # `occupancy/2` returns only :present rows, so a tombstone reads as "absent".

  @doc false
  # INSERT/raise the key to a :present row at `seq` (never lowering a row already
  # at or above `seq`). Used by `occupied`, the rebalance snapshot, and self-routed
  # claims. Strict `<`: an equal seq never overwrites (seqs are globally unique per
  # source, so ties do not occur in practice). Public so Forum.Muster.Shard writes
  # it directly.
  @spec upsert_if_newer(atom, {Forum.group(), node}, integer, pid | nil) :: :ok
  def upsert_if_newer(table, key, seq, writer),
    do: put_if_newer(table, key, seq, :present, :lt, writer)

  # Mark the key a TOMBSTONE at `seq` (absent), stamped `created_at` (router-local
  # monotonic ms) for the GC sweep. `=<` so a vacancy at the stored seq still wins
  # a strictly-newer :present row (a re-claim) survives.
  @spec tombstone_if_newer(atom, {Forum.group(), node}, integer, integer, pid | nil) :: :ok
  defp tombstone_if_newer(table, key, seq, created_at, writer),
    do: put_if_newer(table, key, seq, created_at, :lte, writer)

  # Seq-guarded write of {key, seq, meta, writer}. Atomic against concurrent
  # writers via select_replace (raise branch) + insert_new (absent branch),
  # retried on the rare interleaving where a still-older row appears in
  # between. `cmp` is the overwrite comparison (:lt for a present INSERT, :lte
  # for a tombstone). The replacement object reconstructs the row; the key
  # tuple is injected as a {:const, _} literal (a bare tuple in a match-spec
  # body is a construction form, not a value).
  defp put_if_newer(table, key, seq, meta, cmp, writer) do
    spec = [
      {{key, :"$1", :_, :_}, [{op(cmp), :"$1", seq}], [{{{:const, key}, seq, meta, writer}}]}
    ]

    case :ets.select_replace(table, spec) do
      1 ->
        :ok

      0 ->
        if :ets.insert_new(table, {key, seq, meta, writer}) do
          :ok
        else
          case :ets.lookup(table, key) do
            [{^key, existing, _, _}] ->
              if overwrite?(cmp, existing, seq),
                do: put_if_newer(table, key, seq, meta, cmp, writer),
                else: :ok

            _ ->
              :ok
          end
        end
    end
  end

  defp op(:lt), do: :<
  defp op(:lte), do: :"=<"
  defp overwrite?(:lt, existing, seq), do: existing < seq
  defp overwrite?(:lte, existing, seq), do: existing <= seq

  # Convert this `source`'s rows older than `seq` into tombstones at `seq` (used by
  # the rebalance snapshot's full-state replace). Each write is individually
  # seq-guarded, so a row a racing re-claim already raised above `seq` is spared.
  defp tombstone_stale_source_rows(table, source, seq, created_at, writer) do
    table
    |> :ets.select([{{{:"$1", source}, :"$2", :_, :_}, [{:<, :"$2", seq}], [:"$1"]}])
    |> Enum.each(fn group ->
      tombstone_if_newer(table, {group, source}, seq, created_at, writer)
    end)
  end

  ## Remote entry points
  #
  # These are invoked on the *router* / receiver node by remote nodes' shards
  # (occupied/4, vacant_batch/4) or coordinator (receive_node_state/5) via the
  # configured Forum.Adapter (default: :erpc.call). occupied/4 and vacant_batch/4
  # run inside the :erpc worker and write directly to the :public occupancy_table,
  # bypassing this coordinator's mailbox, so a busy router absorbs many concurrent
  # updates in parallel. Correctness holds because each occupancy key is
  # {group, source_node}: different sources own disjoint keys, and the source's
  # own shard serializes :occupied vs. :vacant_batch per group.

  # Occupancy rows are versioned: each row is {{group, source_node}, seq} where
  # `seq` is a per-source monotonic stamp (:erlang.unique_integer([:monotonic]))
  # assigned by the source at *dispatch* time. Seqs are only ever compared for
  # the same {group, source} key, so they always come from one source's VM and
  # are totally ordered there. The versioning closes a race that bare
  # delete/insert could not: a `vacant_batch` whose RPC timed out is not cancelled
  # by :erpc, so its DELETE may land on the router *after* the source re-claimed
  # with a fresh `occupied` INSERT. Because the re-claim is dispatched after the
  # vacant worker exited, its seq is strictly higher, and `vacant_batch` refuses to
  # delete a row stamped newer than itself.

  @doc """
  Remote: source_node tells us it now holds local members of `group`.

  `source_pid` is the pid of the source's Scope coordinator INCARNATION that
  dispatched this claim, read by the dispatching Shard from its local Scope's
  registered name right before the RPC. It's stamped on the row so
  `handle_info({:DOWN, ...})` can tell whether a later-dying pid actually
  produced this row, without having to know whether that incarnation has been
  registered as a peer yet (a completely independent, unordered channel; see
  the handler for why that distinction matters). Callers with no live
  coordinator to attribute to (chiefly tests exercising the write path
  directly) must pass an explicit pid anyway: `nil` is only ever produced
  internally, by `local_scope_pid/1` during the narrow startup window before
  Scope has registered; such rows are simply never matched by a DOWN's
  exact-pid wipe.
  """
  @spec occupied(atom, Forum.group(), node, integer, pid | nil) :: :ok
  def occupied(scope, group, source_node, seq, source_pid) do
    # Seq-guarded upsert (not an unconditional insert): a snapshot for this same
    # {group, source} may be applied concurrently by this coordinator during a
    # rebalance, and we must not let an older write clobber a newer one. See
    # upsert_if_newer/3.
    #
    # Wrapped in a span so a test can force an ordering on the INSERT *before* it
    # writes: the :start fires ahead of the upsert (unlike :muster_occupied below,
    # which fires after). muster_distributed_test.exs uses :start to park a stale
    # occupied INSERT behind a fresh vacant DELETE (the reverse of the covered
    # stale-DELETE-after-fresh-INSERT race).
    tp_span(:muster_occupied_apply, %{
      scope: scope,
      node: node(),
      group: group,
      source: source_node,
      seq: seq
    }) do
      upsert_if_newer(occupancy_table_name(scope), {group, source_node}, seq, source_pid)
    end

    # Emitted AFTER the insert, so a forced ordering on this event implies the
    # row is committed (muster_distributed_test.exs races it against a stale
    # vacant DELETE).
    tp(:muster_occupied, %{
      scope: scope,
      node: node(),
      group: group,
      source: source_node,
      seq: seq
    })

    :ok
  end

  @doc "Remote: source_node tells us its last local members of `groups` left. See occupied/5 for `source_pid`."
  @spec vacant_batch(atom, [Forum.group()], node, integer, pid | nil) :: :ok
  def vacant_batch(scope, groups, source_node, seq, source_pid) do
    table = occupancy_table_name(scope)
    created_at = System.monotonic_time(:millisecond)

    # Tombstone each row (mark it absent at this batch's seq) rather than delete it.
    # A later `occupied`/snapshot for the same key (higher seq) still survives a
    # stale, late DELETE, and, crucially, the reverse also holds: a stale, lower-
    # seq INSERT that lands AFTER this DELETE (an orphaned, un-cancelled :occupied/
    # snapshot RPC) is rejected by the seq guard instead of resurrecting the group.
    # Atomic per row.
    tp_span(:muster_vacant_batch, %{
      scope: scope,
      node: node(),
      groups: groups,
      source: source_node,
      seq: seq
    }) do
      Enum.each(groups, fn group ->
        tombstone_if_newer(table, {group, source_node}, seq, created_at, source_pid)
      end)
    end

    :ok
  end

  @doc """
  Remote: source_node gives us a full-state snapshot of its groups for the
  cluster view identified by `view_hash`.

  Unlike `occupied`/`vacant_batch`, this does **not** write the occupancy table
  from the RPC worker. It applies the snapshot via a synchronous
  `{:apply_snapshot, ...}` call into the receiver's coordinator and returns its
  reply. Serializing the apply through the single coordinator is what makes a
  *sequence* of overlapping rebalances safe: the coordinator applies a source's
  snapshots in mailbox order under a per-source seq guard, so a late or reordered
  round is dropped wholesale and can never resurrect a group a newer round already
  dropped, a guarantee that concurrent direct ETS writes from parallel RPC
  workers cannot give (the multi-row insert+delete is not atomic across workers).

  The snapshot still doubles as source_node's rebalance marker: the apply folds
  the occupancy write and the `member_views` update into one indivisible step
  (data first, then readiness). Because the call only returns once it has been
  applied, "RPC returned ⟹ applied", so when the sender clears `owed_snapshots`
  and resumes its view heartbeat to us, our data and marker are already in place.
  We pass `:infinity` for the inner call (it is a few ETS ops that never block);
  the sender's `:erpc` `:rpc_timeout_ms` is the real bound.

  `source_pid` (see occupied/5) is `self()` at the dispatching Scope: it
  dispatches this RPC itself, so no lookup is needed.
  """
  @spec receive_node_state(atom, node, [Forum.group()], non_neg_integer, integer, pid | nil) ::
          :ok
  def receive_node_state(scope, source_node, groups, view_hash, seq, source_pid) do
    GenServer.call(
      Forum.Supervisor.name(scope),
      {:apply_snapshot, source_node, groups, view_hash, seq, source_pid},
      :infinity
    )
  end

  @doc """
  Remote: source_node gives us an incremental DELTA (the groups that just moved
  onto us) for the cluster view identified by `view_hash`.

  The add-only counterpart of `receive_node_state`, dispatched by a source's
  rebalance to a router that was already a member and had acked the source's
  previous round, so its rows for the source match the previous ring generation.
  Unlike a snapshot it does **not** wipe: groups that moved *away* from us are
  reaped by our own `drop_stale_router_entries`, and a group the source vacated by
  the source's vacant-batch retry, so a delta need only ADD what moved in. Applied
  via `{:apply_delta, ...}` through the coordinator (same per-source seq guard as a
  snapshot), and it doubles as the source's rebalance marker (data first, then
  readiness), so the readiness barrier treats it exactly like a snapshot.
  """
  @spec apply_delta(atom, node, [Forum.group()], non_neg_integer, integer, pid | nil) :: :ok
  def apply_delta(scope, source_node, adds, view_hash, seq, source_pid) do
    GenServer.call(
      Forum.Supervisor.name(scope),
      {:apply_delta, source_node, adds, view_hash, seq, source_pid},
      :infinity
    )
  end

  @doc """
  Remote: source_node is beginning a view change and tells us (one of its OLD
  view's members) to stop counting it as agreeing to the view we last heard from
  it (the two-phase prepare; see `begin_view_change`).

  We INVALIDATE our member_views entry for source_node at `seq` (a value that can
  never equal a real cluster-view hash), so `ready?/1` no longer treats it as
  agreeing with any view and this node drops to `:converging`/floods as a router
  for it. Seq-stamped like every other announcement, so a stale, lower-seq
  asserting marker cannot un-invalidate it; source_node re-establishes agreement
  only when it COMMITS and re-announces its new view at a higher seq.

  Applied via a synchronous call into this coordinator (like `receive_node_state`)
  so the update is serialized with snapshot/marker applies; the reply is the ack
  the sender's prepare worker waits on. `source_pid` is the sender's Scope
  incarnation (for the DOWN-attribution guard).
  """
  @spec note_transition(atom, node, integer, pid | nil) :: :ok
  def note_transition(scope, source_node, seq, source_pid) do
    GenServer.call(
      Forum.Supervisor.name(scope),
      {:apply_transition, source_node, seq, source_pid},
      :infinity
    )
  end

  ## GenServer lifecycle

  @spec start_link(atom, Keyword.t()) :: GenServer.on_start()
  def start_link(scope, opts \\ []),
    do: GenServer.start_link(__MODULE__, [scope, opts], name: Forum.Supervisor.name(scope))

  @doc false
  # Child spec for the scope's shared ring. Started as a supervised sibling by
  # Forum.Supervisor (NOT linked to this coordinator) so a coordinator restart
  # does not take the ring down under the shards that read it directly.
  def ring_child_spec(scope) do
    %{
      id: :muster_ring,
      start: {Ring, :start_link, [[{:name, ring_name(scope)} | Forum.Muster.ring_config()]]}
    }
  end

  @impl true
  def init([scope, opts]) do
    view_heartbeat_interval_ms =
      Keyword.get(opts, :view_heartbeat_interval_ms, @default_view_heartbeat_interval_ms)

    rpc_timeout_ms = Keyword.get(opts, :rpc_timeout_ms, @default_rpc_timeout_ms)

    singleton_promotion_timeout_ms =
      Keyword.get(
        opts,
        :singleton_promotion_timeout_ms,
        default_singleton_promotion_timeout(view_heartbeat_interval_ms)
      )

    rebalance_gather_timeout_ms =
      Keyword.get(opts, :rebalance_gather_timeout_ms, @default_rebalance_gather_timeout_ms)

    shards_ready_timeout_ms =
      Keyword.get(opts, :shards_ready_timeout_ms, @default_shards_ready_timeout_ms)

    tombstone_window_ms =
      Keyword.get(opts, :tombstone_window_ms, default_tombstone_window(rpc_timeout_ms))

    message_module = Keyword.get(opts, :message_module, Forum.Adapter.ErlDist)

    if not (is_integer(view_heartbeat_interval_ms) and view_heartbeat_interval_ms > 0) do
      raise ArgumentError,
            "expected :view_heartbeat_interval_ms to be a positive integer, got: #{inspect(view_heartbeat_interval_ms)}"
    end

    :ok = :net_kernel.monitor_nodes(true)

    # The occupancy table is created and OWNED by Forum.Supervisor (a long-lived
    # sibling), not by us, so it survives a coordinator restart (and the shard
    # restarts that cascade from it, see Forum.Supervisor's flat :rest_for_one)
    # under whichever shard processes are running. We only reference it by
    # name. On our restart the table retains the previous incarnation's rows; that
    # is safe because init starts :converging, so callers flood until either
    # discovery / rebalance converges first or bounded singleton self-promotion
    # fires. Each remote source's next snapshot replaces its rows wholesale, and
    # drop_stale_router_entries prunes the rest on the :ready transition. Our own
    # self rows are re-asserted (monotonically) by reannounce_local_groups_at_init.
    occupancy_table = occupancy_table_name(scope)

    :ok = message_module.register(scope)

    # The ring is a supervised sibling (Forum.Supervisor starts it before us).
    # Reset its node set to just us: on a coordinator restart members shrinks
    # back to [node()] until peers re-discover us.
    {:ok, _} = Ring.set_nodes(ring_name(scope), [node()])

    # Lifecycle tri-state: :rebalancing (my ring is in flux, senders flood) ->
    # :converging (ring adopted, still waiting for peers to agree on my view) ->
    # :ready (all peers agree; my occupancy table can be trusted as a router).
    # Init/restart begins :converging even with members [node()]: a restarted
    # local sender would otherwise agree with that one-node view and could trust
    # incomplete occupancy before scope-level discovery re-pairs. A bounded,
    # init-only singleton-promotion timer below restores liveness when the scope
    # really has downsized to one node.
    :persistent_term.put({Forum.Muster, scope, :status}, :converging)
    # Cluster-view hash senders tag broadcasts with; router compares against its own.
    :persistent_term.put(
      {Forum.Muster, scope, :view_hash},
      Forum.Muster.view_hash_for_members([node()])
    )

    # Always re-open the join gate in case of a restart during a drain
    :persistent_term.put({Forum.Muster, scope, :accepting_joins}, true)

    Logger.info("Muster[#{node()}|#{scope}] Starting")

    state = %State{
      scope: scope,
      message_module: message_module,
      view_heartbeat_interval_ms: view_heartbeat_interval_ms,
      singleton_promotion_timeout_ms: singleton_promotion_timeout_ms,
      rpc_timeout_ms: rpc_timeout_ms,
      rebalance_gather_timeout_ms: rebalance_gather_timeout_ms,
      shards_ready_timeout_ms: shards_ready_timeout_ms,
      tombstone_window_ms: tombstone_window_ms,
      occupancy_table: occupancy_table,
      members: [node()]
    }

    state = reannounce_local_groups_at_init(state)
    # Above the seqs of the rows just re-announced, so receivers may judge them
    # once this watermark is announced.
    state = %{state | view_seq: next_seq()}

    {:ok, state, {:continue, :discover}}
  end

  @impl true
  def handle_continue(:discover, state) do
    await_shards_ready(state)

    state.message_module.broadcast(state.scope, discover_msg(state))

    schedule_singleton_promotion(state)
    schedule_view_heartbeat(state)
    schedule_tombstone_sweep(state)
    {:noreply, state}
  end

  # Forum.Supervisor starts Forum.Muster.ShardsReadySentinel as the LAST child
  # of the outer :rest_for_one, right after shards_supervisor: its start_link/1
  # cannot run until every shard has returned from its own init (a supervisor
  # blocks its caller until a started child's init returns, and starts children
  # strictly in list order), so its one-shot :muster_shards_ready send is a
  # guarantee, not a race. We wait for it here, before doing anything that
  # could trigger a rebalance (the broadcast right below can draw an immediate
  # :muster_discover_ack, and a peer's :nodeup races independently of our own
  # startup), so do_rebalance's synchronous GenServer.call to each shard can
  # never land before that shard is registered. handle_continue runs to
  # completion before any other queued message is processed, so this also
  # defers anything that happened to arrive ahead of the signal.
  #
  # A missing signal after the timeout means the tree is unhealthy in a way
  # nothing above self-heals (e.g. the sentinel's own child spec is broken);
  # crashing hands off to the supervisor's restart logic instead of hanging
  # this coordinator forever.
  defp await_shards_ready(state) do
    receive do
      :muster_shards_ready -> :ok
    after
      state.shards_ready_timeout_ms ->
        raise "Muster[#{node()}|#{state.scope}] shards not ready after #{state.shards_ready_timeout_ms}ms"
    end
  end

  ## handle_call

  # Apply a full-state snapshot from `source` (dispatched by its rebalance, via
  # the receive_node_state RPC, which calls in here and waits for the reply).
  # Serializing the apply through this one process is what makes a *sequence* of
  # overlapping rebalances safe: the per-source seq guard is atomic because this
  # is one process.
  #
  # A snapshot whose seq is not strictly greater than the highest already applied
  # from this source is a stale, reordered round (the RPC that carried it may have
  # been delayed past a newer round, or executed late after an erpc timeout). We
  # drop it wholesale, so it can never resurrect a group a newer round already
  # dropped, and still reply :ok.
  #
  # Upsert the snapshot rows at `seq` (never lowering a newer racing re-claim),
  # then tombstone only this source's older rows (strict `<`). We then advance the
  # watermark and fold in the carried view marker (member_views + update_status).
  # Data first, then readiness, in one indivisible step.
  @impl true
  def handle_call(
        {:apply_snapshot, source, groups, view_hash, seq, source_pid},
        _from,
        %State{} = state
      ) do
    applied = Map.get(state.applied_snapshot_seq, source)

    if applied != nil and seq <= elem(applied, 0) do
      {:reply, :ok, state}
    else
      table = state.occupancy_table
      created_at = System.monotonic_time(:millisecond)
      Enum.each(groups, fn group -> upsert_if_newer(table, {group, source}, seq, source_pid) end)
      # Tombstone (not delete) this source's rows that predate the snapshot and are
      # not in it: a late, lower-seq INSERT for a group the source no longer holds
      # must not resurrect it. The just-upserted present rows are at `seq` (not
      # < seq) and are spared.
      tombstone_stale_source_rows(table, source, seq, created_at, source_pid)

      tp(:muster_node_state_received, %{
        scope: state.scope,
        node: node(),
        source: source,
        view_hash: view_hash,
        groups: groups
      })

      state = %{
        state
        | applied_snapshot_seq: Map.put(state.applied_snapshot_seq, source, {seq, source_pid})
      }

      {:reply, :ok, update_status(put_member_view(state, source, view_hash, seq, source_pid))}
    end
  end

  # Incremental sibling of {:apply_snapshot}: apply a DELTA (the groups that just
  # moved onto us) from `source`. Like the snapshot it is seq-guarded per source:
  # a round not strictly newer than the highest already applied is a stale,
  # reordered round and is dropped wholesale. But it does NOT wipe: a delta only
  # ADDS, since groups that moved away are reaped by our own
  # drop_stale_router_entries and a vacated group by the source's vacant-batch
  # retry (the sender asserts what it holds; the receiver owns removes). Each add
  # is an individually seq-guarded upsert (the same per-{group, source} discipline
  # as occupied/4), so it composes with concurrent claims from the source's shards.
  # We then advance the watermark and fold in the carried view marker, exactly like
  # a snapshot (data first, then readiness), so the barrier cannot tell the two
  # apart.
  @impl true
  def handle_call(
        {:apply_delta, source, adds, view_hash, seq, source_pid},
        _from,
        %State{} = state
      ) do
    applied = Map.get(state.applied_snapshot_seq, source)

    if applied != nil and seq <= elem(applied, 0) do
      {:reply, :ok, state}
    else
      table = state.occupancy_table
      Enum.each(adds, fn group -> upsert_if_newer(table, {group, source}, seq, source_pid) end)

      tp(:muster_delta_received, %{
        scope: state.scope,
        node: node(),
        source: source,
        view_hash: view_hash,
        groups: adds
      })

      state = %{
        state
        | applied_snapshot_seq: Map.put(state.applied_snapshot_seq, source, {seq, source_pid})
      }

      {:reply, :ok, update_status(put_member_view(state, source, view_hash, seq, source_pid))}
    end
  end

  # Prepare (see note_transition/4): `source` is leaving the view it last
  # announced to us. Invalidate its member_views entry (hv := :in_transition, a
  # value no real cluster-view hash equals), seq-guarded via put_member_view, so
  # ready?/1 stops counting it as agreeing to any view. A stale, lower-seq
  # asserting marker cannot regress this (newest-seq-wins); `source` re-agrees
  # only when it commits and re-announces at a higher seq. Serialized here with
  # every other member_views update; the reply is the sender's ack.
  @impl true
  def handle_call({:apply_transition, source, seq, source_pid}, _from, %State{} = state) do
    tp(:muster_transition_applied, %{
      scope: state.scope,
      node: node(),
      source: source,
      seq: seq
    })

    {:reply, :ok, update_status(put_member_view(state, source, :in_transition, seq, source_pid))}
  end

  # Graceful cluster-leave: evacuate the router role before this node dies
  # We do not rebalance ourselves; instead we broadcast
  # `{:muster_leaving, self(), view_seq}` and let each peer rebalance us out of its
  # ring and ack with `{:muster_leaving_ack, node()}` once that eviction is done. The
  # `drain/2` caller is parked in `from` and replied to asynchronously so this
  # loop never blocks on the remote acks.
  # Start draining immediately (`leaving: true` suppresses every outbound
  # self-assertion) and stop accepting joins. A singleton (no peers) has nobody
  # to evacuate to and nothing routed to it, so it replies `:ok` at once. Otherwise
  # we arm the ack deadline and wait. Inbound coordination RPCs keep being
  # serviced throughout.
  def handle_call({:drain, _timeout, _settle_ms}, _from, %State{leaving: true} = state) do
    {:reply, {:error, :already_draining}, state}
  end

  def handle_call({:drain, timeout, settle_ms}, from, %State{} = state) do
    # When atoms or other terms that fit in one machine word are deleted, no global GC is needed.
    :persistent_term.put({Forum.Muster, state.scope, :accepting_joins}, false)

    # Un-ready ourselves for the whole drain. We keep our old ring and view, and
    # peers evict us one by one, so from the first eviction on our occupancy
    # table is no longer maintained: a peer that has evicted us sends its new
    # first-member claims to the newly-elected router, never to us.
    state = publish_status(%{state | pending_round: nil}, :rebalancing)
    expected = state.peers |> Map.keys() |> Enum.map(&node/1) |> MapSet.new()

    tp(:muster_drain_begin, %{
      scope: state.scope,
      node: node(),
      expected: MapSet.to_list(expected),
      settle_ms: settle_ms
    })

    expected_size = MapSet.size(expected)

    if expected_size == 0 do
      Logger.info(
        "Muster[#{node()}|#{state.scope}] Draining: singleton (no peers), nothing to hand off; draining immediately"
      )

      {:reply, :ok, %{state | leaving: true}}
    else
      Logger.info(
        "Muster[#{node()}|#{state.scope}] Draining: broadcasting leave, awaiting acks from " <>
          "#{expected_size} peer(s) #{inspect(MapSet.to_list(expected))} " <>
          "(ack timeout #{timeout}ms, settle #{settle_ms}ms)"
      )

      state.message_module.broadcast(state.scope, {:muster_leaving, self(), state.view_seq})
      Process.send_after(self(), :leave_deadline, timeout)

      {:noreply,
       %{
         state
         | leaving: true,
           leave_from: from,
           leave_pending: expected,
           settle_ms: settle_ms
       }}
    end
  end

  # For tests / introspection: group_states + cooldown are gathered from the
  # shards, which own the per-group state machine.
  def handle_call(:status, _from, state) do
    group_states = gather_group_states(state.scope)

    reply = %{
      members: state.members,
      peers: Map.keys(state.peers) |> Enum.map(&node/1),
      group_states: group_states,
      cooldown: for({g, :cooldown} <- group_states, do: g)
    }

    {:reply, reply, state}
  end

  # Lightweight snapshot for `Forum.Muster.summary/1`: ONLY the small fields that
  # live in the coordinator's own state. It deliberately does NOT gather group
  # states from the shards or copy the occupancy table (the caller reads those as
  # cheap ETS counts), so this call is O(1) and safe to poll.
  def handle_call(:summary, _from, state) do
    reply = %{
      members: state.members,
      peers: map_size(state.peers),
      owed_snapshots: map_size(state.owed_snapshots),
      applied_snapshot_seq: state.applied_snapshot_seq
    }

    {:reply, reply, state}
  end

  # Full snapshot for `Forum.Muster.dump/1`: everything :status returns plus the
  # persistent_term lifecycle fields, the per-peer view bookkeeping, the ring's
  # current node set, and the router-role occupancy table folded into
  # %{group => [source_node]}.
  def handle_call(:dump, _from, state) do
    occupancy =
      state.occupancy_table
      |> :ets.tab2list()
      |> Enum.reduce(%{}, fn
        {{group, src}, _seq, :present, _writer}, acc -> Map.update(acc, group, [src], &[src | &1])
        _tombstone, acc -> acc
      end)

    {:ok, ring_nodes} = Ring.get_nodes(ring_name(state.scope))
    group_states = gather_group_states(state.scope)

    reply = %{
      scope: state.scope,
      status: :persistent_term.get({Forum.Muster, state.scope, :status}, nil),
      view_hash: :persistent_term.get({Forum.Muster, state.scope, :view_hash}, nil),
      members: state.members,
      ring_nodes: ring_nodes,
      peers: Map.keys(state.peers) |> Enum.map(&node/1),
      member_views: state.member_views,
      owed_snapshots: state.owed_snapshots,
      applied_snapshot_seq: state.applied_snapshot_seq,
      group_states: group_states,
      cooldown: for({g, :cooldown} <- group_states, do: g),
      occupancy: occupancy
    }

    {:reply, reply, state}
  end

  ## handle_info

  # Peer discovery (the receiver of a discover replies with an ack and registers
  # the peer). The handshake piggybacks each side's current view hash and announce
  # watermark so member_views is seeded immediately, important after a coordinator
  # restart, where it would otherwise be empty until the next membership change.
  #
  # Unlike the view heartbeat (announce_view, which deliberately skips any node
  # in owed_snapshots: its marker rides the snapshot, after the data), the ack
  # withholds the piggyback for a discoverer we owe a full snapshot to
  # (view_hash/seq -> nil), exactly mirroring announce_view's guard. Such a
  # discoverer has no trustworthy baseline yet: handing it our post-rebalance
  # view/watermark would let it declare the barrier satisfied (and trust its
  # occupancy table) before that snapshot's data ever lands.
  # Draining: once leaving we suppress every OUTBOUND self-assertion so no peer
  # re-pairs us after we announced leaving.
  @impl true
  def handle_info({:muster_discover, _peer, _view_hash, _seq}, %State{leaving: true} = state) do
    {:noreply, state}
  end

  def handle_info({:muster_discover, peer, view_hash, seq}, %State{} = state) do
    peer_node = node(peer)

    {ack_view_hash, ack_seq} =
      if Map.has_key?(state.owed_snapshots, peer_node) or state.pending_round != nil do
        # Owed a snapshot, or mid view-change (in transition): withhold our view
        # so the discoverer does not record us as agreeing to a view whose data
        # (or ring swap) has not landed yet.
        {nil, nil}
      else
        {own_view_hash(state), state.view_seq}
      end

    state.message_module.send(
      state.scope,
      peer_node,
      {:muster_discover_ack, self(), ack_view_hash, ack_seq}
    )

    state = put_member_view(state, peer_node, view_hash, seq, peer)
    {:noreply, register_peer(state, peer)}
  end

  # A withheld piggyback (see above) carries no view/watermark: leave
  # member_views untouched rather than seed it with `nil` (which, since `nil` is
  # never "newer" than a real seq under put_member_view's guard, would silently
  # brick that source's entry until it announces again anyway -- explicit is
  # clearer than relying on that guard).
  # Draining: ignore discover-acks while leaving (outbound self-assertion; see
  # the :muster_discover gate above).
  def handle_info({:muster_discover_ack, _peer, _view_hash, _seq}, %State{leaving: true} = state) do
    {:noreply, state}
  end

  def handle_info({:muster_discover_ack, peer, nil, nil}, %State{} = state) do
    {:noreply, register_peer(state, peer)}
  end

  def handle_info({:muster_discover_ack, peer, view_hash, seq}, %State{} = state) do
    state = put_member_view(state, node(peer), view_hash, seq, peer)
    {:noreply, register_peer(state, peer)}
  end

  # Restart scope if our own node was renamed after :net_kernel.start
  # We also check state.members to be extra sure we are a singleton
  def handle_info({:nodeup, node}, state) when node == node() do
    if match?([_], state.members) do
      {:stop, {:shutdown, :node_renamed}, state}
    else
      {:noreply, state}
    end
  end

  # Draining: don't reach out to pair with a newly-up node while leaving
  # (outbound self-assertion; see the :muster_discover gate above). The
  # self-rename clause above is more specific and still matches first.
  def handle_info({:nodeup, _node}, %State{leaving: true} = state) do
    {:noreply, state}
  end

  def handle_info({:nodeup, node}, state) do
    Logger.info("Muster[#{node()}|#{state.scope}] node up: #{node}, reaching out to pair")

    :telemetry.execute([:forum, state.scope, :node, :up], %{}, %{node: node})

    state.message_module.send(state.scope, node, discover_msg(state))

    {:noreply, state}
  end

  # Net split / disconnect: wait for the peer's monitor DOWN. A non-member going
  # down (a graceful leaver we already evicted and demonitored) leaves nothing
  # urgent behind: whatever is still attributable to it is collected by the
  # periodic reap_departed_sources/1 sweep once it is out of Node.list().
  def handle_info({:nodedown, _node}, state), do: {:noreply, state}

  # A peer announced the cluster view it has finished rebalancing into, plus its
  # announce watermark. Record it as that peer's latest view (newest-seq-wins). We
  # do NOT gate on it matching our current view: storing it means an announcement
  # that arrives before we adopt that view is retained, so once we catch up the
  # agreement check in ready?/1 sees it.
  def handle_info({:rebalance_marker, source, source_pid, view_hash, seq}, %State{} = state) do
    # Emitted BEFORE the member_views/status update, so a test can park a
    # SPECIFIC source's marker (matched on source + view_hash) and hold this node
    # on a superseded view while the source races ahead. Used by
    # muster_distributed_test.exs to reproduce the stale-ready-router window.
    tp(:muster_rebalance_marker, %{
      scope: state.scope,
      node: node(),
      source: source,
      view_hash: view_hash,
      seq: seq
    })

    {:noreply, update_status(put_member_view(state, source, view_hash, seq, source_pid))}
  end

  # Peer coordinator crashed/disconnected. The pid-stamp guard (matching the
  # monitor ref we hold for this pid) rejects a stale DOWN for a pid we already
  # dropped. The actual eviction is depart_peer/3, shared with the graceful-leave
  # path.
  def handle_info({:DOWN, ref, :process, pid, _reason}, %State{} = state) do
    case Map.get(state.peers, pid) do
      ^ref ->
        state = depart_peer(state, pid, "down")
        # If we are mid-drain and this peer was one we awaited an ack from, it is
        # gone and will never ack: stop waiting on it (else drain blocks the full
        # timeout and reports a dead node as unacked).
        {:noreply, drop_drain_expectation(state, node(pid))}

      _ ->
        {:noreply, state}
    end
  end

  # A peer is leaving the cluster gracefully. We are still in its ring at this
  # instant, but we evict it before it dies so our subsequent claims/routing go to
  # the newly-elected router and our own rebalance re-announces the groups we hold
  # to that router. depart_peer/3 does the ring swap + re-announce; we ack only
  # after it returns.
  #
  # Unlike the crash path the leaver is still alive, and its shards / rebalance
  # workers dispatch by :erpc, off the coordinator-to-coordinator FIFO channel
  # this message travels on -- so writes it put on the wire before draining can
  # still land after the eviction, each one a permanent phantom fan-out target.
  # Two things close that window:
  #
  #   * `seq`, its announce watermark (the snapshot_seq stamped on every
  #     snapshot/delta of its last committed round), parked so those late writes
  #     lose to the ordinary per-source guard. See leave_watermark/3.
  #   * The periodic reap_departed_sources/1 sweep, for everything a watermark
  #     cannot stop: a claim from one of its shards carries a fresh, higher seq
  #     and writes occupancy directly. That sweep collects whatever landed once
  #     the leaver is gone from the view AND disconnected, which is also what
  #     keeps the departure watermark below from outliving its usefulness.
  #
  # We demonitor-and-flush so the leaver's eventual real :DOWN cannot re-run the
  # eviction we are about to do.
  def handle_info({:muster_leaving, peer_pid, seq}, %State{} = state) do
    case Map.get(state.peers, peer_pid) do
      nil ->
        {:noreply, state}

      ref ->
        Logger.info(
          "Muster[#{node()}|#{state.scope}] peer draining: #{node(peer_pid)}, rebalancing it out of the ring and acking"
        )

        tp(:muster_leaving_received, %{
          scope: state.scope,
          node: node(),
          peer_node: node(peer_pid)
        })

        Process.demonitor(ref, [:flush])
        state = state |> depart_peer(peer_pid, "leaving") |> leave_watermark(peer_pid, seq)

        state.message_module.send(state.scope, node(peer_pid), {:muster_leaving_ack, node()})
        {:noreply, state}
    end
  end

  # An ack from a peer that has finished rebalancing us out of its ring. Only
  # meaningful while we are the leaver (a parked caller in `leave_from`). Once
  # every pending peer has acked (or departed), we start the settle window
  # (still servicing inbound RPCs) to drain in-flight RPCs
  # peers dispatched before they rebalanced
  def handle_info({:muster_leaving_ack, peer_node}, %State{leave_from: from} = state)
      when from != nil do
    {:noreply, resolve_pending_peer(state, peer_node)}
  end

  def handle_info({:muster_leaving_ack, _peer_node}, state), do: {:noreply, state}

  # Settle window elapsed: in-flight RPCs peers dispatched before rebalancing us
  # out have had `settle_ms` to land. Reply :ok to the parked
  # drain/2 caller. The host app may now tear down its transport and halt.
  def handle_info(:leave_settle, %State{leave_from: from} = state) when from != nil do
    Logger.info(
      "Muster[#{node()}|#{state.scope}] Draining: settle window elapsed, router role fully evacuated; safe to halt"
    )

    tp(:muster_drain_settled, %{scope: state.scope, node: node()})
    GenServer.reply(from, :ok)
    {:noreply, %{state | leave_from: nil}}
  end

  def handle_info(:leave_settle, state), do: {:noreply, state}

  # Ack deadline fired while the drain caller is still parked. If every expected
  # peer has already acked (or departed), leave_pending is empty, we are in the
  # settle window, and this deadline is stale. If peers are still pending we
  # consider that it timed out.
  def handle_info(:leave_deadline, %State{leave_from: from} = state) when from != nil do
    pending_size = MapSet.size(state.leave_pending)

    if pending_size == 0 do
      # All peers acked/departed; the settle window owns the reply. Stale deadline, no-op.
      {:noreply, state}
    else
      unacked = MapSet.to_list(state.leave_pending)

      Logger.warning(
        "Muster[#{node()}|#{state.scope}] Draining: ack deadline reached, #{pending_size} " <>
          "peer(s) did not ack the handoff: #{inspect(unacked)}. Proceeding with shutdown anyway"
      )

      tp(:muster_drain_timeout, %{scope: state.scope, node: node(), unacked: unacked})
      GenServer.reply(from, {:timeout, unacked})
      {:noreply, %{state | leave_from: nil}}
    end
  end

  def handle_info(:leave_deadline, state), do: {:noreply, state}

  # Worker reported back the result of a fire-and-forget :receive_node_state
  # snapshot dispatched during a rebalance.
  #
  # On success the receiver has enqueued (and will FIFO-apply) our snapshot, and
  # the marker it carries, so we stop suppressing the view heartbeat to that node,
  # but only if this is still the round that owes it. A newer rebalance may have
  # re-owed the same router with a higher seq; clearing on a stale (lower-seq)
  # acknowledgement would let the next heartbeat send a bare marker before the
  # newer snapshot lands. The seq stamp guards against that.
  #
  # On failure we only crash (the deliberate "restart re-announces from a clean
  # slate" recovery) if router_node is still a member. This only matters for a
  # departure that races an in-flight snapshot/delta TO that same node (i.e. it
  # was still in owed_snapshots when it died); most departures have no worker
  # talking to the departed node at all and never reach this branch. But when
  # one does race: if the DOWN was already processed while this worker was in
  # flight, do_rebalance already dropped router_node from members (and pruned
  # owed_snapshots), so this is a stale, redundant signal about a departure
  # we've already handled, and crashing on it would turn that ordinary race
  # into a coordinator crash for no reason.
  def handle_info(
        {{:node_state_done, router_node, seq}, _ref, :process, _pid, exit_reason},
        state
      ) do
    case worker_result(exit_reason) do
      :ok ->
        owed =
          case Map.get(state.owed_snapshots, router_node) do
            ^seq -> Map.delete(state.owed_snapshots, router_node)
            _ -> state.owed_snapshots
          end

        {:noreply, %{state | owed_snapshots: owed}}

      other ->
        # Never crash while draining
        if router_node in state.members and not state.leaving do
          raise "Muster rebalance snapshot to #{router_node} failed: #{inspect(other)}"
        else
          Logger.info(
            "Muster[#{node()}|#{state.scope}] rebalance snapshot to #{router_node} failed: #{inspect(other)}, but it already left membership; dropping"
          )

          {:noreply, state}
        end
    end
  end

  # Worker reported back the result of a fire-and-forget `note_transition`
  # prepare RPC dispatched by begin_view_change. On :ok the old-view member has
  # recorded our transition (invalidated our member_views entry on it), so it can
  # no longer be a stale-ready router for the view we are leaving; clear it from
  # `awaiting`, and once every old-view member has acked, COMMIT (swap the ring
  # via do_rebalance). We act only on the CURRENT round (seq match): a superseded
  # round's ack is stale and dropped.
  #
  # On failure we crash (the same "restart re-announces from a clean slate"
  # recovery as a failed snapshot) only if the member is still in the target: a
  # member being dropped by this round (or one that already left, whose :DOWN
  # superseded this round to a newer seq that no longer matches here) is a stale,
  # redundant signal, not a reason to crash.
  def handle_info(
        {{:transition_done, member, seq}, _ref, :process, _pid, exit_reason},
        state
      ) do
    case state.pending_round do
      %{seq: ^seq, target: target, awaiting: awaiting} ->
        case worker_result(exit_reason) do
          :ok ->
            awaiting = MapSet.delete(awaiting, member)
            state = %{state | pending_round: %{state.pending_round | awaiting: awaiting}}

            if MapSet.size(awaiting) == 0 do
              {:noreply, commit_view_change(state)}
            else
              {:noreply, state}
            end

          other ->
            if member in target do
              raise "Muster view-change prepare to #{member} failed: #{inspect(other)}"
            else
              # Not in the target (being dropped / already leaving): don't crash,
              # and stop awaiting it so a departing old member cannot wedge the
              # round. Commit if it was the last outstanding ack.
              Logger.info(
                "Muster[#{node()}|#{state.scope}] view-change prepare to #{member} failed: #{inspect(other)}, but it is not in the target view; dropping"
              )

              awaiting = MapSet.delete(awaiting, member)
              state = %{state | pending_round: %{state.pending_round | awaiting: awaiting}}

              if MapSet.size(awaiting) == 0 do
                {:noreply, commit_view_change(state)}
              else
                {:noreply, state}
              end
            end
        end

      _ ->
        # No pending round, or a superseded (stale-seq) one: drop.
        {:noreply, state}
    end
  end

  # Periodic re-announce of our current view to every member, plus a re-discovery
  # sweep (rediscover/1) to any connected non-member. The event-driven path
  # (rebalance announcements + the discovery handshake) normally converges
  # member_views in milliseconds; this heartbeat is the backstop that heals a
  # dropped announcement (and a dropped discovery) without needing a membership
  # change, bounding both the worst-case "stuck flooding as a router" window and
  # the worst-case "restarted in place but never re-paired" window to one
  # interval. Idempotent with member_views (latest-wins) and with discovery
  # (register_peer no-ops a known peer), so a redundant heartbeat is harmless.
  # Draining: skip the whole heartbeat while leaving.
  def handle_info(:view_heartbeat, %State{leaving: true} = state) do
    {:noreply, state}
  end

  def handle_info(:view_heartbeat, state) do
    announce_view(state)
    rediscover(state)
    schedule_view_heartbeat(state)
    {:noreply, state}
  end

  # Bounded liveness backstop for a scope that really is singleton after an
  # init/restart. Before this fires we stay flood-only; if scope discovery or a
  # rebalance already expanded membership (or reached :ready) first, this is a
  # no-op.
  def handle_info(:singleton_self_promote, state) do
    should_promote? =
      state.members == [node()] and state.peers == %{} and
        :persistent_term.get({Forum.Muster, state.scope, :status}, nil) == :converging

    if should_promote? do
      {:noreply, publish_status(state, :ready)}
    else
      {:noreply, state}
    end
  end

  # Periodic GC of vacancy tombstones older than the window; see the register
  # note above upsert_if_newer/3. Reaping is the only thing that bounds the
  # tombstones' memory; correctness does not depend on it firing promptly (a
  # tombstone kept too long is merely an absent row), so a single periodic sweep
  # on the coordinator suffices.
  #
  # Piggybacked on the same tick: reap_departed_sources/1 (rows whose source has
  # left the cluster entirely) and an unconditional re-run of
  # drop_stale_router_entries, regardless of the current :status. Without the
  # latter, a claim (occupied/4, vacant_batch/4, the only cross-node writes with
  # no view_hash fencing) whose :erpc was delayed past a rebalance can land on a
  # router after it already agreed on the view that routes the group away, with
  # no row yet to judge and no further :ready transition ever coming to re-judge
  # it once the row does appear. do_rebalance's own sweep and the :ready
  # transition's (above) cover the common case promptly; this tick is the
  # backstop that bounds the worst case to one :tombstone_window_ms interval
  # even when the cluster goes quiet right after the delayed write lands.
  def handle_info(:sweep_tombstones, state) do
    reap_tombstones(state)
    state = reap_departed_sources(state)
    drop_stale_router_entries(state)
    schedule_tombstone_sweep(state)
    {:noreply, state}
  end

  # Test-only: drives the rebalance path with a synthetic members list.
  # Locally-spawned pids can't masquerade as remote peers (`node/1` returns the
  # local node), so triggering rebalance through the normal discovery path with a
  # fake remote isn't possible in single-node tests. This hook is the unlock.
  def handle_info({:__rebalance_for_test, new_members}, state) when is_list(new_members) do
    new_members_sorted = Enum.sort(new_members)
    state = do_rebalance(state, new_members_sorted)
    {:noreply, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  ## Rebalance

  # Render a membership change as a compact delta for logging. A single
  # transition can add and/or remove any number of nodes at once (recompute_members
  # rederives the whole set), so both `added` and `removed` may be non-empty. The
  # full before/after sets stay in the telemetry events; humans get signed counts
  # plus the (usually tiny) diff instead of two walls of node names.
  defp member_delta(from, to) do
    added = to -- from
    removed = from -- to

    summary =
      [added != [] && "+#{length(added)}", removed != [] && "-#{length(removed)}"]
      |> Enum.filter(& &1)
      |> case do
        [] -> "no change"
        parts -> Enum.join(parts, "/")
      end

    detail =
      [added != [] && "added #{inspect(added)}", removed != [] && "removed #{inspect(removed)}"]
      |> Enum.filter(& &1)
      |> Enum.join(", ")

    base = "#{length(to)} members (was #{length(from)}), #{summary}"
    if detail == "", do: base, else: "#{base}: #{detail}"
  end

  defp do_rebalance(state, new_members) do
    ring = ring_name(state.scope)

    Logger.info(
      "Muster[#{node()}|#{state.scope}] rebalance start: #{member_delta(state.members, new_members)} (view_hash #{Forum.Muster.view_hash_for_members(new_members)})"
    )

    tp(:muster_rebalance_start, %{
      scope: state.scope,
      node: node(),
      from: state.members,
      to: new_members,
      view_hash: Forum.Muster.view_hash_for_members(new_members)
    })

    # 1) Flip status to :rebalancing BEFORE updating the ring. Callers reading
    #    router/2 see :rebalancing and fan out to all members. member_views is NOT
    #    reset: peers' already-announced views stay and are re-evaluated against
    #    the new hash by update_status at the end.
    :persistent_term.put({Forum.Muster, state.scope, :status}, :rebalancing)

    :persistent_term.put(
      {Forum.Muster, state.scope, :view_hash},
      Forum.Muster.view_hash_for_members(new_members)
    )

    # 2) Atomically replace the node set; this bumps the ring's generation. After
    #    this call: find_node = NEW routers; find_historical_node(_, _, 1) = OLD.
    {:ok, _} = Ring.set_nodes(ring, new_members)

    # 3) Stamp the snapshot seq for this round NOW, right after the ring swap and
    #    before gathering the shards. This is a clean cut in the VM-global
    #    monotonic sequence: every group held before the rebalance carries an
    #    occupancy seq < snapshot_seq, and every claim a shard processes from here
    #    on carries seq > snapshot_seq, so the wipe below (strict `<`) can never
    #    delete a freshly-claimed group's row.
    snapshot_seq = next_seq()

    # 4) Gather every shard's held groups synchronously. In this same call each
    #    shard also normalizes its in-flight vacant batch and settles its moved
    #    :occupied_pending waiters (see Forum.Muster.Shard). Because each shard's
    #    mailbox is FIFO and the ring is already swapped, the union below is a
    #    COMPLETE held set, the basis for complete-per-router snapshots.
    #    Candidates are the groups we hold (:occupied, :cooldown, :occupied_pending):
    #    :cooldown must be included even though the Partition count is 0, because
    #    the old router still believes we hold them; :occupied_pending so parked
    #    callers get :ok once the new router has been told.
    candidates =
      state.scope
      |> Forum.Supervisor.shards()
      |> Enum.flat_map(fn shard ->
        {:held, groups} =
          GenServer.call(shard, {:rebalance, new_members}, state.rebalance_gather_timeout_ms)

        groups
      end)

    new_router =
      Map.new(candidates, fn group ->
        {:ok, n} = Ring.find_node(ring, group)
        {group, n}
      end)

    # Groups whose router actually changed, used to decide which routers need a
    # refreshed snapshot at all.
    groups_to_reannounce =
      Enum.filter(candidates, fn group ->
        {:ok, old_dest} = Ring.find_historical_node(ring, group, 1)
        Map.fetch!(new_router, group) != old_dest
      end)

    # Routers that gained at least one moved group; only these need to hear from
    # us. A router with no moved group is left untouched: its existing rows for us
    # are still correct, and any group that moved *away* is cleared by its own
    # drop_stale_router_entries (the receiver owns removes; we only ever assert
    # what we hold).
    changed_routers =
      groups_to_reannounce |> Enum.map(&Map.fetch!(new_router, &1)) |> MapSet.new()

    # Each changed router gets either a FULL snapshot or a DELTA:
    #
    #   * FULL (receive_node_state, wipe+replace) when the router's baseline is
    #     unknown: it joined THIS round (its table is empty or stale-surviving),
    #     or it has an in-flight round from us (owed_snapshots: it may not have
    #     applied the previous round, so a ring-derived diff has no trustworthy
    #     base). The wipe re-establishes a complete, correct picture.
    #
    #   * DELTA (apply_delta, add-only upsert) otherwise: the router was already
    #     a member and acked our last round, so its rows match the PREVIOUS ring
    #     generation. R holds the groups that routed to it before this round
    #     (maintained inductively: it gained them in the round they moved in, and
    #     drops what moves away via its own sweep), so we need only send what moved
    #     IN this round (groups_to_reannounce routed to R). find_historical_node(_,
    #     _, 1), the previous generation, is exactly that baseline.
    #
    # old_members is the pre-rebalance view (state.members is updated below). After
    # a Scope restart members is [node()], so every other router reads as "new" and
    # gets a FULL snapshot, so the post-crash heal stays a full re-announce.
    old_members = state.members

    full_by_router =
      candidates
      |> Enum.group_by(&Map.fetch!(new_router, &1))
      |> Map.take(MapSet.to_list(changed_routers))

    moved_by_router = Enum.group_by(groups_to_reannounce, &Map.fetch!(new_router, &1))

    targets =
      Enum.map(MapSet.to_list(changed_routers), fn router_node ->
        if router_node not in old_members or Map.has_key?(state.owed_snapshots, router_node) do
          {router_node, Map.get(full_by_router, router_node, []), :receive_node_state}
        else
          {router_node, Map.get(moved_by_router, router_node, []), :apply_delta}
        end
      end)

    full_count = Enum.count(targets, fn {_, _, fun} -> fun == :receive_node_state end)

    Logger.info(
      "Muster[#{node()}|#{state.scope}] rebalance: #{length(candidates)} group(s) held, #{length(groups_to_reannounce)} moved, notifying #{length(targets)} router(s) (#{full_count} full): #{inspect(MapSet.to_list(changed_routers))}"
    )

    # Local self-target: synchronous (seq-guarded) ETS inserts (a full local
    # target's stale rows are reaped by drop_stale_router_entries below, exactly
    # like a delta's, so the local path never needs the wipe). Remote targets: one
    # fire-and-forget worker per destination. We do NOT wait: Scope stays free
    # while the RPCs are in flight; each worker reports via a tagged DOWN
    # ({:node_state_done, ...}); a failure crashes us from that handler.
    {local_targets, remote_targets} =
      Enum.split_with(targets, fn {dest, _, _} -> dest == node() end)

    Enum.each(local_targets, fn {_, groups, _} ->
      Enum.each(groups, fn group ->
        upsert_if_newer(state.occupancy_table, {group, node()}, snapshot_seq, self())
      end)
    end)

    view_hash = Forum.Muster.view_hash_for_members(new_members)

    Enum.each(remote_targets, fn {router_node, groups, function} ->
      spawn_rpc_worker(
        state,
        router_node,
        function,
        [state.scope, node(), groups, view_hash, snapshot_seq, self()],
        {:node_state_done, router_node, snapshot_seq}
      )
    end)

    snapshot_targets = Enum.map(remote_targets, fn {router_node, _, _} -> router_node end)

    owed_snapshots =
      Enum.reduce(snapshot_targets, state.owed_snapshots, fn router_node, acc ->
        Map.put(acc, router_node, snapshot_seq)
      end)

    # Marker hybrid: members that received a data snapshot are marked by the
    # snapshot itself (its {:apply_snapshot} carries view_hash and is folded into
    # member_views when applied, after the data write). Every other member gets a
    # cheap async marker so its barrier learns "this source holds nothing for me"
    # rather than "this source has not arrived yet". Self never needs one.
    #
    # Excluding only THIS round's snapshot_targets is not enough: a member still
    # owed a PREVIOUS round's un-acked snapshot (its routed groups did not move
    # again this round, so it is not a snapshot_target now either) would
    # otherwise get a bare marker for the new view and could count us as agreed
    # before the old round's data lands. So we also exclude every node still in
    # owed_snapshots (this round's plus any carried over): its marker keeps
    # riding its eventual snapshot, and the heartbeat (announce_view) resumes
    # covering it once that snapshot is acked.
    Enum.each(new_members -- [node() | Map.keys(owed_snapshots)], fn member ->
      state.message_module.send(
        state.scope,
        member,
        {:rebalance_marker, node(), self(), view_hash, snapshot_seq}
      )
    end)

    # Adopt the new view (and this round's announce watermark) before judging
    # stale entries. Prune owed entries for nodes no longer in the cluster.
    state = %{
      state
      | members: new_members,
        view_seq: snapshot_seq,
        owed_snapshots: Map.take(owed_snapshots, new_members),
        # This IS the commit of any in-flight prepare round; clearing it lets
        # update_status below resume publishing :ready/:converging.
        pending_round: nil
    }

    drop_stale_router_entries(state)

    # Leave :rebalancing for :ready or :converging based on peer agreement. A
    # single-node cluster lands on :ready immediately; a multi-node cluster stays
    # :converging until peer announcements arrive. If a snapshot RPC ultimately
    # fails it crashes us from :node_state_done and the restart re-announces every
    # locally-held group from the partition tables, so the optimistic settle that
    # each shard already did self-heals.
    update_status(state)
  end

  # Recompute the lifecycle status from member_views vs. current membership and
  # publish it (only when it actually changes). Only ever sets :ready or
  # :converging; :rebalancing is owned by do_rebalance and by an in-flight
  # prepare round.
  #
  # While a prepare round is in flight (pending_round != nil) we have NOT yet
  # swapped the ring: our committed view is still the old one and we must keep
  # flooding (:rebalancing), so an incoming marker that would otherwise recompute
  # us to :ready for the stale view must not. Hold the status until commit.
  defp update_status(%{pending_round: pr} = state) when pr != nil, do: state

  # Draining: we published :rebalancing at drain start and stay there until we
  # exit (see handle_call({:drain, ...})). A marker or snapshot from a peer must
  # not recompute us back to :ready for a table we no longer own.
  defp update_status(%State{leaving: true} = state), do: state

  defp update_status(state) do
    status = if ready?(state), do: :ready, else: :converging

    publish_status(state, status)
  end

  defp publish_status(state, status) do
    key = {Forum.Muster, state.scope, :status}
    previous = :persistent_term.get(key, nil)

    if previous != status do
      :persistent_term.put(key, status)

      tp(:muster_status_change, %{
        scope: state.scope,
        node: node(),
        from: previous,
        to: status,
        members: state.members,
        view_hash: own_view_hash(state)
      })

      Logger.info(
        "Muster[#{node()}|#{state.scope}] status #{inspect(previous)} -> #{inspect(status)} (members #{inspect(state.members)})"
      )

      # Most stale rows cannot be GC'd during the rebalance itself: peers have
      # typically not yet announced the new view, so the source-agreement guard in
      # drop_stale_router_entries skips their rows. Re-run the sweep once every
      # member has agreed; now every member's rows are judgeable. This is an
      # additional, prompt sweep on top of the periodic one piggybacked on
      # :sweep_tombstones (below); it catches the common case immediately
      # instead of waiting for the next tick.
      if status == :ready, do: drop_stale_router_entries(state)
    end

    state
  end

  # Ready once every member (other than ourselves) has announced a view that
  # agrees with ours. A member with no entry yet, or one whose latest view
  # differs, keeps us not-ready: the safe direction (the router floods).
  defp ready?(state) do
    own = own_view_hash(state)

    Enum.all?(state.members, fn member ->
      member == node() or match?({^own, _, _}, Map.get(state.member_views, member))
    end)
  end

  defp own_view_hash(state), do: Forum.Muster.view_hash_for_members(state.members)

  # Newest-seq-wins: seqs are per-source monotonic dispatch stamps, so the entry
  # with the highest seq is the source's causally-latest announcement even when
  # markers arrive out of order (they travel both as async dist sends and inside
  # :receive_node_state RPCs). `writer` (see the occupancy table note above
  # upsert_if_newer/4) is stored alongside the view/seq so
  # handle_info({:DOWN, ...}) can tell whether THIS entry is attributable to a
  # dying pid, independent of whether that pid is (still, or yet) in `peers`.
  defp put_member_view(state, source, view_hash, seq, writer) do
    case Map.get(state.member_views, source) do
      {_hash, newer, _writer} when newer > seq ->
        state

      _ ->
        %{state | member_views: Map.put(state.member_views, source, {view_hash, seq, writer})}
    end
  end

  # GC of router-role occupancy rows for groups that no longer route to us.
  #
  # A row may only be judged under our ring if its source demonstrably shares the
  # view the ring implements; otherwise dropping it can lose data. The source's
  # announced view (member_views) must equal ours, and the row's seq must not
  # exceed the watermark carried by that announcement (occupied/4 and
  # vacant_batch/4 write this table straight from their :erpc workers and never
  # touch member_views, so the table can be AHEAD of member_views). Those same
  # concurrent writers are also why the write below is seq-guarded rather than
  # by key alone (see the note at the select_replace). Skipped rows are harmless
  # and are re-judged on the :ready transition and, as a backstop, on every
  # :sweep_tombstones tick (see handle_info(:sweep_tombstones, _) above);
  # together these also cover a row that does not exist yet at either point and
  # only appears afterwards (a claim delayed by :erpc past both). Our own rows
  # are always judgeable and must stay in the sweep: a group that moved away (or
  # was vacated while routed elsewhere) leaves a self row nothing else cleans up.
  #
  # TOMBSTONE, do not hard-delete: a stale row is downgraded to a tombstone at
  # its EXISTING seq (see the register note above upsert_if_newer/3) rather than
  # removed outright. A hard delete discards the seq watermark, and a per-key
  # RPC carries no view fencing (occupied/4, vacant_batch/4 take no view_hash),
  # so a claim dispatched before this group's router last flapped away from us
  # and delivered only after it flapped back would otherwise have nothing to
  # lose against and resurrect the row via insert_new, permanently, since a
  # row currently routed TO us is never judged stale again. Only a :present row
  # is downgraded (the `meta == :present` guard on the match head below); a row
  # already a tombstone is left completely untouched, on purpose, even though it
  # is just as "routed away" as a :present one; touching it would refresh its
  # `created_at` on every tick and starve reap_tombstones/1 forever, since this
  # sweep and the reap both run on the same :sweep_tombstones tick (reap first,
  # then this). Skipping already-tombstoned rows means each row is downgraded at
  # most once, so it ages out on the same bounded schedule as any other
  # tombstone.
  defp drop_stale_router_entries(state) do
    ring = ring_name(state.scope)
    own = own_view_hash(state)
    created_at = System.monotonic_time(:millisecond)

    state.occupancy_table
    |> :ets.select([
      {{{:"$1", :"$2"}, :"$3", :"$4", :"$5"}, [], [{{:"$1", :"$2", :"$3", :"$4", :"$5"}}]}
    ])
    |> Enum.each(fn {group, n, row_seq, meta, writer} ->
      # Agreement first: it is a map lookup, and at rebalance time most sources
      # have not announced the new view yet, so their rows are skipped without
      # paying for the ring lookup.
      if meta == :present and source_agrees?(state, n, row_seq, own) and
           router_under_ring(ring, group) != node() do
        # Emitted BEFORE the write below and never parked, so a test can
        # detect that the sweep has judged this row while holding the write
        # itself parked (a force_ordering-delayed event stays invisible to the
        # trace collector until released).
        tp(:muster_drop_stale_judged, %{
          scope: state.scope,
          node: node(),
          group: group,
          source: n,
          seq: row_seq
        })

        # SEQ-GUARDED tombstone: only downgrade the row if it still carries the
        # exact seq (and is still :present) as judged. occupied/4 writes this
        # table from :erpc workers, concurrently with this sweep, so between the
        # :ets.select above and this write the source may have legitimately
        # re-claimed the group under a newer view (raising the key via
        # upsert_if_newer): a key-only write here would destroy that fresh row,
        # and nothing would ever re-send it (the source got its :ok; deltas
        # carry moved groups only). A raised row makes this a no-op; if it is
        # still stale it is re-judged (under the watermark of the source's newer
        # announcement) on a later sweep. Wrapped in a span so a test can park
        # the sweep between judgment and write (force_ordering on :start),
        # exactly that window.
        tombstoned =
          tp_span(:muster_drop_stale_apply, %{
            scope: state.scope,
            node: node(),
            group: group,
            source: n,
            seq: row_seq
          }) do
            :ets.select_replace(state.occupancy_table, [
              {{{group, n}, row_seq, :present, writer}, [],
               [{{{:const, {group, n}}, row_seq, created_at, writer}}]}
            ])
          end

        # Emitted AFTER an actual tombstone write, so a block_until on this
        # event implies the row now reads as absent (occupancy/2 filters to
        # :present only), not that it was physically removed.
        if tombstoned == 1 do
          tp(:muster_drop_stale_entry, %{
            scope: state.scope,
            node: node(),
            group: group,
            source: n
          })
        end
      end
    end)
  end

  defp router_under_ring(ring, group) do
    {:ok, n} = Ring.find_node(ring, group)
    n
  end

  defp source_agrees?(_state, source, _row_seq, _own) when source == node(), do: true

  defp source_agrees?(state, source, row_seq, own) do
    case Map.get(state.member_views, source) do
      {^own, watermark, _writer} -> row_seq <= watermark
      _ -> false
    end
  end

  ## Peer/membership

  defp register_peer(state, peer) when is_pid(peer) do
    cond do
      node(peer) == node() ->
        # Ignore self-discovery (loopback from our own broadcast).
        state

      Map.has_key?(state.peers, peer) ->
        state

      true ->
        ref = Process.monitor(peer)

        tp(:muster_peer_registered, %{
          scope: state.scope,
          node: node(),
          peer: node(peer)
        })

        peers = Map.put(state.peers, peer, ref)
        recompute_members(%{state | peers: peers})
    end
  end

  # A peer we were awaiting a drain handoff-ack from died before it could ack.
  # depart_peer/3 has already evicted it and re-elected routers for whatever it
  # held, so there is nothing left to hand off to it: resolve it out of the pending
  # set instead of blocking until the ack deadline fires.
  defp drop_drain_expectation(%State{leave_from: from} = state, dead_node) when from != nil do
    if MapSet.member?(state.leave_pending, dead_node) do
      Logger.info(
        "Muster[#{node()}|#{state.scope}] Draining: expected peer #{inspect(dead_node)} died " <>
          "before acking the handoff. Dropping it from the wait"
      )

      tp(:muster_drain_peer_lost, %{scope: state.scope, node: node(), peer_node: dead_node})
    end

    resolve_pending_peer(state, dead_node)
  end

  defp drop_drain_expectation(state, _dead_node), do: state

  # A peer we were waiting on has resolved as it has acked the handoff or it has departed
  # the cluster. Remove it from the pending set and if that empties the set open
  # the settle window.
  defp resolve_pending_peer(%State{leave_from: from} = state, peer_node) when from != nil do
    if MapSet.member?(state.leave_pending, peer_node) do
      pending = MapSet.delete(state.leave_pending, peer_node)
      state = %{state | leave_pending: pending}
      if MapSet.size(pending) == 0, do: open_settle(state), else: state
    else
      state
    end
  end

  defp resolve_pending_peer(state, _peer_node), do: state

  # Every peer acked or departed: start the settle window (still servicing inbound
  # RPCs) so in-flight RPCs peers dispatched before rebalancing us out can land,
  # then :leave_settle replies to the parked drain/2 caller.
  defp open_settle(%State{} = state) do
    Logger.info(
      "Muster[#{node()}|#{state.scope}] Draining: all peers acked or departed; " <>
        "settling for #{state.settle_ms}ms before shutdown"
    )

    tp(:muster_drain_acked, %{scope: state.scope, node: node()})
    Process.send_after(self(), :leave_settle, state.settle_ms)
    state
  end

  # Evict a peer (crash via :DOWN, or graceful :muster_leaving): drop occupancy
  # entries, member_views and applied_snapshot_seq entries attributable to this
  # pid, then rebalance.
  #
  # Occupancy rows / member_views / applied_snapshot_seq entries are written
  # from two independent, unordered channels: the peer-registration messages
  # (discover/discover_ack/rebalance_marker, which carry the writer's pid) and
  # the data RPCs (occupied/4, vacant_batch/4, receive_node_state/5,
  # apply_delta/5, which carry it too). A peer that restarts in place can have
  # its fresh data (a snapshot applied via receive_node_state/5) land and get
  # written under the new pid before this runs for the old pid's DOWN, with no
  # discover/ack from the new incarnation processed yet: register_peer/peers has
  # no idea a newer incarnation exists. Wiping by node alone (or by "is some
  # other peer currently registered", which only watches the registration
  # channel) would destroy that already-applied, already-correct data
  # permanently: membership does not change (nothing new got registered), so
  # recompute_members is a no-op and nothing ever re-announces to repair it.
  #
  # Wipe only the entries actually attributable to this pid. Each of
  # occupancy / member_views / applied_snapshot_seq carries the writer pid
  # that produced it, independent of whatever `peers` currently holds. A row
  # written by any other pid was necessarily written by a different
  # incarnation (only one Scope can be live per node at a time) and is left
  # alone, regardless of whether that incarnation has been registered as a
  # peer yet.
  defp depart_peer(%State{} = state, pid, why) do
    peer_node = node(pid)
    new_peers = Map.delete(state.peers, pid)

    Logger.info(
      "Muster[#{node()}|#{state.scope}] peer #{why}: #{peer_node}, dropping occupancy/view data attributable to this incarnation and rebalancing"
    )

    state =
      tp_span(:muster_peer_down_apply, %{
        scope: state.scope,
        node: node(),
        peer_node: peer_node
      }) do
        :ets.match_delete(state.occupancy_table, {{:_, peer_node}, :_, :_, pid})
        :telemetry.execute([:forum, state.scope, :node, :down], %{}, %{node: peer_node})

        member_views =
          case Map.get(state.member_views, peer_node) do
            {_view_hash, _seq, ^pid} -> Map.delete(state.member_views, peer_node)
            _ -> state.member_views
          end

        applied_snapshot_seq =
          case Map.get(state.applied_snapshot_seq, peer_node) do
            {_seq, ^pid} -> Map.delete(state.applied_snapshot_seq, peer_node)
            _ -> state.applied_snapshot_seq
          end

        %{
          state
          | member_views: member_views,
            applied_snapshot_seq: applied_snapshot_seq,
            peers: new_peers
        }
      end

    # A leaver has already handed off its router role
    if state.leaving, do: state, else: recompute_members(state)
  end

  # Graceful-leave only: re-arm the per-source snapshot guard that depart_peer/3
  # just cleared, at the leaver's announce watermark (`seq`, its last committed
  # round's snapshot_seq). Unlike a crashed peer, a drained one is still alive,
  # and a snapshot/delta its workers dispatched before draining can land
  # after the eviction; with the guard cleared it would re-insert the leaver's
  # rows and member_views entry. Any such write carries at most `seq`, so it
  # loses to the `seq <= applied` check. reap_departed_sources/1 collects the
  # watermark once the leaver is dead.
  defp leave_watermark(%State{} = state, peer_pid, seq) do
    applied = Map.put(state.applied_snapshot_seq, node(peer_pid), {seq, peer_pid})
    %{state | applied_snapshot_seq: applied}
  end

  defp recompute_members(state) do
    new_members =
      [node() | Enum.map(Map.keys(state.peers), &node/1)]
      |> Enum.uniq()
      |> Enum.sort()

    cond do
      new_members == state.members ->
        # No committed-view change. If a prepare round was in flight (its growth
        # peer left before we committed), cancel it and return to the committed
        # view.
        if state.pending_round == nil do
          state
        else
          cancel_view_change(state)
        end

      # Growth (or a mixed change that adds a node): prepare-gate the ring swap.
      Enum.any?(new_members, fn n -> n not in state.members end) ->
        begin_view_change(state, new_members)

      # Pure shrink (a node left): commit immediately. The departed node's
      # member_views entry was wiped in the :DOWN handler, which un-readies us for
      # any view still containing it, so a shrink can never leave us a stale-ready
      # router; only growth can, and only growth needs the prepare.
      true ->
        do_rebalance(state, new_members)
    end
  end

  # Phase 1: announce our move to `target` to every OLD-view member (the
  # only possible stale routers for this transition) and await their acks before
  # committing. Flip to :rebalancing (so we flood as sender and router meanwhile)
  # and bump :view_hash, but do NOT swap the ring: joins keep routing under the
  # old committed view (which is safe -- they claim at the old routers). Each
  # `note_transition` RPC INVALIDATES our member_views entry on the recipient at
  # this round's seq, so a stale asserting marker cannot un-invalidate it, and the
  # recipient drops out of :ready for the old view immediately. Also starts (or
  # SUPERSEDES, with a fresh seq) the pending round; stale-seq acks are ignored.
  # An empty audience (we were singleton) commits at once.
  defp begin_view_change(state, target) do
    round_seq = next_seq()
    :persistent_term.put({Forum.Muster, state.scope, :status}, :rebalancing)

    :persistent_term.put(
      {Forum.Muster, state.scope, :view_hash},
      Forum.Muster.view_hash_for_members(target)
    )

    # Old-view members still connected. A member that has already dropped off
    # distribution (a departing node) is excluded: it can no longer be a stale
    # router, and awaiting its ack would wedge the round. Its own :DOWN drives the
    # shrink separately.
    audience = Enum.filter(state.members -- [node()], &(&1 in Node.list()))

    Logger.info(
      "Muster[#{node()}|#{state.scope}] view-change prepare: #{member_delta(state.members, target)}, preparing #{inspect(audience)}"
    )

    tp(:muster_view_prepare, %{
      scope: state.scope,
      node: node(),
      from: state.members,
      target: target,
      audience: audience,
      seq: round_seq
    })

    Enum.each(audience, fn member ->
      spawn_rpc_worker(
        state,
        member,
        :note_transition,
        [state.scope, node(), round_seq, self()],
        {:transition_done, member, round_seq}
      )
    end)

    state = %{
      state
      | pending_round: %{target: target, awaiting: MapSet.new(audience), seq: round_seq}
    }

    if audience == [] do
      commit_view_change(state)
    else
      state
    end
  end

  # Phase 2: every old-view member acked -> commit. do_rebalance swaps the
  # ring, gathers the shards, re-announces held groups to the new routers, and
  # recomputes :status. It also clears pending_round (below), so update_status
  # resumes publishing :ready/:converging.
  defp commit_view_change(%{pending_round: %{target: target}} = state) do
    do_rebalance(state, target)
  end

  # Cancel an in-flight prepare round whose growth peer left before we committed:
  # membership is back to our committed view, so restore the published view_hash
  # and drop the round. But the round's `note_transition` RPCs already INVALIDATED
  # our member_views entry on each old-view member (stamped at the round's seq,
  # which is ABOVE our committed view_seq). Those members are now flooding for us
  # and will NOT re-agree off a bare heartbeat marker: it carries the old, lower
  # view_seq, so their newest-seq-wins guard keeps the invalidation. Left alone
  # they stay :converging until our next COMMITTED rebalance advances view_seq --
  # which in a now-stable cluster may never happen. So bump view_seq past the
  # round's seq (next_seq is monotonic, so this out-ranks the invalidation) and
  # PROACTIVELY re-announce our unchanged view, re-establishing agreement at once.
  defp cancel_view_change(%{pending_round: %{target: target, seq: round_seq}} = state) do
    Logger.info(
      "Muster[#{node()}|#{state.scope}] view-change cancelled: #{inspect(target)} superseded back to committed #{inspect(state.members)}"
    )

    tp(:muster_view_cancel, %{
      scope: state.scope,
      node: node(),
      target: target,
      members: state.members,
      round_seq: round_seq
    })

    :persistent_term.put({Forum.Muster, state.scope, :view_hash}, own_view_hash(state))
    state = update_status(%{state | pending_round: nil, view_seq: next_seq()})
    announce_view(state)
    state
  end

  ## Init / introspection helpers

  # At init, members is just [node()], so the router for every group is ourselves.
  # Walk the partitions (which may have entries left over from a previous
  # incarnation) and insert their self occupancy rows. The per-group state machine
  # is rebuilt independently by each shard.
  defp reannounce_local_groups_at_init(state) do
    Enum.each(local_groups(state), fn group ->
      upsert_if_newer(state.occupancy_table, {group, node()}, next_seq(), self())
    end)

    state
  end

  defp local_groups(state) do
    Forum.Muster.Shard.groups(state.scope)
  end

  # Fold every shard's per-group state into one map for :status / :dump. A shard
  # that is momentarily down (mid-restart) is skipped rather than crashing this
  # introspection call: the groups it owns simply read as absent until it is
  # back. (do_rebalance's gather is deliberately NOT tolerant: a shard down
  # mid-rebalance should crash us so the restart re-announces from a clean slate.)
  defp gather_group_states(scope) do
    scope
    |> Forum.Supervisor.shards()
    |> Enum.reduce(%{}, fn shard, acc ->
      try do
        Map.merge(acc, GenServer.call(shard, :group_states))
      catch
        :exit, _ -> acc
      end
    end)
  end

  ## View announce / RPC workers

  defp discover_msg(state) do
    {:muster_discover, self(), own_view_hash(state), state.view_seq}
  end

  # Periodic re-discovery backstop. The one-shot :muster_discover broadcast in
  # handle_continue(:discover) is the ONLY thing that re-pairs a coordinator that
  # restarted IN PLACE: its dist connection never dropped, so no :nodeup re-fires,
  # and every peer dropped it on its old pid's :DOWN, so peers won't reach back
  # out either. If that lone announcement is lost (a peer mid-restart hadn't
  # re-subscribed yet, or a transient transport drop), nothing else heals the
  # edge: announce_view only ever talks to nodes already in `members`. So on each
  # heartbeat we re-offer discovery to every connected node that is not yet a
  # member, bounding worst-case stranding to one heartbeat interval.
  #
  # Heals symmetrically: re-pairs a peer that missed OUR announcement, and, when
  # WE are the stranded island (members == [node()] after our own restart),
  # re-offers us to everyone connected. Idempotent: an already-paired node is a
  # member and excluded here, and register_peer no-ops a duplicate pid anyway. A
  # connected node not running this scope has no subscriber and ignores it. Like
  # announce_view this is local work + fire-and-forget sends only, so the Scope
  # loop never blocks.
  defp rediscover(state) do
    case Node.list() -- state.members do
      [] ->
        :ok

      unpaired ->
        msg = discover_msg(state)

        Enum.each(unpaired, fn target ->
          state.message_module.send(state.scope, target, msg)
          tp(:muster_rediscover, %{scope: state.scope, node: node(), target: target})
        end)

        :ok
    end
  end

  # Re-announce our current view to every other member (newest-seq-wins on their
  # side). Members we still owe a rebalance snapshot are skipped: their marker is
  # carried by the in-flight snapshot, after its data is applied.
  defp announce_view(state) do
    # While a prepare round is in flight we are in transition and must assert
    # NOTHING: our committed view is the old one, and a bare marker asserting it
    # would re-create the very staleness the prepare is invalidating on our
    # old-view members (it would out-seq the invalidation). The round's own RPCs
    # carry the transition; a lost one fails the worker and crashes us. So skip.
    if state.pending_round != nil do
      :ok
    else
      view_hash = own_view_hash(state)

      Enum.each(state.members, fn member ->
        if member != node() and not Map.has_key?(state.owed_snapshots, member) do
          state.message_module.send(
            state.scope,
            member,
            {:rebalance_marker, node(), self(), view_hash, state.view_seq}
          )
        end
      end)

      :ok
    end
  end

  defp schedule_view_heartbeat(state) do
    Process.send_after(self(), :view_heartbeat, state.view_heartbeat_interval_ms)
    :ok
  end

  defp schedule_singleton_promotion(state) do
    Process.send_after(self(), :singleton_self_promote, state.singleton_promotion_timeout_ms)
    :ok
  end

  defp schedule_tombstone_sweep(state) do
    Process.send_after(self(), :sweep_tombstones, state.tombstone_window_ms)
    :ok
  end

  # Delete tombstones older than the window. Tombstone rows carry an integer
  # created_at (router-local monotonic ms) in the meta slot; :present rows carry
  # the :present atom, so `is_integer` cleanly selects only tombstones. A reaped
  # tombstone is at most window + sweep-interval old; both equal tombstone_window_ms.
  defp reap_tombstones(state) do
    cutoff = System.monotonic_time(:millisecond) - state.tombstone_window_ms

    :ets.select_delete(state.occupancy_table, [
      {{:_, :_, :"$1", :_}, [{:is_integer, :"$1"}, {:<, :"$1", cutoff}], [true]}
    ])
  end

  # Periodic GC of per-source state whose source has left the cluster: rows,
  # member_views and applied_snapshot_seq are all keyed by source.
  #
  # The occupancy table outlives a coordinator restart (Forum.Supervisor owns
  # it), so a Scope crash between a departure and its targeted cleanup strands
  # rows no other path can judge: drop_stale_router_entries/1 skips any row whose
  # source has not announced our view, and reap_tombstones/1 only reaps
  # tombstones. This sweep is the stateless, repeating backstop. It reaps a source only once it is both out
  # of our view and disconnected: a still-connected non-member is mid-join and
  # writes here legitimately, and a still-member is depart_peer/3's job.
  defp reap_departed_sources(%State{} = state) do
    keep = MapSet.new([node() | Node.list()] ++ state.members)

    departed =
      state.occupancy_table
      |> :ets.select([{{{:_, :"$1"}, :_, :_, :_}, [], [:"$1"]}])
      |> MapSet.new()
      |> MapSet.union(MapSet.new(Map.keys(state.member_views)))
      |> MapSet.union(MapSet.new(Map.keys(state.applied_snapshot_seq)))
      |> MapSet.difference(keep)

    Enum.reduce(departed, state, fn source, state ->
      rows =
        :ets.select_delete(state.occupancy_table, [{{{:_, source}, :_, :_, :_}, [], [true]}])

      Logger.info(
        "Muster[#{node()}|#{state.scope}] reaped #{rows} occupancy row(s) and any view/watermark " <>
          "state for departed source #{source}"
      )

      tp(:muster_departed_source_reaped, %{
        scope: state.scope,
        node: node(),
        source: source,
        rows: rows
      })

      %{
        state
        | member_views: Map.delete(state.member_views, source),
          applied_snapshot_seq: Map.delete(state.applied_snapshot_seq, source)
      }
    end)
  end

  # Tombstone retention window: a multiple of the RPC timeout, the practical upper
  # bound on how late an orphaned, un-cancelled :occupied/snapshot RPC can land.
  defp default_singleton_promotion_timeout(view_heartbeat_interval_ms)
       when is_integer(view_heartbeat_interval_ms) do
    view_heartbeat_interval_ms * @singleton_promotion_timeout_multiplier
  end

  defp default_singleton_promotion_timeout(_),
    do: @default_view_heartbeat_interval_ms * @singleton_promotion_timeout_multiplier

  defp default_tombstone_window(rpc_timeout_ms) when is_integer(rpc_timeout_ms),
    do: rpc_timeout_ms * @tombstone_window_multiplier

  defp default_tombstone_window(_), do: @default_rpc_timeout_ms * @tombstone_window_multiplier

  # spawn_opt with monitor + tag gives us atomic spawn+monitor and uses the
  # worker's exit reason as the result channel, so any termination surfaces as a
  # single tagged DOWN message. Used here only for the rebalance snapshot RPC
  # (receive_node_state); shards dispatch occupied/vacant_batch.
  defp spawn_rpc_worker(state, router_node, function, args, tag) do
    message_module = state.message_module
    scope = state.scope
    rpc_timeout = state.rpc_timeout_ms
    self_node = node()

    {_pid, _ref} =
      :erlang.spawn_opt(
        fn ->
          # Fires before the RPC is dispatched, so a test can force_ordering a
          # delay here to model snapshot-RPC latency without blocking the
          # coordinator (this is a throwaway worker process, not the coordinator
          # itself).
          tp(:muster_rpc_worker_start, %{
            scope: scope,
            node: self_node,
            router: router_node,
            function: function
          })

          result =
            try do
              message_module.call(scope, router_node, __MODULE__, function, args, rpc_timeout)
            catch
              kind, reason -> {:error, {kind, reason}}
            end

          tp(:muster_rpc_worker_result, %{
            scope: scope,
            node: self_node,
            router: router_node,
            function: function,
            ok?: result == :ok
          })

          exit({:rpc_result, result})
        end,
        [{:monitor, [{:tag, tag}]}]
      )

    :ok
  end

  defp worker_result({:rpc_result, r}), do: r
  defp worker_result(:noproc), do: {:error, :worker_noproc}
  defp worker_result(other), do: {:error, {:worker_exit, other}}

  # Per-source monotonic occupancy stamp. VM-global and strictly increasing.
  defp next_seq, do: :erlang.unique_integer([:monotonic])

  ## Names

  defp ring_name(scope), do: :"#{scope}_muster_ring"
end
