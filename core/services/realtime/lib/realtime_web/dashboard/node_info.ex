defmodule RealtimeWeb.Dashboard.NodeInfo do
  @moduledoc """
  Live Dashboard page showing Realtime-specific information about all nodes in the cluster.

  Provides region and read-replica routing per node —
  context the built-in Home page and node picker do not expose.
  """
  use Phoenix.LiveDashboard.PageBuilder

  @impl true
  def menu_link(_, _), do: {:ok, "Node Info"}

  @impl true
  def mount(_params, _session, socket) do
    nodes = collect_all_nodes()
    {:ok, assign(socket, nodes: nodes)}
  end

  @impl true
  def handle_event("refresh", _params, socket) do
    {:noreply, assign(socket, nodes: collect_all_nodes())}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="phx-dashboard-section">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">Node Info</h5>
        <button phx-click="refresh" class="btn btn-sm btn-outline-secondary">Refresh</button>
      </div>
      <p class="text-muted small">
        Region details for every node in the cluster.
        Use this alongside the node picker (top-right) to identify which node to inspect.
      </p>

      <%= for node_data <- @nodes do %>
        <div class={"card mb-3 #{if node_data.current, do: "border-primary"}"}>
          <div class="card-header d-flex justify-content-between align-items-center">
            <strong><%= node_data.name %></strong>
            <div>
              <%= if node_data.current do %>
                <span class="badge bg-primary me-1">current</span>
              <% end %>
              <%= if node_data.error do %>
                <span class="badge bg-danger">unreachable</span>
              <% else %>
                <span class="badge bg-success">connected</span>
              <% end %>
            </div>
          </div>
          <%= if node_data.error do %>
            <div class="card-body text-danger small"><%= node_data.error %></div>
          <% else %>
            <div class="card-body p-0">
              <table class="table table-sm table-hover mb-0">
                <thead><tr><th colspan="2" class="text-muted small ps-3">Realtime</th></tr></thead>
                <tbody>
                  <tr><td class="ps-3">Region</td><td><%= node_data.region || "not set" %></td></tr>
                  <tr><td class="ps-3">Master Region</td><td><%= node_data.master_region || "not set" %></td></tr>
                  <tr><td class="ps-3">Is Master</td><td><%= node_data.is_master %></td></tr>
                  <tr><td class="ps-3">Read Replica</td><td><%= node_data.read_replica %></td></tr>
                </tbody>
              </table>
            </div>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end

  defp collect_all_nodes do
    current = node()
    all = [current | Node.list()]
    Enum.map(all, &fetch_node_data(&1, &1 == current))
  end

  defp fetch_node_data(node_name, is_current) do
    base = %{name: node_name, current: is_current, error: nil}

    result =
      if is_current do
        {:ok, gather_local_info()}
      else
        case :rpc.call(node_name, __MODULE__, :gather_local_info, [], 5_000) do
          {:badrpc, reason} -> {:error, "RPC failed: #{inspect(reason)}"}
          info -> {:ok, info}
        end
      end

    case result do
      {:ok, info} -> Map.merge(base, info)
      {:error, msg} -> Map.put(base, :error, msg)
    end
  end

  def gather_local_info do
    region = Realtime.Nodes.region()
    master_region = Application.get_env(:realtime, :master_region) || region
    replica_module = Realtime.Repo.Replica.replica()
    replica_host = Application.get_env(:realtime, replica_module, [])[:hostname]

    %{
      region: region,
      master_region: master_region,
      is_master: region == master_region,
      read_replica: replica_host || "not set"
    }
  end
end
