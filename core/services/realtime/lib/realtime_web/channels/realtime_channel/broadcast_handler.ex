defmodule RealtimeWeb.RealtimeChannel.BroadcastHandler do
  @moduledoc """
  Handles the Broadcast feature from Realtime
  """
  use Realtime.Logs

  import Phoenix.Socket, only: [assign: 3]

  alias Realtime.FeatureFlags
  alias Realtime.Messages
  alias Realtime.Tenants
  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.TenantBroadcaster
  alias Phoenix.Socket
  alias Realtime.GenCounter
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies

  @type payload :: map | {String.t(), :json | :binary, binary, map()}

  @event_type "broadcast"
  @spec handle(payload, Socket.t()) :: {:reply, :ok, Socket.t()} | {:noreply, Socket.t()}
  def handle(payload, %{assigns: %{private?: false}} = socket), do: handle(payload, nil, socket)

  @doc """
  Handles an outgoing broadcast for a channel.

  `db_conn` is `nil` for public channels, which don't run write authorization nor persist messages.
  Otherwise must pass the tenant database conn used to run write authorization and persist the message.
  """
  @spec handle(payload, pid() | nil, Socket.t()) ::
          {:reply, :ok | {:ok, map()} | {:error, any()}, Socket.t()} | {:noreply, Socket.t()}
  def handle(payload, db_conn, %{assigns: %{private?: true}} = socket) do
    %{
      assigns: %{
        self_broadcast: self_broadcast,
        tenant_topic: tenant_topic,
        authorization_context: authorization_context,
        policies: policies,
        tenant: tenant_id
      }
    } = socket

    case run_authorization_check(policies || %Policies{}, db_conn, authorization_context) do
      {:ok, %Policies{broadcast: %BroadcastPolicies{write: true}} = policies} ->
        socket =
          socket
          |> assign(:policies, policies)
          |> increment_rate_counter()

        %{ack_broadcast: ack_broadcast} = socket.assigns

        res =
          case Tenants.validate_payload_size(tenant_id, payload) do
            # Broadcast first to prioritize throughput.
            :ok ->
              send_message(tenant_id, self_broadcast, tenant_topic, payload)
              # TODO: hard limits and buffering based on ack
              maybe_persist(policies, db_conn, tenant_id, authorization_context.topic, payload, ack_broadcast)

            {:error, error} ->
              {:error, error}
          end

        cond do
          ack_broadcast && match?({:error, :payload_size_exceeded}, res) ->
            {:reply, {:error, :payload_size_exceeded}, socket}

          ack_broadcast && match?({:ok, _}, res) ->
            {:reply, res, socket}

          ack_broadcast ->
            {:reply, :ok, socket}

          true ->
            {:noreply, socket}
        end

      {:ok, policies} ->
        {:noreply, assign(socket, :policies, policies)}

      {:error, :rls_policy_error, error} ->
        log_error("RlsPolicyError", error)
        {:noreply, socket}

      {:error, :query_canceled, error} ->
        log_error("QueryCanceled", error)
        {:noreply, socket}

      {:error, :missing_partition} ->
        log_error("MissingPartition", "Realtime was unable to find the expected messages partition")
        {:noreply, socket}

      {:error, :tenant_database_unavailable} ->
        log_error("UnableToConnectToProject", "Realtime was unable to connect to the project database")
        {:noreply, socket}

      {:error, :increase_connection_pool} ->
        {:noreply, socket}

      {:error, error} ->
        log_error("UnableToSetPolicies", error)
        {:noreply, socket}
    end
  end

  def handle(payload, _db_conn, %{assigns: %{private?: false}} = socket) do
    %{
      assigns: %{
        tenant_topic: tenant_topic,
        self_broadcast: self_broadcast,
        ack_broadcast: ack_broadcast,
        tenant: tenant_id
      }
    } = socket

    socket = increment_rate_counter(socket)

    res =
      case Tenants.validate_payload_size(tenant_id, payload) do
        :ok -> send_message(tenant_id, self_broadcast, tenant_topic, payload)
        error -> error
      end

    cond do
      ack_broadcast && match?({:error, :payload_size_exceeded}, res) ->
        {:reply, {:error, :payload_size_exceeded}, socket}

      ack_broadcast ->
        {:reply, :ok, socket}

      true ->
        {:noreply, socket}
    end
  end

  defp send_message(tenant_id, self_broadcast, tenant_topic, payload) do
    broadcast = build_broadcast(tenant_topic, payload)

    if self_broadcast do
      TenantBroadcaster.pubsub_broadcast(
        tenant_id,
        tenant_topic,
        broadcast,
        RealtimeChannel.MessageDispatcher,
        :broadcast
      )
    else
      TenantBroadcaster.pubsub_broadcast_from(
        tenant_id,
        self(),
        tenant_topic,
        broadcast,
        RealtimeChannel.MessageDispatcher,
        :broadcast
      )
    end
  end

  # No idea why Dialyzer is complaining here
  @dialyzer {:nowarn_function, build_broadcast: 2}

  # Message payload was built by V2 Serializer which was originally UserBroadcastPush
  # We are not using the metadata for anything just yet.
  defp build_broadcast(topic, {user_event, user_payload_encoding, user_payload, _metadata}) do
    %RealtimeWeb.Socket.UserBroadcast{
      topic: topic,
      user_event: user_event,
      user_payload_encoding: user_payload_encoding,
      user_payload: user_payload
    }
  end

  defp build_broadcast(topic, payload) do
    %Phoenix.Socket.Broadcast{topic: topic, event: @event_type, payload: payload}
  end

  @spec maybe_persist(Policies.t(), pid(), String.t(), String.t(), payload, ack_broadcast :: boolean()) ::
          :ok | :skip | {:ok, map()}
  defp maybe_persist(
         %Policies{broadcast: %BroadcastPolicies{persist: true}},
         db_conn,
         tenant_id,
         topic,
         payload,
         ack_broadcast
       ) do
    if FeatureFlags.enabled?("broadcast_persistence", tenant_id) do
      if ack_broadcast do
        persist(db_conn, tenant_id, topic, payload)
      else
        Task.Supervisor.start_child(Realtime.TaskSupervisor, fn ->
          persist(db_conn, tenant_id, topic, payload)
        end)

        :ok
      end
    else
      :skip
    end
  end

  defp maybe_persist(_policies, _db_conn, _tenant_id, _topic, _payload, _ack_broadcast), do: :ok

  defp persist(db_conn, tenant_id, topic, payload) do
    with {:ok, event, event_payload} <- convert_to_persistable_fields(payload),
         {:ok, id} <- Messages.persist(db_conn, tenant_id, topic, event, event_payload) do
      {:ok, %{id: id}}
    else
      error ->
        log_error("UnableToPersistMessage", error)
        :ok
    end
  end

  @spec convert_to_persistable_fields(payload) ::
          {:ok, String.t(), map() | binary()} | {:error, :unsupported_payload}
  defp convert_to_persistable_fields(%{"event" => event, "payload" => payload}), do: {:ok, event, payload}

  # Already in JSON format, use Fragment to skip decode and re-encode
  defp convert_to_persistable_fields({event, :json, user_payload, _metadata}),
    do: {:ok, event, Jason.Fragment.new(user_payload)}

  defp convert_to_persistable_fields({event, :binary, user_payload, _metadata}), do: {:ok, event, user_payload}

  defp convert_to_persistable_fields(_payload), do: {:error, :unsupported_payload}

  defp increment_rate_counter(%{assigns: %{policies: %Policies{broadcast: %BroadcastPolicies{write: false}}}} = socket) do
    socket
  end

  defp increment_rate_counter(%{assigns: %{tenant: tenant_id}} = socket) do
    GenCounter.add(Tenants.events_per_second_key(tenant_id))
    socket
  end

  defp run_authorization_check(
         %Policies{broadcast: %BroadcastPolicies{write: nil}} = policies,
         db_conn,
         authorization_context
       ) do
    with {:ok, %Policies{broadcast: %BroadcastPolicies{write: true}} = policies} <-
           Authorization.get_write_authorizations(policies, db_conn, authorization_context, :broadcast) do
      maybe_check_persistence(policies, db_conn, authorization_context)
    end
  end

  defp run_authorization_check(socket, _db_conn, _authorization_context) do
    {:ok, socket}
  end

  # The persist policy needs its own probe, so only pay for it when the flag is on.
  defp maybe_check_persistence(policies, db_conn, authorization_context) do
    if FeatureFlags.enabled?("broadcast_persistence", authorization_context.tenant_id) do
      Authorization.get_write_authorizations(policies, db_conn, authorization_context, :persistence)
    else
      {:ok, policies}
    end
  end
end
