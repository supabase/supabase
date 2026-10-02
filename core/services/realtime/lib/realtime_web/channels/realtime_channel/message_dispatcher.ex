defmodule RealtimeWeb.RealtimeChannel.MessageDispatcher do
  @moduledoc """
  Inspired by Phoenix.Channel.Server.dispatch/3
  """

  require Logger
  alias Phoenix.Socket.Broadcast
  alias RealtimeWeb.Socket.UserBroadcast

  def fastlane_metadata(
        fastlane_pid,
        serializer,
        topic,
        log_level,
        tenant_id,
        replayed_message_ids \\ MapSet.new(),
        presence_read? \\ true,
        broadcast_read? \\ true
      ) do
    {:rc_fastlane, fastlane_pid, serializer, topic, log_level, tenant_id, replayed_message_ids, presence_read?,
     broadcast_read?}
  end

  @presence_diff "presence_diff"
  @broadcast "broadcast"

  @doc """
  This dispatch function caches encoded messages if fastlane is used and it can conditionally log.

  Non presence messages delivered through fastlane are counted in bulk against the tenant's events
  rate counter. Channel processes are only messaged (`:check_rate_counter`) when that counter has
  triggered its limit, so they can shut down, or when it is not running, so they can restart it.

  fastlane_pid is the actual socket transport pid
  """
  @spec dispatch(
          list,
          pid,
          Broadcast.t()
          | UserBroadcast.t()
          | {:tb, String.t(), Broadcast.t() | UserBroadcast.t()}
        ) :: :ok
  # Broadcast messages are tagged with their tenant_id by RealtimeWeb.TenantBroadcaster so the
  # receiving node can attribute the fan-out before delivery. Strip the tag here so every
  # downstream clause (and the client) only ever sees the underlying struct.
  def dispatch(subscribers, from, {:tb, _tenant_id, %Broadcast{event: @presence_diff} = msg}),
    do: dispatch(subscribers, from, msg)

  def dispatch(subscribers, from, {:tb, tenant_id, msg}),
    do: do_dispatch(subscribers, from, msg, tenant_id)

  def dispatch(subscribers, from, %Broadcast{event: @presence_diff} = msg) do
    {_encoded_cache, count} =
      Enum.reduce(subscribers, {%{}, 0}, fn
        {pid, _}, {encoded_cache, count} when pid == from ->
          {encoded_cache, count}

        # Subscriber is denied presence.read: withhold the presence_diff. Mirrors the
        # can_read_presence?/1 gate on the presence_state push.
        {_pid,
         {:rc_fastlane, _fastlane_pid, _serializer, _join_topic, _log_level, _tenant_id, _replayed, false, _bcast}},
        {encoded_cache, count} ->
          {encoded_cache, count}

        # presence.read not yet authorized (presence was not enabled at join): route to the channel
        # process so it can consult presence.read at delivery time. Wrapped in a
        # tuple so it is handled by RealtimeChannel.handle_info rather than intercepted and pushed by
        # Phoenix.Channel.Server's built-in %Broadcast{} handling.
        {pid, {:rc_fastlane, _fastlane_pid, _serializer, _join_topic, _log_level, _tenant_id, _replayed, nil, _bcast}},
        {encoded_cache, count} ->
          send(pid, {:authorize_presence_diff, msg})
          {encoded_cache, count}

        {_pid,
         {:rc_fastlane, fastlane_pid, serializer, join_topic, log_level, tenant_id, _replayed_message_ids, true, _bcast}},
        {encoded_cache, count} ->
          maybe_log(log_level, join_topic, msg, tenant_id)

          encoded_cache =
            fastlane_dispatch(msg, fastlane_pid, serializer, join_topic, encoded_cache, tenant_id, log_level)

          {encoded_cache, count + 1}

        {pid, _}, {encoded_cache, count} ->
          send(pid, msg)
          {encoded_cache, count}
      end)

    tenant_id = tenant_id(subscribers)
    increment_presence_counter(tenant_id, msg.event, count)

    :ok
  end

  def dispatch(subscribers, from, msg), do: do_dispatch(subscribers, from, msg, tenant_id(subscribers))

  defp do_dispatch(subscribers, from, msg, tenant_id) do
    message_id = message_id(msg)
    broadcast? = broadcast?(msg)
    check_rate_counter? = check_rate_counter?(tenant_id)

    {_encoded_cache, count} =
      Enum.reduce(subscribers, {%{}, 0}, fn
        {pid, _}, acc when pid == from ->
          acc

        {pid,
         {:rc_fastlane, fastlane_pid, serializer, join_topic, log_level, tenant_id, replayed_message_ids,
          _presence_read?, broadcast_read?}},
        {encoded_cache, count} = acc ->
          if (broadcast? and broadcast_read? != true) or already_replayed?(message_id, replayed_message_ids) do
            acc
          else
            if check_rate_counter?, do: send(pid, :check_rate_counter)

            maybe_log(log_level, join_topic, msg, tenant_id)

            encoded_cache =
              fastlane_dispatch(msg, fastlane_pid, serializer, join_topic, encoded_cache, tenant_id, log_level)

            {encoded_cache, count + 1}
          end

        {pid, _}, acc ->
          send(pid, msg)
          acc
      end)

    increment_events_counter(tenant_id, count)

    :ok
  end

  defp broadcast?(%UserBroadcast{}), do: true
  defp broadcast?(%Broadcast{event: @broadcast}), do: true
  defp broadcast?(_msg), do: false

  defp maybe_log(:info, join_topic, msg, tenant_id) when is_struct(msg) do
    log = "Received message on #{join_topic} with payload: #{inspect(msg, pretty: true)}"
    Logger.info(log, external_id: tenant_id, project: tenant_id)
  end

  defp maybe_log(:info, join_topic, msg, tenant_id) when is_binary(msg) do
    log = "Received message on #{join_topic}. #{msg}"
    Logger.info(log, external_id: tenant_id, project: tenant_id)
  end

  defp maybe_log(_level, _join_topic, _msg, _tenant_id), do: :ok

  defp fastlane_dispatch(msg, fastlane_pid, serializer, join_topic, encoded_cache, tenant_id, log_level) do
    case encoded_cache do
      %{{^serializer, ^join_topic} => {:ok, encoded_msg}} ->
        send(fastlane_pid, encoded_msg)
        encoded_cache

      %{{^serializer, ^join_topic} => {:error, _reason}} ->
        # We do nothing at this stage. It has been already logged depending on the log level
        encoded_cache

      %{} ->
        # Use the original topic that was joined without the external_id
        msg = %{msg | topic: join_topic}

        result =
          case fastlane!(serializer, msg) do
            {:ok, encoded_msg} ->
              send(fastlane_pid, encoded_msg)
              {:ok, encoded_msg}

            {:error, reason} ->
              maybe_log(log_level, join_topic, reason, tenant_id)
              {:error, reason}
          end

        Map.put(encoded_cache, {serializer, join_topic}, result)
    end
  end

  # We have to convert because V1 does not know how to process UserBroadcast
  defp fastlane!(Phoenix.Socket.V1.JSONSerializer = serializer, %UserBroadcast{} = msg) do
    with {:ok, msg} <- UserBroadcast.convert_to_json_broadcast(msg) do
      {:ok, serializer.fastlane!(msg)}
    end
  end

  defp fastlane!(serializer, msg), do: {:ok, serializer.fastlane!(msg)}

  defp tenant_id([{_pid, {:rc_fastlane, _, _, _, _, tenant_id, _, _, _}} | _]), do: tenant_id
  defp tenant_id(_), do: nil

  defp check_rate_counter?(tenant_id) when is_binary(tenant_id) do
    case tenant_id |> Realtime.Tenants.events_per_second_key() |> Realtime.RateCounter.find() do
      {:ok, %{limit: %{triggered: true}}} -> true
      {:ok, _} -> false
      {:error, :not_found} -> true
    end
  end

  defp check_rate_counter?(_tenant_id), do: false

  defp increment_events_counter(tenant_id, count) when is_binary(tenant_id) and count > 0 do
    tenant_id
    |> Realtime.Tenants.events_per_second_key()
    |> Realtime.GenCounter.add(count)
  end

  defp increment_events_counter(_tenant_id, _count), do: :ok

  defp increment_presence_counter(tenant_id, "presence_diff", count) when is_binary(tenant_id) do
    tenant_id
    |> Realtime.Tenants.presence_events_per_second_key()
    |> Realtime.GenCounter.add(count)
  end

  defp increment_presence_counter(_tenant_id, _event, _count), do: :ok

  defp message_id(%UserBroadcast{metadata: %{"id" => id}}), do: id
  defp message_id(%Broadcast{payload: %{"meta" => %{"id" => id}}}), do: id
  defp message_id(_), do: nil

  defp already_replayed?(nil, _replayed_message_ids), do: false
  defp already_replayed?(message_id, replayed_message_ids), do: MapSet.member?(replayed_message_ids, message_id)
end
