defmodule Realtime.GenRpcPubSub do
  @moduledoc """
  gen_rpc Phoenix.PubSub adapter
  """

  @behaviour Phoenix.PubSub.Adapter
  alias Forum.Muster
  alias Realtime.FeatureFlags
  alias Realtime.GenRpc
  alias Realtime.GenRpcPubSub.RegionRings
  alias Realtime.GenRpcPubSub.Worker
  alias Realtime.Nodes
  use Supervisor

  @impl true
  def node_name(_), do: node()

  # Supervisor callbacks

  def start_link(opts) do
    adapter_name = Keyword.fetch!(opts, :adapter_name)
    name = Keyword.fetch!(opts, :name)
    pool_size = Keyword.get(opts, :pool_size, 1)
    broadcast_pool_size = Keyword.get(opts, :broadcast_pool_size, pool_size)

    Supervisor.start_link(__MODULE__, {adapter_name, name, broadcast_pool_size},
      name: :"#{name}#{adapter_name}_supervisor"
    )
  end

  @impl true
  def init({adapter_name, pubsub, pool_size}) do
    workers = for number <- 1..pool_size, do: :"#{pubsub}#{adapter_name}_#{number}"

    :persistent_term.put(adapter_name, List.to_tuple(workers))

    children =
      for worker <- workers do
        Supervisor.child_spec({Realtime.GenRpcPubSub.Worker, {pubsub, worker}}, id: worker)
      end

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp worker_name(adapter_name, key) do
    workers = :persistent_term.get(adapter_name)
    elem(workers, :erlang.phash2(key, tuple_size(workers)))
  end

  @impl true
  def broadcast(adapter_name, topic, {:tb, tenant_id, _inner} = message, dispatcher) do
    if FeatureFlags.enabled?("use_muster_broadcast", tenant_id) do
      muster_broadcast(adapter_name, topic, tenant_id, message, dispatcher)
    else
      flood_all(adapter_name, topic, message, dispatcher)
    end
  end

  def broadcast(adapter_name, topic, message, dispatcher) do
    flood_all(adapter_name, topic, message, dispatcher)
  end

  # Original behavior: fan a broadcast out to every other node in the region (:ftl)
  # plus one representative per other region (:ftr, which re-floods its own region).
  defp flood_all(adapter_name, topic, message, dispatcher) do
    worker = worker_name(adapter_name, self())
    my_region = Nodes.region()

    intra_region_flood(worker, my_region, topic, message, dispatcher)

    # send a message to a node in each region to forward to the rest of the region
    other_region_nodes = nodes_from_other_regions(my_region, self())
    GenRpc.abcast(other_region_nodes, worker, Worker.forward_to_region(topic, message, dispatcher), key: self())

    :ok
  end

  # Feature-flagged (`use_muster_broadcast`): ask Muster which nodes actually hold
  # the tenant and deliver only to those, instead of flooding whole regions. This
  # applies both within the origin's own region (via the local Muster scope) and
  # across regions (via a locally-reconstructed copy of each remote region's ring;
  # see `RegionRings`).
  #
  # NOTE: correctness relies on the tenant's connections being registered in Muster
  # (the separate `use_muster_channel_join` flag). Enable this flag only for tenants
  # that already have that one on, otherwise `Muster.targets/3` legitimately returns
  # an empty set and remote deliveries are dropped.
  defp muster_broadcast(adapter_name, topic, tenant_id, message, dispatcher) do
    worker = worker_name(adapter_name, self())
    my_region = Nodes.region()
    scope = Application.get_env(:realtime, :muster_scope)

    # Cross-region: route to each remote region's expected router, or flood that
    # region when we have no ring for it yet.
    cross_region_route(worker, my_region, tenant_id, topic, message, dispatcher)

    # Intra-region: route to the node Muster says owns this tenant's occupancy.
    case Muster.router(scope, tenant_id) do
      {:ok, router_node} when router_node == node() ->
        # We are the router: resolve the targets right here and :ftl them, rather than
        # bouncing the work through our own worker's mailbox. The origin already
        # delivered to its local subscribers via Phoenix, so it is excluded.
        nodes = Worker.targets_or_flood(scope, tenant_id, my_region, Muster.view_hash(scope))
        abcast_local(worker, nodes, topic, message, dispatcher)

      {:ok, router_node} ->
        # Remote router: hand it the routing decision over the network. Fire-and-forget,
        route = Worker.route(tenant_id, topic, message, dispatcher, node(), Muster.view_hash(scope))
        GenRpc.abcast([router_node], worker, route, key: self())

      _ ->
        # Routing is unreliable while the ring is in flux (or not available):
        # over-deliver to the whole region (minus the origin).
        intra_region_flood(worker, my_region, topic, message, dispatcher)
    end

    :ok
  end

  # Origin-side :ftl to `nodes`, excluding this node: the origin already delivered to
  # its own subscribers via Phoenix.PubSub's local dispatch.
  defp abcast_local(worker, nodes, topic, message, dispatcher) do
    other_nodes = for n <- nodes, n != node(), do: n
    GenRpc.abcast(other_nodes, worker, Worker.forward_to_local(topic, message, dispatcher), key: self())
    :ok
  end

  defp intra_region_flood(worker, my_region, topic, message, dispatcher) do
    abcast_local(worker, Nodes.region_nodes(my_region), topic, message, dispatcher)
  end

  defp nodes_from_other_regions(my_region, key) do
    Enum.flat_map(RegionRings.all_node_regions(), fn
      ^my_region ->
        []

      region ->
        case Nodes.node_from_region(region, key) do
          {:ok, node} -> [node]
          _ -> []
        end
    end)
  end

  # For each region other than our own, hand the broadcast to the node we expect to
  # be that region's Muster router for this tenant (computed from a local copy of
  # the region's ring). The receiver re-validates and floods its region if our guess
  # was wrong. When we have no ring for a region yet, fall back to the original
  # representative-per-region flood (`:ftr`), so cross-region delivery is never worse
  # than before Muster routing.
  defp cross_region_route(worker, my_region, tenant_id, topic, message, dispatcher) do
    Enum.each(RegionRings.all_node_regions(), fn
      ^my_region ->
        :ok

      region ->
        case RegionRings.expected_router(region, tenant_id) do
          {:ok, router_node, view_hash} ->
            route = Worker.route_region(topic, tenant_id, message, dispatcher, view_hash)
            GenRpc.abcast([router_node], worker, route, key: self())

          :error ->
            with {:ok, node} <- Nodes.node_from_region(region, self()) do
              GenRpc.abcast([node], worker, Worker.forward_to_region(topic, message, dispatcher), key: self())
            end
        end
    end)
  end

  @impl true
  def direct_broadcast(adapter_name, node_name, topic, message, dispatcher) do
    worker = worker_name(adapter_name, self())
    GenRpc.abcast([node_name], worker, Worker.forward_to_local(topic, message, dispatcher), key: self())
  end
end

defmodule Realtime.GenRpcPubSub.Worker do
  @moduledoc false
  use GenServer
  require Logger

  alias Realtime.Nodes

  defstruct [:pubsub, :worker, :scope, :my_region]

  def forward_to_local(topic, message, dispatcher), do: {:ftl, topic, message, dispatcher}
  def forward_to_region(topic, message, dispatcher), do: {:ftr, topic, message, dispatcher}

  def route(tenant_id, topic, message, dispatcher, origin, view_hash),
    do: {:route, tenant_id, topic, message, dispatcher, origin, view_hash}

  # Cross-region routed broadcast. Carries the origin-computed `view_hash` for the
  # *target* region's membership
  def route_region(topic, tenant_id, message, dispatcher, view_hash),
    do: {:route_region, topic, tenant_id, message, dispatcher, view_hash}

  # Resolve the delivery set for a tenant broadcast when this node is the router
  def targets_or_flood(scope, tenant_id, my_region, view_hash) do
    case Forum.Muster.targets(scope, tenant_id, view_hash) do
      {:ok, nodes} -> nodes
      {:error, :flood} -> Nodes.region_nodes(my_region)
    end
  end

  @doc false
  def start_link({pubsub, worker}), do: GenServer.start_link(__MODULE__, {pubsub, worker}, name: worker)

  @impl true
  def init({pubsub, worker}) do
    Process.flag(:message_queue_data, :off_heap)
    Process.flag(:fullsweep_after, 20)

    state = %__MODULE__{
      pubsub: pubsub,
      worker: worker,
      scope: Application.get_env(:realtime, :muster_scope),
      my_region: Nodes.region()
    }

    {:ok, state}
  end

  @impl true
  # Forward to local
  def handle_info({:ftl, topic, message, dispatcher} = msg, %__MODULE__{pubsub: pubsub} = state) do
    measure_presence_replication_received(topic, msg)
    RealtimeWeb.TenantBroadcaster.measure_broadcast_fanout(message)
    Phoenix.PubSub.local_broadcast(pubsub, topic, message, dispatcher)
    {:noreply, state}
  end

  # Forward to the rest of the region
  def handle_info({:ftr, topic, message, dispatcher} = msg, %__MODULE__{} = state) do
    %__MODULE__{pubsub: pubsub, worker: worker, my_region: my_region} = state
    measure_presence_replication_received(topic, msg)
    RealtimeWeb.TenantBroadcaster.measure_broadcast_fanout(message)

    # Forward to local first
    Phoenix.PubSub.local_broadcast(pubsub, topic, message, dispatcher)

    # Then broadcast to the rest of my region, keeping the message intact so the
    # downstream :ftl handlers can attribute the fan-out too.
    other_nodes = for node <- Nodes.region_nodes(my_region), node != node(), do: node

    if other_nodes != [] do
      Realtime.GenRpc.abcast(other_nodes, worker, forward_to_local(topic, message, dispatcher), [])
    end

    {:noreply, state}
  end

  # Routed broadcast (feature flag `use_muster_broadcast`): the origin named us as the
  # router for `tenant_id`. Deliver only to the nodes Muster says hold the tenant.
  def handle_info(
        {:route, tenant_id, topic, message, dispatcher, origin, view_hash},
        %__MODULE__{pubsub: pubsub, worker: worker, scope: scope, my_region: my_region} = state
      ) do
    # We are being extra catious here because Muster.targets/3 would already detect the different sender view hash
    # But this also covers if we have a bug and we just sent to the wrong node.
    nodes =
      case Forum.Muster.router(scope, tenant_id) do
        # Still the router: use the authoritative occupancy set, or over-deliver
        # to the whole region on a readiness/view-hash mismatch.
        {:ok, router_node} when router_node == node() ->
          targets_or_flood(scope, tenant_id, my_region, view_hash)

        # Router changed somehow, we have a bug or it's rebalancing at the moment
        _ ->
          Logger.warning(
            "Muster router changed during broadcast (:route) for tenant #{tenant_id}, falling back to region flood"
          )

          Nodes.region_nodes(my_region)
      end

    dispatch_to_nodes(nodes, origin, pubsub, worker, topic, message, dispatcher)

    {:noreply, state}
  end

  # Cross-region routed broadcast (feature flag `use_muster_broadcast`): a node in
  # another region computed us as the expected router for `tenant_id` in *our*
  # region and tagged the message with the view_hash it derived from the expected
  # region's membership.
  def handle_info(
        {:route_region, topic, tenant_id, message, dispatcher, view_hash},
        %__MODULE__{pubsub: pubsub, worker: worker, scope: scope, my_region: my_region} = state
      ) do
    nodes =
      case Forum.Muster.router(scope, tenant_id) do
        # We really are the router: authoritative occupancy, or a region flood on a
        # view_hash/readiness mismatch (which covers a stale sender membership view).
        {:ok, router_node} when router_node == node() ->
          targets_or_flood(scope, tenant_id, my_region, view_hash)

        # The sender's expected-router guess was stale or we are
        # rebalancing: flood our whole region rather than risk a miss.
        _ ->
          Logger.warning(
            "Muster router changed during broadcast (:route_region) for tenant #{tenant_id}, falling back to region flood"
          )

          Nodes.region_nodes(my_region)
      end

    # No origin to exclude: the sender is in another region and never holds local
    # members here, so `nil` matches no node and we deliver to the full target set.
    dispatch_to_nodes(nodes, nil, pubsub, worker, topic, message, dispatcher)

    {:noreply, state}
  end

  @impl true
  def handle_info(_, state), do: {:noreply, state}

  @presence_replication_received_event [:realtime, :presence, :replication, :received]

  # Phoenix.Tracker shards gossip on "phx_presence:<shard>" topics.
  defp measure_presence_replication_received("phx_presence:" <> _, msg) do
    :telemetry.execute(@presence_replication_received_event, %{size: :erlang.external_size(msg)}, %{
      implementation: "phoenix"
    })
  end

  defp measure_presence_replication_received(_topic, _msg), do: :ok

  # Deliver `message` to `nodes`, excluding `origin` (which already delivered to its
  # own subscribers via Phoenix.PubSub's local dispatch). Delivers locally if this
  # node is among the targets, and :ftl to the rest.
  defp dispatch_to_nodes(nodes, origin, pubsub, worker, topic, message, dispatcher) do
    self_node = node()

    # Single pass: drop the origin (it already delivered locally), flag whether this
    # node is itself a target, and collect the remote targets to :ftl.
    {local?, remote} =
      Enum.reduce(nodes, {false, []}, fn
        n, acc when n == origin -> acc
        n, {_local?, remote} when n == self_node -> {true, remote}
        n, {local?, remote} -> {local?, [n | remote]}
      end)

    if local? do
      RealtimeWeb.TenantBroadcaster.measure_broadcast_fanout(message)
      Phoenix.PubSub.local_broadcast(pubsub, topic, message, dispatcher)
    end

    if remote != [] do
      Realtime.GenRpc.abcast(remote, worker, forward_to_local(topic, message, dispatcher), [])
    end

    :ok
  end
end
