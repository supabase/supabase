defmodule RealtimeWeb.StatusLive.Index do
  @moduledoc """
  Publically available status page for our clusters, showing nodes and cross region latency.
  """
  use RealtimeWeb, :live_view

  alias Realtime.Latency.Payload
  alias Realtime.Nodes
  alias RealtimeWeb.Endpoint

  @ping_interval to_timeout(second: 15)
  @stale_after @ping_interval * 2
  @warn_above_ms to_timeout(second: 1)
  @problem_limit 200
  @flush_interval to_timeout(second: 1)
  @state_key :node_info

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Endpoint.subscribe("admin:cluster")
      schedule_staleness_check()
      schedule_flush()
    end

    node_ids = all_nodes()
    pair_status = default_pair_status(node_ids)

    socket =
      socket
      |> assign(:active_nav, :status)
      |> assign(:node_ids, node_ids)
      |> assign(:node_regions, %{})
      |> assign(:pair_status, pair_status)
      |> assign(:selected_node, nil)
      |> assign(:region_filter, "")
      |> assign(:node_sort, "node")
      |> assign(:pair_sort, "severity")
      |> assign(:drill_sort, "node")
      |> assign(:mounted_at, DateTime.utc_now())
      |> put_state(%{pair_status: pair_status, node_regions: %{}})

    {:ok, socket}
  end

  @impl true
  def handle_event("select_node", %{"node" => node}, socket) do
    selected = if socket.assigns.selected_node == node, do: nil, else: node
    {:noreply, assign(socket, :selected_node, selected)}
  end

  def handle_event("filter_region", %{"value" => value}, socket) do
    {:noreply, assign(socket, :region_filter, value)}
  end

  def handle_event("sort_nodes", %{"value" => value}, socket) do
    {:noreply, assign(socket, :node_sort, value)}
  end

  def handle_event("sort_pairs", %{"value" => value}, socket) do
    {:noreply, assign(socket, :pair_sort, value)}
  end

  def handle_event("sort_drill", %{"value" => value}, socket) do
    {:noreply, assign(socket, :drill_sort, value)}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{payload: %Payload{} = payload}, socket) do
    {pair, entry} = pair_entry(payload)
    state = state(socket)

    state = %{
      state
      | pair_status: Map.put(state.pair_status, pair, entry),
        node_regions: Map.put(state.node_regions, payload.from_node, payload.from_region)
    }

    {:noreply, put_state(socket, state)}
  end

  # scheduled flushes/draws to avoid triggering rerenders too frequently
  def handle_info(:flush, socket) do
    schedule_flush()
    state = state(socket)

    socket =
      socket
      |> assign(:pair_status, state.pair_status)
      |> assign(:node_regions, state.node_regions)

    {:noreply, socket}
  end

  def handle_info(:check_staleness, socket) do
    schedule_staleness_check()
    pair_status = apply_staleness(socket.assigns.pair_status, DateTime.utc_now(), socket.assigns.mounted_at)
    state = %{state(socket) | pair_status: pair_status}

    socket =
      socket
      |> put_state(state)
      |> assign(:pair_status, pair_status)

    {:noreply, socket}
  end

  @doc false
  def pair_entry(%Payload{} = payload) do
    entry = %{
      from: payload.from_node,
      to: payload.node,
      latency: payload.latency,
      status: payload_status(payload),
      updated_at: DateTime.utc_now()
    }

    {pair_id(payload.from_node, payload.node), entry}
  end

  @doc false
  def apply_staleness(pair_status, now, since \\ nil) do
    Map.new(pair_status, fn
      {pair, %{updated_at: nil} = entry} ->
        if since && DateTime.diff(now, since, :millisecond) > @stale_after do
          {pair, %{entry | status: :stale}}
        else
          {pair, entry}
        end

      {pair, %{updated_at: updated_at} = entry} ->
        if DateTime.diff(now, updated_at, :millisecond) > @stale_after do
          {pair, %{entry | status: :stale}}
        else
          {pair, entry}
        end
    end)
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Realtime Cluster Health")
  end

  defp payload_status(%Payload{response: {:error, :rpc_error, _reason}}), do: :error
  defp payload_status(%Payload{latency: latency}) when is_number(latency) and latency > @warn_above_ms, do: :warning
  defp payload_status(%Payload{latency: latency}) when is_number(latency), do: :ok
  defp payload_status(_), do: :unknown

  defp schedule_staleness_check, do: Process.send_after(self(), :check_staleness, @stale_after)
  defp schedule_flush, do: Process.send_after(self(), :flush, @flush_interval)

  # Private (not change-tracked) accumulator for payloads arriving between flushes,
  # to delay rerendering until the next `flush`
  defp state(socket), do: socket.private[@state_key]
  defp put_state(socket, state), do: put_private(socket, @state_key, state)

  defp all_nodes do
    # Load-test-only escape hatch to have realistic rendering.
    # Practically `[]` on prod and so shouldn't have a meaningful impact.
    extra_ids = Application.get_env(:realtime, __MODULE__, []) |> Keyword.get(:extra_node_ids, [])
    extra_ids ++ ([Node.self() | Node.list()] |> Enum.map(&Nodes.short_node_id_from_name/1))
  end

  defp default_pair_status(node_ids) do
    for from <- node_ids, to <- node_ids, into: %{} do
      {pair_id(from, to), %{from: from, to: to, latency: nil, status: :unknown, updated_at: nil}}
    end
  end

  defp pair_id(from, to) do
    from <> "_" <> to
  end

  @doc false
  def nodes_by_region(node_ids, node_regions) do
    node_ids
    |> Enum.group_by(fn node -> Map.get(node_regions, node, "unknown") end)
    |> Enum.sort_by(fn {region, _} -> {region == "unknown", region} end)
  end

  @doc false
  def regions(node_ids, node_regions) do
    node_ids
    |> Enum.map(&Map.get(node_regions, &1, "unknown"))
    |> Enum.uniq()
    |> Enum.sort_by(&{&1 == "unknown", &1})
  end

  @doc false
  def region_pair_stats(pair_status, node_regions, from_region, to_region) do
    entries =
      pair_status
      |> Map.values()
      |> Enum.reject(&(&1.from == &1.to))
      |> Enum.filter(fn p ->
        Map.get(node_regions, p.from, "unknown") == from_region and Map.get(node_regions, p.to, "unknown") == to_region
      end)

    # Only average latencies from successful probes — a failed/stale probe's number isn't a real
    # round-trip, so it must not drag the regional average toward zero.
    latencies =
      entries
      |> Enum.filter(&(&1.status in [:ok, :warning]))
      |> Enum.map(& &1.latency)
      |> Enum.filter(&is_number/1)

    avg_latency = if latencies == [], do: nil, else: Enum.sum(latencies) / length(latencies)
    status = entries |> Enum.map(& &1.status) |> aggregate_status()

    %{avg_latency: avg_latency, status: status, sample_size: length(entries)}
  end

  # Region-level rollup is an aggregate over many pairs, so use a majority rule (not worst-case):
  # a couple of flaky links shouldn't redden a whole region — that detail belongs on the node
  # cards and in problem pairs.
  defp aggregate_status([]), do: :unknown

  defp aggregate_status(statuses) do
    cond do
      majority?(statuses, :error) -> :error
      majority?(statuses, :stale) -> :stale
      majority?(statuses, :warning) -> :warning
      :else -> :ok
    end
  end

  @doc false
  def visible_nodes(all_node_ids, node_regions, pair_status, region_filter, sort_by) do
    all_node_ids
    |> filter_by_region(node_regions, region_filter)
    |> sort_nodes(all_node_ids, node_regions, pair_status, sort_by)
  end

  defp filter_by_region(node_ids, _node_regions, region_filter) when region_filter in [nil, ""], do: node_ids

  defp filter_by_region(node_ids, node_regions, region_filter) do
    query = String.downcase(region_filter)

    Enum.filter(node_ids, fn node ->
      node_regions |> Map.get(node, "unknown") |> String.downcase() |> String.contains?(query)
    end)
  end

  defp sort_nodes(node_ids, _all_node_ids, node_regions, _pair_status, "region") do
    Enum.sort_by(node_ids, &Map.get(node_regions, &1, "unknown"))
  end

  defp sort_nodes(node_ids, all_node_ids, _node_regions, pair_status, "status") do
    Enum.sort_by(node_ids, &(-status_rank(node_status(&1, all_node_ids, pair_status))))
  end

  defp sort_nodes(node_ids, _all_node_ids, _node_regions, _pair_status, _sort_by), do: Enum.sort(node_ids)

  @doc false
  def problem_pairs(pair_status, node_regions, sort_by \\ "severity") do
    entries =
      pair_status
      |> Map.values()
      |> Enum.reject(&(&1.from == &1.to))
      |> Enum.filter(&(&1.status in [:warning, :error, :stale]))

    sorted =
      case sort_by do
        "latency" -> Enum.sort_by(entries, &(-(&1.latency || 0)))
        "region" -> Enum.sort_by(entries, &{Map.get(node_regions, &1.from, "unknown"), &1.from, &1.to})
        _ -> Enum.sort_by(entries, &{-status_rank(&1.status), &1.from, &1.to})
      end

    {Enum.take(sorted, @problem_limit), max(length(entries) - @problem_limit, 0)}
  end

  @doc false
  def node_pairs(node, node_ids, pair_status, sort_by \\ "node") do
    entries =
      node_ids
      |> Enum.reject(&(&1 == node))
      |> Enum.map(fn other ->
        %{
          node: other,
          outgoing: Map.get(pair_status, pair_id(node, other)),
          incoming: Map.get(pair_status, pair_id(other, node))
        }
      end)

    case sort_by do
      "latency" ->
        Enum.sort_by(entries, &(-max(&1.outgoing[:latency] || 0, &1.incoming[:latency] || 0)))

      "status" ->
        Enum.sort_by(entries, &(-status_rank(worst_status([&1.outgoing[:status], &1.incoming[:status]]))))

      _ ->
        Enum.sort_by(entries, & &1.node)
    end
  end

  @doc false
  # A node's own health, not the worst of every link it touches: a single bad link to one
  # dead region shouldn't paint an otherwise-healthy node red. Down = most peers can't reach it
  # (incoming errors); silent = it stopped reporting (outgoing stale); warning only when a
  # majority of its links are slow. Individual slow/error links live in the matrix + problem pairs.
  def node_status(node, node_ids, pair_status) do
    others = Enum.reject(node_ids, &(&1 == node))
    incoming = statuses_for(others, fn other -> pair_id(other, node) end, pair_status)
    outgoing = statuses_for(others, fn other -> pair_id(node, other) end, pair_status)

    cond do
      incoming == [] and outgoing == [] -> :unknown
      majority?(incoming, :error) -> :error
      majority?(outgoing, :stale) -> :stale
      majority?(outgoing, :warning) -> :warning
      :error in incoming or :stale in outgoing -> :warning
      :else -> :ok
    end
  end

  defp statuses_for(others, key_fun, pair_status) do
    others
    |> Enum.map(&Map.get(pair_status, key_fun.(&1)))
    |> Enum.map(& &1[:status])
    |> Enum.reject(&(is_nil(&1) or &1 == :unknown))
  end

  defp majority?([], _status), do: false
  defp majority?(statuses, status), do: Enum.count(statuses, &(&1 == status)) * 2 > length(statuses)

  defp worst_status(statuses) do
    case Enum.reject(statuses, &is_nil/1) do
      [] -> :unknown
      list -> Enum.max_by(list, &status_rank/1)
    end
  end

  defp status_rank(:error), do: 4
  defp status_rank(:stale), do: 3
  defp status_rank(:warning), do: 2
  defp status_rank(:ok), do: 1
  defp status_rank(:unknown), do: 0

  @doc false
  def status_variant(:ok), do: :success
  def status_variant(:warning), do: :warning
  def status_variant(:error), do: :error
  def status_variant(:stale), do: :neutral
  def status_variant(:unknown), do: :neutral

  @doc false
  def status_label(:ok), do: "OK"
  def status_label(:warning), do: "Slow"
  def status_label(:error), do: "Unreachable"
  def status_label(:stale), do: "Stale"
  def status_label(:unknown), do: "Loading..."
end
