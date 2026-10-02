defmodule Realtime.GenRpcPubSub.RegionRings do
  @moduledoc """
  Maintains a local, best-effort copy of every *other* region's Muster ring so a
  broadcaster can compute the router a remote region would pick for a tenant —
  without running that region's Muster scope locally.

  Each region a node participates in runs its own Muster scope
  (`:realtime_channels_<region>`), and Muster derives a group's router purely from
  the scope's **member set** using fixed consistent-hashing parameters
  (`Forum.Muster.ring_config/0`). Because that computation depends only on the node
  set, we can reproduce a remote region's routing by building an `ExHashRing.Ring`
  with the same config over that region's nodes — which we already know from
  `Realtime.Nodes.region_nodes/1` (the syn `RegionNodes` group).

  For each other region we keep:

    * an `ExHashRing.Ring` process whose node set tracks `region_nodes/1`, and
    * the `view_hash` that region's scope would publish for that node set
      (`Forum.Muster.view_hash_for_members/1`), cached alongside.

  `expected_router/2` reads both without touching this GenServer (lock-free ETS +
  ring reads), so it is safe on the broadcast hot path.

  ## Freshness and correctness

  Rings are resynced from syn `RegionNodes` group membership events (see
  `Realtime.SynHandler.on_process_joined/5`), which fire only once syn has a node's
  region metadata — the right signal, unlike raw `:nodeup` which precedes it. A
  periodic backstop reconciles anything a dropped event missed.

  Staleness is never a *correctness* problem: the receiving router re-validates that
  it really is the router and floods its region on any mismatch, and the
  `view_hash` we pass drives Muster's readiness barrier (a diverged view fails it
  and floods). Staleness only costs a fallback flood, never a missed delivery.
  """

  use GenServer
  require Logger

  alias Forum.Muster
  alias Realtime.Nodes

  @table :realtime_region_router_rings
  @default_reconcile_interval_ms :timer.minutes(5)

  # Reserved row in @table caching the full cluster region set
  @all_regions_key :__all_regions__

  defmodule State do
    @moduledoc false

    @typedoc "A region's ring: its process name and pid."
    @type ring :: {name :: atom(), pid()}

    @type t :: %__MODULE__{
            # region => the ExHashRing process backing it
            rings: %{optional(String.t()) => ring()},
            # region => the node set last applied to its ring, so an unchanged
            # reconcile can skip the non-idempotent `set_nodes`
            members: %{optional(String.t()) => MapSet.t(node())},
            # last full region set written to the cache row, so an unchanged
            # reconcile can skip rewriting it (nil until the first reconcile)
            all_regions: [String.t()] | nil,
            # ETS table holding {region, ring_name, view_hash} for lock-free reads
            table: atom(),
            # reconcile backstop interval, in ms
            interval: non_neg_integer()
          }

    @enforce_keys [:table, :interval]
    defstruct rings: %{}, members: %{}, all_regions: nil, table: nil, interval: nil
  end

  ## Client

  def start_link(opts) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  Returns the router `group` would map to in `region`, plus the `view_hash` that
  region's scope would publish for its current membership.

  * `{:ok, node, view_hash}` — hand the broadcast to `node` (tagged with
    `view_hash`); the receiver confirms via `Forum.Muster.targets/3` or floods.
  * `:error` — no ring for `region` yet (registry not started, region unknown, or
    empty). The caller should fall back to flooding the region.

  `table` selects the backing ETS table
  """
  @spec expected_router(String.t(), Forum.group(), atom()) ::
          {:ok, node(), non_neg_integer()} | :error
  def expected_router(region, group, table \\ @table) when is_binary(region) do
    with [{^region, ring_name, view_hash}] <- :ets.lookup(table, region),
         {:ok, node} <- ExHashRing.Ring.find_node(ring_name, group) do
      {:ok, node, view_hash}
    else
      _ -> :error
    end
  rescue
    # Table doesn't exist yet (registry not started); :ets.lookup raises here.
    ArgumentError -> :error
  end

  @doc """
  Returns the cached full cluster region set — the same value
  `Realtime.Nodes.all_node_regions/0` would return (sorted, de-duplicated) —
  maintained by `reconcile/1`.

  This is the broadcast hot path's read: a single lock-free ETS lookup instead of
  the full-table `:syn.group_names/1` scan on every message. Falls back to a live
  syn read when the cache row or table is not present yet (registry still
  starting, or between a crash and the rebuilding reconcile), so it is never less
  fresh than reading syn directly.

  `table` selects the backing ETS table.
  """
  @spec all_node_regions(atom()) :: [String.t()]
  def all_node_regions(table \\ @table) do
    case :ets.lookup(table, @all_regions_key) do
      [{@all_regions_key, regions}] -> regions
      [] -> Nodes.all_node_regions()
    end
  rescue
    # Table doesn't exist yet (registry not started); :ets.lookup raises here.
    ArgumentError -> Nodes.all_node_regions()
  end

  defp ring_name(table, region), do: :"#{table}_ring_#{region}"

  ## Server

  @impl true
  def init(opts) do
    Process.flag(:trap_exit, true)
    table = Keyword.get(opts, :table, @table)
    :ets.new(table, [:named_table, :protected, :set, read_concurrency: true])

    interval = Keyword.get(opts, :reconcile_interval_ms, @default_reconcile_interval_ms)

    # Refresh precisely when syn learns a node's region membership (metadata
    # attached), rather than on raw :nodeup which precedes propagation.
    :telemetry.attach_many(
      {__MODULE__, self()},
      [[:syn, RegionNodes, :joined], [:syn, RegionNodes, :left]],
      &__MODULE__.handle_syn_event/4,
      self()
    )

    state = %State{table: table, interval: interval}
    state = if Keyword.get(opts, :reconcile_on_init, true), do: reconcile(state), else: state
    Process.send_after(self(), :reconcile, state.interval)
    {:ok, state}
  end

  @impl true
  def handle_info(:reconcile, state) do
    state = reconcile(state)
    Process.send_after(self(), :reconcile, state.interval)
    {:noreply, state}
  end

  # A syn RegionNodes membership change coalesces into a single reconcile.
  def handle_info(:syn_changed, state), do: {:noreply, reconcile(state)}

  # A ring process exited; drop it so the reconcile below restarts it.
  def handle_info({:EXIT, pid, reason}, %State{} = state) do
    case Enum.find(state.rings, fn {_region, {_name, ring_pid}} -> ring_pid == pid end) do
      {region, _} ->
        Logger.warning("RegionRings ring for #{region} exited: #{inspect(reason)}; rebuilding")
        :ets.delete(state.table, region)

        state = %State{
          state
          | rings: Map.delete(state.rings, region),
            members: Map.delete(state.members, region)
        }

        {:noreply, reconcile(state)}

      nil ->
        {:noreply, state}
    end
  end

  def handle_info(_msg, state), do: {:noreply, state}

  @impl true
  def terminate(_reason, _state) do
    :telemetry.detach({__MODULE__, self()})
    :ok
  end

  @doc false
  # Runs in the telemetry-emitting (syn) process: keep it to a single send.
  def handle_syn_event(_event, _measurements, _meta, server_pid) do
    send(server_pid, :syn_changed)
  end

  ## Internal

  @spec reconcile(State.t()) :: State.t()
  defp reconcile(%State{} = state) do
    own_region = Nodes.region()
    all_regions = Nodes.all_node_regions()

    if all_regions != state.all_regions do
      :ets.insert(state.table, {@all_regions_key, all_regions})
    end

    wanted = Enum.reject(all_regions, &(&1 == own_region))

    # Add/update rings for every other region. Rings for regions that go away
    # (a deployment draining a region) are left in place: they're rare, harmless
    # to keep, and staleness only ever costs a fallback flood, never a delivery.
    {rings, members} =
      Enum.reduce(wanted, {state.rings, state.members}, fn region, {rings, members} ->
        nodes = Nodes.region_nodes(region)
        desired = MapSet.new(nodes)
        existing? = Map.has_key?(rings, region)
        {name, _pid} = entry = ensure_ring(state.table, region, rings)

        # `set_nodes` advances an ex_hash_ring generation and is not idempotent,
        # so only touch the ring when the region's node set actually changed (or
        # the ring was just (re)created). Node ordering is ignored — a MapSet
        # comparison keeps a reordered-but-equal membership from bumping a
        # generation.
        if not existing? or not MapSet.equal?(Map.get(members, region), desired) do
          {:ok, _} = ExHashRing.Ring.set_nodes(name, nodes)
          :ets.insert(state.table, {region, name, Muster.view_hash_for_members(nodes)})
        end

        {Map.put(rings, region, entry), Map.put(members, region, desired)}
      end)

    %State{state | rings: rings, members: members, all_regions: all_regions}
  end

  defp ensure_ring(table, region, rings) do
    case Map.get(rings, region) do
      {_name, _pid} = entry ->
        entry

      nil ->
        name = ring_name(table, region)
        {:ok, pid} = start_ring(name)
        {name, pid}
    end
  end

  defp start_ring(name) do
    opts = [{:name, name}, {:nodes, []} | Muster.ring_config()]

    case ExHashRing.Ring.start_link(opts) do
      {:ok, pid} -> {:ok, pid}
      # A prior incarnation's ring is still shutting down; adopt it.
      {:error, {:already_started, pid}} -> {:ok, pid}
    end
  end
end
