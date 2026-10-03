defmodule RealtimeWeb.RealtimeChannel.PresenceHandler do
  @moduledoc """
  Handles the Presence feature for Realtime.

  This module provides functions for all client facing entry points into 
  Realtime's Presence feature. These entry points include:

  * Joining - When a channel joins, at this point it may or may not be part of
              a presence topic depending on its join config.
  * Syncing - using the `sync/1` function. This will send the full state of the 
              presence topic back to the client socket, assuming they have access to it.
  * Tracking and Untracking - via `handle/2`, this will add, update, or remove the client's 
              presence state from the topic.

  All presence tracking uses `RealtimeWeb.Presence`, which is Realtime's instantiation of 
  `Phoenix.Presence`.
  """
  use Realtime.Logs

  import Phoenix.Socket, only: [assign: 3]
  import Phoenix.Channel, only: [push: 3]

  alias Phoenix.Socket
  alias Phoenix.Tracker.Shard
  alias Realtime.Api.Tenant
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Authorization
  alias RealtimeWeb.Channels.Payloads
  alias RealtimeWeb.Presence
  alias RealtimeWeb.RealtimeChannel.Logging

  defguard is_private?(socket) when socket.assigns.private?

  defguard can_read_presence?(socket) when is_private?(socket) and socket.assigns.policies.presence.read

  defguard can_write_presence?(socket) when is_private?(socket) and socket.assigns.policies.presence.write

  @doc """
  Computes join-time presence assigns.

  These assigns must be available before authorization policies are evaluated. 
  Must be called before `RealtimeChannel`'s `maybe_assign_policies/3`.
  """
  @spec join(Payloads.Join.t(), Tenant.t()) :: %{presence_enabled?: boolean(), presence_key: term()}
  def join(join, tenant) do
    presence_enabled? = Payloads.Join.presence_enabled?(join) || tenant.presence_enabled

    %{
      presence_enabled?: presence_enabled?,
      presence_key: Payloads.Join.presence_key(join)
    }
  end

  @doc """
  Computes presence rate-limiting assigns. 

  Only call this once a join has fully succeeded, otherwise we unnecessarily create a RateCounter.
  """
  @spec join_rate_limits(Tenant.t()) :: %{
          presence_rate_counter: RateCounter.Args.t(),
          presence_client_rate_limit: %{
            :counter => 0,
            :max_calls => pos_integer(),
            :reset_at => nil,
            :window_ms => pos_integer()
          }
        }
  def join_rate_limits(tenant) do
    config = Application.get_env(:realtime, :client_presence_rate_limit, max_calls: 5, window_ms: 30_000)
    rate_counter = Tenants.presence_events_per_second_rate(tenant)

    RateCounter.new(rate_counter)

    %{
      presence_rate_counter: rate_counter,
      presence_client_rate_limit: %{
        max_calls: positive_integer_or(tenant.max_client_presence_events_per_window, config[:max_calls]),
        window_ms: positive_integer_or(tenant.client_presence_window_ms, config[:window_ms]),
        counter: 0,
        reset_at: nil
      }
    }
  end

  @doc """
  Sends presence state to a connected client
  """
  @spec sync(Socket.t()) :: :ok | {:error, :rate_limit_exceeded}
  def sync(%{assigns: %{presence_enabled?: false}}), do: :ok

  def sync(socket) when not is_private?(socket) do
    %{assigns: %{tenant_topic: topic}} = socket

    with :ok <- limit_presence_event(socket) do
      push(socket, "presence_state", presence_dirty_list(topic))
      Logging.maybe_log_info(socket, :sync_presence)

      :ok
    end
  end

  def sync(socket) when not can_read_presence?(socket), do: :ok

  def sync(socket) when can_read_presence?(socket) do
    %{tenant_topic: topic} = socket.assigns

    with :ok <- limit_presence_event(socket) do
      push(socket, "presence_state", presence_dirty_list(topic))
      Logging.maybe_log_info(socket, :sync_presence)

      :ok
    end
  end

  @doc """
  Handles client events related to Presence. 

  Presence events include:

  * track - used to store or update a client's state in the presence topic.
  * untrack - used to leave, and remove state from the presence topic.

  This function will apply rate limits and authorization to ensure that 
  the client has access to the topic, and if so the event will be passed on 
  to the presence system.

  When successful, returns `{:ok, socket, :resync | :no_resync}`.

  The third element of the tuple can be used to determine whether the client
  should get a full update of the current presence sync. At this point that is 
  only set if a track call caused presence to flip from disabled to enabled for 
  the channel.

  """
  @spec handle(map(), Socket.t()) ::
          {:ok, Socket.t(), :resync | :no_resync}
          | {:error,
             :invalid_payload
             | :rls_policy_error
             | :query_canceled
             | :missing_partition
             | :tenant_database_unavailable
             | :unable_to_set_policies
             | :increase_connection_pool
             | :rate_limit_exceeded
             | :client_rate_limit_exceeded
             | :unable_to_track_presence
             | :payload_size_exceeded
             | :connect_rate_limit_reached
             | :tenant_db_too_many_connections}
          | {:error, :rpc_error, term()}
  def handle(%{"event" => event} = payload, socket) do
    event = String.downcase(event, :ascii)

    with {:ok, socket} <- limit_client_presence_event(socket) do
      handle_presence_event(event, payload, socket)
    else
      {:error, :client_rate_limit_exceeded} = error -> error
    end
  end

  def handle(_, socket), do: {:ok, socket, :no_resync}

  defp handle_presence_event("track", payload, socket) when not is_private?(socket) do
    track(socket, payload)
  end

  defp handle_presence_event("track", payload, socket)
       when is_private?(socket) and is_nil(socket.assigns.policies.presence.write) do
    %{assigns: %{authorization_context: authorization_context, policies: policies, tenant: tenant_id}} = socket

    # presence is being enabled by this track. Authorize presence.read now if it wasn't evaluated at
    # join (the join skips it when presence was disabled, leaving read nil) so the channel can gate
    # presence_diff for this socket, then authorize presence.write.
    with {:ok, policies} <- authorize(tenant_id, policies, authorization_context) do
      socket = assign(socket, :policies, policies)
      handle_presence_event("track", payload, socket)
    else
      {:error, :rls_policy_error, error} ->
        log_error("RlsPolicyError", error)
        {:error, :rls_policy_error}

      {:error, :query_canceled, error} ->
        log_error("QueryCanceled", error)
        {:error, :query_canceled}

      {:error, :missing_partition} ->
        log_error("MissingPartition", "Realtime was unable to find the expected messages partition")
        {:error, :missing_partition}

      {:error, :tenant_database_unavailable} ->
        {:error, :tenant_database_unavailable}

      {:error, :increase_connection_pool} ->
        {:error, :increase_connection_pool}

      {:error, :rpc_error, error} ->
        {:error, :rpc_error, error}

      {:error, error} ->
        log_error("UnableToSetPolicies", error)
        {:error, :unable_to_set_policies}
    end
  end

  defp handle_presence_event("track", payload, socket) when can_write_presence?(socket) do
    track(socket, payload)
  end

  defp handle_presence_event("track", _, socket) when not can_write_presence?(socket) do
    {:error, :unauthorized}
  end

  defp handle_presence_event("untrack", _, socket) do
    %{assigns: %{presence_key: presence_key, tenant_topic: tenant_topic}} = socket
    :ok = Presence.untrack(self(), tenant_topic, presence_key)
    {:ok, assign(socket, :presence_track_payload, nil), :no_resync}
  end

  defp handle_presence_event(event, _, _) do
    log_error("UnknownPresenceEvent", event)
    {:error, :unknown_presence_event}
  end

  # Check whether a client is authorized to read and write to a private presence topic.
  #
  # This will be called when a client hasn't previously been authorized to ensure it has access.
  # We get the DB connection here, at the smallest scope, so we only need to get the connection
  # if we haven't previously done the authorization. handle_presence_event/3 checks this before
  # calling authorize/3.
  defp authorize(tenant_id, policies, authorization_context) do
    with {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant_id),
         {:ok, policies} <- maybe_authorize_presence_read(policies, db_conn, authorization_context) do
      Authorization.get_write_authorizations(
        policies,
        db_conn,
        authorization_context,
        :presence
      )
    end
  end

  defp track(socket, payload) do
    %{assigns: %{presence_key: presence_key, tenant_topic: tenant_topic}} = socket
    payload = Map.get(payload, "payload", %{})

    with :ok <- check_track_payload(socket.assigns, payload),
         tenant <- Tenants.Cache.get_tenant_by_external_id(socket.assigns.tenant),
         :ok <- validate_payload_size(tenant, payload),
         _ <- RealtimeWeb.TenantBroadcaster.collect_payload_size(socket.assigns.tenant, payload, :presence),
         :ok <- limit_presence_event(socket),
         {:ok, _} <- Presence.track(self(), tenant_topic, presence_key, payload) do
      resync =
        if socket.assigns.presence_enabled? do
          :no_resync
        else
          :resync
        end

      socket =
        socket
        |> assign(:presence_enabled?, true)
        |> assign(:presence_track_payload, payload)

      {:ok, socket, resync}
    else
      {:error, :no_payload_change} ->
        # no-op if payload hasn't changed
        {:ok, socket, :no_resync}

      {:error, {:already_tracked, pid, _, _}} ->
        case Presence.update(pid, tenant_topic, presence_key, payload) do
          {:ok, _} ->
            socket = assign(socket, :presence_track_payload, payload)
            {:ok, socket, :no_resync}

          {:error, _} ->
            {:error, :unable_to_track_presence}
        end

      {:error, reason} when reason in [:invalid_payload, :rate_limit_exceeded, :payload_size_exceeded] ->
        {:error, reason}

      {:error, error} ->
        log_error("UnableToTrackPresence", error)
        {:error, :unable_to_track_presence}
    end
  end

  # presence.read is left unevaluated (nil) at join when presence is disabled. Authorize it now that
  # presence is being enabled; otherwise it was already evaluated at join, so reuse it.
  defp maybe_authorize_presence_read(%{presence: %{read: nil}} = policies, db_conn, authorization_context) do
    Authorization.get_read_authorizations(policies, db_conn, authorization_context, presence_enabled?: true)
  end

  defp maybe_authorize_presence_read(policies, _db_conn, _authorization_context), do: {:ok, policies}

  defp check_track_payload(_assigns, payload) when not is_map(payload), do: {:error, :invalid_payload}
  defp check_track_payload(%{presence_track_payload: payload}, payload), do: {:error, :no_payload_change}
  defp check_track_payload(_assigns, _payload), do: :ok

  defp presence_dirty_list(topic) do
    [{:pool_size, size}] = :ets.lookup(Presence, :pool_size)

    Presence
    |> Shard.name_for_topic(topic, size)
    |> Shard.dirty_list(topic)
    |> Phoenix.Presence.group()
  end

  defp limit_presence_event(socket) do
    %{assigns: %{presence_rate_counter: presence_counter, tenant: _tenant_id}} = socket
    {:ok, rate_counter} = RateCounter.get(presence_counter)
    tenant = Tenants.Cache.get_tenant_by_external_id(socket.assigns.tenant)

    if rate_counter.avg > tenant.max_presence_events_per_second do
      {:error, :rate_limit_exceeded}
    else
      GenCounter.add(presence_counter.id)
      :ok
    end
  end

  defp limit_client_presence_event(socket) do
    %{assigns: %{presence_client_rate_limit: limit_config}} = socket

    current_time = System.monotonic_time(:millisecond)

    # Check if we need to reset the window
    cond do
      is_nil(limit_config.reset_at) or current_time > limit_config.reset_at ->
        # Start new window or reset expired window
        updated_limit_config = %{limit_config | counter: 1, reset_at: current_time + limit_config.window_ms}
        updated_socket = assign(socket, :presence_client_rate_limit, updated_limit_config)
        {:ok, updated_socket}

      limit_config.counter >= limit_config.max_calls ->
        {:error, :client_rate_limit_exceeded}

      true ->
        # Increment counter
        updated_limit_config = %{limit_config | counter: limit_config.counter + 1}
        updated_socket = assign(socket, :presence_client_rate_limit, updated_limit_config)
        {:ok, updated_socket}
    end
  end

  defp validate_payload_size(tenant, payload), do: Tenants.validate_payload_size(tenant, payload)

  defp positive_integer_or(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer_or(_value, default), do: default
end
