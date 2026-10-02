defmodule RealtimeWeb.TenantBroadcaster do
  @moduledoc """
  gen_rpc broadcaster
  """

  alias Phoenix.PubSub
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher

  @type message_type :: :broadcast | :presence | :postgres_changes

  @spec pubsub_direct_broadcast(
          node :: node(),
          tenant_id :: String.t(),
          PubSub.topic(),
          PubSub.message(),
          PubSub.dispatcher(),
          message_type
        ) ::
          :ok
  def pubsub_direct_broadcast(node, tenant_id, topic, message, dispatcher, message_type) do
    collect_payload_size(tenant_id, message, message_type)

    do_direct_broadcast(node, topic, message, dispatcher)

    :ok
  end

  # Remote
  defp do_direct_broadcast(node, topic, message, dispatcher) when node != node() do
    PubSub.direct_broadcast(node, Realtime.PubSub, topic, message, dispatcher)
  end

  # Local
  defp do_direct_broadcast(_node, topic, message, dispatcher) do
    PubSub.local_broadcast(Realtime.PubSub, topic, message, dispatcher)
  end

  @spec pubsub_broadcast(tenant_id :: String.t(), PubSub.topic(), PubSub.message(), PubSub.dispatcher(), message_type) ::
          :ok
  def pubsub_broadcast(tenant_id, topic, message, dispatcher, message_type) do
    collect_payload_size(tenant_id, message, message_type)
    tagged_message = tag_tenant(tenant_id, message, dispatcher, message_type)

    # We measure here for the local dispatch and GenRpcPubSub measures on the remote nodes
    measure_broadcast_fanout(tagged_message)

    PubSub.broadcast(Realtime.PubSub, topic, tagged_message, dispatcher)
    :ok
  end

  @spec pubsub_broadcast_from(
          tenant_id :: String.t(),
          from :: pid,
          PubSub.topic(),
          PubSub.message(),
          PubSub.dispatcher(),
          message_type
        ) ::
          :ok
  def pubsub_broadcast_from(tenant_id, from, topic, message, dispatcher, message_type) do
    collect_payload_size(tenant_id, message, message_type)
    tagged_message = tag_tenant(tenant_id, message, dispatcher, message_type)

    # We measure here for the local dispatch and GenRpcPubSub measures on the remote nodes
    measure_broadcast_fanout(tagged_message)

    PubSub.broadcast_from(
      Realtime.PubSub,
      from,
      topic,
      tagged_message,
      dispatcher
    )

    :ok
  end

  # Tag broadcast messages with their tenant_id so the receiving node can attribute the fan-out
  # (see the telemetry in Realtime.GenRpcPubSub.Worker). Only tag when MessageDispatcher is the
  # dispatcher, since it is the component that unwraps the tag before delivery
  # Presence/postgres_changes stay untagged.
  defp tag_tenant(tenant_id, message, MessageDispatcher, :broadcast), do: {:tb, tenant_id, message}
  defp tag_tenant(_tenant_id, message, _dispatcher, _message_type), do: message

  @fanout_event [:realtime, :broadcast, :fanout, :node_delivery]

  @doc """
  Records whether the current node holds any connection for the broadcast's tenant, so that
  aggregating `hit=false` tells us how many node deliveries could have been avoided.
  """
  @spec measure_broadcast_fanout(message :: term) :: :ok
  def measure_broadcast_fanout({:tb, tenant_id, _message}) do
    count = Forum.Census.local_member_count(:users, tenant_id)

    :telemetry.execute(@fanout_event, %{local_tenant_users: count}, %{tenant: tenant_id, hit: count > 0})
  end

  def measure_broadcast_fanout(_message), do: :ok

  @payload_size_event [:realtime, :tenants, :payload, :size]

  @spec collect_payload_size(tenant_id :: String.t(), payload :: term, message_type :: message_type) :: :ok
  def collect_payload_size(tenant_id, payload, message_type) when is_struct(payload) do
    # Extracting from struct so the __struct__ bit is not calculated as part of the payload
    collect_payload_size(tenant_id, Map.from_struct(payload), message_type)
  end

  def collect_payload_size(tenant_id, payload, message_type) do
    :telemetry.execute(@payload_size_event, %{size: :erlang.external_size(payload)}, %{
      tenant: tenant_id,
      message_type: message_type
    })
  end
end
