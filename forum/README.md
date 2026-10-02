# Forum

Forum is a scalable, distributed process-group library for Elixir/OTP. It ships two primitives that share the same supervision and partition machinery but solve different problems:

* **`Forum.Census`**: eventually-consistent counting of group membership across the cluster. Use it when you need to know "how many processes are in group X right now" without paying per-join/leave network traffic.
* **`Forum.Muster`**: precise routing for fan-out broadcast. For every group it tracks which nodes hold local members and names the single **router** node to route through, so you can send a message to every process in a group, anywhere in the cluster, without blindly broadcasting to nodes that don't care. Muster owns the routing decision; you supply the transport.

Both share the same per-node fundamentals:

* Process pids never leave the node they live on.
* Group membership is partitioned locally for concurrency (one GenServer per scheduler by default: a `Forum.Partition` for Census, a `Forum.Muster.Shard` for Muster).
* A cluster forms by all nodes starting the same scope name; nodes discover each other via Erlang distribution.

## Installation

```elixir
def deps do
  [
    {:forum, "~> 1.0"}
  ]
end
```

---

## `Forum.Census`: distributed counts

Each node holds local-only membership and broadcasts its per-group counts to every peer on a fixed interval (default 5 s). Reads aggregate the local count plus the most recent counts received from peers. The view is **eventually consistent** (a join is reflected on remote nodes after at most one broadcast interval), but the cost on the wire is constant in the number of joins/leaves, not proportional.

Start it under your supervision tree:

```elixir
children = [
  {Forum.Census, [:users, partitions: 8, broadcast_interval_in_ms: 5_000]}
]
```

Use it:

```elixir
iex> Forum.Census.join(:users, {:tenant, 123}, self())
:ok
iex> Forum.Census.local_member_count(:users, {:tenant, 123})
1
iex> Forum.Census.member_count(:users, {:tenant, 123})        # cluster-wide
3
iex> Forum.Census.member_counts(:users)
%{{:tenant, 123} => 3, {:tenant, 456} => 1}
```

When to use Census: you want counts, totals, presence-of-anyone signals, dashboards. You don't need millisecond precision and you don't want to fan out per-event traffic.

Peers find each other with a discovery handshake and monitor each other's Scope process. Counts are only recorded from a **registered** peer. This matters because the count broadcast and process monitoring can travel over independent transports (e.g. a `:gen_rpc`-backed `:message_module` for broadcasts while monitoring rides Erlang distribution), so a peer's `:sync` and its `:DOWN` are unordered: a `:sync` that arrives after the `:DOWN` was already handled would otherwise re-insert a ghost entry that nothing would ever clean up. Dropping counts from unregistered peers closes that window; to keep registration self-healing (so a dropped or reordered discovery doesn't strand a peer's counts permanently), every node re-announces itself to the cluster every `discover_interval_in_ms` (default 60 s), well above the count broadcast interval since it only heals the rare missed-registration case.

---

## `Forum.Muster`: group-routed fan-out broadcast

Muster answers a different question: *given a group, which nodes have at least one local member of it?* It uses that to route a broadcast precisely, without blasting every node in the cluster.

### The router node

For each group, exactly one node in the Muster cluster is the **router** node, chosen by **consistent hashing** over the sorted member list (via [`ex_hash_ring`](https://hexdocs.pm/ex_hash_ring), 128 vnodes per node by default). Every node computes the same router independently from the same ring; the member list is the only input, so no consensus is needed. Consistent hashing matters at rebalance time: when a node joins or leaves a cluster of size *N*, only ~1/*N* of the groups change their router, rather than nearly all of them.

The router node owns the authoritative "which nodes hold this group" set. When the first local member of a group joins on node A, A sends a synchronous `:occupied` notification to the router node. When the last local member leaves (after a cooldown, see below), A queues the group and a periodic flush sends a batched `:vacant_batch` to the router. The router keeps a table keyed by `{group, node}`: the set of nodes a broadcast for that group must reach.

To broadcast, a caller asks `router/2` for the group's router node and routes the message there over its own transport; the router then fans out to the member nodes. While the cluster view is in flux, `router/2` returns `{:rebalancing, members}` and the caller fans out to every member instead. Right after a coordinator init/restart, the scope also stays flood-only until either discovery/rebalance converges or a bounded singleton-promotion timeout fires: the temporary local `[node()]` ring view is a reset state, not proof the scope is truly singleton.

### Coordinator and claim shards

Each Muster scope runs **two kinds of process per node**, both started under the scope's supervisor:

* One **coordinator** (`Forum.Muster.Scope`): the per-node cluster brain. It owns the ring's node set, cluster membership and peer monitors, the readiness barrier (`member_views`), snapshot apply, and rebalance orchestration. It is the **sole writer** of the `:status`/`:view_hash` persistent_terms that `router/2` and `can_decide?/2` read, which is why partitioning the claim path cannot weaken those guarantees.
* **N claim shards** (`Forum.Muster.Shard`, one per partition index, default = schedulers online): each owns, for the slice of groups hashing to it via `:erlang.phash2(group, N)`, **both** the local **membership** (which pids belong to each group, and the `Process.monitor` that fires when a member dies) **and** the per-group claim state machine (the "have I told the router?" question, cooldown, vacant flush). The shard absorbs the membership job and skips Census's O(1) **counts** table: the claim FSM only needs "is there ≥1 member" and "did this removal hit 0", both derived on demand from the entries table (an `:ordered_set`, so a group's members are contiguous and those checks are bounded prefix scans). A `join/3` is therefore a **single** `GenServer.call` to the group's shard (claim + register in one handler, no second hop to a membership process), and the member monitor lives in the same process as the claim state, so the last member leaving drives the cooldown transition **directly**. A storm of distinct-group first-joins still spreads across N mailboxes. Each shard's entries and claim-state tables live **directly in Supervisor-owned ETS** (no in-memory copy), so they survive a shard crash (see [Coordinator or shard crash](#coordinator-shard-or-ring-crash-for-other-reasons)).

The split keeps the hot path (joins/claims) sharded while the rare, node-wide work (rebalance, the barrier) stays centralized. Shards read the ring and write the `:public` occupancy table directly and **never** call the coordinator synchronously; the coordinator calls shards synchronously only during a rebalance, to gather their held groups. The router-role occupancy table, the ring, and each shard's entries and claim-state tables are all **owned by the scope's long-lived Supervisor** (not the coordinator or the shards), so neither a coordinator restart nor a shard restart pulls a table out from under a process still using it; the coordinator and shards reference them by name.

### Public API

```elixir
Forum.Muster.join(scope, group, pid)        # :ok | {:error, :not_local | :draining | :rpc_failed | term}
Forum.Muster.leave(scope, group, pid)       # :ok | {:error, term}
Forum.Muster.drain(scope, opts)             # graceful cluster-leave; :ok | {:timeout, [node]} | {:error, :already_draining}
Forum.Muster.router(scope, group)           # {:ok, node} | {:rebalancing, [node]}
Forum.Muster.targets(scope, group, sender_view_hash)  # (on router) {:ok, [node]} | {:error, :flood}
Forum.Muster.occupancy(scope, group)        # (on router) raw held [node], NOT barrier-gated
Forum.Muster.members(scope)                 # [node]
Forum.Muster.status(scope)                   # :ready | :converging | :rebalancing | :unknown
Forum.Muster.local_members(scope, group)    # [pid]
Forum.Muster.local_member?(scope, group, pid)
Forum.Muster.local_member_count(scope, group)
Forum.Muster.summary(scope)                  # cheap, poll-safe summary map
Forum.Muster.dump(scope)                     # prints a state snapshot, returns :ok
```

Start it under supervision with a scope name (use a different scope from any Census on the same node):

```elixir
children = [
  {Forum.Muster,
   [:topics, partitions: 8, vacancy_cooldown_ms: 30_000, vacant_flush_interval_ms: 5_000]}
]
```

Every inter-node send Muster makes internally — discovery, `:occupied`, `:vacant_batch`, rebalance snapshots/deltas, view heartbeats — goes through a pluggable transport: a module implementing the `Forum.Adapter` behaviour (`register/1`, `broadcast/2,3`, `send/3`, `call/6`), passed as `:message_module` (default `Forum.Adapter.ErlDist`, built on Erlang distribution). Swap it to run Muster's coordination traffic over a different RPC mechanism (e.g. `:gen_rpc`) without touching the claim/rebalance logic.

### How join works

```
caller                       claim shard                 router (remote)
  |                              |                                     |
  |--- {:join, group, pid} ----->|  (shard = phash2(group, N))         |
  |                              | group_state?                        |
  |                              |   :occupied  -> register, reply :ok |
  |                              |   :cooldown  -> reclaim, register,  |
  |                              |                 reply :ok           |
  |                              |   nil (first member):               |
  |                              |     router == self?                 |
  |                              |       yes: register, write          |
  |                              |            occupancy, reply :ok     |
  |                              |       no: spawn worker ------------>|
  |                              |                                     | insert {{group, A}}
  |                              | <---- :ok ------------------------- |
  |                              | register, reply :ok to all waiters  |
  | <----- :ok ----------------- |                                     |
```

Key invariants:

* Every `join/3` is a single `GenServer.call` to the group's shard; the shard's state machine decides what to do. An already-`:occupied` group just registers the member; a `:cooldown`/`:vacant_*` group is reclaimed (no router RPC where avoidable); only a `nil` (genuinely first) member dispatches the `:occupied` claim. Registration always happens in the shard because that is the process that owns the member monitor.
* On the first-member **remote-router** path the shard registers the member only *after* the router has confirmed the `:occupied` RPC (in `handle_occupied_done`). On the **local-router** path it registers the member first, then writes the occupancy row. Either way the claim and the registration are both owned by the long-lived shard, so the router is never told a group is occupied before a *monitored* local member exists (or, for the remote path, before one is about to be registered on confirm). A caller that dies mid-join therefore cannot leave the router believing we hold a group we don't, and if `pid` is already dead when the shard registers it, the monitor fires immediately and the normal `:vacant → :cooldown` path retracts it.
* **Crash-safety write ordering.** Within `handle_join` the shard always commits the *durable* state (the `states_table` row, and on the local path the membership entry) *before* the externally-visible occupancy assertion, so any shard crash leaves a state that restart reconciliation can drive back to consistency; recovery never depends on the caller retrying:
  * *Remote router:* write `:occupied_pending`, **then** dispatch the `:occupied` RPC. A crash in that window is recoverable: the RPC worker is monitored (not linked) so it may still land its INSERT, but the restarted shard finds the durable `:occupied_pending` with no live member, reconciles it to `:vacant_queued`, and the flush retracts the row (the lower-`seq` orphan INSERT loses to the higher-`seq` vacant DELETE regardless of arrival order). Dispatching before writing the state would lose the record and strand a phantom router row.
  * *Local router:* register the member and write `:occupied`, **then** write the local occupancy row last. A crash before the row leaves no orphan (no row was written); a crash after it implies the entry already exists, so on restart `rebuild_group_states` re-asserts the row for every live group whose router is the local node. Writing the row first would let a crash strand a member-less row that nothing retracts.
* If the RPC fails the caller gets `{:error, :rpc_failed}` and the shard never registers, so no membership entry is left behind and the next `join/3` naturally retries.
* Concurrent `join/3` calls for the same fresh group dedup into **one** RPC; they all hash to the same shard (same `phash2(group, N)`), so the rest piggyback on the in-flight `:occupied_pending` state there, and each waiter's pid is registered when the RPC confirms.
* The shard never blocks on an RPC: it dispatches the call to a short-lived worker process and parks the waiters in `{:occupied_pending, [{from, pid} | …]}`. The worker reports back with `{:occupied_done, …}`.

### How leave works (the cooldown, and the batched vacant flush)

`leave/3` is a `GenServer.call` to the group's shard, which removes the member (entry + monitor teardown). A monitored member that simply *dies* takes the same path via its tagged `DOWN`. When that removal empties the group (no entries remain, a bounded check on the `:ordered_set`, no counter needed) and the shard still holds the group (`:occupied`), it enters the **cooldown** state directly, in the same handler, with no cross-process step (the shard owns both the membership and the claim state). Cooldown lasts `:vacancy_cooldown_ms` (default 30 s). During cooldown:

* The router still believes we hold the group; no RPC has been sent.
* If a new `join/3` arrives, the shard cancels the cooldown timer and goes back to `:occupied`, with no network traffic **except when we are our own router**, in which case it re-asserts the local occupancy row (a cheap, idempotent `upsert_if_newer` at a fresh `seq`) before replying. This is the whole reason cooldown exists: a quick join/leave/join cycle normally costs zero RPCs. But "the router already knows" does not survive a coordinator restart in between: `init/1` resets the ring to `[node()]`, so we can become our own router again for a group whose self row was tombstoned (by `drop_stale_router_entries`) while it was routed elsewhere during our downtime, and restart reconciliation (`rebuild_group_states`) only re-asserts self rows for groups with *live* members, which a cooling-down group has none of. Without the guard, the reclaim above would silently leave a live, successfully-joined member with an empty occupancy row on its own router, permanently, for any broadcast round decided during that window. A *remote* router needs no such guard: reaching a multi-node view again implies a rebalance that re-announced held groups, `:cooldown` included.
* If the cooldown expires with the group still empty, the group moves to `:vacant_queued`.

Each shard runs its own periodic **vacant flush** (every `:vacant_flush_interval_ms`, default 5 s) that drains *its* queue: it buckets that shard's `:vacant_queued` groups by their *current* router and sends **one** `:vacant_batch` RPC per router (groups routed to self are retracted locally with the **same seq-guarded tombstone**, never a hard delete: the coordinator's rebalance self-upsert is a separate writer, and a hard delete would discard the row's high-water `seq` and let that upsert's stale, lower-`seq` write resurrect a member-less phantom via `insert_new`), moving each group to `:vacant_flushing` until the batch settles. (Batching is per-shard, so a router may receive up to one batch per shard; this is safe because `:vacant_batch` is per-row seq-guarded, not a full-state replacement like a snapshot.) On success the groups are forgotten; **on failure they go back to `:vacant_queued`** and the next flush retries them. The flush is therefore self-draining: a transient RPC failure, or a briefly-overloaded router, never strands a permanently stale `{group, node}` entry, because the group keeps being re-sent until the router acknowledges it. Because the router is computed at flush time, a rebalance that moved a queued group's router simply routes the next flush to the right node.

If a `join/3` arrives while a group is `:vacant_flushing` (its vacant batch is mid-flight), the shard does **not** wait for the batch: it re-claims immediately, dispatching `:occupied` straight away and moving the group to `:occupied_pending`. (The re-claim and the racing vacant batch are dispatched from the *same* shard, same group → same shard, so their dispatch order, and thus their `seq` order, is well defined.) The `:occupied` is dispatched after the in-flight `:vacant_batch`, so it carries a higher occupancy `seq` and the router's guard makes its INSERT win over the racing (lower-`seq`) DELETE regardless of arrival order (see [Occupancy-row versioning](#vacant-time-rpc-failure)). The batch's eventual reply is then dropped, since the group is no longer `:vacant_flushing`.

---

## Rebalance: what happens when nodes join or leave

Each Muster scope runs one `ExHashRing.Ring` process, supervised *above* the coordinator rather than linked to it, so a coordinator restart leaves it up for the shards reading it (see [the supervision tree](#coordinator-shard-or-ring-crash-for-other-reasons)). The ring stores the member set and provides ETS-backed lookups; mutations bump a generation counter and keep the previous generation accessible for delta computation. Rebalance is orchestrated entirely by the coordinator, which is also the **sole writer** of the ring's node set (`Ring.set_nodes`, at `init` and on rebalance), the dependency that shapes the supervision tree below.

Two `persistent_term` keys track the cluster view (all cheap, lock-free reads):

```
{Forum.Muster, scope, :status}    = :rebalancing | :converging | :ready
{Forum.Muster, scope, :view_hash} = phash2(sorted member list)
```

`:status` is a lifecycle tri-state: **`:rebalancing`** (our ring is in flux) → **`:converging`** (ring adopted, still waiting for peers to agree on our view) → **`:ready`** (every peer agrees; our occupancy table can be trusted as a router). One ordered value captures the lifecycle: "ready" already implies "not rebalancing", so no separate boolean is needed.

`Muster.router/2` returns the full member list to fan out only while `:rebalancing`; in `:converging`/`:ready` it routes to the ring's node. `Muster.can_decide?/2` (router side) trusts the occupancy table only in `:ready` (which subsumes the ring-settled check) with `:view_hash` agreement. `:view_hash` and `:status` drive the router-readiness barrier (see below).

### Trigger

A rebalance starts on every node whenever its view of the cluster changes:

* `:nodeup` from `:net_kernel` (after libcluster, manual `Node.connect/1`, etc.): if the new node is also running this scope's Muster, the discovery handshake adds it to `peers` and `recompute_members` runs.
* A peer's coordinator `:DOWN` (crash or disconnect): the peer is removed and `recompute_members` runs. Before rebalancing, the `:DOWN` handler also clears occupancy rows, `member_views` and `applied_snapshot_seq` entries keyed by the departed node, since a dead source can never flush its vacancies and nothing else would clean them, but **only the entries actually attributable to the dying pid**. Every occupancy row, `member_views` entry, and `applied_snapshot_seq` entry is stamped with the pid of the Scope coordinator incarnation that wrote it (occupancy rows via `occupied/5`/`vacant_batch/5`/`receive_node_state/6`/`apply_delta/6`, all of which carry the writer's pid; `member_views` via the discovery handshake and rebalance markers, which already carry a pid). `:DOWN` compares each entry's stamped writer against the dying pid directly; it does not need to know whether a newer incarnation has been registered as a peer yet. This matters because peer registration (discovery/`_ack`) and data delivery (the RPCs above) are two fully independent, unordered channels: a peer that restarts *in place* can have its fresh full snapshot land and apply (via `receive_node_state/6`) before any discovery message from its new incarnation has been processed, so `peers` alone is not a reliable signal of whether the data is already stale. A row or entry whose writer differs from the dying pid was necessarily produced by a different incarnation (only one Scope is ever live per node at a time), so it is left alone regardless of what `peers` currently shows. (See `test/forum/muster_distributed_test.exs` for the departure path end-to-end and the fresher-incarnation race from both directions.)

### Two-phase view adoption (growth is gated on the old view's members)

A cluster **growth** does not swap the ring immediately. First the coordinator runs a **PREPARE** round (`begin_view_change`): it announces its move to the grown view to every member of its **old** committed view — the only nodes that could still believe they route a group to a node that is about to route it elsewhere — via a `note_transition` RPC (dispatched from short-lived workers, so the coordinator never blocks). Each recipient **invalidates** its `member_views` entry for us (seq-stamped, so a stale asserting marker can't undo it), which immediately drops it out of `:ready` for any view that counted us as agreeing. Only once **every** old-view member has acked does the coordinator **COMMIT** — run `do_rebalance` below, swapping the ring and routing joins under the new view. Meanwhile joins keep routing under the *old* committed ring (safe: they claim on the old routers), so the join path is never blocked; only the *ring swap* waits.

This orders "every old-view member knows we are leaving the view" strictly *before* "we route a join under the new view", which closes a subtle missed-delivery window (a member that freshly joins a group under a newer view could otherwise be missed by an old-view router still transiently `:ready`). A membership change mid-round **supersedes** it (fresh seq; stale-seq acks are ignored). If the change instead brings membership back to the committed view — the node that triggered the growth left again before the round committed — the round is **cancelled** (`cancel_view_change`): there is no ring to swap, so we restore the committed view and drop the round. But any old-view member that already acked has invalidated its entry for us at the round's seq, which is *above* our committed `view_seq`, so a bare heartbeat marker (carrying the lower `view_seq`) is rejected by its newest-seq-wins guard and it would flood for us until our next committed rebalance — which in a now-stable cluster may never come. So the cancel bumps `view_seq` past the round's seq and **proactively re-announces**, re-establishing agreement at once rather than depending on the heartbeat. A prepare RPC that fails/times out to a still-relevant member crashes the coordinator (the same "restart re-announces from a clean slate" recovery as a failed snapshot), which is the deliberate liveness cost of the gate: a slow/unreachable old-view member delays (or, on timeout, forces a restart of) the growing node's adoption rather than risking the miss. A **shrink** needs no prepare and commits immediately: the departed node's `member_views` entry is wiped in the `:DOWN` handler, which already un-readies every node still on a view containing it, so a shrink cannot leave a stale-ready router.

### What a rebalance does (`do_rebalance`, on the coordinator — the COMMIT phase)

1. Compute the new sorted member list. If unchanged, do nothing.
2. Flip `:status` to `:rebalancing` and bump `:view_hash`. From this point, `Muster.router/2` returns `{:rebalancing, members}` for all groups; broadcasters fan out to every member.
3. Call `ExHashRing.Ring.set_nodes/2` with the new member list. The ring atomically swaps to a new generation; the prior generation is retained for one cycle (so `find_node/2` = NEW router, `find_historical_node/3 back: 1` = OLD).
4. **Stamp this round's `snapshot_seq`** (`:erlang.unique_integer([:monotonic])`): a clean cut in the VM-global sequence. Every group held before the rebalance carries occupancy `seq < snapshot_seq`, and every claim a shard processes from here on carries a higher one, so the snapshot's stale-row tombstone pass (strict `<`, below) can never touch a freshly-claimed group's row.
5. **Gather every shard's held groups, synchronously.** Call each shard `{:rebalance, new_members}`. In that one call each shard: (a) normalizes its in-flight vacant batch (`:vacant_flushing → :vacant_queued`, re-routed by the next flush; the in-flight worker's late result is dropped); (b) **settles its moved `:occupied_pending` waiters**, replying `:ok` and moving to `:occupied` for each pending group whose router *changed*, leaving non-moved pending for their own in-flight worker to settle; and (c) returns its held groups (`:occupied`, `:cooldown`, `:occupied_pending`). Because a shard's mailbox is FIFO and the ring is already swapped, every in-flight claim was processed *before* this call, so the union of the shards' replies is a **complete** held set, the basis for complete-per-router snapshots. (`:cooldown` groups are held even though the member count is 0, since the old router still believes we hold them; `:occupied_pending` so parked callers get `:ok`.) The settle reply is **optimistic** (done before the snapshot is dispatched) and safe because `:status` is `:rebalancing`, so senders flood rather than target a not-yet-populated row. This in-VM call is the only synchronous coupling between the coordinator and a shard; it is bounded by `:rebalance_gather_timeout_ms` (default 15 s), and a shard that does not reply in time crashes the coordinator (which then restarts and re-announces from a clean slate), so a wedged shard can never hang the coordinator indefinitely.
6. **Find the moved groups and affected routers** from the gathered set: a group's router *changed* iff `find_node/2 ≠ find_historical_node/3 (back: 1)`. The distinct new routers of moved groups are the *affected* routers (~1/N of candidates with consistent hashing).
7. **Notify each affected router, fire-and-forget (a full snapshot or a delta).** Dispatch **one** RPC per affected router to a short-lived monitored worker; **the coordinator does not wait**; it returns as soon as the workers are dispatched. The hot claim path runs entirely in the shards and never touches the coordinator, so claims are never blocked by a rebalance; the only synchronous coupling is the in-VM shard gather of step 5, never a remote RPC. Each worker reports via a tagged `{:node_state_done, router, seq}` DOWN; a failure crashes the coordinator from that handler (see "Rebalance RPC failure"). Which RPC a router gets depends on whether we can trust its current baseline:

    * **Full snapshot** (`:receive_node_state`) when the router's baseline is **unknown**: it *joined this round* (`router ∉ old members`, so its table is empty or stale-surviving across a coordinator restart), or it is in **`owed_snapshots`** (a round we dispatched last time is still un-acked, so it may not have applied it). The RPC carries all held groups routed to it, and the receiver **replaces** its rows for our node, re-establishing a complete, correct picture. A node join always takes this path, since the new router's whole occupancy for us is genuinely new information and there is nothing to send incrementally.

    * **Delta** (`:apply_delta`) otherwise: the router was already a member and acked our previous round, so its rows for us match the *previous* ring generation. It already holds the groups that routed to it before this round (maintained inductively: it gained each in the round it moved in, and drops what moves away via its own sweep), so we send **only the groups that moved onto it this round** (`groups_to_reannounce` routed to it; `find_historical_node/3 back: 1` is exactly that baseline). The receiver **adds** them without a wipe. This is the common node-*leave* / churn case: a surviving router inherits the departed node's groups while already holding most of its rows, so re-sending the full set is pure waste.

    Groups routed to *this* node are written to the local occupancy table directly (seq-guarded at `snapshot_seq`) in both cases; its own stale rows are reaped by `drop_stale_router_entries` (step 9), so the local path never needs a wipe either. A router that gained nothing is left untouched: its existing rows for us are still correct, and any group that moved *away* is cleared by its own `drop_stale_router_entries` (step 9). In every case **the sender only ever asserts what it holds (adds); the receiver owns removes**, which is why a delta need not carry them.

    The receiver does **not** apply either RPC from the worker. Both hand off to the receiver's **coordinator** as a synchronous call (`{:apply_snapshot, …}` / `{:apply_delta, …}`), applied under the **same per-source seq guard** (any round whose seq is not strictly greater than the highest already applied from that source is dropped wholesale). Serializing the apply through the single coordinator is what makes a *sequence* of overlapping rebalances safe: a late or reordered round (including an `:erpc`-timeout RPC that executes long after the sender gave up, since erpc does not cancel remote execution) can never resurrect a group a newer round already dropped. Each row is **upserted seq-guarded** (never lowering a newer racing `:occupied` from the same source: snapshot insert, delta add, and `occupied/4` are all guarded upserts, so a round from this coordinator and an `:occupied` from a shard can race the same key without clobbering the newer). A full snapshot additionally **tombstones** (not deletes) this source's rows older than `seq`, so a later, lower-`seq` `:occupied` for a group the source no longer holds cannot resurrect it (see "Vacant-time RPC failure"); a delta skips the tombstone pass because it makes no claim about groups it didn't send. The upsert-then-tombstone order keeps a concurrent reader on the *superset*, so the window over-delivers rather than missing a held group.
8. **Announce our view to every member for the readiness barrier (hybrid).** Each affected router learns our view from the RPC itself: the `{:apply_snapshot, …}` / `{:apply_delta, …}` carries `view_hash` and this round's seq (the *announce watermark*), and the coordinator folds the occupancy write and the `member_views` update into one indivisible apply, committing data before the view is recorded. Members that received neither an RPC this round nor still owe one from a previous round get a cheap async `{:rebalance_marker, node(), view_hash, seq}` send instead; that is how their barrier learns "this source holds nothing for me" vs. "this source has not arrived yet". This keeps the RPC count at roughly the announce-set size (not N per node) while still signalling every member. Because the RPCs are fire-and-forget, each affected router (full or delta) is recorded in `owed_snapshots` (stamped with this round's seq) until its worker acknowledges. That matters for three reasons: the **view heartbeat skips owed nodes** (a bare marker reaching such a node before its data is applied would let it count us as agreed before our data lands); the next rebalance, seeing the round still un-acked, falls back to a full snapshot for it (step 7); and **this same rebalance's bare-marker send also skips every node still in `owed_snapshots`**, not just this round's own RPC recipients, so a router whose routed groups didn't move this round (not a fresh RPC target) but is still owed a previous round's un-acked snapshot is never told the new view is settled ahead of that stale data. The marker for an owed node rides the eventual RPC instead, after the data write. See the readiness barrier below.
9. Walk our own occupancy table and drop entries for groups we are no longer the router for (those entries will be re-announced to us by the original source nodes during their own rebalances). A foreign source's entry is only dropped if that source *demonstrably agrees* with the view being judged under (see "Stale router entries" below); rows that can't be judged yet are left in place and re-swept on the `:converging → :ready` transition, when every member has agreed.
10. Leave `:rebalancing` by recomputing `:status` from peer agreement: `:ready` if every member's latest view already matches ours (single-node clusters land here immediately), otherwise `:converging`.

### What callers see during the rebalance window

`Muster.router/2` returns `{:rebalancing, members}` for the entire duration.

`Muster.join/3`/`claim` is **not** blocked by a rebalance: claims run in the shards, which the rebalance only touches via the brief synchronous gather of step 5 (and the snapshot RPCs that follow are fire-and-forget). A new claim is answered against the freshly-adopted ring. Only callers already parked in `:occupied_pending` for a group whose router changed are affected, and they are settled optimistically during that gather (step 5).

### Router-readiness barrier

The `:rebalancing` status is *local* to each node and only protects senders on that node. It does not cover this ordering: node A finishes its rebalance and goes `:ready` while node B is still mid-rebalance, so a group that re-hashed onto a fresh router C is routed there by A before B has announced it to C. A and C *agree* on membership, and C is `:ready`, yet C's occupancy table is incomplete. Neither a membership-agreement check nor C's own status catches this, because the lag is in a *third* node's announcement.

The barrier closes it. Each broadcast is tagged with the sender's `:view_hash`. On the router, the fan-out path calls `Muster.targets/3`, which folds the barrier (`Muster.can_decide?/2`) and the occupancy read into one result:

```elixir
Muster.targets(scope, group, sender_view_hash)
#  {:ok, [node]}   : status == :ready AND view_hash == sender's
#                    → occupancy table is complete; deliver to exactly these source nodes
#  {:error, :flood}: either clause false
#                    → table can't be trusted; caller over-delivers to everyone
#
# can_decide?/2 is the boolean behind the {:ok, _} branch:
#   status == :ready          : ring settled AND every member agrees with our view
#   and view_hash == sender's : the sender agrees with us on the node set
```

If either clause is false the router **cannot decide its targets and the caller must fan out to all nodes**. `targets/3` returns `{:error, :flood}` rather than a node list because picking the flood set is the caller's job: it fans out to whatever "everyone" means for its transport (e.g. every node in the region). That set is deliberately *not* `members/2` (the ring's member view): a freshly-restarted coordinator resets its ring to just `[node()]`, so the ring can be incomplete in exactly the situation that triggers a flood. The two checks are complementary: the `:view_hash` comparison catches sender/router *disagreement* (and the coordinator-restart window, where a restarted router's view shrinks to `[node()]` and so mismatches), while `:ready` (vs. `:converging`) catches the *convergence* gap above, where membership agreement holds but not every holder has re-announced yet. `:ready` implies the ring is settled, so it covers the not-rebalancing case too.

`:status == :ready` is derived from `member_views`, a map of **each peer's most-recently-announced `{view hash, announce watermark}`**. A peer announces its view by finishing its own rebalance, either via its data-carrying `:receive_node_state` RPC (which echoes the sender's view and that round's seq) or, for a member that sent no snapshot, via a cheap async `{:rebalance_marker, source, view_hash, seq}` (step 7). The handshake (`:muster_discover`/`_ack`) also piggybacks each side's view and watermark, so a node seeds `member_views` immediately, which matters after a coordinator restart that would start with an empty map, **except** when the discoverer is a node we owe a full snapshot to: like the heartbeat below, the ack then withholds the piggyback (nil view/watermark, `member_views` left untouched), because handing an owed node our post-rebalance view before its snapshot has landed would let it declare the barrier satisfied against a table that isn't there yet. We are `:ready` once every member's latest view equals ours; otherwise `:converging`.

The map is **newest-seq-wins and never reset across rebalances**, which is what makes the barrier converge. An announcement that arrives *before* the receiver has adopted that view is stored as that peer's latest view rather than discarded; the moment the receiver catches up to the same view, the agreement check passes. Picking the newest *seq* rather than the latest *arrival* matters because announcements travel on two channels (async dist sends and `:receive_node_state` RPCs), so an older marker can overtake a newer one; the seq comparison makes that reordering harmless. The degraded state is the safe one: any disagreement or missing entry keeps the node in `:converging`, so it floods (never misses) and self-corrects as announcements arrive.

The one place we **do** drop an entry is when a peer leaves: the `:DOWN` handler deletes that node's `member_views` row alongside its occupancy rows, but only if the row's stamped writer pid is the one that just died (see the fresher-incarnation guard above); if it belongs to a different, still-live incarnation, the row is left alone. This is plain departure hygiene: a dead peer's prior announcement is moot, so we don't hold onto data from a node that's gone. It does not weaken the "never reset across rebalances" invariant, which is only about not discarding a live peer's early announcements. (See `test/forum/muster_distributed_test.exs`.)

When membership changes *cascade* (a second node joins while the cluster is still `:converging` from the first), each node simply rebalances again out of `:converging`, re-handing its groups to the final routers, and only the final view ever fully converges. A node does **not** commit (route joins under) a grown view until its old-view members have acked its move (see [Two-phase view adoption](#two-phase-view-adoption-growth-is-gated-on-the-old-views-members)), so a node that has advanced past a view can never be missed by an old-view router still transiently `:ready` for it: the mover was gated until that router recorded the move. (Under a fast cascade a node may not even materialise an intermediate view — it supersedes its still-uncommitted target and commits the final view directly.) A router stays `:ready` for a superseded view only for reads by senders *also* on that view, and any holder relevant to such a sender either was announced under that view or is gated from advancing until the router knows — so the router's table is complete for it. (See `test/forum/muster_distributed_test.exs`.)

There is no readiness *timeout* for ordinary convergence: `:converging` is a fully-functional safe state (the node still routes as a sender and floods as a router), not a blocking wait, so there is nothing to time out. The one deliberate exception is coordinator init/restart when the local scope view has reset to `[node()]`: there, a bounded `:singleton_promotion_timeout_ms` self-promotes the scope to singleton `:ready` if no scope peers were rediscovered first, the explicit liveness tradeoff for a scope that may genuinely have downsized to one node. To bound the worst case otherwise, each node re-announces its current view to every member every `:view_heartbeat_interval_ms` (default 10 s). The event-driven path (rebalance announcements + the discovery handshake) normally converges in milliseconds; the heartbeat is the backstop that heals a dropped announcement *without* needing a membership change. It's idempotent with `member_views` (newest-seq-wins; the heartbeat re-sends the current watermark), so a redundant heartbeat costs only a small message per member. The heartbeat **skips any node in `owed_snapshots`** (a fire-and-forget snapshot still in flight from this node's last rebalance): that node's marker rides the snapshot, after the data is applied, and a premature bare marker would let it trust an occupancy table we haven't populated yet. The snapshot worker's `:node_state_done` clears the node, so the next heartbeat resumes covering it.

The same heartbeat doubles as the **re-discovery** backstop. The discovery handshake (`:muster_discover`/`_ack`) is otherwise driven only by `init` (a one-shot broadcast) and `:nodeup`. Neither re-fires for a coordinator that crashes and restarts **in place**: its dist connection never dropped, so there is no `:nodeup`, and every peer already dropped it on its old pid's `:DOWN`, so peers do not reach back out. If that single `init` announcement is lost (a peer that was itself mid-restart hadn't re-subscribed, or a transient transport drop), nothing else would ever re-pair the node, because the announce heartbeat and `member_views` only talk to nodes *already* in `members`. So on each tick the heartbeat also re-sends `:muster_discover` to every connected node (`Node.list()`) not yet in `members`, bounding worst-case stranding to one interval. It heals symmetrically (re-pairing a peer that missed our announcement, and re-offering *us* to everyone when we are the stranded island, `members == [node()]` after our own restart) and is idempotent (a known peer is already a member and skipped; `register_peer` no-ops a duplicate pid). Connected nodes not running this scope have no subscriber and ignore it.

Because `:view_hash` is content-derived (`phash2` of the sorted node set) rather than a counter, it survives coordinator restarts unchanged: a restarted router recomputes the same hash once it re-converges, and mismatches in the meantime.

### Cost of a rolling deploy

Because the ring is consistent-hashed, a 100-node rolling deploy that grows the new cluster 1 → 100 moves ~1 group out of every 100 candidates per node-add, on average. A `phash2(group, length(members))` scheme would instead remap ~all groups on every node-add. Consistent hashing keeps the per-event announce-set small and the rebalance window short, which in turn keeps the broadcast-fan-out window short.

### Graceful shutdown / draining (`Forum.Muster.drain/2`)

A dying node has two roles, and only one of them needs Muster's help:

* Its **source role** (holding local members) needs no mechanism. As the host app disconnects its clients, membership drops to 0 and the normal vacant-flush (see *How leave works*) retracts occupancy on the current router. That is the host app's job.
* Its **router role** is the one only a *pre-death* handoff can protect. By consistent hashing this node is the elected router for ~1/N of *all* groups cluster-wide, so if it dies abruptly, broadcasts routed to it are dropped.

`drain/2` closes that window while the node is **still alive**. Two messages carry the whole protocol:

1. **Leaver → peers: `{:muster_leaving, coordinator_pid, view_seq}`.** A single `handle_call` closes the join gate, publishes `:rebalancing`, drops any in-flight growth prepare, broadcasts the leave, arms the `:timeout_ms` deadline and flips to `leaving: true`. The broadcast reaches every connected node running the scope. A node that does not hold the sender as a registered peer (never paired with it, or already evicted it) ignores it.
2. **Peer → leaver: `{:muster_leaving_ack, node()}`, sent *after* the eviction.** The peer runs `depart_peer/3`, the very eviction the crash path uses (ring swap + re-announce), and acks only once it returns, so **an ack means the handoff is complete on that peer**, not merely that the message arrived. It also demonitors the leaver with `[:flush]`, so the leaver's eventual real `:DOWN` cannot re-run the eviction. From then on its death is observed only by the departed-source sweep's disconnection check (below).

**Draining is outbound-only.** The leaver suppresses every *outbound self-assertion* (heartbeat announce, re-discovery, discover-ack, nodeup-discovery) so no peer can re-pair it after it announced leaving, and it drops inbound `:muster_discover` for the same reason, so the set of peers it awaits cannot grow after drain start. Every *inbound coordination RPC* (`:occupied`, `:vacant_batch`, snapshot/delta/transition applies, `:rebalance_marker`) keeps being serviced through the whole drain and settle window: the node stays a responsive router right up to exit, it just stops advertising itself. `join/3` on a draining node returns `{:error, :draining}` so a stray join fails loudly instead of creating an unroutable member.

**A draining router floods; it never decides.** The leaver publishes `:rebalancing` at drain start and stays there, so `targets/3` returns `{:error, :flood}` for every sender and `router/2` returns the full member list. Peers evict the leaver one at a time, and from the *first* eviction its occupancy table is no longer maintained: a peer that has evicted it sends its new first-member claims to the newly-elected router. A peer that has *not* yet processed the leave still routes those same groups here and asks under the old view hash, which the leaver would match (it keeps its old view) and answer from a table missing the other peer's brand-new members. That is a silent miss the crash path never has: a dead router fails the call and the sender floods. The settle window's job, letting broadcasts already routed here fan out, is served by flooding just as well.

**The leaver neither rebalances nor crashes.** It keeps its own full ring and view and lets each **peer** rebalance *it* out of that peer's ring, even when a peer it is waiting on dies mid-drain (a concurrent rolling restart, or two nodes draining at once): `depart_peer/3` on a leaver forgets the peer but skips the rebalance. A rebalance from a leaver would dispatch fresh snapshots/deltas stamped *above* the departure watermark (below) that peers parked for it, so each would pass their guard and resurrect the leaver as a phantom on a peer that already evicted it.

#### Why a graceful leave needs more than the eviction

An eviction is enough for a crash, because a dead node writes nothing more. A **drained** node is different: it stays alive through the handoff, the settle window and however long the host app then takes to halt, and its shards and rebalance workers dispatch by `:erpc`, a channel with no ordering relation to the coordinator-to-coordinator dist send that carried the leave. So a write it had put on the wire *before* draining can land on a peer *after* that peer evicted it, re-inserting occupancy rows and a `member_views` entry for a node that is on its way out. Neither `{:nodedown, _}` (a no-op) nor `drop_stale_router_entries` (which can only judge a row whose source announces *our* view, and this one announces the view that still contains itself) can ever collect them. Each is a permanent phantom fan-out target: `targets/3` keeps handing broadcasters a node that no longer exists. Two mechanisms close the two dispatch paths:

* **Snapshots and deltas: the departure watermark.** The `view_seq` in step 1 is the leaver's announce watermark, the `snapshot_seq` of its last committed rebalance and so the stamp on every snapshot/delta that round dispatched. The peer parks it as `applied_snapshot_seq[leaver]`, replacing the entry `depart_peer/3` just cleared, so a late apply loses to the ordinary `seq <= applied` guard on `{:apply_snapshot, …}`/`{:apply_delta, …}` and is dropped wholesale. Rejecting beats reaping: the phantom never exists, so no broadcast can read it in the meantime, and a leaver that never actually dies (an aborted deploy) never produces the death a reap would need. This is the one per-source watermark that outlives its writer. Once the leaver is dead it is inert, since a node name is never reused (see [Node death and replacement](#node-death-and-replacement)), so no later writer can be measured against it, and `reap_departed_sources/1` collects it on the next tick once the leaver is both out of the view and disconnected.
* **Claims: the periodic departed-source sweep.** A first-member join fires an `:occupied` claim from a *shard*, stamped with a fresh seq at dispatch and written straight to the router's occupancy table; it never consults `applied_snapshot_seq`, so no watermark can stop it. The join gate (`:accepting_joins`) closes at the start of `drain/2`, but a claim dispatched an instant earlier is already in flight, and `:erpc` does not cancel. `reap_departed_sources/1` collects it on the next tick once the leaver is both out of the view and disconnected (see [A departed source needs a backstop that survives a coordinator crash](#stale-router-entries)). Disconnection is what provably ends the window (an `:erpc` cannot land from a dead node), and because the sweep *repeats*, a claim that lands just after one tick is collected by the next. That same predicate clears the departure watermark above: the leaver stays connected for its whole handoff and settle, so the watermark survives exactly as long as a late apply can still arrive, and is dropped only once no such write is possible.

The instant a peer swaps its ring, its subsequent claims/routing go to the newly-elected router, and its own rebalance re-announces the groups it holds to that router. Nothing the dying router "owned" is lost: every occupancy row was sourced from some node's local members, and the live sources re-announce during the same rebalance. The only rows that vanish are the ones sourced from the dying node itself which are going away regardless.

#### The wait

The leaver tracks the peers it is still waiting on in `leave_pending` (its registered peers as of drain start) and replies to the parked `drain/2` caller asynchronously, so its own loop never blocks on the acks. When that set empties it opens the **settle window** (`:settle_ms`, still servicing inbound RPCs) so in-flight RPCs peers dispatched *before* they rebalanced still land, and only then replies `:ok`. A **singleton** (no peers) has nobody to hand off to and replies `:ok` at once. A peer that **dies** mid-drain instead of acking is dropped from `leave_pending` by its `:DOWN` and counted as departed rather than unacked, so a peer crashing during a concurrent rolling restart does not make `drain` block the full `:timeout_ms`. Nothing else resolves a pending peer: under asymmetric pairing (the leaver holds the peer, but the peer never registered the leaver or had already evicted it) that peer ignores the leave and never acks, so the drain waits out the full `:timeout_ms` and reports it unacked. That is slow rather than lossy, since such a peer does not route to the leaver at all. If the deadline fires with peers still pending, `drain/2` returns `{:timeout, unacked_nodes}` immediately and does not serve the settle window.

**Two leavers resolve each other.** Several nodes can drain at once, and when two of them snapshot `leave_pending` before either leave lands, each is waiting on the *other* leaver's ack. It arrives: handling an inbound leave is not an outbound self-assertion, so a draining node still evicts a co-leaver and acks it like any other peer, and each survivor simply processes the two departures in turn (an intermediate ring may briefly elect the other leaver as router for the first one's groups; the second departure re-announces those groups onto the final ring). The one asymmetry is the `:DOWN` backstop: evicting a co-leaver demonitors it, so if that co-leaver then dies *without* having processed our own leave, nothing resolves it and the drain waits out the full `:timeout_ms`. Slow rather than lossy — a co-leaver's ack is worth nothing anyway, since it evicts us from a ring it is itself about to abandon.

**`drain` is terminal.** It leaves the node `:rebalancing` with its heartbeat off (the tick is not even rescheduled), so a node that calls `drain` but does not actually die (e.g. an aborted deploy) is stranded until it restarts. Call it only when truly shutting down. The one thing that clears it is a coordinator crash: a fresh `init` drops the in-memory `leaving` state and reopens the join gate, so the node rejoins as a normal member (see [Rebalance RPC failure](#rebalance-rpc-failure)).

#### Host-app contract

`drain` handles only the router role, so call it **late** in shutdown: close the listener to new connections, close/migrate the existing sockets (each retracts its occupancy through the normal vacant-flush), give that a few seconds, call `drain/2`, and only then halt.

`:timeout_ms` (default 5s) caps the ack wait; `:settle_ms` (default 5s) is the post-ack in-flight-drain window and should be at least the scope's `:rpc_timeout_ms`, which is not enforced. `drain/2` bounds its own `GenServer.call` at `timeout_ms + settle_ms + 1s`, so the host's shutdown budget (the child spec's `shutdown:`, and the SIGTERM grace period around it) must exceed that plus however long the socket teardown above takes.

---

## Failure scenarios

### Join-time RPC failure

The synchronous `:occupied` call from the source node to the router can fail (network blip, router overloaded, router coordinator crashed mid-call so its occupancy table is gone). When it does:

* The shard replies `{:error, :rpc_failed}` to the waiting caller.
* `Muster.join/3` propagates this to its caller.
* **Nothing is inserted into the shard's membership entries.** This is the load-bearing invariant: a local membership entry means the router has been notified.
* The next `Muster.join/3` for the same group naturally retries: local count is still 0, so it goes through the first-member claim path again.

### Vacant-time RPC failure

`:vacant_batch` RPCs to the router are best-effort but **retried**. A failed batch is logged and its groups are returned to `:vacant_queued`, so the next flush re-sends them. The group keeps being re-sent until the router acknowledges it, so the router cannot accumulate a permanently stale `{group, source_node}` entry from a transient failure: the flush (per shard) is a self-draining retry loop. (A failure never crashes the shard or fails a `leave/3` call; `leave/3` only removes the local membership entry, and the retraction RPC is the flush's job, off the caller's path.)

In addition to the retry, two event-driven cleanups still apply:

* If the source node leaves the cluster, the router's `:DOWN` handler clears the entries keyed by that node that are stamped with the dying pid. A fresher incarnation's already-delivered data (writer-pid stamped, whether or not its discovery has been processed yet) is left alone.
* A rebalance that moves a group's routing away from the old router triggers `drop_stale_router_entries` there.

**Occupancy rows are a last-writer-wins-by-`seq` register to make this race-free.** `:erpc.call` does **not** cancel the remote execution on timeout, so a write can land on the router long after the source gave up, and in *either* order relative to a competing write for the same key. Every occupancy row is stored as `{{group, source_node}, seq, meta, writer}`, where `seq` is a per-source monotonic stamp (`:erlang.unique_integer([:monotonic])`) assigned by the source **at dispatch time**, `meta` is `:present` (the source holds the group) or an integer timestamp marking a **tombstone** (the source vacated it), and `writer` is the pid of the source's Scope coordinator incarnation that produced the row (see the fresher-incarnation guard above, which compares against this field directly). Seqs are only ever compared for the same `{group, source}` key, whose writes all originate on one node, so the comparison is always within a single VM's monotonic sequence and survives coordinator/shard restarts. Both directions of the race are then symmetric:

* **Stale DELETE after a fresh INSERT.** A re-claim's `:occupied` is dispatched *after* the `vacant_batch` it races (the join arrives later), so it carries a strictly higher `seq`. A timed-out `vacant_batch` whose DELETE lands afterwards would otherwise clobber the live re-claim; instead `vacant_batch` only tombstones a row whose `seq` is **no newer** than the batch's, so the stale, lower-`seq` DELETE is a no-op.
* **Stale INSERT after a fresh DELETE.** The mirror: an orphaned `:occupied`/snapshot (e.g. its shard crashed and the restart re-routed the claim as a higher-`seq` vacancy) can land *after* the source genuinely vacated. This is why a vacancy **tombstones** the row (keeping its `seq`) rather than deleting it: the stale, lower-`seq` INSERT loses to the tombstone's guard and cannot resurrect the group. Deleting the row outright would discard the high-water `seq` and let the late INSERT win via `insert_new`, leaving a permanent phantom.

All writers go through the same seq-guarded upsert: `occupied/4`, the rebalance snapshot apply, and self-routed claims write `:present`; `vacant_batch` and the snapshot's full-state replace write tombstones. So a snapshot dispatched by the (single) coordinator and an `:occupied` dispatched by a shard can write the same `{group, source}` concurrently during a rebalance without the older write clobbering the newer. Tombstones are reaped by a periodic sweep on the coordinator once older than `:tombstone_window_ms` (default `rpc_timeout_ms × 5`), comfortably past the longest an orphaned RPC could still be in flight in a healthy cluster (under a partition the RPC fails fast rather than landing late). Reaping only bounds memory; correctness does not depend on it firing promptly, since a tombstone kept too long merely reads as absent. (See `test/forum/muster_distributed_test.exs` and `test/forum/muster_test.exs`.)

### Rebalance RPC failure

Snapshot dispatch is fire-and-forget on the sender (the coordinator does not wait), but the receiver-side apply is a synchronous call (`receive_node_state` calls `{:apply_snapshot, …}` into the receiver's coordinator and waits for the reply), so any failure ultimately fails the snapshot's `:erpc` and crashes the **sender** via the `:node_state_done` handler:

* **Transport failure.** If a snapshot's `:erpc` cannot reach the router (node down, etc.), the monitored worker reports `{:error, _}` and the `:node_state_done` handler **re-raises. The sender's coordinator crashes.**
* **Apply failure.** If applying the snapshot raises, the **receiver's** coordinator crashes mid-call, so the caller's `GenServer.call` exits, the `:erpc` returns an error, and the sender crashes too (exactly the transport-failure path). Both restart. (A late or stale apply can't corrupt anything: the per-source seq guard drops it and still replies `:ok`.)

After a crash the supervisor restarts the **coordinator**, whose `init/1`:

* Resets the member list to `[node()]`, the `:status` persistent_term to `:converging` (not `:ready`, even at members `[node()]`: a restarted local sender would otherwise agree with that one-node view and trust incomplete occupancy before scope discovery re-pairs; the bounded `:singleton_promotion_timeout_ms` restores `:ready` if the scope truly downsized to one node), and `:view_hash` to `phash2([node()])` (forgetting the cluster view). A sender that still holds the pre-crash multi-node `:view_hash` will mismatch this single-node hash, so `can_decide?/2` returns false and broadcasts to the restarted router fan out to all nodes until it re-converges.
* Walks the shards' membership entries (which survive a coordinator death because they live in `:public, :named_table` ETS owned by the Supervisor) and re-asserts (monotonic upsert) its router-role **occupancy self-rows** for every group with live local members. The occupancy table is itself owned by the Supervisor, so it is **not** recreated on a coordinator restart: it survives intact under whichever shard processes write it directly. Any foreign-source rows the dead incarnation held are harmless: the restart resets `:view_hash` (below), so `can_decide?/2` is false and callers flood until each source re-snapshots (replacing its rows) and the `:ready` sweep prunes the rest. A coordinator crash also restarts every shard (see [Coordinator crash](#coordinator-shard-or-ring-crash-for-other-reasons)), so this same walk-and-reassert always runs against freshly-restarted shards, one reset story, not two. The per-group state machine is not lost by this: it lives in the shards' Supervisor-owned durable claim-state table, which each shard's own restart rebuilds from; remote sources' rows are refilled when they re-snapshot after re-discovery.
* Re-broadcasts the discovery message; peers respond; `recompute_members` runs again. This `init` broadcast is one-shot, but it is **not** the only chance to re-pair: because the node restarted in place (its dist connection never dropped, so no `:nodeup` re-fires and peers won't reach back out), a lost `init` discovery would otherwise strand it forever, so the view heartbeat re-offers `:muster_discover` to every connected non-member each tick (see [the re-discovery backstop](#router-readiness-barrier)), bounding worst-case stranding to one interval.
* Reopens the join gate (`:accepting_joins` persistent_term to `true`). `drain/2` is the *only* writer that closes it (to `false`), and that term outlives the coordinator process. So a coordinator crash *during* a drain — before the node actually dies — would otherwise leave the gate stuck closed forever: the restarted incarnation re-pairs and routes normally, yet `join/3` would keep returning `{:error, :draining}` for the life of the OS process. A fresh `init` means "not leaving", so it reopens the gate; the in-memory `leaving` state is dropped by the restart anyway, so the drain is effectively aborted and the node rejoins as a normal member.

The supervisor restart strategy ensures the cluster eventually re-converges. The `:status` and `:view_hash` persistent_terms both **survive the crash unchanged** — nothing resets them as the coordinator dies — so during the brief window between the crash and `init/1` running they hold their pre-crash values (whatever `:status` was: usually `:ready` or `:converging`, `:rebalancing` only if the node happened to crash mid-rebalance). That window is nonetheless safe, because the occupancy table is likewise unmutated (the coordinator that would rebalance it is down), so a router answering `targets/3` from it returns the same authoritative set it would have before the crash. What actually protects correctness *across* the restart is `init/1` resetting `:view_hash` to `phash2([node()])` and `:status` to `:converging` (above): from then on `can_decide?/2` fails for any sender still holding the pre-crash multi-node view, so callers flood rather than trust the restarted router's shrunken view until it re-converges. (See `test/forum/muster_distributed_test.exs`.)

### Coordinator, shard, or ring crash for other reasons

**An outer `:rest_for_one` supervisor holds the ring, the coordinator, a shards-supervisor, and a one-shot shards-ready sentinel; the shards themselves live under their own inner `:one_for_one` supervisor:**

```
:rest_for_one
├── ring                       # node set lives in the ring process's own ETS table
├── coordinator (scope)        # the ONLY writer of the ring's node set
├── shards_supervisor (:one_for_one)
│   ├── shard_0                # read the ring directly; durable ETS claim state
│   ├── shard_1
│   └── shard_n
└── shards_ready_sentinel      # :ignore's every start; no pid
```

The sentinel is more than a restart-ordering fixture: because a supervisor starts children strictly in list order and blocks its caller until each child's `init` returns, the sentinel's own `start_link/1` cannot run until every shard has returned from init, so its one-shot `:muster_shards_ready` send to the coordinator is a guarantee, not a race. The coordinator's `init/1` blocks on that signal (bounded by `:shards_ready_timeout_ms`, default 5 s) before broadcasting discovery or doing anything — like a rebalance — that calls into the shards, so `do_rebalance`'s synchronous per-shard gather can never land before a shard is registered. Shard init is local, ETS-only work with no I/O, so this timeout should never come close to firing in a healthy tree; if it does, the coordinator crashes and the supervisor restarts it rather than hanging forever.

`:rest_for_one` restarts the crashed child **and every child listed after it**, never anything before it. `:one_for_one` restarts only the crashed child. That gives the whole crash story for free, straight from this shape, with no extra code:

* **Coordinator crash** restarts the coordinator, `shards_supervisor`, and the sentinel (listed after it): restarting a `:supervisor` child re-runs its `init`, which restarts every shard fresh, but never the ring (listed before it). One reset story: "the coordinator restarted" always means the shards did too, never a stale shard left running next to a fresh coordinator. The occupancy table and the shards' membership/claim-state tables are all owned by the long-lived outer **Supervisor** (created in its `init/1`, which does **not** re-run when a child below it restarts), so they survive this whole cascade untouched; the restarted coordinator's `init/1` re-asserts the occupancy self-rows from them, re-discovers, and rebalances, while each restarted shard's own `init/1` rebuilds its membership and claim state the same way it would after an ordinary shard crash (see below).
* **Shard crash** restarts ONLY that shard, never any other shard, the sentinel, the coordinator, or the ring. Shards live under their own nested `:one_for_one` supervisor, so a shard crash is handled entirely inside it and never propagates outward (the outer `rest_for_one` never observes it, since `shards_supervisor` itself didn't crash). A restarted shard's `init/1` first re-installs its member monitors from the **durable entries table** (Supervisor-owned, so it survived the crash) by re-`Process.monitor`ing every surviving entry, so a member that died while the shard was down is recovered, its re-installed monitor's immediate `DOWN` driving the normal removal. It then rebuilds its `group_states` from its **durable claim-state table**, reconciled against the live membership the entries imply (the set of groups with ≥1 member): a group with live members is re-adopted `:occupied`; a group with no live members but an outstanding router assertion (`:cooldown` / `:vacant_queued` / `:vacant_flushing` / `:occupied_pending`) is **retained** and driven to retraction (its router row is flushed away), rather than being silently forgotten. Cooldown timers (process-local) are re-armed; `:occupied_pending` waiters are dropped (their callers retry). Retaining those outstanding-assertion states is what keeps a router row from being orphaned, including remote-routed rows that only the source's own record can retract. (If a single shard crash-loops past the inner supervisor's own restart intensity, `shards_supervisor` itself terminates and the outer `rest_for_one` restarts it, all shards and the sentinel, but still never the coordinator or ring.)
* **Ring crash:** the ring stores its node set in its own process-owned ETS table, so a crash brings it back **empty**, and the coordinator is the only writer that could re-seed it (and only at `init`/rebalance, neither of which a lone ring restart triggers). Being listed first is what makes the ring the dependency root of the whole list: its crash restarts the ring, the coordinator, `shards_supervisor` (every shard), and the sentinel, and the coordinator's `init/1` re-seeds the ring with `[node()]` and re-converges from there. Without this, a ring restart in isolation would strand routing on an empty ring until the next membership change.


### Stale router entries

Whenever cluster membership changes and a group's router shifts from B to C, B briefly holds a stale `{group, source}` entry. Four things clean it up:

* B's own `drop_stale_router_entries` sweep, run at each rebalance, again on the `:converging → :ready` transition, and periodically (piggybacked on the tombstone GC tick, every `:tombstone_window_ms`), removes entries whose group is no longer routed to B.
* If a source node is removed from the cluster, the routers still listing it drop its rows in their peer-`:DOWN` handler (`match_delete` on that node, scoped to rows stamped with the dying pid), since a dead source can never flush its own vacancies and nothing else would. A row stamped with a different, still-live incarnation's pid is left alone (see "Vacant-time RPC failure" above).
* `reap_departed_sources/1`, on the same periodic tick, deletes every row whose source has left the cluster outright — see **A departed source needs a backstop that survives a coordinator crash** below.
* The source node's periodic vacant flush re-sends queued vacancies to the *current* router, so a vacancy that was never delivered (or was delivered to a node that has since stopped being the router) is eventually applied where it matters. Because each shard's claim state is **crash-durable** (see [Coordinator or shard crash](#coordinator-shard-or-ring-crash-for-other-reasons)), a shard restart keeps queued/cooldown vacancies and the flush resumes retracting them, including for groups routed to a *remote* router that the local node would otherwise have no record of.

Stale entries do not cause incorrect broadcasts because broadcasters always route via the *current* router.

**The sweep is guarded: a row is only judged under a view its source has agreed to.** `drop_stale_router_entries` deletes a foreign source's row only when (a) that source's last-announced view (`member_views`) equals the view our ring currently implements, and (b) the row's seq is at or below that announcement's watermark. Without the guard, two ordering races lose data permanently:

* *Asymmetric views.* Our ring can transiently contain a node the source never saw (e.g. an ephemeral joiner we registered before its death propagated). Judged under that ring, the source's group may hash to the phantom node, but the source never re-announces it anywhere else, so deleting the row leaves a permanent hole. Consistent-hashing monotonicity protects *subset* views (a group that routes to us in the source's view also routes to us in any subset of it containing us, which is why plain joins are safe in any interleaving), but it says nothing once the views are not nested. The view-agreement check (a) restores the comparison to a single shared view.
* *Data ahead of markers.* A source's `:occupied`/`:vacant_batch` writes go straight to the occupancy ETS from their RPC workers (only the rare *snapshot* apply is serialized through the coordinator), and they do **not** touch `member_views`, so a freshly-claimed row can carry a seq higher than the source's last-announced watermark. (Snapshot rows are exempt: the coordinator folds a snapshot's occupancy write and its `member_views` update into one atomic apply, so for snapshot rows the table can't run ahead of the marker.) A row stamped above the source's watermark belongs to an announce round we have not processed yet and must not be judged under the older view; check (b) skips it.

Rows the guard skips are harmless (a non-router's rows are never consulted, so they cost only memory) and are re-judged on the `:ready` transition, by which point every member has announced agreement with our view and the sweep can collect everything genuinely stale. (See `test/forum/muster_test.exs` and `test/forum/muster_distributed_test.exs`.)

**A row that does not exist yet at either of those points needs a backstop.** `occupied/4` and `vacant_batch/4` are the only cross-node writes with no `view_hash` on the wire, just `{group, source_node, seq}`, so, unlike `receive_node_state`/`apply_delta`, they can't fold into the readiness barrier the way a snapshot or delta does. Because `:erpc` does not cancel a delayed call, one of these can land on B after B has already rebalanced away from routing the group to it and already run both of the sweeps above, at which point there was nothing to sweep, since the row didn't exist yet. If no further membership change ever comes, neither of those two sweeps runs again, and the late write plants a permanent phantom row. `drop_stale_router_entries` is therefore also run, unconditionally, on every periodic tombstone-GC tick (`handle_info(:sweep_tombstones, _)`), independent of `:status` or rebalance activity: the same guard applies, so it only ever removes rows a source has demonstrably agreed are stale. This bounds the worst case to one `:tombstone_window_ms` interval even in a cluster that goes quiet right after the delayed write lands. (See `test/forum/muster_distributed_test.exs`.)

**A departed source needs a backstop that survives a coordinator crash.** Every mechanism above that collects a *departed* node's rows is keyed to a specific incarnation and lives in the coordinator's own state: the peer-`:DOWN` handler's pid-matched `match_delete`, and the departure watermark the graceful leave parks. The occupancy table is not — `Forum.Supervisor` owns it (see [Coordinator, shard, or ring crash](#coordinator-shard-or-ring-crash-for-other-reasons)), so it outlives any coordinator restart. A Scope crash in the window between a departure and its cleanup therefore destroys every mechanism that could collect that node's rows while leaving the rows themselves untouched, and afterwards nothing can judge them: `drop_stale_router_entries` needs the source to announce *our* view and a departed source never will, `{:nodedown, _}` is a no-op, and the tombstone reaper only reaps tombstones. Each survivor is a phantom fan-out target for the life of the OS process.

`reap_departed_sources/1`, run on the same `:sweep_tombstones` tick, is the backstop. It holds no per-departure state at all: it re-derives the answer from the current view and the current connection set on every tick, so a restart has nothing to lose. Being idempotent and repeating is also what makes it robust where a one-shot timer is not — a row planted by an orphaned RPC *after* one tick is collected by the next, bounding the exposure to one `:tombstone_window_ms` interval instead of forever.

A source qualifies only if it is **both** outside the committed view **and** disconnected. Membership alone is not enough: a node that is mid-join, or whose claim beat our registration of it as a peer, legitimately writes this table before it appears in `members`, and dropping those rows would discard a claim the source has already been told we accepted. Such a node is by definition still connected, so the connection check is what makes the membership check safe. Disconnected-and-not-a-member is exactly the condition under which the peer-`:DOWN` handler already wipes a peer's rows, so this adds no new class of loss: a node that comes back (a healed partition, a restart) re-announces everything it holds in its own rebalance's snapshot. The delete is a hard delete rather than a tombstone, because a tombstone fences a later write by seq and nothing here can be fenced that way — a claim from the departed node carries a fresh, higher seq and would win over any tombstone we could write. The repeating sweep covers that case instead. (See `test/forum/muster_distributed_test.exs`.)

**The delete itself is seq-guarded against a concurrent re-claim.** The sweep judges rows from a snapshot of the table (`:ets.select`), but `occupied/4` keeps writing the same table from its `:erpc` workers while the sweep runs. Between judging a row stale at some seq and physically removing it, the source may legitimately re-claim the group under a newer view that routes it back to B, raising the same `{group, source}` key to a fresh, higher seq. A key-only delete would destroy that fresh row, and nothing would ever re-send it (the source got its `:ok`, and later rebalances send deltas of moved groups only), so B would converge `:ready` as the group's router with a silent, permanent hole in its occupancy. The sweep therefore deletes with `:ets.select_delete` matched on the exact judged seq: a concurrently-raised row makes the delete a no-op, and if the row is still genuinely stale it is re-judged, under the watermark of the source's newer announcement, by a later sweep. (See `test/forum/muster_distributed_test.exs`.)

### Network partition

If A and B can no longer reach each other, they each detect peer `:DOWN`, rebalance independently, and route to whoever they can see. When the partition heals, the rejoin runs through discovery → rebalance and the two sub-clusters merge. Broadcasts during the split are delivered to the sub-cluster the sender can see; Muster does not perform anti-entropy beyond this, so a broadcast during a partition won't reach the other side after the heal.

The readiness barrier keeps every node in `:converging` during an asymmetric split too (e.g. two peers split from each other while a third node still sees both), so routers flood rather than trust their tables until the heal and re-convergence. (See `test/forum/muster_distributed_test.exs`.)

## Observability

Muster logs its lifecycle on two tiers, all prefixed `Muster[node|scope]`:

* **`info`**: the rare, cluster-level events: rebalance start (old → new members + view hash), a one-line rebalance summary (groups held, groups moved, routers re-snapshotted), every `:status` transition (`:rebalancing → :converging → :ready`), and node up / peer down. These are safe to leave on; they fire only on real change.
* **`debug`**: the per-group churn: each claim decision (occupied locally, dispatched to a router, reclaimed from cooldown/queue/in-flight flush, parked behind an in-flight `:occupied`), `:occupied` RPC results, a group entering cooldown, cooldown expiry (queued or reclaimed), and each vacant flush / batch acknowledgement.

Bump the level to watch the per-group flow while playing:

```elixir
Logger.configure(level: :debug)
```

When Muster is embedded in a host app (e.g. Realtime), that app's Logger setup prints these lines. The standalone `forum` app ships with `config :logger, backends: []`, so if you're playing *inside* `forum/` (`iex -S mix`) attach a console handler first:

```elixir
:logger.add_handler(:console, :logger_std_h, %{config: %{type: :standard_io}})
:logger.set_primary_config(:level, :debug)
```

For a point-in-time snapshot, `Forum.Muster.dump(scope)` prints the lifecycle status, view hash, ring members, peers, each peer's last-announced view hash, the per-group state machine, and the router-role occupancy table (`group => [source_node]`), then returns `:ok`:

```
iex> Forum.Muster.dump(:topics)
Muster :topics @ :node1@host
  status:       :ready
  view_hash:    123456789
  members:      [:node1@host, :node2@host]
  ...
group_states:
  :occupied (2): ["room:1", "room:2"]
occupancy (as router):
  "room:1" => [:node1@host]
```

Node up/down is also emitted as a `:telemetry` event (`[:forum, scope, :node, :up | :down]`) if you'd rather attach a handler than read logs. (Muster does not emit a group-vacancy telemetry event: the shard that owns the group's membership transitions its own claim state directly.)

## Trace-based testing (`Snabbkaffex`)

Concurrent code is awkward to test with mocks and `Process.sleep`. The
[snabbkaffe](https://github.com/kafka4beam/snabbkaffe) library instead lets you
assert on the *trace* of events a system emitted, and block until a specific
event happens. Snabbkaffe is a BEAM library, but its instrumentation ships as
Erlang `-include` macros that Elixir can't use, so we depend on
[`snabbkaffex`](https://github.com/kafka4beam/snabbkaffe) — an Elixir wrapper
that provides the macro/function counterparts (the `Snabbkaffex` module).

**Trace points are discarded outside `:test`.** A `tp/2` call compiles to a real
collector call in `MIX_ENV=test` and to `_ = data; :ok` everywhere else (the data
expression is still evaluated, matching snabbkaffe's prod semantics). Instrument
`lib/` code with `use Snabbkaffex, only: :trace`, which imports just the
discardable trace-point macros (`tp/2,3`, `tp_span/3,4`) at near-zero production
cost:

```elixir
defmodule Forum.Muster do
  use Snabbkaffex, only: :trace

  # ... somewhere in the rebalance path:
  tp(:muster_rebalance_done, %{scope: scope, members: members})
end
```

In a test, `use Snabbkaffex` (no options) brings in the full API. The collector
is a global singleton, so a trace-running test module must be `async: false`.
`check_trace/2` runs an action, collects the trace, and hands it to a check
function (which passes unless it raises, so use ordinary `assert`). Trace-query
helpers take the `trace` as their **first** argument, so they pipe naturally:

```elixir
use ExUnit.Case, async: false
use Snabbkaffex

test "rebalance converges" do
  check_trace(
    fn ->
      add_node(:node2)
      block_until(%{:"$kind" => :muster_rebalance_done}, 1000)
    end,
    fn trace ->
      assert [%{members: members}] = of_kind(trace, :muster_rebalance_done)
      assert :node2 in members
    end
  )
end
```

`Forum.Muster` emits trace points (from the coordinator and the claim shards) you can build assertions on:

* `:muster_rebalance_start`: `%{scope, node, from, to, view_hash}`.
* `:muster_status_change`: `%{scope, node, from, to, members, view_hash}`, on
  every `:rebalancing → :converging → :ready` transition.
* `:muster_peer_registered`: `%{scope, node, peer}`, when discovery pairs a peer.
* `:muster_node_state_received`: `%{scope, node, source, view_hash, groups}`,
  after a `:receive_node_state` snapshot has been committed on the receiver.
* `:muster_rebalance_marker`: `%{scope, node, source, view_hash, seq}`, emitted
  *before* a received bare `:rebalance_marker` updates `member_views`/`:status`.
* `:muster_view_prepare`: `%{scope, node, from, target, audience, seq}`, emitted
  when a node begins the two-phase view-change PREPARE (before committing the
  grown view), naming the old-view members it must get acks from.
* `:muster_view_cancel`: `%{scope, node, target, members, round_seq}`, emitted when
  an in-flight PREPARE round is cancelled because membership returned to the
  committed view before it committed (the growth peer left again); the node
  restores the committed view and proactively re-announces it (see
  `cancel_view_change`).
* `:muster_transition_applied`: `%{scope, node, source, seq}`, emitted *before* a
  received `note_transition` prepare invalidates `source`'s `member_views` entry,
  so forcing an ordering on it holds this node as a stale-view router while a peer
  is mid view-change (used to characterise the two-phase gate in the distributed
  suite).
* `:muster_occupied`: `%{scope, node, group, source, seq}`, after an
  `:occupied` INSERT has been committed on the router.
* `:muster_occupied_apply`: a `tp_span/3` around the router-side `:occupied`
  INSERT (match `:"$span"` of `:start` / `{:complete, _}`); the `:start` event
  fires *before* the write, so forcing an ordering on it parks the INSERT (the
  mirror of `:muster_vacant_batch`, used to drive the stale-INSERT-after-DELETE
  race in the distributed suite).
* `:muster_vacant_batch`: a `tp_span/3` around the router-side batched vacancy
  (match `:"$span"` of `:start` / `{:complete, _}`); the `:start` event fires
  before the tombstone writes, so forcing an ordering on it parks the whole batch.
* `:muster_drop_stale_entry`: `%{scope, node, group, source}`, per row the
  stale-entry sweep actually deletes (emitted after the delete, so blocking on
  it implies the row is gone).
* `:muster_departed_source_reaped`: `%{scope, node, source, rows}`, per source
  node the periodic departed-source sweep collects, with the number of rows
  deleted (emitted after the delete).
* `:muster_rediscover`: `%{scope, node, target}`, per connected non-member the
  heartbeat's re-discovery sweep re-offers `:muster_discover` to (emitted after
  the send).
* `:muster_drain_begin`: `%{scope, node, expected, settle_ms}`, emitted on the
  leaver when `drain/2` starts, naming the peers it will wait for acks from
  (emitted *before* the `{:muster_leaving, …}` broadcast).
* `:muster_leaving_received`: `%{scope, node, peer_node}`, emitted on a **peer**
  when it accepts a `{:muster_leaving, …}`, *before* it evicts `peer_node` and
  acks — so forcing an ordering on it parks a peer mid-handoff.
* `:muster_drain_peer_lost`: `%{scope, node, peer_node}`, emitted on the leaver
  when an awaited peer dies mid-drain and is dropped from the wait instead of
  being counted as unacked.
* `:muster_drain_acked`: `%{scope, node}`, emitted on the leaver once every peer
  has acked or departed, as the settle window opens.
* `:muster_drain_settled`: `%{scope, node}`, emitted on the leaver when the
  settle window elapses, just before `drain/2` replies `:ok` (the host app may
  halt from here).
* `:muster_drain_timeout`: `%{scope, node, unacked}`, emitted on the leaver when
  the `:timeout_ms` deadline fires with peers still pending.
* `:muster_group_state`: `%{scope, node, group, state}`, emitted by the owning
  claim shard on every per-group state-machine transition (`state: nil` means the
  group was forgotten). Lets tests `block_until` a group reaches e.g.
  `:vacant_queued` instead of polling.

All are discarded outside `:test`.

### Distributed traces

The collector runs on the node that calls `check_trace`. To capture trace points
emitted on *other* nodes (e.g. `:peer` nodes in `muster_distributed_test.exs`),
tell each remote node to forward its events to the collector:

```elixir
forward_trace(remote_node)
```

Attach it **before** the remote work starts so no event is missed: a remote
`tp` emitted before forwarding is wired up goes nowhere. With forwarding on, a
single `check_trace` sees events from the whole cluster, which is how the
distributed test asserts that *every* node re-converges to `:ready` (matching on
the final `view_hash`) after a node joins. The remote nodes only need snabbkaffe
on their code path, with no collector of their own. `unforward_trace/1` reverts a
node to recording locally — call it before a deliberate `Node.disconnect/1` so a
forwarded `tp`'s RPC doesn't auto-reconnect the node (see the netsplit tests).

Available macros: trace points `tp/2,3` and `tp_span/3,4`; running/checking with
`check_trace/2,3`; collector lifecycle `start_trace/0`, `stop/0`,
`collect_trace/0,1`; synchronisation `block_until/1,2,3`, `wait_async_action/2,3`,
`retry/3`; trace querying `of_kind/2`, `projection/2`, `find_pairs/3,4`,
`causality/3,4`, `strict_causality/3,4`; fault injection `force_ordering/2,3`,
`inject_crash/2,3`; plus `give_or_take/3` and the `match_event/1` predicate
builder. The trace-query helpers take the `trace` as their **first** argument
(`of_kind(trace, kind)`), so they pipe left-to-right. Patterns are ordinary
Elixir patterns (snabbkaffe's `?match_event` becomes `match?/2`); the event's
kind lives under the `:"$kind"` key, so prefer `of_kind/2` for filtering. See the
`Snabbkaffex` moduledoc for details.
