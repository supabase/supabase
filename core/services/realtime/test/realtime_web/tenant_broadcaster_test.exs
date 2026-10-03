defmodule RealtimeWeb.TenantBroadcasterTest do
  # Usage of Clustered and changing Application env
  use Realtime.DataCase, async: false

  alias Phoenix.Socket.Broadcast

  alias RealtimeWeb.Endpoint
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher
  alias RealtimeWeb.TenantBroadcaster

  @topic "test-topic" <> to_string(__MODULE__)

  @aux_mod (quote do
              defmodule Subscriber do
                # Relay messages to testing node
                def subscribe(subscriber, topic) do
                  spawn(fn ->
                    RealtimeWeb.Endpoint.subscribe(topic)
                    send(subscriber, :ready)

                    receive do
                      msg ->
                        send(subscriber, {:relay, node(), msg})
                    end
                  end)
                end

                # Relay the fan-out telemetry emitted on this (receiving) node back to the test process.
                # Filter by tenant so an in-flight tagged broadcast from a prior test (different
                # tenant) can't leak into a later test's mailbox.
                def attach_fanout(dest, tenant) do
                  :telemetry.attach(
                    {__MODULE__, dest},
                    [:realtime, :broadcast, :fanout, :node_delivery],
                    &__MODULE__.relay_fanout/4,
                    %{dest: dest, tenant: tenant}
                  )
                end

                def detach_fanout(dest), do: :telemetry.detach({__MODULE__, dest})

                def relay_fanout(_event, measurements, %{tenant: tenant} = metadata, %{dest: dest, tenant: tenant}) do
                  send(dest, {:fanout, measurements, metadata})
                end

                def relay_fanout(_event, _measurements, _metadata, _config), do: :ok
              end
            end)

  setup_all do
    {:ok, node} = Clustered.start(@aux_mod)

    %{node: node}
  end

  setup context do
    tenant_id = random_string()
    topic = "#{@topic}:#{tenant_id}"
    Endpoint.subscribe(topic)

    :erpc.call(context.node, Subscriber, :subscribe, [self(), topic])
    assert_receive :ready

    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    :telemetry.attach(
      __MODULE__,
      [:realtime, :tenants, :payload, :size],
      &__MODULE__.handle_telemetry/4,
      %{pid: self(), tenant: tenant_id}
    )

    {:ok, tenant_id: tenant_id, topic: topic}
  end

  describe "pubsub_broadcast/5" do
    test "pubsub_broadcast", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}
      expected_size = payload_size(message)
      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end

    test "pubsub_broadcast list payload", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: ["a", %{"b" => "c"}, 1, 23]}
      expected_size = payload_size(message)
      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end

    test "pubsub_broadcast string payload", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: "some text payload"}
      expected_size = payload_size(message)
      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end
  end

  describe "pubsub_broadcast_from/6" do
    test "pubsub_broadcast_from", %{node: node, tenant_id: tenant_id, topic: topic} do
      parent = self()

      spawn_link(fn ->
        Endpoint.subscribe(topic)
        send(parent, :ready)

        receive do
          msg -> send(parent, {:other_process, msg})
        end
      end)

      assert_receive :ready

      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}
      expected_size = payload_size(message)

      TenantBroadcaster.pubsub_broadcast_from(tenant_id, self(), topic, message, Phoenix.PubSub, :broadcast)

      assert_receive {:other_process, ^message}

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }

      # This process does not receive the message
      refute_receive _any
    end
  end

  describe "pubsub_direct_broadcast/6" do
    test "pubsub_direct_broadcast", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}
      expected_size = payload_size(message)

      TenantBroadcaster.pubsub_direct_broadcast(node(), tenant_id, topic, message, Phoenix.PubSub, :broadcast)
      TenantBroadcaster.pubsub_direct_broadcast(node, tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end

    test "pubsub_direct_broadcast list payload", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: ["a", %{"b" => "c"}, 1, 23]}
      expected_size = payload_size(message)

      TenantBroadcaster.pubsub_direct_broadcast(node(), tenant_id, topic, message, Phoenix.PubSub, :broadcast)
      TenantBroadcaster.pubsub_direct_broadcast(node, tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end

    test "pubsub_direct_broadcast string payload", %{node: node, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: "some text payload"}
      expected_size = payload_size(message)

      TenantBroadcaster.pubsub_direct_broadcast(node(), tenant_id, topic, message, Phoenix.PubSub, :broadcast)
      TenantBroadcaster.pubsub_direct_broadcast(node, tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      assert_receive ^message

      # Remote node received the broadcast
      assert_receive {:relay, ^node, ^message}

      assert_receive {
        :telemetry,
        [:realtime, :tenants, :payload, :size],
        %{size: ^expected_size},
        %{tenant: ^tenant_id, message_type: :broadcast}
      }
    end
  end

  describe "collect_payload_size/3" do
    test "emit telemetry for struct", %{tenant_id: tenant_id} do
      TenantBroadcaster.collect_payload_size(
        tenant_id,
        %Phoenix.Socket.Broadcast{event: "broadcast", payload: %{"a" => "b"}},
        :broadcast
      )

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 65},
                      %{tenant: ^tenant_id, message_type: :broadcast}}
    end

    test "emit telemetry for map", %{tenant_id: tenant_id} do
      TenantBroadcaster.collect_payload_size(
        tenant_id,
        %{event: "broadcast", payload: %{"a" => "b"}},
        :postgres_changes
      )

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 53},
                      %{tenant: ^tenant_id, message_type: :postgres_changes}}
    end

    test "emit telemetry for non-map", %{tenant_id: tenant_id} do
      TenantBroadcaster.collect_payload_size(tenant_id, "some blob", :presence)

      assert_receive {:telemetry, [:realtime, :tenants, :payload, :size], %{size: 15},
                      %{tenant: ^tenant_id, message_type: :presence}}
    end
  end

  describe "broadcast fan-out tagging" do
    setup %{node: node, tenant_id: tenant_id} do
      :ok = :erpc.call(node, Subscriber, :attach_fanout, [self(), tenant_id])
      on_exit(fn -> :erpc.call(node, Subscriber, :detach_fanout, [self()]) end)
      :ok
    end

    test "tags :broadcast messages dispatched via MessageDispatcher so the receiving node measures fan-out",
         %{tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, MessageDispatcher, :broadcast)

      # The receiving node holds no connection for this tenant -> hit=false. Generous timeout: the
      # telemetry is emitted on the remote node and relayed back across the cluster hop.
      assert_receive {:fanout, %{local_tenant_users: 0}, %{tenant: ^tenant_id, hit: false}}, 5000
    end

    test "does not tag :broadcast messages dispatched by another dispatcher", %{tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      refute_receive {:fanout, _, _}
    end

    test "does not tag non-broadcast message types", %{tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, MessageDispatcher, :presence)

      refute_receive {:fanout, _, _}
    end
  end

  describe "measure_broadcast_fanout/1 on the sending node" do
    setup do
      ref = :telemetry_test.attach_event_handlers(self(), [[:realtime, :broadcast, :fanout, :node_delivery]])
      %{ref: ref}
    end

    test "pubsub_broadcast measures the sender's own local fan-out", %{ref: ref, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, MessageDispatcher, :broadcast)

      # The sending node dispatches locally without going through the Worker, but still measures.
      assert_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, %{local_tenant_users: 0},
                      %{tenant: ^tenant_id, hit: false}}
    end

    test "pubsub_broadcast measures hit=true when the sender holds a connection for the tenant",
         %{ref: ref, tenant_id: tenant_id, topic: topic} do
      :ok = Realtime.UsersCounter.add(self(), tenant_id)
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, MessageDispatcher, :broadcast)

      assert_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, %{local_tenant_users: count},
                      %{tenant: ^tenant_id, hit: true}}

      assert count >= 1
    end

    test "pubsub_broadcast_from measures the sender's own local fan-out", %{
      ref: ref,
      tenant_id: tenant_id,
      topic: topic
    } do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast_from(tenant_id, self(), topic, message, MessageDispatcher, :broadcast)

      assert_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, %{local_tenant_users: 0},
                      %{tenant: ^tenant_id, hit: false}}
    end

    test "does not measure when dispatched by another dispatcher", %{ref: ref, tenant_id: tenant_id, topic: topic} do
      message = %Broadcast{topic: topic, event: "an event", payload: %{"a" => "b"}}

      TenantBroadcaster.pubsub_broadcast(tenant_id, topic, message, Phoenix.PubSub, :broadcast)

      refute_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, _, _}
    end
  end

  describe "measure_broadcast_fanout/1" do
    setup do
      ref = :telemetry_test.attach_event_handlers(self(), [[:realtime, :broadcast, :fanout, :node_delivery]])
      %{ref: ref}
    end

    test "emits hit=false when the node holds no connection for the tenant", %{ref: ref, tenant_id: tenant_id} do
      message = %Broadcast{topic: @topic, event: "an event", payload: %{"a" => "b"}}

      assert :ok = TenantBroadcaster.measure_broadcast_fanout({:tb, tenant_id, message})

      assert_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, %{local_tenant_users: 0},
                      %{tenant: ^tenant_id, hit: false}}
    end

    test "emits hit=true and the connection count when the node holds a connection for the tenant",
         %{ref: ref, tenant_id: tenant_id} do
      :ok = Realtime.UsersCounter.add(self(), tenant_id)
      message = %Broadcast{topic: @topic, event: "an event", payload: %{"a" => "b"}}

      assert :ok = TenantBroadcaster.measure_broadcast_fanout({:tb, tenant_id, message})

      assert_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, %{local_tenant_users: count},
                      %{tenant: ^tenant_id, hit: true}}

      assert count >= 1
    end

    test "is a no-op for untagged messages", %{ref: ref} do
      assert :ok = TenantBroadcaster.measure_broadcast_fanout(%Broadcast{topic: @topic, event: "e", payload: %{}})
      assert :ok = TenantBroadcaster.measure_broadcast_fanout("untagged message")

      refute_receive {[:realtime, :broadcast, :fanout, :node_delivery], ^ref, _, _}
    end
  end

  def handle_telemetry(event, measures, metadata, %{pid: pid, tenant: tenant}) do
    if metadata[:tenant] == tenant do
      send(pid, {:telemetry, event, measures, metadata})
    end
  end

  # Mirrors TenantBroadcaster.collect_payload_size/3: the wire size depends on the message
  # (including its per-test topic), so derive it rather than hardcoding. Exact-size regressions
  # for fixed inputs are covered by the "collect_payload_size/3" describe block.
  defp payload_size(%_{} = message), do: :erlang.external_size(Map.from_struct(message))
end
