defmodule Realtime.GenRpcPubSub.RegionRingsTest do
  # async: false — Mimic global + distributed integration test
  use ExUnit.Case, async: false
  use TestHelpers

  alias Realtime.GenRpcPubSub.RegionRings
  alias Realtime.Nodes
  alias Forum.Muster

  use Mimic
  setup :set_mimic_from_context

  @region "ap-southeast-1"

  # Local ring reconciliation settles in milliseconds; cross-node syn/Muster convergence can take
  # seconds on a loaded runner, and each probe there is an erpc round trip, so it polls slower.
  @short_wait [timeout: 1_000, interval: 10]
  @cluster_wait [timeout: 20_000, interval: 100]

  defp members do
    Enum.sort([node(), :"rr1@127.0.0.1", :"rr2@127.0.0.1", :"rr3@127.0.0.1"])
  end

  # Start an isolated RegionRings instance with its own table/name. Defaults to NOT
  # reconciling on init (so mimic-based tests can install process-scoped Nodes stubs
  # first) with a long backstop interval; pass opts to override for tests that want
  # it to reconcile from live syn membership.
  defp start_region_rings!(opts \\ []) do
    table = :"rr_table_#{System.unique_integer([:positive])}"
    name = :"rr_srv_#{System.unique_integer([:positive])}"

    base = [name: name, table: table, reconcile_on_init: false, reconcile_interval_ms: 60_000]

    pid = start_supervised!({RegionRings, Keyword.merge(base, opts)}, id: name)

    %{pid: pid, table: table}
  end

  describe "expected_router/3 fallbacks" do
    test "returns :error before any reconcile has populated the ring" do
      %{table: table} = start_region_rings!()
      assert RegionRings.expected_router(@region, "tenant_0", table) == :error
    end

    test "returns :error for a region with no ring" do
      %{pid: pid, table: table} = start_region_rings!()

      stub(Nodes, :all_node_regions, fn -> [@region] end)

      stub(Nodes, :region_nodes, fn
        @region -> members()
        _ -> []
      end)

      reconcile(pid)

      assert RegionRings.expected_router("no-such-region", "tenant_0", table) == :error
    end
  end

  describe "all_node_regions/1" do
    test "falls back to a live syn read before the table exists" do
      # No RegionRings started: the table is absent, so :ets.lookup raises and the
      # rescue must fall back to a single Nodes.all_node_regions/0 read.
      expect(Nodes, :all_node_regions, fn -> [@region, "us-east-1"] end)

      assert RegionRings.all_node_regions(:rr_absent_table) == [@region, "us-east-1"]
    end

    test "falls back to a live syn read before any reconcile has populated the cache row" do
      %{table: table} = start_region_rings!()

      # Table exists (created in init) but the cache row hasn't been written yet, so
      # the empty-lookup branch must fall back to a single Nodes.all_node_regions/0 read.
      expect(Nodes, :all_node_regions, fn -> [@region, "us-east-1"] end)

      assert RegionRings.all_node_regions(table) == [@region, "us-east-1"]
    end

    test "reads are served from the cache after a reconcile, never re-reading syn" do
      %{pid: pid, table: table} = start_region_rings!()

      # Exactly one syn read, performed by the reconcile itself. If any later
      # all_node_regions/1 fell through to syn, Mimic would see a second call and fail.
      expect(Nodes, :all_node_regions, 1, fn -> [@region, "us-east-1"] end)
      expect(Nodes, :region_nodes, 1, fn _ -> members() end)

      reconcile(pid)

      assert RegionRings.all_node_regions(table) == [@region, "us-east-1"]
      # Read again: served from ETS, not from syn (guaranteed by the expect-once above).
      assert RegionRings.all_node_regions(table) == [@region, "us-east-1"]
    end

    test "a reconcile refreshes the cached region set when membership changes" do
      %{pid: pid, table: table} = start_region_rings!()

      # One region_nodes read per reconcile (only @region is wanted; "us-east-1" is
      # own_region and is rejected).
      expect(Nodes, :region_nodes, 2, fn _ -> members() end)

      expect(Nodes, :all_node_regions, fn -> [@region] end)
      reconcile(pid)
      assert RegionRings.all_node_regions(table) == [@region]

      expect(Nodes, :all_node_regions, fn -> [@region, "us-east-1"] end)
      reconcile(pid)
      assert RegionRings.all_node_regions(table) == [@region, "us-east-1"]
    end
  end

  describe "ring process exit" do
    test "rebuilds a ring that exits and recovers expected_router" do
      members = members()
      %{pid: pid, table: table} = start_region_rings!()

      stub(Nodes, :all_node_regions, fn -> [@region] end)

      stub(Nodes, :region_nodes, fn
        @region -> members
        _ -> []
      end)

      state = reconcile(pid)
      {_name, ring_pid} = Map.fetch!(state.rings, @region)
      assert {:ok, _node, _vh} = RegionRings.expected_router(@region, "tenant_0", table)

      # Kill the region's ring. RegionRings traps exits, so the propagated
      # `{:EXIT, ring_pid, :killed}` must drop the dead ring and rebuild it.
      ref = Process.monitor(ring_pid)
      Process.exit(ring_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^ring_pid, :killed}

      assert_eventually {:ok, _, _} = RegionRings.expected_router(@region, "tenant_0", table), @short_wait

      new_state = :sys.get_state(pid)
      {_name, new_ring_pid} = Map.fetch!(new_state.rings, @region)
      assert new_ring_pid != ring_pid
      assert Process.alive?(new_ring_pid)
    end
  end

  describe "resync on syn membership change" do
    test "a RegionNodes join event refreshes the ring and view_hash" do
      %{table: table} = start_region_rings!()

      # Attach RegionRings' telemetry handler to a real scope change: emitting the
      # event must drive a resync. First membership:
      first = Enum.sort([node(), :"rr1@127.0.0.1"])
      stub(Nodes, :all_node_regions, fn -> [@region] end)

      stub(Nodes, :region_nodes, fn
        @region -> first
        _ -> []
      end)

      :telemetry.execute([:syn, RegionNodes, :joined], %{}, %{name: @region})
      assert_eventually {:ok, _, _} = RegionRings.expected_router(@region, "tenant_0", table), @short_wait
      {:ok, _node1, vh1} = RegionRings.expected_router(@region, "tenant_0", table)
      assert vh1 == Muster.view_hash_for_members(first)

      # A node joins the region: the emitted event must update the cached view_hash.
      second = Enum.sort([node(), :"rr1@127.0.0.1", :"rr2@127.0.0.1"])
      expected_vh2 = Muster.view_hash_for_members(second)

      stub(Nodes, :region_nodes, fn
        @region -> second
        _ -> []
      end)

      :telemetry.execute([:syn, RegionNodes, :joined], %{}, %{name: @region})

      assert_eventually(
        {:ok, _, ^expected_vh2} = RegionRings.expected_router(@region, "tenant_0", table),
        @short_wait
      )

      {:ok, _node2, vh2} = RegionRings.expected_router(@region, "tenant_0", table)
      assert vh2 == expected_vh2
      refute vh2 == vh1
    end
  end

  # A full distributed check: stand up a real multi-node Muster cluster in a remote
  # region, then assert the locally-reconstructed ring in RegionRings matches that
  # scope's live routing exactly — both the router it picks for every group and the
  # view_hash it tags them with. This is the property RegionRings exists to provide:
  # reproduce a remote scope's routing without running that scope locally.
  describe "distributed: mirrors a remote region's live Muster ring" do
    @remote_region "ap-southeast-2"

    setup do
      # RegionRings only builds rings for regions other than our own, so pin the
      # origin to a different region than the remote cluster below.
      previous_region = Application.get_env(:realtime, :region)
      Application.put_env(:realtime, :region, "us-east-1")
      on_exit(fn -> Application.put_env(:realtime, :region, previous_region) end)

      :ok
    end

    test "expected_router agrees with the remote scope's router and view_hash for every group" do
      remote_nodes = start_remote_region_cluster()
      remote_scope = :"realtime_channels_#{@remote_region}"
      remote = hd(remote_nodes)

      # The origin learns the remote region's membership through syn, exactly as
      # RegionRings.reconcile/1 reads it.
      assert_eventually Nodes.region_nodes(@remote_region) == Enum.sort(remote_nodes), @cluster_wait

      # An isolated RegionRings that reconciles from live syn membership, with a short
      # backstop so any late syn propagation is folded in without a membership event.
      %{table: table} = start_region_rings!(reconcile_on_init: true, reconcile_interval_ms: 100)

      remote_view_hash = fn -> :erpc.call(remote, Muster, :view_hash, [remote_scope]) end

      # Wait until our reconstructed ring has converged on the view the remote scope
      # actually publishes — this is the view_hash equality the router relies on to
      # trust occupancy instead of flooding.
      assert_eventually(
        case RegionRings.expected_router(@remote_region, "probe", table) do
          {:ok, _node, vh} -> vh == remote_view_hash.()
          _ -> false
        end,
        @cluster_wait
      )

      expected_vh = remote_view_hash.()

      # For a spread of groups, our local reconstruction must name the exact router
      # the remote scope would, tagged with the remote view_hash.
      for i <- 1..200 do
        group = "rr-int-#{i}"
        assert {:ok, remote_router} = :erpc.call(remote, Muster, :router, [remote_scope, group])

        assert RegionRings.expected_router(@remote_region, group, table) ==
                 {:ok, remote_router, expected_vh},
               "group #{group} routed differently than the remote scope"
      end
    end
  end

  # Start a real multi-node Muster cluster in @remote_region and wait until every
  # node's scope is :ready and agrees on a single view. Returns the sorted node list.
  defp start_remote_region_cluster do
    gen_rpc_port = Application.fetch_env!(:gen_rpc, :tcp_server_port)
    remote_scope = :"realtime_channels_#{@remote_region}"

    peers = [:rr_int_a, :rr_int_b, :rr_int_c]

    client_config_per_node =
      Map.new([
        {node(), gen_rpc_port}
        | Enum.map(peers, fn peer -> {TestEnv.peer_node(peer), TestEnv.peer_gen_rpc_port(peer)} end)
      ])

    on_exit(fn -> Application.put_env(:gen_rpc, :client_config_per_node, {:internal, %{}}) end)
    Application.put_env(:gen_rpc, :client_config_per_node, {:internal, client_config_per_node})
    extra_config = [{:gen_rpc, :client_config_per_node, {:internal, client_config_per_node}}]

    nodes =
      Enum.map(peers, fn peer ->
        config =
          [{:realtime, :region, @remote_region}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(peer)}] ++
            extra_config

        {:ok, n} = Clustered.start(nil, name: peer, extra_config: config, phoenix_port: TestEnv.peer_http_port(peer))

        n
      end)

    assert_eventually(
      Enum.all?(nodes, fn n -> :erpc.call(n, Muster, :status, [remote_scope]) == :ready end) and
        nodes |> Enum.map(&:erpc.call(&1, Muster, :view_hash, [remote_scope])) |> Enum.uniq() |> length() == 1,
      @cluster_wait
    )

    Enum.sort(nodes)
  end

  defp reconcile(pid) do
    send(pid, :syn_changed)
    # calling :sys.get_state/1 ensures that the above message has been processed
    # as this is a sync call
    :sys.get_state(pid)
  end
end
