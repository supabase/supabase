defmodule Forum.Muster do
  @moduledoc """
  Group-aware fan-out broadcast.

  For every group, exactly one node in the cluster is the **router** node,
  chosen by consistent hashing (via `ExHashRing`) over the sorted Muster
  cluster membership. The router node knows which nodes hold local members
  of that group; callers route a broadcast to it (using their own transport)
  via `router/2`.

  Use a different scope name than any `Forum.Census` scope on the same node.
  """

  alias Forum.Muster.Scope
  alias Forum.Muster.Shard

  # Canonical consistent-hashing parameters. Every Muster ring is built with these
  # (see `ring_config/0`), and anything that reconstructs a scope's ring from the
  # outside must use the same values or it will compute different routers.
  @ring_replicas 128
  @ring_depth 2

  @type group :: Forum.group()
  @type start_option ::
          {:partitions, pos_integer()}
          | {:vacancy_cooldown_ms, non_neg_integer()}
          | {:vacant_flush_interval_ms, pos_integer()}
          | {:view_heartbeat_interval_ms, pos_integer()}
          | {:singleton_promotion_timeout_ms, pos_integer()}
          | {:rpc_timeout_ms, timeout()}
          | {:rebalance_gather_timeout_ms, pos_integer()}
          | {:shards_ready_timeout_ms, pos_integer()}
          | {:tombstone_window_ms, pos_integer()}
          | {:message_module, module()}
          | {:max_restarts, non_neg_integer()}
          | {:max_seconds, pos_integer()}

  @typedoc "Lifecycle status of a scope's coordinator (see `status/1`)."
  @type lifecycle_status :: :ready | :converging | :rebalancing | :unknown

  @typedoc "Per-label counts of the local claim state machine, plus `:total`."
  @type group_state_counts :: %{
          occupied: non_neg_integer(),
          cooldown: non_neg_integer(),
          vacant_queued: non_neg_integer(),
          vacant_flushing: non_neg_integer(),
          occupied_pending: non_neg_integer(),
          total: non_neg_integer()
        }

  @typedoc "Cheap, poll-safe snapshot of a scope on this node (see `summary/1`)."
  @type summary :: %{
          scope: atom(),
          status: lifecycle_status(),
          view_hash: non_neg_integer(),
          members: [node()],
          ring_nodes: [node()],
          peers: non_neg_integer(),
          owed_snapshots: non_neg_integer(),
          applied_snapshot_seq: %{node() => {integer(), pid()}},
          occupancy_row_count: non_neg_integer(),
          occupancy_rows_by_node: %{node() => non_neg_integer()},
          group_state_counts: group_state_counts()
        }

  # Timeout for the local GenServer.call to the claim shard. Generous because the
  # underlying RPC timeout is what actually bounds the wait; this just needs
  # to be longer than that. The supervisor restarts a shard if it crashes, so
  # callers won't wait forever on a dead shard. During a rebalance, callers
  # stay parked on this call until the rebalance settles them with :ok.
  @claim_call_timeout 60_000

  @doc "Returns a supervisor child specification."
  def child_spec([scope]) when is_atom(scope), do: child_spec([scope, []])
  def child_spec(scope) when is_atom(scope), do: child_spec([scope, []])

  def child_spec([scope, opts]) when is_atom(scope) and is_list(opts) do
    %{
      id: {Forum.Muster, scope},
      start: {__MODULE__, :start_link, [scope, opts]},
      type: :supervisor
    }
  end

  @doc """
  Starts the Muster supervision tree for `scope`.

  Options:

  * `:partitions`: number of local partitions (default: schedulers online).
  * `:vacancy_cooldown_ms`: how long to wait after a group goes vacant locally
    before queuing it for a vacant flush (default: 30_000).
  * `:vacant_flush_interval_ms`: how often the queued vacancies are flushed to
    their router nodes in per-router batches (default: 5_000). A failed
    batch re-queues its groups, so this also bounds the retry cadence.
  * `:view_heartbeat_interval_ms`: how often each node re-announces its current
    cluster-view hash to peers AND re-offers discovery to any connected
    non-member (default: 10_000). This is the readiness-barrier and re-discovery
    backstop: it heals a dropped view announcement (and a dropped discovery, e.g.
    a coordinator that restarted in place, whose one-shot discovery was lost)
    without a membership change, bounding both the worst-case "router floods
    instead of targeting" window and the worst-case "restarted but never
    re-paired" window to one interval.
  * `:singleton_promotion_timeout_ms`: on coordinator init/restart, how long a
    scope that still sees only itself waits before self-promoting to singleton
    `:ready` (default: 3 * `:view_heartbeat_interval_ms`). Until this fires (or
    scope discovery/rebalance converges first), routers flood instead of trusting
    occupancy.
  * `:rpc_timeout_ms`: timeout for router-node RPCs (default: 5_000).
  * `:rebalance_gather_timeout_ms`: timeout for the synchronous in-VM call the
    coordinator makes to each claim shard to gather its held groups during a
    rebalance (default: 15_000). A shard that does not reply within this window
    crashes the coordinator (which then restarts and re-announces from a clean
    slate); raise it if shards routinely hold very large group sets.
  * `:shards_ready_timeout_ms`: how long, at init/restart, the coordinator
    waits for `Forum.Muster.ShardsReadySentinel`'s one-shot signal that every
    claim shard has finished its own init before doing anything (like a
    rebalance) that calls into them (default: 5_000). Shard init is local,
    ETS-only work with no I/O, so this should never come close to firing in a
    healthy tree; if it does, the coordinator crashes and the supervisor
    restarts it rather than hanging forever.
  * `:tombstone_window_ms`: how long a vacancy tombstone is kept in the
    occupancy table before the periodic GC sweep reaps it (default:
    `:rpc_timeout_ms` * 5). Must be long enough that an orphaned, un-cancelled
    `:occupied` or snapshot RPC (whose only delay is scheduling/network,
    bounded by `:rpc_timeout_ms` in a healthy cluster) can no longer land and
    resurrect the row; raise it alongside `:rpc_timeout_ms` if RPCs are
    routinely slower than that.
  * `:message_module`: module implementing `Forum.Adapter` (default:
    `Forum.Adapter.ErlDist`).
  * `:max_restarts`: max restarts allowed for this scope's own supervision
    tree within `:max_seconds`, before it gives up and exits (default: 3,
    matching `Supervisor`'s own default). Raise this (and/or `:max_seconds`)
    to make the scope tolerate a higher crash-loop frequency without
    propagating an exit to whatever supervises it.
  * `:max_seconds`: the time window `:max_restarts` is measured over
    (default: 5, matching `Supervisor`'s own default).
  """
  @spec start_link(atom, [start_option]) :: Supervisor.on_start()
  def start_link(scope, opts \\ []) when is_atom(scope) do
    {partitions, opts} = Keyword.pop(opts, :partitions, System.schedulers_online())

    if not (is_integer(partitions) and partitions >= 1) do
      raise ArgumentError,
            "expected :partitions to be a positive integer, got: #{inspect(partitions)}"
    end

    cooldown = Keyword.get(opts, :vacancy_cooldown_ms)

    if cooldown != nil and not (is_integer(cooldown) and cooldown >= 0) do
      raise ArgumentError,
            "expected :vacancy_cooldown_ms to be a non-negative integer, got: #{inspect(cooldown)}"
    end

    flush_interval = Keyword.get(opts, :vacant_flush_interval_ms)

    if flush_interval != nil and not (is_integer(flush_interval) and flush_interval > 0) do
      raise ArgumentError,
            "expected :vacant_flush_interval_ms to be a positive integer, got: #{inspect(flush_interval)}"
    end

    heartbeat_interval = Keyword.get(opts, :view_heartbeat_interval_ms)

    if heartbeat_interval != nil and
         not (is_integer(heartbeat_interval) and heartbeat_interval > 0) do
      raise ArgumentError,
            "expected :view_heartbeat_interval_ms to be a positive integer, got: #{inspect(heartbeat_interval)}"
    end

    singleton_promotion_timeout = Keyword.get(opts, :singleton_promotion_timeout_ms)

    if singleton_promotion_timeout != nil and
         not (is_integer(singleton_promotion_timeout) and singleton_promotion_timeout > 0) do
      raise ArgumentError,
            "expected :singleton_promotion_timeout_ms to be a positive integer, got: #{inspect(singleton_promotion_timeout)}"
    end

    gather_timeout = Keyword.get(opts, :rebalance_gather_timeout_ms)

    if gather_timeout != nil and not (is_integer(gather_timeout) and gather_timeout > 0) do
      raise ArgumentError,
            "expected :rebalance_gather_timeout_ms to be a positive integer, got: #{inspect(gather_timeout)}"
    end

    shards_ready_timeout = Keyword.get(opts, :shards_ready_timeout_ms)

    if shards_ready_timeout != nil and
         not (is_integer(shards_ready_timeout) and shards_ready_timeout > 0) do
      raise ArgumentError,
            "expected :shards_ready_timeout_ms to be a positive integer, got: #{inspect(shards_ready_timeout)}"
    end

    tombstone_window = Keyword.get(opts, :tombstone_window_ms)

    if tombstone_window != nil and not (is_integer(tombstone_window) and tombstone_window > 0) do
      raise ArgumentError,
            "expected :tombstone_window_ms to be a positive integer, got: #{inspect(tombstone_window)}"
    end

    max_restarts = Keyword.get(opts, :max_restarts)

    if max_restarts != nil and not (is_integer(max_restarts) and max_restarts >= 0) do
      raise ArgumentError,
            "expected :max_restarts to be a non-negative integer, got: #{inspect(max_restarts)}"
    end

    max_seconds = Keyword.get(opts, :max_seconds)

    if max_seconds != nil and not (is_integer(max_seconds) and max_seconds > 0) do
      raise ArgumentError,
            "expected :max_seconds to be a positive integer, got: #{inspect(max_seconds)}"
    end

    Forum.Supervisor.start_link(Forum.Muster.Scope, scope, partitions, opts)
  end

  @doc """
  Join `pid` to `group` in `scope`.

  `pid` is handed to the group's claim shard (`Forum.Muster.Shard`, chosen by
  `phash2(group)` so a join storm across distinct groups spreads over N shard
  mailboxes), which both registers the member locally and, if this is the first
  local member of `group`, notifies the router node via a synchronous `:occupied`
  RPC. The shard owns the member monitor as well as the claim state, so the router
  is never told a group is occupied before a monitored local member exists: a
  caller that dies mid-join can never leave the router believing we hold a group we
  don't. If the `:occupied` RPC fails the join fails and `pid` is not registered
  locally; the next call to `join/3` will retry the RPC.

  If the group was recently vacant (in cooldown, or queued/in-flight for a
  vacant flush), the join reclaims it without re-notifying the router where
  it can, so a quick leave/join cycle costs no RPC.

  The shard's per-group state lives in a Supervisor-owned ETS table (its single
  source of truth), so it survives a shard crash: on restart the shard reconciles
  the table against the live member counts, and never forgets an outstanding router
  assertion, so a shard crash cannot orphan a `{group, node}` entry on a (local or
  remote) router.

  Returns `{:error, :draining}` if this node has begun a graceful cluster-leave
  (`drain/2`): once leaving, the node is being rebalanced out of every peer's
  ring, so a new first-member join could produce a local member with no occupancy
  row on any router (silently missing from every broadcast). The join fails loudly
  instead. The host app should stop accepting new joins at SIGTERM anyway (see
  `drain/2`); this is defense-in-depth for a stray join that races the drain.
  """
  @spec join(atom, group, pid) :: :ok | {:error, :not_local | :draining | :rpc_failed | term}
  def join(_scope, _group, pid) when is_pid(pid) and node(pid) != node(),
    do: {:error, :not_local}

  def join(scope, group, pid) when is_atom(scope) and is_pid(pid) do
    if :persistent_term.get({Forum.Muster, scope, :accepting_joins}, true) do
      call_shard(scope, group, {:join, group, pid})
    else
      {:error, :draining}
    end
  end

  @doc "Remove `pid` from `group` in `scope`."
  @spec leave(atom, group, pid) :: :ok | {:error, term}
  def leave(scope, group, pid) when is_atom(scope) and is_pid(pid) do
    call_shard(scope, group, {:leave, group, pid})
  end

  @doc """
  Gracefully evacuates this node's **router role** before it leaves the cluster,
  and blocks until the evacuation is acknowledged.

  A Muster node plays two independent roles. Its **source role** (holding local
  members) needs no Muster mechanism on shutdown: as the host app disconnects its
  clients, membership drops to 0 and the normal vacant-flush retracts occupancy.
  Its **router role** is the one only a *pre-death* handoff can protect: by
  consistent hashing this node is the elected router for ~1/N of all groups, and
  if it dies abruptly a peer's first-member join still hashes to it, fires a
  synchronous `:occupied` claim to a corpse, and ends up with a local member that
  has no occupancy row on any router silently missing from every broadcast.

  `drain/2` closes that window while the node is *still alive*: it broadcasts a
  leave (`{:muster_leaving, coordinator_pid, view_seq}`), and each peer rebalances
  this node out of its ring (routing its share to the newly-elected routers and
  re-announcing the groups it holds) and only *then* acks
  (`{:muster_leaving_ack, node}`) so an ack means that peer's handoff is done.
  Because this node stays alive after each peer evicts it, a write its shards or
  rebalance workers had already put on the wire could otherwise land afterwards
  and resurrect it as a fan-out target. The `view_seq` on the leave is the peer's
  departure watermark, which rejects such a snapshot; a late claim, which no
  watermark can stop, is collected when the peer sees this node actually die.
  `drain` returns only once **every peer has acked** and then waits a
  `settle_ms` window (still servicing inbound RPCs) so in-flight broadcasts routed
  here just before the handoff can fan out.

  This node keeps its own full ring/view and does not rebalance itself, not even
  if a peer dies mid-drain. Other peers rebalance it out. It stays draining for
  the whole call: all outbound self-assertion (heartbeat, re-discovery) is
  suppressed so no peer re-pairs it, while inbound coordination RPCs keep being
  serviced. It also publishes `:rebalancing` for the whole drain, so
  `targets/3` on it returns `{:error, :flood}` and `router/2` returns the full
  member list: from the first peer's eviction on, its occupancy table is no
  longer maintained (that peer's new claims go to the newly-elected router), so a
  sender still routing here under the old view must flood rather than trust it.

  ## Shutdown sequencing (host-app contract)

  `drain` handles ONLY the router role. Call it **late** in shutdown, in order:

    1. On SIGTERM, close the listener to new connections (the
       load balancer has usually already pulled the node).
    2. Close/migrate existing websockets; each leaving socket retracts its
       occupancy on the current router via the normal vacant-flush.
    3. Give step 2 a few seconds to drain (well inside the grace period).
    4. Call `drain/2`.
    5. **Only then** halt.

  **`drain` is terminal**: it leaves the node draining with its heartbeat off,
  so a node that calls `drain` but does not actually die (e.g. an aborted deploy)
  is stranded until it restarts. Call it only when truly shutting down.

  ## Options

    * `:timeout_ms` (default `5_000`): how long to wait for every peer to ack
      before giving up and returning `{:timeout, unacked_nodes}`.
    * `:settle_ms` (default `5_000`): the post-ack in-flight-drain window. It
      should be at least the scope's `:rpc_timeout_ms` so an RPC a peer
      dispatched to us just before evicting us can still land; this is not
      enforced.

  Returns `:ok` once all peers acked and the settle elapsed, or
  `{:timeout, unacked_nodes}` if some peer did not ack within `:timeout_ms`. A
  singleton (no peers) returns `:ok` immediately. A peer that *dies* mid-drain
  (rather than acking) is treated as departed: it is dropped from the wait rather
  than counted as unacked, so a peer crashing during a rolling restart does not
  make `drain` block the full `:timeout_ms`. A second call while a drain is
  already in flight (or after one completed) returns `{:error, :already_draining}`
  without disturbing the first.
  """
  @spec drain(atom, keyword) :: :ok | {:timeout, [node]} | {:error, :already_draining}
  def drain(scope, opts \\ []) when is_atom(scope) do
    timeout = Keyword.get(opts, :timeout_ms, 5_000)
    settle = Keyword.get(opts, :settle_ms, 5_000)

    GenServer.call(
      Forum.Supervisor.name(scope),
      {:drain, timeout, settle},
      timeout + settle + 1_000
    )
  end

  @doc """
  Returns the router node for `group` in `scope`.

  * `{:ok, node}`: our ring is settled (`:converging` or `:ready`); route to
    `node`. (If the chosen router's own table isn't complete yet it will fall
    back to flooding; see `can_decide?/2`.)
  * `{:rebalancing, [node]}`: the local Scope's ring is in flux. The router
    mapping is unreliable; callers using their own transport should fan out to
    every node in the list rather than targeting a single router.
  """
  @spec router(atom, group) :: {:ok, node} | {:rebalancing, [node]}
  def router(scope, group) when is_atom(scope) do
    case :persistent_term.get({Forum.Muster, scope, :status}) do
      :rebalancing ->
        {:ok, members} = ExHashRing.Ring.get_nodes(ring_name(scope))
        {:rebalancing, members}

      _converging_or_ready ->
        ExHashRing.Ring.find_node(ring_name(scope), group)
    end
  end

  @doc "Returns the current Muster cluster member nodes for `scope`."
  @spec members(atom) :: [node]
  def members(scope) when is_atom(scope) do
    {:ok, ns} = ExHashRing.Ring.get_nodes(ring_name(scope))
    ns
  end

  @doc """
  Returns the current lifecycle status for `scope`.

  * `:ready`: every member's latest announced view agrees with ours, so this
    node's router-role occupancy table is complete and can be trusted (see
    `can_decide?/2`). `:ready` also implies the ring is settled.
  * `:converging`: the ring is adopted but not every peer has agreed on our view
    yet; as a router this node floods rather than trust its occupancy table.
  * `:rebalancing`: the ring is in flux; `router/2` returns the full member list
    so callers fan out to everyone.
  * `:unknown`: the scope's coordinator has not published a status yet (e.g. it
    is still starting up, or `scope` names no running Muster).
  """
  @spec status(atom) :: lifecycle_status()
  def status(scope) when is_atom(scope) do
    :persistent_term.get({Forum.Muster, scope, :status}, :unknown)
  end

  @doc """
  Returns the current cluster-view hash for `scope`.

  Senders tag each broadcast with this so the router can tell whether it
  agrees about cluster membership (see `can_decide?/2`).
  """
  @spec view_hash(atom) :: non_neg_integer
  def view_hash(scope) when is_atom(scope) do
    :persistent_term.get({Forum.Muster, scope, :view_hash})
  end

  @doc """
  The consistent-hashing parameters every Muster ring is built with.

  Returned as a keyword list ready to pass to `ExHashRing.Ring.start_link/1`
  (`[replicas: ..., depth: ...]`). Anything outside Muster that reconstructs a
  scope's ring — e.g. to compute the router a *remote* scope would pick without
  running that scope locally — must build its ring with exactly these values, or
  it will hash groups to different nodes.
  """
  @spec ring_config() :: [replicas: pos_integer(), depth: pos_integer()]
  def ring_config, do: [replicas: @ring_replicas, depth: @ring_depth]

  @doc """
  The cluster-view hash a scope would publish for the member set `members`.

  This is the exact function Muster uses internally to derive the `view_hash`
  senders tag broadcasts with (see `view_hash/1`), exposed so a caller can
  reproduce a *remote* scope's hash from that scope's member set without running
  it. `members` must be the scope's membership as Muster keeps it: de-duplicated
  and sorted (`Enum.uniq |> Enum.sort`), otherwise the hash will not match.
  """
  @spec view_hash_for_members([node()]) :: non_neg_integer()
  def view_hash_for_members(members) when is_list(members), do: :erlang.phash2(members)

  @doc """
  Whether this node, as the router for a broadcast tagged `sender_view_hash`,
  can confidently decide its fan-out targets from the occupancy table.

  Returns `false` unless this node is `:ready` (every member's latest announced
  view agrees with ours, so our occupancy table is complete) AND it agrees with
  the sender about cluster membership. `:ready` already implies the ring is
  settled. When false, the caller should fan out to all nodes instead of
  trusting the occupancy table.

  Most callers want `targets/3`, which folds this check and the occupancy read
  into one result; use `can_decide?/2` directly only when you need the boolean
  on its own.
  """
  @spec can_decide?(atom, non_neg_integer) :: boolean
  def can_decide?(scope, sender_view_hash) when is_atom(scope) do
    :persistent_term.get({Forum.Muster, scope, :status}) == :ready and
      :persistent_term.get({Forum.Muster, scope, :view_hash}) == sender_view_hash
  end

  @doc """
  Returns the fan-out targets for a broadcast to `group` tagged with the
  sender's `sender_view_hash`. Run this **on the router node** for `group` (see
  `router/2`).

  This is the single read a router should use to pick its delivery set: it folds
  the readiness barrier (`can_decide?/2`) and the occupancy lookup into one step,
  so a caller can never read occupancy without first confirming the table can be
  trusted.

  * `{:ok, [node]}`: this node is `:ready` and agrees with the sender about
    cluster membership, so its router-role occupancy table is complete and
    authoritative. Deliver to exactly these source nodes (may be empty, meaning
    nobody holds the group).
  * `{:error, :flood}`: the barrier is not satisfied (still `:converging`, the
    sender disagrees about membership, or a coordinator restart shrank our view).
    The occupancy table cannot be trusted, so the caller must over-deliver
    instead of risking a miss. Muster does not pick the flood set: the caller
    fans out to whatever "everyone" means for its transport (e.g. all nodes in
    the region), which is intentionally *not* `members/2`. A freshly-restarted
    coordinator resets its ring to just `[node()]`, so the ring view can be
    incomplete in exactly the situation that triggers a flood.
  """
  @spec targets(atom, group, non_neg_integer) :: {:ok, [node]} | {:error, :flood}
  def targets(scope, group, sender_view_hash) when is_atom(scope) do
    if can_decide?(scope, sender_view_hash) do
      {:ok, Scope.occupancy(scope, group)}
    else
      {:error, :flood}
    end
  end

  @doc """
  Returns the source nodes this node's router-role occupancy table currently
  holds for `group` in `scope` — the raw table content.

  Unlike `targets/3` this is **not** barrier-gated: it does not consult
  `can_decide?/2`, so it reflects what this node believes about `group` even when
  a broadcast would flood. Intended for inspection/debugging
  """
  @spec occupancy(atom, group) :: [node]
  def occupancy(scope, group) when is_atom(scope) do
    Scope.occupancy(scope, group)
  end

  defp ring_name(scope), do: :"#{scope}_muster_ring"

  @doc "List local pids registered to `group` in `scope`."
  @spec local_members(atom, group) :: [pid]
  def local_members(scope, group) when is_atom(scope) do
    Shard.members(scope, group)
  end

  @doc "Whether `pid` is a local member of `group` in `scope`."
  @spec local_member?(atom, group, pid) :: boolean
  def local_member?(scope, group, pid) when is_atom(scope) and is_pid(pid) do
    Shard.member?(scope, group, pid)
  end

  @doc "Local member count for `group` in `scope`."
  @spec local_member_count(atom, group) :: non_neg_integer
  def local_member_count(scope, group) when is_atom(scope) do
    Shard.member_count(scope, group)
  end

  defp call_shard(scope, group, msg) do
    GenServer.call(Forum.Supervisor.shard(scope, group), msg, @claim_call_timeout)
  catch
    :exit, reason -> {:error, {:scope_exit, reason}}
  end

  @doc """
  Prints a human-readable snapshot of `scope`'s Muster state and returns `:ok`.

  Handy from IEx while playing with a cluster: shows the lifecycle status, the
  cluster-view hash, the ring members, known peers, each peer's last-announced
  `{view hash, announce watermark}`, the per-group state machine, and the
  router-role occupancy table
  (`group => [source_node]`). Pair it with `Logger.configure(level: :debug)` to
  also watch the per-group churn scroll by.
  """
  @spec dump(atom) :: :ok
  def dump(scope) when is_atom(scope) do
    snapshot = GenServer.call(Forum.Supervisor.name(scope), :dump)
    IO.puts(format_dump(snapshot))
  end

  @doc """
  Returns a cheap, summarised snapshot of `scope`, safe to poll (e.g. from an
  admin dashboard or metrics).

  Unlike `dump/1` this never gathers per-group state from the shards or copies
  the occupancy table.

  Returns a map with:

    * `:scope`, `:status`, `:view_hash` - lifecycle identity (persistent_term).
    * `:members` - the coordinator's current member list.
    * `:ring_nodes` - the ring's current node set.
    * `:peers`, `:owed_snapshots` - counts of connected peers / outstanding
      owed snapshots.
    * `:applied_snapshot_seq` - last applied snapshot sequence.
    * `:occupancy_row_count` - present rows in the router-role occupancy table.
    * `:occupancy_rows_by_node` - `%{source_node => count}` of those rows over
      the ring's members (the per-node sum can trail `:occupancy_row_count` by
      any rows whose source has since left the ring).
    * `:group_state_counts` - `%{state => count}` across all shards, plus
      `:total`.
  """
  @spec summary(atom) :: summary()
  def summary(scope) when is_atom(scope) do
    coord = GenServer.call(Forum.Supervisor.name(scope), :summary)

    Map.merge(coord, %{
      scope: scope,
      status: status(scope),
      view_hash: view_hash(scope),
      ring_nodes: members(scope),
      occupancy_row_count: Scope.occupancy_row_count(scope),
      occupancy_rows_by_node: Scope.occupancy_rows_by_node(scope),
      group_state_counts: Scope.group_state_counts(scope)
    })
  end

  defp format_dump(s) do
    grouped =
      Enum.group_by(s.group_states, fn {_g, st} -> group_state_label(st) end, &elem(&1, 0))

    group_lines =
      if grouped == %{} do
        ["  (none)"]
      else
        Enum.map(grouped, fn {label, groups} ->
          "  #{label} (#{length(groups)}): #{inspect(Enum.sort(groups))}"
        end)
      end

    occupancy_lines =
      if s.occupancy == %{} do
        ["  (empty)"]
      else
        Enum.map(s.occupancy, fn {group, nodes} ->
          "  #{inspect(group)} => #{inspect(Enum.sort(nodes))}"
        end)
      end

    [
      "Muster #{inspect(s.scope)} @ #{inspect(node())}",
      "  status:       #{inspect(s.status)}",
      "  view_hash:    #{inspect(s.view_hash)}",
      "  members:      #{inspect(s.members)}",
      "  ring_nodes:   #{inspect(s.ring_nodes)}",
      "  peers:        #{inspect(s.peers)}",
      "  member_views: #{inspect(s.member_views)}",
      "  owed_snaps:   #{inspect(s.owed_snapshots)}",
      "  applied_snap: #{inspect(s.applied_snapshot_seq)}",
      "  cooldown:     #{inspect(Enum.sort(s.cooldown))}",
      "group_states:" | group_lines
    ]
    |> Kernel.++(["occupancy (as router):" | occupancy_lines])
    |> Enum.join("\n")
  end

  defp group_state_label(:occupied), do: ":occupied"
  defp group_state_label(:cooldown), do: ":cooldown"
  defp group_state_label(:vacant_queued), do: ":vacant_queued"
  defp group_state_label({:occupied_pending, _}), do: ":occupied_pending"
  defp group_state_label(:vacant_flushing), do: ":vacant_flushing"
end
