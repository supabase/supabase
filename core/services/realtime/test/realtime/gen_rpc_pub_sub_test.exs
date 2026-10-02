Application.put_env(:phoenix_pubsub, :test_adapter, {Realtime.GenRpcPubSub, []})
Code.require_file("../../deps/phoenix_pubsub/test/shared/pubsub_test.exs", __DIR__)

defmodule Realtime.GenRpcPubSubTest do
  # Application env being changed
  use ExUnit.Case, async: false
  use TestHelpers

  alias Forum.Muster
  alias Realtime.FeatureFlags
  alias Realtime.GenRpcPubSub.RegionRings
  alias Realtime.GenRpcPubSub.Worker
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher

  @cluster_wait [timeout: 15_000, interval: 100]

  @ring_convergence_wait [timeout: 20_000, interval: 100]

  test "it sets off_heap message_queue_data flag on the workers" do
    assert Realtime.PubSubElixir.Realtime.PubSub.Adapter_1
           |> Process.whereis()
           |> Process.info(:message_queue_data) == {:message_queue_data, :off_heap}
  end

  test "it sets fullsweep_after flag on the workers" do
    assert Realtime.PubSubElixir.Realtime.PubSub.Adapter_1
           |> Process.whereis()
           |> Process.info(:fullsweep_after) == {:fullsweep_after, 20}
  end

  @aux_mod (quote do
              defmodule Subscriber do
                import WaitForIt

                # Relay messages to testing node
                def subscribe(subscriber, topic) do
                  spawn(fn ->
                    RealtimeWeb.Endpoint.subscribe(topic)

                    # syn RegionNodes membership propagates asynchronously across the cluster.
                    # A TimeoutError here names the counts actually seen on this peer, where the
                    # old `eventually/2` + `raise` could only report a fixed string.
                    match_wait!(
                      %{"us-east-1" => 2, "ap-southeast-2" => 2},
                      region_node_counts(),
                      timeout: 15_000,
                      interval: 100
                    )

                    send(subscriber, {:ready, Application.get_env(:realtime, :region)})

                    loop = fn f ->
                      receive do
                        msg -> send(subscriber, {:relay, node(), msg})
                      end

                      f.(f)
                    end

                    loop.(loop)
                  end)
                end

                # Register a long-lived local member for the tenant so this node reports hit=true.
                def region_node_counts do
                  Map.new(["us-east-1", "ap-southeast-2"], &{&1, length(Realtime.Nodes.region_nodes(&1))})
                end

                def add_user(tenant_id) do
                  pid = spawn(fn -> Process.sleep(:infinity) end)
                  :ok = Realtime.UsersCounter.add(pid, tenant_id)
                end

                # Relay the fan-out telemetry emitted on this (receiving) node back to the test process.
                def attach_fanout(dest) do
                  :telemetry.attach(
                    {__MODULE__, dest},
                    [:realtime, :broadcast, :fanout, :node_delivery],
                    &__MODULE__.relay_fanout/4,
                    dest
                  )
                end

                def relay_fanout(_event, measurements, metadata, dest) do
                  send(dest, {:fanout, node(), measurements, metadata})
                end

                # Region-agnostic relay (unlike subscribe/2, no fixed topology asserts).
                def subscribe_relay(subscriber, topic) do
                  spawn(fn ->
                    RealtimeWeb.Endpoint.subscribe(topic)
                    send(subscriber, {:subscribed, node()})

                    loop = fn f ->
                      receive do
                        msg -> send(subscriber, {:relay, node(), msg})
                      end

                      f.(f)
                    end

                    loop.(loop)
                  end)
                end

                # Register a long-lived local Muster member for the tenant so this node
                # shows up in the router's occupancy set for `group`.
                def muster_join(scope, group) do
                  pid = spawn(fn -> Process.sleep(:infinity) end)
                  :ok = Forum.Muster.join(scope, group, pid)
                  pid
                end
              end
            end)

  Code.eval_quoted(@aux_mod)

  @topic "gen-rpc-pub-sub-test-topic"

  @presence_event [:realtime, :presence, :replication, :received]

  describe "regional broadcasting" do
    setup do
      previous_region = Application.get_env(:realtime, :region)
      Application.put_env(:realtime, :region, "us-east-1")
      on_exit(fn -> Application.put_env(:realtime, :region, previous_region) end)

      :ok
    end

    test "broadcasts fan out across regions and each receiving node emits fan-out telemetry" do
      # start 1 node in us-east-1 to test my region broadcasting
      # start 2 nodes in ap-southeast-2 to test other region broadcasting

      us_node = :us_node
      ap2_nodeX = :ap2_nodeX
      ap2_nodeY = :ap2_nodeY

      # Avoid port collision
      gen_rpc_port = Application.fetch_env!(:gen_rpc, :tcp_server_port)

      client_config_per_node = %{
        node() => gen_rpc_port,
        TestEnv.peer_node(us_node) => TestEnv.peer_gen_rpc_port(us_node),
        TestEnv.peer_node(ap2_nodeX) => TestEnv.peer_gen_rpc_port(ap2_nodeX),
        TestEnv.peer_node(ap2_nodeY) => TestEnv.peer_gen_rpc_port(ap2_nodeY)
      }

      extra_config = [{:gen_rpc, :client_config_per_node, {:internal, client_config_per_node}}]

      on_exit(fn -> Application.put_env(:gen_rpc, :client_config_per_node, {:internal, %{}}) end)
      Application.put_env(:gen_rpc, :client_config_per_node, {:internal, client_config_per_node})

      us_extra_config =
        [{:realtime, :region, "us-east-1"}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(us_node)}] ++
          extra_config

      {:ok, us} =
        Clustered.start(@aux_mod,
          name: us_node,
          extra_config: us_extra_config,
          phoenix_port: TestEnv.peer_http_port(us_node)
        )

      ap2_nodeX_extra_config =
        [{:realtime, :region, "ap-southeast-2"}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(ap2_nodeX)}] ++
          extra_config

      {:ok, ap_x} =
        Clustered.start(@aux_mod,
          name: ap2_nodeX,
          extra_config: ap2_nodeX_extra_config,
          phoenix_port: TestEnv.peer_http_port(ap2_nodeX)
        )

      ap2_nodeY_extra_config =
        [{:realtime, :region, "ap-southeast-2"}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(ap2_nodeY)}] ++
          extra_config

      {:ok, ap_y} =
        Clustered.start(@aux_mod,
          name: ap2_nodeY,
          extra_config: ap2_nodeY_extra_config,
          phoenix_port: TestEnv.peer_http_port(ap2_nodeY)
        )

      # syn RegionNodes membership propagates asynchronously across the cluster. Waiting on the
      # counts *per region* rather than on a combined boolean means a failure names the region
      # that did not converge, and how far it got.
      assert_eventually %{"us-east-1" => 2, "ap-southeast-2" => 2} = region_node_counts(), @cluster_wait

      RealtimeWeb.Endpoint.subscribe(@topic)
      :erpc.multicall(Node.list(), Subscriber, :subscribe, [self(), @topic])

      receive_timeout = to_timeout(second: 2)

      assert_receive {:ready, "us-east-1"}, receive_timeout
      assert_receive {:ready, "ap-southeast-2"}, receive_timeout
      assert_receive {:ready, "ap-southeast-2"}, receive_timeout

      # Relay the fan-out telemetry emitted on every receiving node back to this process.
      for node <- Node.list(), do: :ok = :erpc.call(node, Subscriber, :attach_fanout, [self()])

      # Untagged broadcast: delivered to every node, but a no-op for fan-out telemetry.
      message = %Phoenix.Socket.Broadcast{topic: @topic, event: "an event", payload: ["a", %{"b" => "c"}, 1, 23]}
      Phoenix.PubSub.broadcast(Realtime.PubSub, @topic, message)

      assert_receive ^message

      # Remote nodes received the broadcast
      assert_receive {:relay, ^us, ^message}, 5000
      assert_receive {:relay, ^ap_x, ^message}, 1000
      assert_receive {:relay, ^ap_y, ^message}, 1000

      # Untagged messages do not emit fan-out telemetry
      refute_receive {:fanout, _, _, _}
      refute_receive _any

      # Tagged broadcast: fans out via :ftl (us_node, same region) and :ftr (ap nodes, other region),
      # and each receiving node emits the fan-out telemetry. Register a connection on us_node so it
      # reports hit=true while the ap nodes report hit=false.
      tenant_id = "fanout-#{System.unique_integer([:positive])}"
      :ok = :erpc.call(us, Subscriber, :add_user, [tenant_id])

      tagged_message = %Phoenix.Socket.Broadcast{topic: @topic, event: "an event", payload: %{"a" => "b"}}

      Phoenix.PubSub.broadcast(
        Realtime.PubSub,
        @topic,
        {:tb, tenant_id, tagged_message},
        RealtimeWeb.RealtimeChannel.MessageDispatcher
      )

      # The tag is stripped before delivery: subscribers only ever see the underlying struct
      assert_receive ^tagged_message
      assert_receive {:relay, ^us, ^tagged_message}, 5000
      assert_receive {:relay, ^ap_x, ^tagged_message}, 1000
      assert_receive {:relay, ^ap_y, ^tagged_message}, 1000

      # us_node holds a connection for the tenant (:ftl path) -> hit=true
      assert_receive {:fanout, ^us, %{local_tenant_users: us_count}, %{tenant: ^tenant_id, hit: true}}, 5000

      assert us_count >= 1

      # ap nodes hold no connection for the tenant (:ftr path + its re-forwarded :ftl) -> hit=false
      assert_receive {:fanout, ^ap_x, %{local_tenant_users: 0}, %{tenant: ^tenant_id, hit: false}}, 1000

      assert_receive {:fanout, ^ap_y, %{local_tenant_users: 0}, %{tenant: ^tenant_id, hit: false}}, 1000

      refute_receive _any

      presence_topic = "phx_presence:gen_rpc_pub_sub_test"
      presence_message = {:pub, :heartbeat, {:gen_rpc_pub_sub_test, 1}, :empty, %{}}
      size = :erlang.external_size(Worker.forward_to_local(presence_topic, presence_message, Phoenix.PubSub))

      refs =
        for node <- [us, ap_x, ap_y],
            do: :erpc.call(node, :telemetry_test, :attach_event_handlers, [self(), [@presence_event]])

      Phoenix.PubSub.broadcast(Realtime.PubSub, presence_topic, presence_message)

      for ref <- refs do
        assert_receive {@presence_event, ^ref, %{size: ^size}, %{implementation: "phoenix"}}, 5000
      end

      refute_receive {@presence_event, _, %{size: ^size}, _}
    end
  end

  describe "presence traffic telemetry" do
    setup do
      topic = "phx_presence:gen_rpc_pub_sub_test_#{System.unique_integer([:positive])}"
      message = {:pub, :heartbeat, {:gen_rpc_pub_sub_test, 1}, :empty, %{}}
      ref = :telemetry_test.attach_event_handlers(self(), [@presence_event])
      %{topic: topic, message: message, ref: ref}
    end

    test "the receiving worker emits the envelope's external size for presence topics", %{
      topic: topic,
      message: message,
      ref: ref
    } do
      ftl = Worker.forward_to_local(topic, message, Phoenix.PubSub)
      ftr = Worker.forward_to_region(topic, message, Phoenix.PubSub)
      size = :erlang.external_size(ftl)
      assert :erlang.external_size(ftr) == size

      route_to_worker(node(), ftl)
      assert_receive {@presence_event, ^ref, %{size: ^size}, %{implementation: "phoenix"}}, 1000

      route_to_worker(node(), ftr)
      assert_receive {@presence_event, ^ref, %{size: ^size}, %{implementation: "phoenix"}}, 1000
    end

    test "the receiving worker emits nothing for non-presence topics", %{message: message, ref: ref} do
      ftl = Worker.forward_to_local(@topic, message, Phoenix.PubSub)
      ftr = Worker.forward_to_region(@topic, message, Phoenix.PubSub)

      size = :erlang.external_size(ftl)

      route_to_worker(node(), ftl)
      route_to_worker(node(), ftr)

      refute_receive {@presence_event, ^ref, %{size: ^size}, _}
    end
  end

  describe "muster-routed broadcasting (use_muster_broadcast)" do
    setup do
      previous_region = Application.get_env(:realtime, :region)
      Application.put_env(:realtime, :region, "us-east-1")
      on_exit(fn -> Application.put_env(:realtime, :region, previous_region) end)

      :ok
    end

    test "delivers to origin subscribers exactly once (routed path excludes the origin)" do
      scope = Application.fetch_env!(:realtime, :muster_scope)
      assert_eventually Muster.status(scope) == :ready, @cluster_wait

      tenant_id = "muster-bcast-#{System.unique_integer([:positive])}"
      topic = "muster-bcast-#{System.unique_integer([:positive])}"

      # The origin holds the tenant, so Muster names this node the router and lists
      # it in the occupancy set.
      member = spawn_link(fn -> Process.sleep(:infinity) end)
      :ok = Muster.join(scope, tenant_id, member)
      assert Muster.targets(scope, tenant_id, Muster.view_hash(scope)) == {:ok, [node()]}

      enable_broadcast_flag!(tenant_id)
      RealtimeWeb.Endpoint.subscribe(topic)

      message = %Phoenix.Socket.Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}
      Phoenix.PubSub.broadcast(Realtime.PubSub, topic, {:tb, tenant_id, message}, MessageDispatcher)

      # Phoenix's local dispatch delivers the (tag-stripped) struct on the origin...
      assert_receive ^message
      # ...and the routed path must NOT fan a second copy back to the origin.
      refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}, 200
    end

    test "prunes intra-region fanout to the tenant's holders for every router placement" do
      %{holder_node: holder_node, bystander_node: bystander_node, scope: scope} = start_us_east_region_cluster()

      # Exercise all three router placements deterministically by picking a group key
      # whose hash-ring router lands on the intended node: the broadcasting node
      # itself, the node that holds the tenant, and a third node that holds nothing.
      # These are distinct code paths (local send vs remote route-hop; local_broadcast
      # vs :ftl; router-is-a-holder vs router-holds-nothing).
      placements = [{"origin", node()}, {"holder", holder_node}, {"bystander", bystander_node}]

      for {label, router_node} <- placements do
        tenant_id = group_routed_to(scope, router_node)
        assert Muster.router(scope, tenant_id) == {:ok, router_node}

        # Only the holder joins the tenant's Muster group.
        _pid = :erpc.call(holder_node, Subscriber, :muster_join, [scope, tenant_id])

        enable_broadcast_flag!(tenant_id)

        topic = "muster-prune-#{label}-#{System.unique_integer([:positive])}"
        RealtimeWeb.Endpoint.subscribe(topic)
        subscribe_region_relays(holder_node, bystander_node, topic)

        message = %Phoenix.Socket.Broadcast{topic: topic, event: "e", payload: %{"router" => label}}
        Phoenix.PubSub.broadcast(Realtime.PubSub, topic, {:tb, tenant_id, message}, MessageDispatcher)

        # Origin always delivers locally; the holder is routed to; the bystander is pruned.
        assert_receive ^message, 1000, "origin should receive locally (router=#{label})"
        assert_receive {:relay, ^holder_node, ^message}, 5000, "holder should receive (router=#{label})"
        refute_receive {:relay, ^bystander_node, _}, 500
      end
    end

    test "over-delivers to the whole region when the router cannot trust its routing" do
      %{holder_node: holder_node, bystander_node: bystander_node, scope: scope} = start_us_east_region_cluster()

      # A group whose router is the holder, held only by the holder.
      tenant_id = group_routed_to(scope, holder_node)
      _pid = :erpc.call(holder_node, Subscriber, :muster_join, [scope, tenant_id])

      # Case 1: the sender saw a different cluster view. We hand the router a route
      # tagged with a stale view_hash, so `targets/3` cannot decide and the router
      # must flood the whole region (the bystander too), even though only the holder
      # actually holds the tenant.
      topic1 = "muster-flood-staleview-#{System.unique_integer([:positive])}"
      subscribe_region_relays(holder_node, bystander_node, topic1)
      message1 = %Phoenix.Socket.Broadcast{topic: topic1, event: "e", payload: %{"case" => "stale-view"}}
      stale_view_hash = Muster.view_hash(scope) + 1

      # The routed message carries the tenant tag, exactly as the adapter forwards it.
      route_to_worker(
        holder_node,
        Worker.route(tenant_id, topic1, {:tb, tenant_id, message1}, MessageDispatcher, node(), stale_view_hash)
      )

      assert_receive {:relay, ^holder_node, ^message1}, 5000
      assert_receive {:relay, ^bystander_node, ^message1}, 5000

      # Case 2: the router changed under us. We send the route to the bystander, which
      # is NOT the router for this tenant (the origin thought it was, but the ring
      # moved). It must recognise this and just fan out to the region rather than
      # trust a stale decision
      topic2 = "muster-flood-wrongrouter-#{System.unique_integer([:positive])}"
      subscribe_region_relays(holder_node, bystander_node, topic2)
      message2 = %Phoenix.Socket.Broadcast{topic: topic2, event: "e", payload: %{"case" => "wrong-router"}}
      view_hash = Muster.view_hash(scope)

      route_to_worker(
        bystander_node,
        Worker.route(tenant_id, topic2, {:tb, tenant_id, message2}, MessageDispatcher, node(), view_hash)
      )

      assert_receive {:relay, ^holder_node, ^message2}, 5000
      assert_receive {:relay, ^bystander_node, ^message2}, 5000
    end

    test "routes across regions to the remote region's expected router, pruning bystanders" do
      %{holder_node: ap_holder, bystander_node: ap_bystander, scope: ap_scope} = start_ap_region_cluster()

      # The origin (us-east-1) must have learned the ap region's membership via syn
      # and reconciled a local copy of its ring whose view agrees with the ap scope.
      assert_eventually %{"ap-southeast-2" => 2} = region_node_counts(), @cluster_wait

      assert_eventually {:agreed, _node, _vh} = ap_router_agreement(ap_holder, ap_scope), @cluster_wait

      # Pick a tenant whose ap-region router is the holder, so the holder is both the
      # router and the sole occupancy node (the clean, non-flood routed path).
      tenant_id =
        Enum.find_value(1..2000, fn i ->
          id = "xr-#{i}-#{System.unique_integer([:positive])}"
          if :erpc.call(ap_holder, Muster, :router, [ap_scope, id]) == {:ok, ap_holder}, do: id
        end) || flunk("no ap group routed to the holder")

      # The origin's reconstructed ring agrees on the router, and its computed
      # view_hash matches the ap router's, so the router trusts occupancy (no flood).
      assert {:ok, ^ap_holder, vh} = RegionRings.expected_router("ap-southeast-2", tenant_id)
      assert vh == :erpc.call(ap_holder, Muster, :view_hash, [ap_scope])

      # Only the holder joins the tenant's ap Muster group.
      _pid = :erpc.call(ap_holder, Subscriber, :muster_join, [ap_scope, tenant_id])

      enable_broadcast_flag!(tenant_id)

      topic = "muster-xregion-#{System.unique_integer([:positive])}"
      subscribe_region_relays(ap_holder, ap_bystander, topic)

      message = %Phoenix.Socket.Broadcast{topic: topic, event: "e", payload: %{"scope" => "cross-region"}}
      Phoenix.PubSub.broadcast(Realtime.PubSub, topic, {:tb, tenant_id, message}, MessageDispatcher)

      # The holder (in the remote region) is routed to; the bystander is pruned.
      assert_receive {:relay, ^ap_holder, ^message}, 5000
      refute_receive {:relay, ^ap_bystander, _}, 500
    end
  end

  # Start two extra us-east-1 nodes (holder + bystander) so the origin makes three,
  # and wait until the region's Muster ring is :ready and agrees on a single view.
  defp start_us_east_region_cluster do
    start_region_cluster("us-east-1", holder: :holder_us, bystander: :bystander_us)
  end

  # Start two nodes in a *different* region (ap-southeast-2) than the origin, and
  # wait until their Muster scope is :ready and agrees on a single view.
  defp start_ap_region_cluster do
    start_region_cluster("ap-southeast-2", holder: :holder_ap, bystander: :bystander_ap)
  end

  # Start a holder + bystander pair in `region` and wait until their Muster scope is
  # :ready and agrees on a single view. When `region` is the origin's own region the
  # origin joins the ring too, so it is included in the convergence wait; otherwise
  # only the two remote nodes are. Each region's pair takes its own peer slots, so the
  # two clusters never reuse a port that has not yet been torn down.
  defp start_region_cluster(region, opts) do
    holder = Keyword.fetch!(opts, :holder)
    bystander = Keyword.fetch!(opts, :bystander)

    gen_rpc_port = Application.fetch_env!(:gen_rpc, :tcp_server_port)

    client_config_per_node = %{
      node() => gen_rpc_port,
      TestEnv.peer_node(holder) => TestEnv.peer_gen_rpc_port(holder),
      TestEnv.peer_node(bystander) => TestEnv.peer_gen_rpc_port(bystander)
    }

    on_exit(fn -> Application.put_env(:gen_rpc, :client_config_per_node, {:internal, %{}}) end)
    Application.put_env(:gen_rpc, :client_config_per_node, {:internal, client_config_per_node})
    extra_config = [{:gen_rpc, :client_config_per_node, {:internal, client_config_per_node}}]

    holder_config =
      [{:realtime, :region, region}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(holder)}] ++ extra_config

    {:ok, holder_node} =
      Clustered.start(@aux_mod, name: holder, extra_config: holder_config, phoenix_port: TestEnv.peer_http_port(holder))

    bystander_config =
      [{:realtime, :region, region}, {:gen_rpc, :tcp_server_port, TestEnv.peer_gen_rpc_port(bystander)}] ++ extra_config

    {:ok, bystander_node} =
      Clustered.start(@aux_mod,
        name: bystander,
        extra_config: bystander_config,
        phoenix_port: TestEnv.peer_http_port(bystander)
      )

    scope = :"realtime_channels_#{region}"

    nodes =
      if region == Application.fetch_env!(:realtime, :region),
        do: [node(), holder_node, bystander_node],
        else: [holder_node, bystander_node]

    assert_eventually(
      %{statuses: [:ready], view_hashes: [_one]} = muster_convergence(nodes, scope),
      @ring_convergence_wait
    )

    %{holder_node: holder_node, bystander_node: bystander_node, scope: scope}
  end

  defp region_node_counts do
    Map.new(["us-east-1", "ap-southeast-2"], &{&1, length(Realtime.Nodes.region_nodes(&1))})
  end

  defp ap_router_agreement(ap_holder, ap_scope) do
    remote_view_hash = :erpc.call(ap_holder, Muster, :view_hash, [ap_scope])

    case RegionRings.expected_router("ap-southeast-2", "probe") do
      {:ok, node, ^remote_view_hash} -> {:agreed, node, remote_view_hash}
      other -> {:disagreed, other, remote_view_hash}
    end
  end

  defp muster_convergence(nodes, scope) do
    %{
      statuses: nodes |> Enum.map(&:erpc.call(&1, Muster, :status, [scope])) |> Enum.uniq(),
      view_hashes: nodes |> Enum.map(&:erpc.call(&1, Muster, :view_hash, [scope])) |> Enum.uniq()
    }
  end

  # Find a group key whose consistent-hash router is `target_node` (all nodes agree
  # on the ring once converged, so it is safe to compute this on the origin).
  defp group_routed_to(scope, target_node) do
    Enum.find_value(1..2000, fn i ->
      id = "muster-route-#{i}-#{System.unique_integer([:positive])}"
      if Muster.router(scope, id) == {:ok, target_node}, do: id
    end) || flunk("no group routed to #{inspect(target_node)}")
  end

  # Inject a routing message straight into a GenRpcPubSub broadcast worker on `target`
  # (bypassing `broadcast/4`) so the router-side flood fallbacks can be exercised
  # deterministically.
  defp route_to_worker(target, route) do
    worker = Realtime.PubSubElixir.Realtime.PubSub.Adapter_1

    send({worker, target}, route)
    :ok
  end

  defp subscribe_region_relays(holder_node, bystander_node, topic) do
    :erpc.call(holder_node, Subscriber, :subscribe_relay, [self(), topic])
    :erpc.call(bystander_node, Subscriber, :subscribe_relay, [self(), topic])
    assert_receive {:subscribed, ^holder_node}, 5000
    assert_receive {:subscribed, ^bystander_node}, 5000
    :ok
  end

  # Enable `use_muster_broadcast` for the tenant without touching the DB: seed both
  # the flag cache (so the flag exists) and the tenant cache (with an override), then
  # tear them down so nothing leaks into other async tests via the shared caches.
  defp enable_broadcast_flag!(tenant_id) do
    flag = %Realtime.Api.FeatureFlag{name: "use_muster_broadcast", enabled: true, rollout_percentage: 100}
    {:ok, true} = FeatureFlags.Cache.update_cache(flag)

    tenant = %Realtime.Api.Tenant{external_id: tenant_id, feature_flags: %{"use_muster_broadcast" => true}}
    {:ok, true} = Realtime.Tenants.Cache.update_cache(tenant)

    on_exit(fn ->
      FeatureFlags.Cache.invalidate_cache("use_muster_broadcast")
      Realtime.Tenants.Cache.invalidate_tenant_cache(tenant_id)
    end)
  end
end
