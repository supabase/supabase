{:ok, _} = Application.ensure_all_started(:syn)

scenarios =
  for regions_count <- [5, 7], nodes_per_region <- [4, 8, 12, 20, 30] do
    {regions_count, nodes_per_region}
  end

# Build one syn scope + cached ETS row per topology, then expose both as a Benchee
# input so each job reads from the matching scenario.
inputs =
  Map.new(scenarios, fn {regions_count, nodes_per_region} ->
    total_nodes = regions_count * nodes_per_region
    scope = :"RegionNodes_#{regions_count}x#{nodes_per_region}"
    :ok = :syn.add_node_to_scopes([scope])

    regions = for i <- 1..regions_count, do: "region-#{i}"

    # One long-lived process per (region, node), joined with `[node: node]` metadata,
    # matching how Realtime.Application registers nodes into RegionNodes.
    for region <- regions, n <- 1..nodes_per_region do
      node = :"node_#{region}_#{n}"

      {:ok, _pid} =
        Task.start_link(fn ->
          :syn.join(scope, region, self(), node: node)
          Process.sleep(:infinity)
        end)
    end

    # Give syn a moment to register everyone before snapshotting the cache row.
    Process.sleep(50)

    table = :ets.new(:"bench_region_set_#{scope}", [:set, :public, read_concurrency: true])
    region_set = :syn.group_names(scope)
    :ets.insert(table, {:__all_regions__, region_set})

    # Sanity: both strategies return the same region set for this scenario.
    true = Enum.sort(region_set) == Enum.sort(:syn.group_names(scope))

    label =
      "#{regions_count} regions x #{String.pad_leading(Integer.to_string(nodes_per_region), 2)} nodes " <>
        "= #{String.pad_leading(Integer.to_string(total_nodes), 3)} nodes"

    {label, %{scope: scope, table: table}}
  end)

IO.puts("Sanity check passed: both strategies resolve the same region set\n")

Benchee.run(
  %{
    "current (:syn.group_names full scan + usort)" => fn %{scope: scope} ->
      :syn.group_names(scope)
    end,
    "cached (single :ets.lookup)" => fn %{table: table} ->
      :ets.lookup(table, :__all_regions__) |> hd() |> elem(1)
    end
  },
  inputs: inputs,
  time: 3,
  memory_time: 1
)
