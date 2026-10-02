defmodule Realtime.GenRpcPubSub.WorkerTest do
  use ExUnit.Case, async: true
  alias Realtime.GenRpcPubSub.Worker
  alias Realtime.GenRpc
  alias Realtime.Nodes
  alias Forum.Muster

  import ExUnit.CaptureLog

  use Mimic

  setup :set_mimic_from_context

  @topic "test_topic"
  @fanout_event [:realtime, :broadcast, :fanout, :node_delivery]
  @view_hash "vh"

  setup do
    worker = start_link_supervised!({Worker, {Realtime.PubSub, __MODULE__}})
    %{worker: worker}
  end

  describe "forward to local" do
    test "local broadcast", %{worker: worker} do
      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)
      send(worker, Worker.forward_to_local(@topic, "le message", Phoenix.PubSub))

      assert_receive "le message"
      refute_receive _any
    end
  end

  describe "forward to region" do
    setup %{worker: worker} do
      GenRpc
      |> stub()
      |> allow(self(), worker)

      Nodes
      |> stub()
      |> allow(self(), worker)

      :ok
    end

    test "local broadcast + forward to other nodes", %{worker: worker} do
      parent = self()
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2, :node_us_3] end)

      expect(GenRpc, :abcast, fn [:node_us_2, :node_us_3],
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, :abcast_called)
        :ok
      end)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)
      send(worker, Worker.forward_to_region(@topic, "le message", Phoenix.PubSub))

      assert_receive "le message"
      assert_receive :abcast_called
      refute_receive _any
    end

    test "local broadcast and no other nodes", %{worker: worker} do
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node()] end)

      reject(GenRpc, :abcast, 4)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)
      send(worker, Worker.forward_to_region(@topic, "le message", Phoenix.PubSub))

      assert_receive "le message"
      refute_receive _any
    end
  end

  describe "broadcast fan-out telemetry" do
    setup do
      ref = :telemetry_test.attach_event_handlers(self(), [@fanout_event])
      tenant_id = "worker-#{System.unique_integer([:positive])}"
      %{ref: ref, tenant_id: tenant_id}
    end

    test "forward to local emits hit=true when the node holds a connection for the tenant",
         %{worker: worker, ref: ref, tenant_id: tenant_id} do
      :ok = Realtime.UsersCounter.add(self(), tenant_id)

      message = {:tb, tenant_id, %Phoenix.Socket.Broadcast{topic: @topic, event: "e", payload: %{}}}
      send(worker, Worker.forward_to_local(@topic, message, Phoenix.PubSub))

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: count}, %{tenant: ^tenant_id, hit: true}}, 500
      assert count >= 1
      refute_receive {@fanout_event, ^ref, _, %{tenant: ^tenant_id}}
    end

    test "forward to local emits hit=false when the node holds no connection for the tenant",
         %{worker: worker, ref: ref, tenant_id: tenant_id} do
      message = {:tb, tenant_id, %Phoenix.Socket.Broadcast{topic: @topic, event: "e", payload: %{}}}
      send(worker, Worker.forward_to_local(@topic, message, Phoenix.PubSub))

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: 0}, %{tenant: ^tenant_id, hit: false}}, 500
      refute_receive {@fanout_event, ^ref, _, %{tenant: ^tenant_id}}
    end

    test "does not emit for untagged messages", %{worker: worker, ref: ref, tenant_id: tenant_id} do
      send(worker, Worker.forward_to_local(@topic, "untagged message", Phoenix.PubSub))

      refute_receive {@fanout_event, ^ref, _, %{tenant: ^tenant_id}}
    end

    test "forward to region also measures fan-out on the receiving node",
         %{worker: worker, ref: ref, tenant_id: tenant_id} do
      GenRpc
      |> stub()
      |> allow(self(), worker)

      Nodes
      |> stub()
      |> allow(self(), worker)

      expect(Nodes, :region_nodes, fn "us-east-1" -> [node()] end)

      message = {:tb, tenant_id, %Phoenix.Socket.Broadcast{topic: @topic, event: "e", payload: %{}}}
      send(worker, Worker.forward_to_region(@topic, message, Phoenix.PubSub))

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: 0}, %{tenant: ^tenant_id, hit: false}}, 500
      refute_receive {@fanout_event, ^ref, _, %{tenant: ^tenant_id}}
    end
  end

  describe "route/6" do
    test "builds the routed-broadcast message" do
      assert Worker.route("tenant", "topic", "msg", Phoenix.PubSub, :origin, "vh") ==
               {:route, "tenant", "topic", "msg", Phoenix.PubSub, :origin, "vh"}
    end
  end

  describe "route_region/5" do
    test "builds the cross-region routed-broadcast message" do
      assert Worker.route_region("topic", "tenant", "msg", Phoenix.PubSub, "vh") ==
               {:route_region, "topic", "tenant", "msg", Phoenix.PubSub, "vh"}
    end
  end

  describe "targets_or_flood/4" do
    test "returns the Muster targets when available" do
      expect(Muster, :targets, fn :scope, "tenant", "vh" -> {:ok, [:node_us_2, :node_us_3]} end)

      assert Worker.targets_or_flood(:scope, "tenant", "us-east-1", "vh") == [:node_us_2, :node_us_3]
    end

    test "falls back to the region nodes when Muster says :flood" do
      expect(Muster, :targets, fn :scope, "tenant", "vh" -> {:error, :flood} end)
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2, :node_us_3] end)

      assert Worker.targets_or_flood(:scope, "tenant", "us-east-1", "vh") ==
               [node(), :node_us_2, :node_us_3]
    end
  end

  describe "routed broadcast" do
    setup %{worker: worker} do
      GenRpc
      |> stub()
      |> allow(self(), worker)

      Nodes
      |> stub()
      |> allow(self(), worker)

      Muster
      |> stub()
      |> allow(self(), worker)

      %{ref: :telemetry_test.attach_event_handlers(self(), [@fanout_event])}
    end

    test "as router: delivers locally and :ftl to remote targets, excluding the origin", %{worker: worker} do
      parent = self()
      tenant_id = "routed-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      # Targets include this node (local), a remote node, and the origin (must be excluded).
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash ->
        {:ok, [node(), :node_us_2, :node_origin]}
      end)

      expect(GenRpc, :abcast, fn [:node_us_2],
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, :abcast_called)
        :ok
      end)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(
        worker,
        Worker.route(tenant_id, @topic, "le message", Phoenix.PubSub, :node_origin, @view_hash)
      )

      assert_receive "le message"
      assert_receive :abcast_called
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "as router: floods the region when Muster.targets returns :flood", %{worker: worker} do
      parent = self()
      tenant_id = "routed-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:error, :flood} end)
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2, :node_us_3] end)

      expect(GenRpc, :abcast, fn nodes,
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, {:abcast_called, nodes})
        :ok
      end)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(
        worker,
        Worker.route(tenant_id, @topic, "le message", Phoenix.PubSub, :node_origin, @view_hash)
      )

      assert_receive "le message"
      assert_receive {:abcast_called, nodes}
      assert Enum.sort(nodes) == [:node_us_2, :node_us_3]
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "logs a warning and floods the region (except origin) when the router changed", %{worker: worker} do
      parent = self()
      tenant_id = "routed-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, :some_other_node} end)
      # The authoritative occupancy set is never consulted once the router changed.
      reject(Muster, :targets, 3)
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2, :node_origin] end)

      expect(GenRpc, :abcast, fn [:node_us_2],
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, :abcast_called)
        :ok
      end)

      log =
        capture_log(fn ->
          :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

          send(
            worker,
            Worker.route(tenant_id, @topic, "le message", Phoenix.PubSub, :node_origin, @view_hash)
          )

          assert_receive "le message"
          assert_receive :abcast_called
        end)

      assert log =~ "Muster router changed during broadcast (:route) for tenant #{tenant_id}"
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "does not :ftl when there are no remote targets", %{worker: worker} do
      tenant_id = "routed-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [node()]} end)
      reject(GenRpc, :abcast, 4)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(
        worker,
        Worker.route(tenant_id, @topic, "le message", Phoenix.PubSub, :node_origin, @view_hash)
      )

      assert_receive "le message"
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "delivers nothing when the origin is the only target", %{worker: worker} do
      tenant_id = "routed-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [:node_origin]} end)
      reject(GenRpc, :abcast, 4)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(
        worker,
        Worker.route(tenant_id, @topic, "le message", Phoenix.PubSub, :node_origin, @view_hash)
      )

      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "routed local delivery emits hit=true when this node holds a connection", %{worker: worker, ref: ref} do
      tenant_id = "routed-hit-#{System.unique_integer([:positive])}"
      :ok = Realtime.UsersCounter.add(self(), tenant_id)

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [node()]} end)

      message = {:tb, tenant_id, %Phoenix.Socket.Broadcast{topic: @topic, event: "e", payload: %{}}}
      send(worker, Worker.route(tenant_id, @topic, message, Phoenix.PubSub, :node_origin, @view_hash))

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: count}, %{tenant: ^tenant_id, hit: true}}
      assert count >= 1
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end
  end

  describe "cross-region routed broadcast" do
    setup %{worker: worker} do
      GenRpc
      |> stub()
      |> allow(self(), worker)

      Nodes
      |> stub()
      |> allow(self(), worker)

      Muster
      |> stub()
      |> allow(self(), worker)

      %{ref: :telemetry_test.attach_event_handlers(self(), [@fanout_event])}
    end

    test "as router: delivers locally and :ftl to remote targets", %{worker: worker} do
      parent = self()
      tenant_id = "routed-region-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [node(), :node_us_2]} end)

      expect(GenRpc, :abcast, fn [:node_us_2],
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, :abcast_called)
        :ok
      end)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(worker, Worker.route_region(@topic, tenant_id, "le message", Phoenix.PubSub, @view_hash))

      assert_receive "le message"
      assert_receive :abcast_called
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "as router: floods the region when Muster.targets returns :flood", %{worker: worker} do
      parent = self()
      tenant_id = "routed-region-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:error, :flood} end)
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2, :node_us_3] end)

      expect(GenRpc, :abcast, fn nodes,
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, {:abcast_called, nodes})
        :ok
      end)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(worker, Worker.route_region(@topic, tenant_id, "le message", Phoenix.PubSub, @view_hash))

      assert_receive "le message"
      assert_receive {:abcast_called, nodes}
      assert Enum.sort(nodes) == [:node_us_2, :node_us_3]
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "floods the region when this node is not the router", %{worker: worker} do
      parent = self()
      tenant_id = "routed-region-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, :some_other_node} end)
      # The authoritative occupancy set is never consulted once we are not the router.
      reject(Muster, :targets, 3)
      expect(Nodes, :region_nodes, fn "us-east-1" -> [node(), :node_us_2] end)

      expect(GenRpc, :abcast, fn [:node_us_2],
                                 Realtime.GenRpcPubSub.WorkerTest,
                                 {:ftl, "test_topic", "le message", Phoenix.PubSub},
                                 [] ->
        send(parent, :abcast_called)
        :ok
      end)

      log =
        capture_log(fn ->
          :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

          send(worker, Worker.route_region(@topic, tenant_id, "le message", Phoenix.PubSub, @view_hash))

          assert_receive "le message"
          assert_receive :abcast_called
        end)

      assert log =~ "Muster router changed during broadcast (:route_region)"
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "does not :ftl when there are no remote targets", %{worker: worker} do
      tenant_id = "routed-region-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [node()]} end)
      reject(GenRpc, :abcast, 4)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(worker, Worker.route_region(@topic, tenant_id, "le message", Phoenix.PubSub, @view_hash))

      assert_receive "le message"
      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "does not send locally if current node does not have occupancy", %{worker: worker} do
      tenant_id = "routed-region-#{System.unique_integer([:positive])}"

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, []} end)
      reject(GenRpc, :abcast, 4)

      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, @topic)

      send(worker, Worker.route_region(@topic, tenant_id, "le message", Phoenix.PubSub, @view_hash))

      refute_receive "le message"
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end

    test "local delivery emits hit=true when this node holds a connection", %{worker: worker, ref: ref} do
      tenant_id = "routed-region-hit-#{System.unique_integer([:positive])}"
      :ok = Realtime.UsersCounter.add(self(), tenant_id)

      expect(Muster, :router, fn _scope, ^tenant_id -> {:ok, node()} end)
      expect(Muster, :targets, fn _scope, ^tenant_id, @view_hash -> {:ok, [node()]} end)

      message = {:tb, tenant_id, %Phoenix.Socket.Broadcast{topic: @topic, event: "e", payload: %{}}}
      send(worker, Worker.route_region(@topic, tenant_id, message, Phoenix.PubSub, @view_hash))

      assert_receive {@fanout_event, ^ref, %{local_tenant_users: count}, %{tenant: ^tenant_id, hit: true}}
      assert count >= 1
      refute_receive {@fanout_event, _, _, %{tenant: ^tenant_id}}
    end
  end
end
