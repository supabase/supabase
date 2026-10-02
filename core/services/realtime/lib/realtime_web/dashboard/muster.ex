defmodule RealtimeWeb.Dashboard.Muster do
  @moduledoc """
  Live Dashboard page showing the Muster coordinator state for the selected node.

  It surfaces the lifecycle status (`:ready` / `:converging` / `:rebalancing`)
  plus supporting detail (view hash, members, ring nodes, peers, snapshot
  bookkeeping, and per-group state counts) so an operator can eyeball this
  node's health at a glance. Use the node picker (top-right) to switch nodes;
  the page reads the selected node from `page.node` and RPCs it for the snapshot
  (the LiveView itself always runs on the serving node).

  It also offers a **group lookup**: given a group id, it resolves the group's
  router on the inspected node (`Forum.Muster.router/2`), RPCs that router for
  the barrier-gated fan-out targets (`Forum.Muster.targets/3`), and shows both
  the inspected node's local member count and the raw occupancy the router holds
  for the group. This makes it easy to see, for one group, who would receive a
  broadcast and why (targets vs. flood).
  """
  use Phoenix.LiveDashboard.PageBuilder

  alias Realtime.GenRpc

  # Lifecycle status -> Bootstrap contextual color.
  @status_colors %{
    ready: "success",
    converging: "warning",
    rebalancing: "danger"
  }

  # Order used to render the per-group state summary.
  @group_state_order [:occupied, :cooldown, :vacant_queued, :occupied_pending, :vacant_flushing]

  @impl true
  def menu_link(_, _), do: {:ok, "Muster"}

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, group_query: nil) |> refresh_data()}
  end

  @impl true
  def handle_event("refresh", _params, socket) do
    {:noreply, refresh_data(socket)}
  end

  @impl true
  def handle_event("lookup_group", %{"group" => group}, socket) do
    query = normalize_group(group)
    {:noreply, socket |> assign(group_query: query) |> refresh_data()}
  end

  @impl true
  def handle_event("clear_group", _params, socket) do
    {:noreply, socket |> assign(group_query: nil) |> refresh_data()}
  end

  # Invoked by LiveDashboard's automatic refresh timer (enabled by default). Without
  # this, the timer would tick and re-render but never re-fetch the snapshot.
  @impl true
  def handle_refresh(socket) do
    {:noreply, refresh_data(socket)}
  end

  # Re-fetches the node snapshot and (if a group is queried) re-runs the group
  # lookup, so both stay live across the manual and automatic refresh paths.
  defp refresh_data(socket) do
    node = socket.assigns.page.node

    assign(socket,
      node_data: node_data(node),
      group_data: group_data(node, socket.assigns.group_query)
    )
  end

  defp normalize_group(group) do
    case String.trim(group) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="phx-dashboard-section">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">Muster</h5>
        <button phx-click="refresh" class="btn btn-sm btn-outline-secondary">Refresh</button>
      </div>
      <div class="card mb-3 border-primary">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong><%= @node_data.name %></strong>
          <%= if @node_data.error do %>
            <span class="badge bg-danger">unavailable</span>
          <% else %>
            <span class={"badge bg-#{status_color(@node_data.status)}"}>
              <%= inspect(@node_data.status) %>
            </span>
          <% end %>
        </div>
        <%= if @node_data.error do %>
          <div class="card-body text-danger small"><%= @node_data.error %></div>
        <% else %>
          <div class="card-body p-0">
            <table class="table table-sm table-hover mb-0">
              <thead><tr><th colspan="2" class="text-muted small ps-3">Cluster / readiness</th></tr></thead>
              <tbody>
                <tr><td class="ps-3">Scope</td><td><%= inspect(@node_data.scope) %></td></tr>
                <tr><td class="ps-3">Status</td><td><%= inspect(@node_data.status) %></td></tr>
                <tr><td class="ps-3">View Hash</td><td><code><%= inspect(@node_data.view_hash) %></code></td></tr>
                <tr><td class="ps-3">Members (<%= length(@node_data.members) %>)</td><td><%= inspect(@node_data.members) %></td></tr>
                <tr><td class="ps-3">Ring Nodes (<%= length(@node_data.ring_nodes) %>)</td><td><%= inspect(@node_data.ring_nodes) %></td></tr>
                <tr><td class="ps-3">Peers</td><td><%= @node_data.peers %></td></tr>
                <tr><td class="ps-3">Owed Snapshots</td><td><%= @node_data.owed_snapshots %></td></tr>
                <tr><td class="ps-3">Applied Snapshot Seq</td><td><%= inspect(@node_data.applied_snapshot_seq) %></td></tr>
              </tbody>
            </table>
            <table class="table table-sm table-hover mb-0 border-top">
              <thead>
                <tr><th colspan="2" class="text-muted small ps-3">As source (groups with local members)</th></tr>
              </thead>
              <tbody>
                <%= for {label, count} <- @node_data.group_counts do %>
                  <tr><td class="ps-3"><%= inspect(label) %></td><td><%= count %></td></tr>
                <% end %>
                <tr class="fw-bold"><td class="ps-3">total</td><td><%= @node_data.group_total %></td></tr>
              </tbody>
            </table>
            <table class="table table-sm table-hover mb-0 border-top">
              <thead>
                <tr><th colspan="2" class="text-muted small ps-3">As router (occupancy rows by source node)</th></tr>
              </thead>
              <tbody>
                <%= for {source_node, count} <- @node_data.occupancy_by_node do %>
                  <tr><td class="ps-3"><%= source_node %></td><td><%= count %></td></tr>
                <% end %>
                <tr class="fw-bold"><td class="ps-3">total present</td><td><%= @node_data.occupancy_row_count %></td></tr>
              </tbody>
            </table>
          </div>
        <% end %>
      </div>

      <div class="card mb-3">
        <div class="card-header"><strong>Group lookup</strong></div>
        <div class="card-body">
          <form phx-submit="lookup_group" class="d-flex gap-2 align-items-center mb-0">
            <input
              type="text"
              name="group"
              value={@group_query}
              placeholder="group id (e.g. tenant id)"
              class="form-control form-control-sm flex-grow-1"
              autocomplete="off"
            />
            <button type="submit" class="btn btn-sm btn-primary text-nowrap">Look up</button>
            <%= if @group_query do %>
              <button type="button" phx-click="clear_group" class="btn btn-sm btn-outline-secondary text-nowrap">Clear</button>
            <% end %>
          </form>

          <%= if @group_data do %>
            <%= if @group_data.error do %>
              <div class="text-danger small mt-3"><%= @group_data.error %></div>
            <% else %>
              <table class="table table-sm table-hover mb-0 mt-3" style="table-layout: fixed">
                <colgroup>
                  <col style="width: 16rem" />
                  <col />
                </colgroup>
                <tbody>
                  <tr><td class="ps-3">Group</td><td class="text-break"><code><%= inspect(@group_data.group) %></code></td></tr>
                  <tr>
                    <td class="ps-3">Inspected node</td>
                    <td class="text-break"><%= @group_data.node %></td>
                  </tr>
                  <tr>
                    <td class="ps-3">Local members here</td>
                    <td><%= @group_data.local_member_count %></td>
                  </tr>
                  <tr>
                    <td class="ps-3">Sender view hash</td>
                    <td class="text-break"><code><%= inspect(@group_data.view_hash) %></code></td>
                  </tr>
                  <tr>
                    <td class="ps-3">Router (<code>router/2</code>)</td>
                    <td class="text-break"><%= fmt_router(@group_data.router) %></td>
                  </tr>
                  <tr>
                    <td class="ps-3">Targets via router (<code>targets/3</code>)</td>
                    <td class="text-break"><%= fmt_targets(@group_data.targets) %></td>
                  </tr>
                  <tr>
                    <td class="ps-3">Router occupancy (raw, count)</td>
                    <td class="text-break"><%= fmt_occupancy(@group_data.router_occupancy) %></td>
                  </tr>
                </tbody>
              </table>
            <% end %>
          <% end %>
        </div>
      </div>
    </div>
    """
  end

  defp status_color(status), do: Map.get(@status_colors, status, "secondary")

  defp fmt_router({:ok, node}), do: to_string(node)
  defp fmt_router({:rebalancing, nodes}), do: "rebalancing — fan out to #{inspect(nodes)}"

  defp fmt_targets({:ok, nodes}),
    do: "#{inspect(Enum.sort(nodes))} (#{length(nodes)} node#{plural(nodes)})"

  defp fmt_targets({:error, :flood}),
    do: "flood — barrier not satisfied (converging, or sender/router view mismatch)"

  defp fmt_targets({:rebalancing, nodes}),
    do: "rebalancing — no single router; fan out to #{inspect(nodes)}"

  defp fmt_targets({:error, :rpc_error, reason}), do: "router RPC failed: #{inspect(reason)}"

  defp fmt_occupancy(nodes) when is_list(nodes),
    do: "#{inspect(Enum.sort(nodes))} (#{length(nodes)})"

  defp fmt_occupancy({:rebalancing, _nodes}), do: "—"
  defp fmt_occupancy({:error, :rpc_error, reason}), do: "router RPC failed: #{inspect(reason)}"

  defp plural([_]), do: ""
  defp plural(_), do: "s"

  # The page LiveView always runs on the serving node; `page.node` is the node
  # chosen in the picker (a URL param). So we gather locally only when that node
  # IS us, and RPC to gather_local_info/0 on the selected node otherwise.
  defp node_data(target) do
    base = %{name: target, error: nil}

    result =
      if target == node() do
        gather_local_info()
      else
        case :rpc.call(target, __MODULE__, :gather_local_info, [], 5_000) do
          {:badrpc, reason} -> {:error, "RPC failed: #{inspect(reason)}"}
          info -> info
        end
      end

    case result do
      {:ok, info} -> Map.merge(base, info)
      {:error, msg} -> Map.put(base, :error, msg)
    end
  end

  @doc """
  Builds the Muster summary for the configured scope on this node and folds it
  into the shape the page renders.

  Returns `{:error, message}` when no scope is configured or the coordinator is
  not running, so the page can surface a friendly error instead of crashing.
  """
  def gather_local_info do
    case Application.get_env(:realtime, :muster_scope) do
      nil ->
        {:error, "No Muster scope configured on this node"}

      scope ->
        try do
          {:ok, to_view(Forum.Muster.summary(scope))}
        catch
          :exit, reason ->
            {:error, "Muster coordinator unavailable: #{inspect(reason)}"}
        end
    end
  end

  # Group lookup: reads the inspected node's local routing state, then (on the
  # serving node) asks that state's router node for its targets/occupancy — the
  # two hops kept flat rather than nested. nil group => no lookup.
  defp group_data(_target, nil), do: nil

  defp group_data(target, group) do
    base = %{group: group, node: target, error: nil}

    # Two independent hops, orchestrated here on the serving node so neither RPC
    # is nested inside the other: first read the inspected node's local routing
    # state, then ask that state's router node for its targets/occupancy.
    case GenRpc.call(target, __MODULE__, :gather_local_group_info, [group], []) do
      {:ok, local} ->
        {targets, occupancy} = router_view(local.scope, group, local.view_hash, local.router)

        Map.merge(base, %{
          local_member_count: local.local_member_count,
          view_hash: local.view_hash,
          router: local.router,
          targets: targets,
          router_occupancy: occupancy
        })

      {:error, :rpc_error, reason} ->
        Map.put(base, :error, "RPC failed: #{inspect(reason)}")

      {:error, msg} ->
        Map.put(base, :error, msg)
    end
  end

  @doc """
  Reads the inspected node's local routing state for `group`: the configured
  scope, this node's cluster-view hash (the sender hash used for `targets/3`),
  the group's router as this node's ring sees it (`Forum.Muster.router/2`), and
  the local member count here.

  Runs on the node being inspected so `router/2` and the view hash reflect that
  node. `group_data/2` then asks the returned router node for `targets/3` and its
  raw occupancy, keeping the two hops flat rather than nesting one RPC in another.

  Returns `{:error, message}` when no scope is configured or the coordinator has
  not published its state yet, so the page can surface a friendly error.
  """
  def gather_local_group_info(group) do
    case Application.get_env(:realtime, :muster_scope) do
      nil ->
        {:error, "No Muster scope configured on this node"}

      scope ->
        try do
          {:ok,
           %{
             scope: scope,
             view_hash: Forum.Muster.view_hash(scope),
             router: Forum.Muster.router(scope, group),
             local_member_count: Forum.Muster.local_member_count(scope, group)
           }}
        rescue
          ArgumentError ->
            {:error, "Muster scope #{inspect(scope)} has no published state on this node yet"}
        catch
          :exit, reason -> {:error, "Muster group lookup failed: #{inspect(reason)}"}
        end
    end
  end

  # With a settled ring, ask the router node for its targets/3 and raw occupancy
  # in a single RPC; while rebalancing there is no single router, so surface the
  # fan-out list. GenRpc.call handles router_node == node() itself; on RPC failure
  # both slots carry the {:error, :rpc_error, _} for the fmt_* helpers to render.
  defp router_view(scope, group, view_hash, {:ok, router_node}) do
    case GenRpc.call(router_node, __MODULE__, :router_group_info, [scope, group, view_hash], []) do
      {:error, :rpc_error, _} = error -> {error, error}
      {targets, occupancy} -> {targets, occupancy}
    end
  end

  defp router_view(_scope, _group, _view_hash, {:rebalancing, nodes} = rebalancing) do
    {rebalancing, {:rebalancing, nodes}}
  end

  @doc """
  Reads the router-role view of `group` on this (router) node in one hop: the
  barrier-gated fan-out targets (`Forum.Muster.targets/3`) and the raw occupancy
  the router currently holds (`Forum.Muster.Scope.occupancy/2`). Returned as
  `{targets_result, occupancy}` so `group_data/2` fetches both with a single RPC
  to the router.
  """
  def router_group_info(scope, group, view_hash) do
    {Forum.Muster.targets(scope, group, view_hash), Forum.Muster.occupancy(scope, group)}
  end

  defp to_view(s) do
    counts = s.group_state_counts
    group_counts = Enum.map(@group_state_order, fn state -> {state, Map.get(counts, state, 0)} end)

    %{
      scope: s.scope,
      status: s.status,
      view_hash: s.view_hash,
      members: s.members,
      ring_nodes: s.ring_nodes,
      peers: s.peers,
      owed_snapshots: s.owed_snapshots,
      applied_snapshot_seq: s.applied_snapshot_seq,
      occupancy_row_count: s.occupancy_row_count,
      occupancy_by_node: Enum.sort_by(s.occupancy_rows_by_node, fn {node, _} -> to_string(node) end),
      group_counts: group_counts,
      group_total: Map.get(counts, :total, 0)
    }
  end
end
