defmodule Realtime.NodesTest do
  # async: false due to use of Clustered and tweaking Application env
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Nodes
  alias Realtime.Tenants

  defp spawn_fake_node(region, node) do
    parent = self()

    fun = fn ->
      :syn.join(RegionNodes, region, self(), node: node)
      send(parent, :joined)

      receive do
        :ok -> :ok
      end
    end

    {:ok, _pid} = start_supervised({Task, fun}, id: {region, node})
    assert_receive :joined
  end

  describe "all_node_regions/0" do
    test "returns all regions with nodes" do
      spawn_fake_node("us-east-1", :node_1)
      spawn_fake_node("ap-2", :node_2)
      spawn_fake_node("ap-2", :node_3)

      assert Nodes.all_node_regions() |> Enum.sort() == ["ap-2", "us-east-1"]
    end

    test "with no other nodes, returns my region only" do
      # Flaky under CPU-contention in CI runners; not sure why.
      # This is an _attempt_ at fixing it.
      assert_eventually Nodes.all_node_regions() == ["us-east-1"]
    end
  end

  describe "region_nodes/1" do
    test "nil region returns empty list" do
      assert Nodes.region_nodes(nil) == []
    end

    test "returns nodes from region" do
      region = "ap-southeast-2"
      spawn_fake_node(region, :node_1)
      spawn_fake_node(region, :node_2)

      spawn_fake_node("eu-west-2", :node_3)

      assert Nodes.region_nodes(region) == [:node_1, :node_2]
      assert Nodes.region_nodes("eu-west-2") == [:node_3]
    end

    test "on non-existing region, returns empty list" do
      assert Nodes.region_nodes("non-existing-region") == []
    end
  end

  describe "node_from_region/2" do
    test "nil region returns error" do
      assert {:error, :not_available} = Nodes.node_from_region(nil, :any_key)
    end

    test "empty region returns error" do
      assert {:error, :not_available} = Nodes.node_from_region("empty-region", :any_key)
    end

    test "returns the same node given the same key" do
      region = "ap-southeast-3"
      spawn_fake_node(region, :node_1)
      spawn_fake_node(region, :node_2)

      spawn_fake_node("eu-west-3", :node_3)

      assert {:ok, :node_2} = Nodes.node_from_region(region, :key1)
      assert {:ok, :node_2} = Nodes.node_from_region(region, :key1)
    end
  end

  describe "get_node_for_tenant/1" do
    setup do
      tenant = TestTenantDb.checkout_tenant()
      region = tenant.extensions |> hd() |> get_in([Access.key!(:settings), "region"])
      %{tenant: tenant, region: region}
    end

    test "nil call returns error" do
      assert {:error, :tenant_not_found} = Nodes.get_node_for_tenant(nil)
      reject(&:syn.members/2)
    end

    test "on existing tenant id, returns a node from the region using load-aware picking", %{
      tenant: tenant,
      region: region
    } do
      expected_nodes = [:tenant@closest1, :tenant@closest2]

      expect(:syn, :members, fn RegionNodes, ^region ->
        [
          {self(), [node: Enum.at(expected_nodes, 0)]},
          {self(), [node: Enum.at(expected_nodes, 1)]}
        ]
      end)

      expected_region = Tenants.region(tenant)

      assert {:ok, node, region} = Nodes.get_node_for_tenant(tenant)
      assert region == expected_region
      assert node in expected_nodes
    end

    test "on existing tenant id, and a single node for a given region, returns single node", %{
      tenant: tenant,
      region: region
    } do
      expect(:syn, :members, fn RegionNodes, ^region -> [{self(), [node: :tenant@closest1]}] end)

      assert {:ok, node, region} = Nodes.get_node_for_tenant(tenant)

      expected_region = Tenants.region(tenant)

      assert node == :tenant@closest1
      assert region == expected_region
    end

    test "on existing tenant id, returns default node for regions not registered in syn", %{tenant: tenant} do
      expect(:syn, :members, fn RegionNodes, _ -> [] end)
      assert {:ok, node, region} = Nodes.get_node_for_tenant(tenant)

      expected_region = Tenants.region(tenant)

      assert node == node()
      assert region == expected_region
    end
  end

  describe "platform_region_translator/1" do
    test "returns nil for nil input" do
      assert Nodes.platform_region_translator(nil) == nil
    end

    test "uses default mapping when no custom mapping configured" do
      original = Application.get_env(:realtime, :region_mapping)
      on_exit(fn -> Application.put_env(:realtime, :region_mapping, original) end)

      Application.put_env(:realtime, :region_mapping, nil)

      assert Nodes.platform_region_translator("eu-north-1") == "eu-west-2"
      assert Nodes.platform_region_translator("us-west-2") == "us-west-1"
      assert Nodes.platform_region_translator("unknown-region") == nil
    end

    test "uses custom mapping when configured without falling back to defaults" do
      original = Application.get_env(:realtime, :region_mapping)
      on_exit(fn -> Application.put_env(:realtime, :region_mapping, original) end)

      custom_mapping = %{
        "custom-region-1" => "us-east-1",
        "eu-north-1" => "custom-target"
      }

      Application.put_env(:realtime, :region_mapping, custom_mapping)

      # Custom mappings work
      assert Nodes.platform_region_translator("custom-region-1") == "us-east-1"
      assert Nodes.platform_region_translator("eu-north-1") == "custom-target"

      # Unmapped regions return nil (no fallback to defaults)
      assert Nodes.platform_region_translator("us-west-2") == nil
    end
  end

  describe "node_load/1" do
    test "returns {:error, :not_enough_data} for local node with insufficient uptime" do
      assert {:error, :not_enough_data} = Nodes.node_load(node())
    end
  end

  describe "node_load/1 with sufficient uptime" do
    setup do
      Cachex.clear(Realtime.Nodes.Cache)
      Application.put_env(:realtime, :node_balance_uptime_threshold_in_ms, 0)

      on_exit(fn ->
        Application.put_env(:realtime, :node_balance_uptime_threshold_in_ms, 999_999_999_999)
      end)
    end

    test "returns cpu load for local node" do
      load = Nodes.node_load(node())

      assert is_integer(load)
      assert load >= 0
    end

    test "returns cpu load for remote node" do
      {:ok, remote_node} = Clustered.start()

      load = Nodes.node_load(remote_node)

      assert is_integer(load)
      assert load >= 0
    end

    test "remote node can also get its own load" do
      {:ok, remote_node} = Clustered.start()

      load = :rpc.call(remote_node, Nodes, :node_load, [remote_node])

      assert is_integer(load)
      assert load >= 0
    end

    test "caches remote node load and sets expiration" do
      {:ok, remote_node} = Clustered.start(nil, extra_config: [{:realtime, :node_balance_uptime_threshold_in_ms, 0}])

      assert {:ok, false} = Cachex.exists?(Realtime.Nodes.Cache, remote_node)

      load1 = Nodes.node_load(remote_node)
      assert is_integer(load1)

      assert {:ok, true} = Cachex.exists?(Realtime.Nodes.Cache, remote_node)
      assert {:ok, ttl} = Cachex.ttl(Realtime.Nodes.Cache, remote_node)
      assert is_integer(ttl) and ttl > 0 and ttl <= 60_000

      reject(&Realtime.GenRpc.call/5)

      load2 = Nodes.node_load(remote_node)
      assert load1 == load2
    end

    test "does not cache rpc errors for remote node" do
      fake_node = :fake_remote_node

      expect(Realtime.GenRpc, :call, fn _, _, _, _, _ -> {:error, :rpc_error, :badrpc} end)

      assert {:ok, false} = Cachex.exists?(Realtime.Nodes.Cache, fake_node)

      result = Nodes.node_load(fake_node)
      assert result == {:error, :rpc_error, :badrpc}

      assert {:ok, false} = Cachex.exists?(Realtime.Nodes.Cache, fake_node)
    end

    test "caches {:error, :not_enough_data} for remote node with insufficient uptime" do
      {:ok, remote_node} =
        Clustered.start(nil, extra_config: [{:realtime, :node_balance_uptime_threshold_in_ms, 999_999_999_999}])

      assert {:ok, false} = Cachex.exists?(Realtime.Nodes.Cache, remote_node)

      result = Nodes.node_load(remote_node)
      assert result == {:error, :not_enough_data}

      assert {:ok, true} = Cachex.exists?(Realtime.Nodes.Cache, remote_node)

      reject(&Realtime.GenRpc.call/5)

      assert {:error, :not_enough_data} = Nodes.node_load(remote_node)
    end
  end

  describe "launch_node/3 load-aware but not enough uptime" do
    test "returns the one node from the region when one node is available" do
      region = "clustered-test-region"
      spawn_fake_node(region, :remote_node)

      result = Nodes.launch_node(region, node(), "test-tenant-123")

      assert result == :remote_node
    end

    test "returns default node when no region nodes available" do
      result = Nodes.launch_node("empty-region", node(), "test-tenant-123")

      assert result == node()
    end

    test "same tenant_id picks same nodes" do
      region = "deterministic-region"
      spawn_fake_node(region, :node_a)
      spawn_fake_node(region, :node_b)
      spawn_fake_node(region, :node_c)

      tenant_id = "test-tenant-456"

      # Call 10 times, should always return same node with hashed tenant ID
      results = for _ <- 1..10, do: Nodes.launch_node(region, node(), tenant_id)

      assert length(Enum.uniq(results)) == 1
    end

    test "different tenant_ids distribute across nodes" do
      region = "distribution-region"
      spawn_fake_node(region, :node_a)
      spawn_fake_node(region, :node_b)
      spawn_fake_node(region, :node_c)

      # Generate 30 different tenant IDs
      tenant_ids = for i <- 1..30, do: "tenant-#{i}"

      results =
        Enum.map(tenant_ids, fn id ->
          Nodes.launch_node(region, node(), id)
        end)

      # Should distribute across multiple nodes (at least 2) using the hashed tenant IDs
      assert length(Enum.uniq(results)) >= 2
    end
  end

  describe "launch_node/3 with load-aware node picking enabled" do
    setup do
      Application.put_env(:realtime, :node_balance_uptime_threshold_in_ms, 0)

      on_exit(fn ->
        Application.put_env(:realtime, :node_balance_uptime_threshold_in_ms, 999_999_999_999)
      end)
    end

    test "picks deterministic node when one node has insufficient data" do
      region = "uptime-test-region"
      spawn_fake_node(region, :node_a)
      spawn_fake_node(region, :node_b)

      stub(Nodes, :node_load, fn
        :node_a -> {:error, :not_enough_data}
        :node_b -> 100
      end)

      results = for _ <- 1..10, do: Nodes.launch_node(region, node(), "test-tenant-123")

      # Deterministic with hashed tenant ID
      assert length(Enum.uniq(results)) == 1
      assert Enum.uniq(results) == [:node_b]
    end

    test "compares load between nodes and picks the least loaded deterministically" do
      {:ok, remote_node} = Clustered.start(nil, [{:realtime, :node_balance_uptime_threshold_in_ms, 0}])

      region = "load-test-region"
      spawn_fake_node(region, node())
      spawn_fake_node(region, remote_node)

      local_load = Nodes.node_load(node())
      remote_load = Nodes.node_load(remote_node)

      assert is_integer(local_load) and local_load >= 0
      assert is_integer(remote_load) and remote_load >= 0

      results = for _ <- 1..10, do: Nodes.launch_node(region, node(), "test-tenant-789")

      # Should be deterministic - all same node within time bucket
      assert length(Enum.uniq(results)) == 1
      assert Enum.all?(results, &(&1 in [node(), remote_node]))
    end
  end

  describe "short_node_id_from_name/1" do
    test "extracts short ID from fly.io-style IPv6 node name" do
      assert Nodes.short_node_id_from_name(:"realtime-prod@fdaa:0:cc:a7b:b385:83c3:cfe3:2") ==
               "83c3cfe3"
    end

    test "returns full name for localhost node" do
      assert Nodes.short_node_id_from_name(:"pink@127.0.0.1") == "pink@127.0.0.1"
    end

    test "returns host for standard domain-style node names" do
      assert Nodes.short_node_id_from_name(:"realtime@host.name.internal") == "host.name.internal"
    end

    test "returns host for simple IP node" do
      assert Nodes.short_node_id_from_name(:"pink@10.0.1.1") == "10.0.1.1"
    end

    test "returns host for nonode@nohost" do
      assert Nodes.short_node_id_from_name(:nonode@nohost) == "nohost"
    end
  end
end
