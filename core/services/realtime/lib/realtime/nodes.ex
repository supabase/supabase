defmodule Realtime.Nodes do
  @moduledoc """
  Handles common needs for :syn module operations
  """
  require Logger
  alias Realtime.Api.Tenant
  alias Realtime.Tenants

  @doc """
  Gets the node to launch the Postgres connection on for a tenant.
  """
  @spec get_node_for_tenant(Tenant.t()) :: {:ok, node(), binary()} | {:error, term()}
  def get_node_for_tenant(nil), do: {:error, :tenant_not_found}

  def get_node_for_tenant(%Tenant{} = tenant) do
    with region <- Tenants.region(tenant),
         tenant_region <- platform_region_translator(region),
         node <- launch_node(tenant_region, node(), tenant.external_id) do
      {:ok, node, tenant_region}
    end
  end

  @doc """
  Translates a region from a platform to the closest Supabase tenant region.

  Region mapping can be customized via the REGION_MAPPING environment variable.
  If not provided, uses the default hardcoded mapping.
  """
  @spec platform_region_translator(String.t() | nil) :: nil | binary()
  def platform_region_translator(nil), do: nil

  def platform_region_translator(tenant_region) when is_binary(tenant_region) do
    case Application.get_env(:realtime, :region_mapping) do
      nil -> default_region_mapping(tenant_region)
      mapping when is_map(mapping) -> Map.get(mapping, tenant_region)
    end
  end

  # Private function with hardcoded defaults
  defp default_region_mapping(tenant_region) do
    case tenant_region do
      "ap-east-1" -> "ap-southeast-1"
      "ap-northeast-1" -> "ap-southeast-1"
      "ap-northeast-2" -> "ap-southeast-1"
      "ap-south-1" -> "ap-southeast-1"
      "ap-southeast-1" -> "ap-southeast-1"
      "ap-southeast-2" -> "ap-southeast-2"
      "ca-central-1" -> "us-east-1"
      "eu-central-1" -> "eu-west-2"
      "eu-central-2" -> "eu-west-2"
      "eu-north-1" -> "eu-west-2"
      "eu-west-1" -> "eu-west-2"
      "eu-west-2" -> "eu-west-2"
      "eu-west-3" -> "eu-west-2"
      "sa-east-1" -> "us-east-1"
      "us-east-1" -> "us-east-1"
      "us-east-2" -> "us-east-1"
      "us-west-1" -> "us-west-1"
      "us-west-2" -> "us-west-1"
      _ -> nil
    end
  end

  @doc """
  The region this node registers under in the `RegionNodes` group.

  `runtime.exs` defaults `REGION` to `"local"`, so deployments that leave it
  unset (self-hosted, CLI) still form a cluster under one group name. Both the
  `:syn.join` and every read of this node's region must go through here.
  """
  @spec region() :: String.t()
  def region, do: Application.fetch_env!(:realtime, :region)

  @doc """
  Lists the nodes in a region. Sorts by node name in case the list order
  is unstable.
  """
  @spec region_nodes(String.t() | nil) :: [atom()]
  def region_nodes(region) when is_binary(region) do
    :syn.members(RegionNodes, region)
    |> Enum.map(fn {_pid, [node: node]} -> node end)
    |> Enum.sort()
  end

  def region_nodes(nil), do: []

  @doc """
  Picks a node from a region based on the provided key
  """
  @spec node_from_region(String.t(), term()) :: {:ok, node} | {:error, :not_available}
  def node_from_region(region, key) when is_binary(region) do
    nodes = region_nodes(region)

    case nodes do
      [] ->
        {:error, :not_available}

      _ ->
        member_count = Enum.count(nodes)
        index = :erlang.phash2(key, member_count)

        {:ok, Enum.fetch!(nodes, index)}
    end
  end

  def node_from_region(_, _), do: {:error, :not_available}

  @doc """
  Picks the node to launch the Postgres connection on.

  Selection is deterministic within time buckets to prevent syn conflicts from
  concurrent requests for the same tenant. Uses time-bucketed seeded random
  selection to pick 2 candidate nodes, compares their loads, and picks the
  least loaded one.

  The time bucket approach ensures:
  - Requests within same time window (default: 60s) pick same nodes → prevents conflicts
  - Requests in different time windows pick different random nodes → better long-term distribution

  If the uptime of the node is below the configured threshold for load balancing,
  a consistent node is picked based on hashing the tenant ID.

  If there are not two nodes in a region, the connection is established from
  the `default` node given.
  """
  @spec launch_node(String.t() | nil, atom(), String.t()) :: atom()
  def launch_node(region, default, tenant_id) when is_binary(tenant_id) do
    case region_nodes(region) do
      [] ->
        Logger.warning("Zero region nodes for #{region} using #{inspect(default)}")
        default

      [single_node] ->
        single_node

      nodes ->
        load_aware_node_picker(nodes, tenant_id)
    end
  end

  @node_selection_time_bucket_seconds Application.compile_env(
                                        :realtime,
                                        :node_selection_time_bucket_seconds,
                                        60
                                      )

  @cache Realtime.Nodes.Cache
  @node_load_ttl_ms @node_selection_time_bucket_seconds * 1_000

  defp load_aware_node_picker(regions_nodes, tenant_id) when is_binary(tenant_id) do
    case regions_nodes do
      nodes ->
        node_count = length(nodes)

        {node1, node2} = two_random_nodes(tenant_id, nodes, node_count)

        # Compare loads and pick least loaded
        load1 = node_load(node1)
        load2 = node_load(node2)

        if is_number(load1) and is_number(load2) do
          if load1 <= load2, do: node1, else: node2
        else
          # Fallback to consistently picking a node if load data is not available
          index = :erlang.phash2(tenant_id, node_count)
          Enum.fetch!(nodes, index)
        end
    end
  end

  defp two_random_nodes(tenant_id, nodes, node_count) do
    # Get current time bucket (unix timestamp / bucket_size)
    time_bucket = div(System.system_time(:second), @node_selection_time_bucket_seconds)

    # Seed the RNG without storing into the process dictionary
    seed_value = :erlang.phash2({tenant_id, time_bucket})
    rand_state = :rand.seed_s(:exsss, seed_value)

    {id1, rand_state2} = :rand.uniform_s(node_count, rand_state)
    {id2, _rand_state3} = :rand.uniform_s(node_count, rand_state2)

    # Ensure id2 is different from id1 when multiple nodes available
    id2 =
      if id1 == id2 and node_count > 1 do
        # Pick next node (wraps around using rem)
        rem(id1, node_count) + 1
      else
        id2
      end

    node1 = Enum.at(nodes, id1 - 1)
    node2 = Enum.at(nodes, id2 - 1)
    {node1, node2}
  end

  @doc """
  Gets the node load for a node either locally or remotely. Returns {:error, :not_enough_data} if the node has not been running for long enough to get reliable metrics.
  """
  @spec node_load(atom()) :: integer() | {:error, :not_enough_data}
  def node_load(node) when node() == node do
    if uptime_ms() < Application.fetch_env!(:realtime, :node_balance_uptime_threshold_in_ms),
      do: {:error, :not_enough_data},
      else: :cpu_sup.avg5()
  end

  def node_load(node) when node() != node do
    {_, value} =
      Cachex.fetch(@cache, node, fn _ ->
        result = Realtime.GenRpc.call(node, __MODULE__, :node_load, [node], [])

        case result do
          result when is_number(result) -> {:commit, result, [expire: @node_load_ttl_ms]}
          {:error, :not_enough_data} -> {:commit, result, [expire: @node_load_ttl_ms]}
          _ -> {:ignore, result}
        end
      end)

    value
  end

  @doc """
  Gets a short node name from a node name when a node name looks like `realtime-prod@fdaa:0:cc:a7b:b385:83c3:cfe3:2`

  ## Examples

      iex> node = Node.self()
      iex> Realtime.Helpers.short_node_id_from_name(node)
      "nohost"

      iex> node = :"realtime-prod@fdaa:0:cc:a7b:b385:83c3:cfe3:2"
      iex> Realtime.Helpers.short_node_id_from_name(node)
      "83c3cfe3"

      iex> node = :"pink@127.0.0.1"
      iex> Realtime.Helpers.short_node_id_from_name(node)
      "pink@127.0.0.1"

      iex> node = :"pink@10.0.1.1"
      iex> Realtime.Helpers.short_node_id_from_name(node)
      "10.0.1.1"

      iex> node = :"realtime@host.name.internal"
      iex> Realtime.Helpers.short_node_id_from_name(node)
      "host.name.internal"
  """

  @spec short_node_id_from_name(atom()) :: String.t()
  def short_node_id_from_name(name) when is_atom(name) do
    [_, host] = name |> Atom.to_string() |> String.split("@", parts: 2)

    case String.split(host, ":", parts: 8) do
      [_, _, _, _, _, one, two, _] ->
        one <> two

      ["127.0.0.1"] ->
        Atom.to_string(name)

      _other ->
        host
    end
  end

  @spec all_node_regions() :: [String.t()]
  @doc "List all the regions where nodes can be launched"
  def all_node_regions, do: :syn.group_names(RegionNodes)

  defp uptime_ms do
    start_time = :erlang.system_info(:start_time)
    now = :erlang.monotonic_time()
    :erlang.convert_time_unit(now - start_time, :native, :millisecond)
  end
end
