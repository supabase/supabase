defmodule RealtimeWeb.RealtimeChannel do
  @moduledoc """
  Used for handling channels and subscriptions.
  """
  use RealtimeWeb, :channel
  use RealtimeWeb.RealtimeChannel.Logging

  require RealtimeWeb.RealtimeChannel.PresenceHandler

  alias DBConnection.Backoff

  alias Forum.Muster

  alias Realtime.Api.Message
  alias Realtime.Api.Tenant
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.Helpers
  alias Realtime.PostgresCdc
  alias Realtime.RateCounter
  alias Realtime.SignalHandler
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Connect
  alias Realtime.UsersCounter

  alias RealtimeWeb.Channels.Payloads.Broadcast.Replay
  alias RealtimeWeb.Channels.Payloads.Join
  alias RealtimeWeb.ChannelsAuthorization
  alias RealtimeWeb.RealtimeChannel.BroadcastHandler
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher
  alias RealtimeWeb.RealtimeChannel.PresenceHandler
  alias RealtimeWeb.RealtimeChannel.Tracker

  # A JWT `exp` can be arbitrarily far in the future and `Process.send_after/3` rejects delays past
  # Erlang's maximum supported time value, so the re-confirmation timer is capped at this interval.
  @confirm_token_ms_max_interval :timer.hours(1)
  @replication_ready_check_interval 500
  @postgres_subscribe_backoff_min 100
  @postgres_subscribe_backoff_max 1_000
  @postgres_subscribe_fatal_reasons [:malformed_subscription_params, :subscription_insert_failed]
  @postgres_subscribe_error_code "RealtimeDisabledForConfiguration"
  @postgres_cdc_down Realtime.Syn.PostgresCdc.down_event()
  @fullsweep_after Application.compile_env!(:realtime, :websocket_fullsweep_after)

  @impl true
  def join("realtime:", _params, socket) do
    # `terminate/2` untracks every channel process, including one whose join was rejected, so
    # this clause has to track too. Otherwise the socket's other channels are untracked in its
    # place and the Tracker reaps a transport that still has channels open.
    Tracker.track(socket.transport_pid)

    socket
    |> log_error("TopicNameRequired", "You must provide a topic name")
    |> join_error()
  end

  def join("realtime:" <> sub_topic = topic, params, socket) do
    %{
      assigns: %{tenant: tenant_id, log_level: log_level},
      channel_pid: channel_pid,
      serializer: serializer,
      transport_pid: transport_pid
    } = socket

    Process.flag(:max_heap_size, max_heap_size())
    Process.flag(:fullsweep_after, @fullsweep_after)
    Tracker.track(socket.transport_pid)
    Logger.metadata(external_id: tenant_id, project: tenant_id)
    Logger.put_process_level(self(), log_level)

    muster_join_task = maybe_start_muster_join(tenant_id, transport_pid)

    join =
      case Join.validate(params) do
        {:ok, join} ->
          join

        {:error, :invalid_join_payload, errors} ->
          log_params = params |> Map.put("access_token", "<redacted>") |> Map.put("user_token", "<redacted>")
          log_error(socket, "InvalidJoinPayload", %{changeset_errors: errors, params: log_params})
          %Join{} |> Join.changeset(params) |> Ecto.Changeset.apply_changes()
      end

    socket =
      socket
      |> assign_access_token(params)
      |> assign(:private?, Join.private?(join))
      |> assign(:policies, nil)

    with :ok <- SignalHandler.shutdown_in_progress?(),
         {:ok, tenant} <- Cache.fetch_tenant_by_external_id(tenant_id),
         socket = assign(socket, PresenceHandler.join(join, tenant)),
         :ok <- only_private?(tenant, socket),
         :ok <- limit_max_users(tenant, transport_pid),
         :ok <- limit_joins(tenant, socket),
         :ok <- limit_channels(tenant, socket),
         {:ok, claims, confirm_token_ref} <- confirm_token(socket),
         socket = assign_authorization_context(socket, sub_topic, claims),
         {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant_id),
         {:ok, socket} <- maybe_assign_policies(sub_topic, db_conn, socket),
         :ok <- can_replay?(params["config"], sub_topic, socket),
         {:ok, replayed_message_ids} <-
           maybe_replay_messages(params["config"], sub_topic, db_conn, tenant_id, socket.assigns.private?) do
      tenant_topic = Tenants.tenant_topic(tenant_id, sub_topic, !socket.assigns.private?)

      # fastlane subscription
      metadata = fastlane_metadata(socket, replayed_message_ids)

      RealtimeWeb.Endpoint.subscribe(tenant_topic, metadata: metadata)
      RealtimeWeb.Endpoint.subscribe("realtime:operations:" <> tenant_id, metadata: metadata)

      replication_ready_opt_in? = Join.replication_ready?(join)

      is_new_api = new_api?(params)

      pg_change_params = pg_change_params(is_new_api, params, channel_pid, claims, sub_topic)

      opts = %{
        is_new_api: is_new_api,
        pg_change_params: pg_change_params,
        transport_pid: transport_pid,
        serializer: serializer,
        topic: topic,
        tenant: tenant_id
      }

      postgres_cdc_subscribe(tenant, opts)

      state = %{postgres_changes: add_id_to_postgres_changes(pg_change_params)}

      assigns = %{
        ack_broadcast: Join.ack_broadcast?(join),
        confirm_token_ref: confirm_token_ref,
        is_new_api: is_new_api,
        pg_sub_ref: nil,
        pg_change_params: pg_change_params,
        self_broadcast: Join.self_broadcast?(join),
        tenant_topic: tenant_topic,
        channel_name: sub_topic,
        fastlane_metadata: metadata,
        replayed_message_ids: replayed_message_ids,
        access_token_verified_at: nil,
        pending_access_token: nil
      }

      assigns =
        if replication_ready_opt_in? do
          send(self(), :notify_replication_ready)

          Map.merge(assigns, %{
            replication_ready_notified?: false,
            replication_ready_deadline: System.monotonic_time(:millisecond) + replication_ready_timeout()
          })
        else
          assigns
        end

      tenant |> Tenants.events_per_second_rate() |> RateCounter.new()

      socket = assign(socket, PresenceHandler.join_rate_limits(tenant))

      # Start presence and add user if presence is enabled
      presence_enabled? = socket.assigns.presence_enabled?
      if presence_enabled?, do: send(self(), :sync_presence)

      with :ok <- await_muster_join(muster_join_task, socket),
           :ok <- start_postgres_subscribe(socket, join, tenant, pg_change_params) do
        UsersCounter.add(transport_pid, tenant_id)
        {:ok, state, assign(socket, assigns)}
      end
    else
      {:error, :expired_token, msg} ->
        maybe_log_warning(socket, "InvalidJWTToken", msg)

      {:error, :missing_claims} ->
        msg = "Fields `role` and `exp` are required in JWT"
        maybe_log_warning(socket, "InvalidJWTToken", msg)

      {:error, :unauthorized, msg} ->
        log_error(socket, "Unauthorized", msg)

      {:error, :too_many_channels} ->
        {:error, %{reason: "ChannelRateLimitReached: Too many channels"}}

      {:error, :too_many_connections} ->
        msg = "Too many connected users"
        log_error(socket, "ConnectionRateLimitReached", msg)

      {:error, :too_many_joins} ->
        msg = "ClientJoinRateLimitReached: Too many joins per second"
        send(transport_pid, %Phoenix.Socket.Broadcast{event: "disconnect"})
        {:error, %{reason: msg}}

      {:error, :increase_connection_pool} ->
        msg = "Please increase your connection pool size"
        log_error(socket, "IncreaseConnectionPool", msg)

      {:error, :tenant_db_too_many_connections} ->
        msg = "Database can't accept more connections, Realtime won't connect"
        log_error(socket, "DatabaseLackOfConnections", msg)

      {:error, :connect_rate_limit_reached} ->
        msg = "Too many database connections attempts per second"
        log_error(socket, "DatabaseConnectionRateLimitReached", msg)

      {:error, :unable_to_set_policies, error} ->
        log_error(socket, "UnableToSetPolicies", error)
        {:error, %{reason: "Realtime was unable to connect to the project database"}}

      {:error, :tenant_database_unavailable} ->
        log_error(socket, "UnableToConnectToProject", "Realtime was unable to connect to the project database")

      {:error, :query_canceled, error} ->
        log_error(socket, "QueryCanceled", error)

      {:error, :missing_partition} ->
        log_error(socket, "MissingPartition", "Realtime was unable to find the expected messages partition")

      {:error, :rpc_error, :timeout} ->
        log_error(socket, "TimeoutOnRpcCall", "Node request timeout")

      {:error, :rpc_error, reason} ->
        log_error(socket, "ErrorOnRpcCall", "RPC call error: " <> inspect(reason))

      {:error, :initializing} ->
        log_error(socket, "InitializingProjectConnection", "Realtime is initializing the project connection")

      {:error, :tenant_database_connection_initializing} ->
        log_error(socket, "InitializingProjectConnection", "Connecting to the project database")

      {:error, :token_malformed, msg} ->
        log_error(socket, "MalformedJWT", msg)

      {:error, invalid_exp} when is_integer(invalid_exp) and invalid_exp <= 0 ->
        log_error(socket, "InvalidJWTToken", "Token expiration time is invalid")

      {:error, :private_only} ->
        log_error(socket, "PrivateOnly", "This project only allows private channels")

      {:error, :tenant_not_found} ->
        send(transport_pid, %Phoenix.Socket.Broadcast{event: "disconnect"})
        log_error(socket, "TenantNotFound", "Tenant with the given ID does not exist")

      {:error, :tenant_suspended} ->
        log_error(socket, "RealtimeDisabledForTenant", "Realtime disabled for this tenant")

      {:error, :signature_error} ->
        log_error(socket, "JwtSignatureError", "Failed to validate JWT signature")

      {:error, :shutdown_in_progress} ->
        log_error(socket, "RealtimeRestarting", "Realtime is restarting, please standby")

      {:error, :failed_to_replay_messages} ->
        log_error(socket, "UnableToReplayMessages", "Realtime was unable to replay messages")

      {:error, :invalid_replay_params} ->
        log_error(socket, "UnableToReplayMessages", "Replay params are not valid")

      {:error, :invalid_replay_channel} ->
        log_error(socket, "UnableToReplayMessages", "Replay is not allowed for public channels")

      {:error, {:error_generating_signer, kid}} ->
        log_error(
          socket,
          "JwtSignerError",
          "Failed to generate JWT signer for key ID (kid) #{inspect(kid)}, check your JWT secret or JWKS configuration"
        )

      {:error, :error_generating_signer} ->
        log_error(
          socket,
          "JwtSignerError",
          "Failed to generate JWT signer, check your JWT secret or JWKS configuration"
        )

      {:error, error} ->
        log_error(socket, "UnknownErrorOnChannel", error)
        {:error, %{reason: "Unknown Error on Channel"}}
    end
    |> join_error()
  rescue
    e ->
      log_error(socket, "UnknownErrorOnChannel", Exception.message(e))
      |> join_error()
  end

  @impl true
  def handle_info({:replay, messages}, socket) do
    for message <- messages do
      meta = %{"replayed" => true, "id" => message.id}
      replay(message, meta, socket)
    end

    {:noreply, socket}
  end

  def handle_info(:check_rate_counter, %{assigns: %{tenant: tenant_id}} = socket) do
    with %Tenant{} = tenant <- Cache.get_tenant_by_external_id(tenant_id),
         {:ok, %{limit: %{triggered: true}}} <- RateCounter.get(Tenants.events_per_second_rate(tenant)) do
      shutdown_response(socket, "Too many messages per second")
    else
      _ -> {:noreply, socket}
    end
  end

  def handle_info(%{event: @postgres_cdc_down}, socket) do
    %{assigns: %{pg_sub_ref: pg_sub_ref}} = socket
    Helpers.cancel_timer(pg_sub_ref)
    pg_sub_ref = postgres_subscribe()

    {:noreply, assign(socket, %{pg_sub_ref: pg_sub_ref})}
  end

  def handle_info(:notify_replication_ready, %{assigns: %{replication_ready_notified?: true}} = socket) do
    {:noreply, socket}
  end

  def handle_info(:notify_replication_ready, socket) do
    %{assigns: %{tenant: tenant_id, channel_name: channel_name, replication_ready_deadline: deadline}} = socket

    cond do
      match?({:ok, _replication_conn}, Connect.replication_status(tenant_id)) ->
        push_system_message("system", socket, "ok", "Replication connection established", channel_name)
        {:noreply, assign(socket, :replication_ready_notified?, true)}

      System.monotonic_time(:millisecond) >= deadline ->
        shutdown_response(socket, "Replication connection was not established in time")

      true ->
        Process.send_after(self(), :notify_replication_ready, @replication_ready_check_interval)
        {:noreply, socket}
    end
  end

  def handle_info(
        %{event: "broadcast"},
        %{assigns: %{policies: %Policies{broadcast: %BroadcastPolicies{read: false}}}} = socket
      ) do
    Logger.warning("Broadcast message ignored")
    {:noreply, socket}
  end

  def handle_info(%{event: type, payload: payload} = msg, socket) do
    count(socket)
    maybe_log_info(socket, msg)
    push(socket, type, payload)
    {:noreply, socket}
  end

  def handle_info(:postgres_changes_subscribed, %{assigns: %{channel_name: channel_name}} = socket) do
    push_postgres_changes_subscribed(socket, channel_name)
    {:noreply, socket}
  end

  def handle_info(:postgres_subscribe, %{assigns: %{channel_name: channel_name}} = socket) do
    %{assigns: %{tenant: tenant_id, pg_sub_ref: pg_sub_ref, pg_change_params: pg_change_params}} = socket

    Helpers.cancel_timer(pg_sub_ref)

    %Tenant{} = tenant = Cache.get_tenant_by_external_id(tenant_id)

    case postgres_subscribe_attempt(tenant, pg_change_params) do
      {:ok, _response} ->
        push_postgres_changes_subscribed(socket, channel_name)
        {:noreply, assign(socket, :pg_sub_ref, nil)}

      {:error, :fatal, error} ->
        maybe_log_warning(socket, @postgres_subscribe_error_code, error)
        push_system_message("postgres_changes", socket, "error", error, channel_name)
        # No point in retrying if the params are invalid
        {:noreply, assign(socket, :pg_sub_ref, nil)}

      {:error, :retry, error} ->
        maybe_log_warning(socket, @postgres_subscribe_error_code, error)

        push_system_message("postgres_changes", socket, "error", error, channel_name)
        {:noreply, assign(socket, :pg_sub_ref, postgres_subscribe(5, 10))}

      {:error, :not_connected} ->
        maybe_log_warning(
          socket,
          "ReconnectSubscribeToPostgres",
          "Re-connecting to PostgreSQL with params: " <> inspect(pg_change_params)
        )

        {:noreply, assign(socket, :pg_sub_ref, postgres_subscribe())}
    end
  rescue
    error ->
      log_warning(socket, "UnableToSubscribeToPostgres", error)
      push_system_message("postgres_changes", socket, "error", error, channel_name)
      {:noreply, assign(socket, :pg_sub_ref, postgres_subscribe(5, 10))}
  end

  def handle_info(:apply_pending_access_token, socket), do: apply_pending_access_token(socket)

  # Apply the pending token if confirm_token fires first, instead of validating the old one
  def handle_info(:confirm_token, %{assigns: %{pending_access_token: pending}} = socket) when is_binary(pending) do
    apply_pending_access_token(socket)
  end

  def handle_info(:confirm_token, %{assigns: %{pg_change_params: pg_change_params}} = socket) do
    case confirm_token(socket) do
      {:ok, claims, confirm_token_ref} ->
        pg_change_params = Enum.map(pg_change_params, &Map.put(&1, :claims, claims))
        {:noreply, assign(socket, %{confirm_token_ref: confirm_token_ref, pg_change_params: pg_change_params})}

      {:error, :missing_claims} ->
        shutdown_response(socket, "Fields `role` and `exp` are required in JWT")

      {:error, :expired_token, msg} ->
        shutdown_response(socket, msg)

      {:error, {:error_generating_signer, kid}} ->
        msg =
          "Failed to generate JWT signer for key ID (kid) #{inspect(kid)}, check your JWT secret or JWKS configuration"

        log_error(socket, "JwtSignerError", msg)
        shutdown_response(socket, msg)

      {:error, :error_generating_signer} ->
        msg = "Failed to generate JWT signer, check your JWT secret or JWKS configuration"
        log_error(socket, "JwtSignerError", msg)
        shutdown_response(socket, msg)

      {:error, error} ->
        shutdown_response(socket, Realtime.Logs.to_log(error))
    end
  end

  def handle_info(:sync_presence, %{assigns: %{presence_enabled?: true}} = socket) do
    case PresenceHandler.sync(socket) do
      :ok ->
        {:noreply, socket}

      {:error, :rate_limit_exceeded} ->
        shutdown_response(socket, "Too many presence messages per second")
    end
  end

  def handle_info(:sync_presence, socket), do: {:noreply, socket}

  # presence_diff for a socket whose presence.read was not authorized at join (presence disabled
  # then) is routed here by the dispatcher instead of fastlaned. Deliver it only if this socket is
  # authorized for presence.read (authorized on-demand when presence was auto-enabled via track),
  # otherwise drop it.
  def handle_info({:authorize_presence_diff, %Phoenix.Socket.Broadcast{} = msg}, socket) do
    if PresenceHandler.can_read_presence?(socket), do: push(socket, "presence_diff", msg.payload)
    {:noreply, socket}
  end

  def handle_info(_, socket), do: {:noreply, socket}

  @impl true
  def handle_in("broadcast", payload, %{assigns: %{private?: true}} = socket) do
    %{tenant: tenant_id} = socket.assigns

    with {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant_id) do
      BroadcastHandler.handle(payload, db_conn, socket)
    else
      {:error, :rpc_error, error} ->
        log_error(socket, "UnableToHandleBroadcast", error)
        {:noreply, socket}

      {:error, error} ->
        log_error(socket, "UnableToHandleBroadcast", error)
        {:noreply, socket}
    end
  end

  def handle_in("broadcast", payload, %{assigns: %{private?: false}} = socket) do
    BroadcastHandler.handle(payload, socket)
  end

  def handle_in("presence", payload, socket) do
    with {:ok, socket, sync_needed} <- PresenceHandler.handle(payload, socket) do
      if sync_needed == :resync, do: send(self(), :sync_presence)

      {:reply, :ok, socket}
    else
      {:error, :client_rate_limit_exceeded} ->
        log_error(socket, "ClientPresenceRateLimitReached", :client_rate_limit_exceeded)
        shutdown_response(socket, "Client presence rate limit exceeded")

      {:error, :rate_limit_exceeded} ->
        shutdown_response(socket, "Too many presence messages per second")

      {:error, :payload_size_exceeded} ->
        shutdown_response(socket, "Track message size exceeded")

      {:error, :invalid_payload} ->
        log_error(socket, "InvalidPresencePayload", :invalid_payload)
        {:reply, {:error, %{reason: "Presence track payload must be a map"}}, socket}

      {:error, :rpc_error, error} ->
        log_error(socket, "UnableToHandlePresence", error)
        {:reply, :error, socket}

      {:error, error} ->
        log_error(socket, "UnableToHandlePresence", error)
        {:reply, :error, socket}
    end
  end

  def handle_in("access_token", %{"access_token" => "sb_" <> _}, socket), do: {:noreply, socket}

  def handle_in("access_token", %{"access_token" => refresh_token}, %{assigns: %{access_token: access_token}} = socket)
      when refresh_token == access_token do
    {:noreply, socket}
  end

  def handle_in("access_token", %{"access_token" => nil}, socket), do: {:noreply, socket}

  # Already held for the current window, nothing new to verify
  def handle_in(
        "access_token",
        %{"access_token" => refresh_token},
        %{assigns: %{pending_access_token: pending}} = socket
      )
      when refresh_token == pending do
    {:noreply, socket}
  end

  def handle_in("access_token", %{"access_token" => refresh_token}, socket) when is_binary(refresh_token) do
    %{assigns: %{access_token_verified_at: verified_at}} = socket
    throttle_ms = access_token_throttle_ms()
    now = now()

    # First refresh of the channel, or the window has closed
    if is_nil(verified_at) or now - verified_at >= throttle_ms do
      apply_access_token(socket, refresh_token, now)
    else
      {:noreply, hold_access_token(socket, refresh_token, throttle_ms - (now - verified_at))}
    end
  end

  def handle_in(type, payload, socket) do
    count(socket)

    # Log info here so that bad messages from clients won't flood Logflare
    # Can subscribe to a Channel with `log_level` `info` to see these messages
    message = "Unexpected message from client of type `#{type}` with payload: #{inspect(payload)}"
    Logger.info(message)

    {:noreply, socket}
  end

  # Validate and update token later.
  defp hold_access_token(%{assigns: %{pending_access_token: nil}} = socket, refresh_token, remaining_ms) do
    log_warning(socket, "AccessTokenRefreshThrottled", "Token refresh throttled, applying in #{remaining_ms}ms")
    Process.send_after(self(), :apply_pending_access_token, remaining_ms)
    assign(socket, :pending_access_token, refresh_token)
  end

  defp hold_access_token(socket, refresh_token, _remaining_ms), do: assign(socket, :pending_access_token, refresh_token)

  defp apply_pending_access_token(%{assigns: %{pending_access_token: nil}} = socket), do: {:noreply, socket}

  defp apply_pending_access_token(%{assigns: %{pending_access_token: token}} = socket) do
    apply_access_token(socket, token, now())
  end

  defp apply_access_token(socket, refresh_token, now) do
    %{
      assigns: %{
        tenant: tenant_id,
        pg_sub_ref: pg_sub_ref,
        channel_name: channel_name,
        pg_change_params: pg_change_params
      }
    } = socket

    # Keep track of the policies evaluated with the previous token so we can detect revoked permissions
    previous_policies = socket.assigns.policies

    socket =
      assign(socket, %{
        access_token: refresh_token,
        policies: nil,
        access_token_verified_at: now,
        pending_access_token: nil
      })

    with {:ok, claims, confirm_token_ref} <- confirm_token(socket),
         socket = assign_authorization_context(socket, channel_name, claims),
         {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant_id),
         {:ok, socket} <- maybe_assign_policies(channel_name, db_conn, socket),
         :ok <- check_read_permissions_revoked(previous_policies, socket.assigns.policies) do
      socket = maybe_resubscribe_fastlane(socket)

      Helpers.cancel_timer(pg_sub_ref)
      pg_change_params = Enum.map(pg_change_params, &Map.put(&1, :claims, claims))

      pg_sub_ref =
        case pg_change_params do
          [_ | _] -> postgres_subscribe()
          _ -> nil
        end

      assigns = %{
        pg_sub_ref: pg_sub_ref,
        confirm_token_ref: confirm_token_ref,
        pg_change_params: pg_change_params
      }

      {:noreply, assign(socket, assigns)}
    else
      {:error, reason, msg} when reason in ~w(unauthorized expired_token token_malformed)a ->
        shutdown_response(socket, msg)

      {:error, :read_permissions_revoked} ->
        shutdown_response(socket, "You no longer have permission to read from this Channel topic: #{channel_name}")

      {:error, :missing_claims} ->
        shutdown_response(socket, "Fields `role` and `exp` are required in JWT")

      {:error, :unable_to_set_policies, _msg} ->
        shutdown_response(socket, "Realtime was unable to connect to the project database")

      {:error, :tenant_database_unavailable} ->
        shutdown_response(socket, "Realtime was unable to connect to the project database")

      {:error, :query_canceled, error} ->
        log_error(socket, "QueryCanceled", error)
        shutdown_response(socket, "Query was cancelled, please try again")

      {:error, :missing_partition} ->
        log_error(socket, "MissingPartition", "Realtime was unable to find the expected messages partition")
        shutdown_response(socket, "Realtime was unable to connect to the project database")

      {:error, :rpc_error, :timeout} ->
        shutdown_response(socket, "Node request timeout")

      {:error, :rpc_error, reason} ->
        shutdown_response(socket, "RPC call error: " <> inspect(reason))

      {:error, {:error_generating_signer, kid}} ->
        msg =
          "Failed to generate JWT signer for key ID (kid) #{inspect(kid)}, check your JWT secret or JWKS configuration"

        log_error(socket, "JwtSignerError", msg)
        shutdown_response(socket, msg)

      {:error, :error_generating_signer} ->
        msg = "Failed to generate JWT signer, check your JWT secret or JWKS configuration"
        log_error(socket, "JwtSignerError", msg)
        shutdown_response(socket, msg)

      {:error, error} ->
        shutdown_response(socket, inspect(error))
    end
  end

  @impl true
  def terminate(reason, %{transport_pid: transport_pid}) do
    Logger.debug("Channel terminated with reason: #{inspect(reason)}")
    :telemetry.execute([:prom_ex, :plugin, :realtime, :disconnected], %{})
    Tracker.untrack(transport_pid)
    :ok
  end

  defp postgres_subscribe(min \\ 1, max \\ 3) do
    Process.send_after(self(), :postgres_subscribe, backoff(min, max))
  end

  defp backoff(min, max) do
    {wait, _} = Backoff.backoff(%Backoff{type: :rand, min: min * 1000, max: max * 1000})
    wait
  end

  def limit_joins(tenant, socket) do
    rate_args = Tenants.joins_per_second_rate(tenant)

    RateCounter.new(rate_args)

    case RateCounter.get(rate_args) do
      {:ok, %{limit: %{triggered: false}}} ->
        GenCounter.add(rate_args.id)
        :ok

      {:ok, %{limit: %{triggered: true}}} ->
        {:error, :too_many_joins}

      error ->
        log_error(socket, "UnknownErrorOnCounter", error)
        {:error, error}
    end
  end

  def limit_channels(tenant, %{transport_pid: pid} = socket) do
    key = Tenants.channels_per_client_key(tenant)
    count = Registry.count_match(Realtime.Registry, key, pid)

    cond do
      count >= tenant.max_channels_per_client ->
        {:error, :too_many_channels}

      count + 1 == tenant.max_channels_per_client ->
        Registry.register(Realtime.Registry, key, pid)
        log_error(socket, "ChannelRateLimitReached", "Too many channels")
        :ok

      true ->
        Registry.register(Realtime.Registry, key, pid)
        :ok
    end
  end

  # Started as early as possible in join/3 (before the `with` chain) so the
  # RPC Muster.join/3 may need to make overlaps with the rest of the join
  # (DB connect, auth checks, ...) instead of adding pure tail latency.
  # Plain Task.async/1 (no shared Task.Supervisor) avoids serializing a join
  # storm through one process; the try/rescue/catch inside guarantees the
  # task always returns a plain term instead of exiting abnormally, so its
  # link to this process can never propagate a crash back to the channel.
  defp maybe_start_muster_join(tenant_id, transport_pid) do
    if FeatureFlags.enabled?("use_muster_channel_join", tenant_id) do
      scope = Application.get_env(:realtime, :muster_scope)

      unless Muster.local_member?(scope, tenant_id, transport_pid) do
        Task.async(fn ->
          try do
            Muster.join(scope, tenant_id, transport_pid)
          rescue
            e -> {:error, Exception.message(e)}
          catch
            :exit, reason -> {:error, reason}
          end
        end)
      end
    end
  end

  defp await_muster_join(nil, _socket), do: :ok

  # Bounds how long a channel join waits on the Muster registration started by
  # maybe_start_muster_join/2, so the client is only told "joined" once Muster
  # membership has actually landed (avoiding a window where an early broadcast
  # fanned out through Muster would miss this pid) - except in the rare case
  # the join is genuinely slow, where we cut our losses instead of blocking
  # the reply on Muster's own much larger worst-case timeout (its internal
  # :claim_call_timeout ceiling is 60s).
  @muster_join_await_ms 4_000

  defp await_muster_join(task, socket) do
    case Task.yield(task, @muster_join_await_ms) || Task.shutdown(task, :brutal_kill) do
      {:ok, :ok} -> :ok
      {:ok, {:error, reason}} -> log_error(socket, "MusterJoinError", inspect(reason))
      {:exit, reason} -> log_error(socket, "MusterJoinError", inspect(reason))
      nil -> log_error(socket, "MusterJoinError", "timed out after #{@muster_join_await_ms}ms")
    end
  end

  defp limit_max_users(tenant, transport_pid) do
    if !UsersCounter.already_counted?(transport_pid, tenant.external_id) and
         UsersCounter.tenant_users(tenant.external_id) >= tenant.max_concurrent_users do
      {:error, :too_many_connections}
    else
      :ok
    end
  end

  defp access_token_throttle_ms, do: Application.fetch_env!(:realtime, :access_token_throttle_ms)

  defp now, do: System.monotonic_time(:millisecond)

  defp count(%{assigns: %{tenant: tenant_id}}), do: GenCounter.add(Tenants.events_per_second_key(tenant_id))

  defp assign_access_token(%{assigns: %{tenant_token: tenant_token}} = socket, params) do
    access_token = Map.get(params, "access_token") || Map.get(params, "user_token")

    case access_token do
      "sb_" <> _ -> assign(socket, :access_token, tenant_token)
      _ -> handle_access_token(socket, params)
    end
  end

  defp handle_access_token(%{assigns: %{tenant_token: _tenant_token}} = socket, %{"user_token" => user_token})
       when is_binary(user_token) do
    assign(socket, :access_token, user_token)
  end

  defp handle_access_token(%{assigns: %{tenant_token: _tenant_token}} = socket, %{"access_token" => access_token})
       when is_binary(access_token) do
    assign(socket, :access_token, access_token)
  end

  defp handle_access_token(%{assigns: %{tenant_token: tenant_token}} = socket, _params) when is_binary(tenant_token) do
    assign(socket, :access_token, tenant_token)
  end

  # Only place cached policies get re-evaluated (access_token refresh) or the socket gets
  # disconnected (JWT expiry). Keep client JWT expiry short: see
  # https://supabase.com/docs/guides/realtime/authorization#updating-rls-policies
  defp confirm_token(%{assigns: assigns}) do
    %{jwt_secret: jwt_secret, access_token: access_token} = assigns

    jwt_jwks = Map.get(assigns, :jwt_jwks)

    with jwt_secret_dec <- Tenant.decrypt_jwt_secret(jwt_secret),
         {:ok, %{"exp" => exp} = claims} when is_integer(exp) <-
           ChannelsAuthorization.authorize_conn(access_token, jwt_secret_dec, jwt_jwks),
         exp_diff when exp_diff > 0 <- exp - Joken.current_time() do
      if ref = assigns[:confirm_token_ref], do: Helpers.cancel_timer(ref)

      interval = min(@confirm_token_ms_max_interval, exp_diff * 1000)
      ref = Process.send_after(self(), :confirm_token, interval)

      {:ok, claims, ref}
    else
      {:error, :token_malformed} ->
        {:error, :token_malformed, "The token provided is not a valid JWT"}

      {:error, error} ->
        {:error, error}

      {:error, error, message} ->
        {:error, error, message}

      e ->
        {:error, e}
    end
  end

  defp shutdown_response(socket, message) when is_binary(message) do
    %{assigns: %{channel_name: channel_name}} = socket
    push_system_message("system", socket, "error", message, channel_name)
    maybe_log_warning(socket, "ChannelShutdown", message)
    {:stop, :normal, socket}
  end

  defp replication_ready_timeout do
    Application.fetch_env!(:realtime, :replication_ready_timeout)
  end

  defp push_system_message(extension, socket, status, error, channel_name)
       when is_map(error) and is_map_key(error, :error_code) and is_map_key(error, :error_message) do
    push(socket, "system", %{
      extension: extension,
      status: status,
      message: "#{error.error_code}: #{error.error_message}",
      channel: channel_name
    })
  end

  defp push_system_message(extension, socket, status, message, channel_name)
       when is_binary(message) do
    push(socket, "system", %{
      extension: extension,
      status: status,
      message: message,
      channel: channel_name
    })
  end

  defp push_system_message(extension, socket, status, message, channel_name) do
    push(socket, "system", %{
      extension: extension,
      status: status,
      message: inspect(message),
      channel: channel_name
    })
  end

  defp new_api?(%{"config" => _}), do: true
  defp new_api?(_), do: false

  defp pg_change_params(true, params, channel_pid, claims, _) do
    case get_in(params, ["config", "postgres_changes"]) do
      [_ | _] = params_list ->
        params_list
        |> Enum.reject(&is_nil/1)
        |> Enum.map(fn params ->
          %{
            id: UUID.uuid1(),
            channel_pid: channel_pid,
            claims: claims,
            params: params
          }
        end)

      _ ->
        []
    end
  end

  defp pg_change_params(false, _, channel_pid, claims, sub_topic) do
    params =
      case String.split(sub_topic, ":", parts: 3) do
        [schema, table, filter] -> %{"schema" => schema, "table" => table, "filter" => filter}
        [schema, table] -> %{"schema" => schema, "table" => table}
        [schema] -> %{"schema" => schema}
      end

    [
      %{
        id: UUID.uuid1(),
        channel_pid: channel_pid,
        claims: claims,
        params: params
      }
    ]
  end

  defp postgres_cdc_subscribe(_tenant, %{pg_change_params: []}), do: []

  defp postgres_cdc_subscribe(tenant, opts) do
    %{
      is_new_api: is_new_api,
      pg_change_params: pg_change_params,
      transport_pid: transport_pid,
      serializer: serializer,
      topic: topic
    } = opts

    ids =
      Enum.map(pg_change_params, fn %{id: id, params: params} ->
        {UUID.string_to_binary!(id), :erlang.phash2(params)}
      end)

    subscription_metadata =
      {:subscriber_fastlane, transport_pid, serializer, ids, topic, is_new_api}

    metadata = [metadata: subscription_metadata]

    {:ok, module} = PostgresCdc.driver(tenant.postgres_cdc_default)
    PostgresCdc.subscribe(module, pg_change_params, tenant.external_id, metadata)

    pg_change_params
  end

  @spec postgres_subscribe_attempt(Tenant.t(), list()) ::
          {:ok, term()} | {:error, :not_connected} | {:error, :fatal | :retry, term()}
  defp postgres_subscribe_attempt(%Tenant{external_id: tenant_id} = tenant, pg_change_params) do
    {:ok, module} = PostgresCdc.driver(tenant.postgres_cdc_default)
    settings = PostgresCdc.filter_settings(tenant.postgres_cdc_default, tenant.extensions)
    args = %{"region" => settings["region"], "id" => tenant_id}

    with {:ok, connection} <- PostgresCdc.connect(module, args),
         {:ok, response} <- PostgresCdc.after_connect(module, connection, settings, pg_change_params, tenant_id) do
      {:ok, response}
    else
      nil -> {:error, :not_connected}
      {:error, {reason, error}} when reason in @postgres_subscribe_fatal_reasons -> {:error, :fatal, error}
      error -> {:error, :retry, error}
    end
  end

  defp start_postgres_subscribe(_socket, _join, _tenant, []), do: :ok

  defp start_postgres_subscribe(socket, join, tenant, pg_change_params) do
    case Join.postgres_changes_wait_timeout(join) do
      nil ->
        send(self(), :postgres_subscribe)
        :ok

      timeout ->
        await_postgres_subscribe(socket, %{
          tenant: tenant,
          pg_change_params: pg_change_params,
          timeout: timeout,
          deadline: System.monotonic_time(:millisecond) + timeout,
          backoff:
            Backoff.new(
              backoff_min: @postgres_subscribe_backoff_min,
              backoff_max: @postgres_subscribe_backoff_max,
              backoff_type: :rand_exp
            )
        })
    end
  end

  defp await_postgres_subscribe(socket, %{tenant: tenant, pg_change_params: pg_change_params} = wait) do
    case postgres_subscribe_attempt(tenant, pg_change_params) do
      {:ok, _response} ->
        send(self(), :postgres_changes_subscribed)
        :ok

      {:error, :fatal, error} ->
        maybe_log_warning(socket, @postgres_subscribe_error_code, error)

      {:error, :not_connected} ->
        sleep_and_retry_postgres_subscribe(socket, wait)

      {:error, :retry, error} ->
        maybe_log_warning(socket, @postgres_subscribe_error_code, error)
        sleep_and_retry_postgres_subscribe(socket, wait)
    end
  end

  defp sleep_and_retry_postgres_subscribe(socket, %{deadline: deadline, backoff: backoff, timeout: timeout} = wait) do
    case deadline - System.monotonic_time(:millisecond) do
      remaining when remaining > 0 ->
        {interval, backoff} = Backoff.backoff(backoff)
        Process.sleep(min(interval, remaining))
        await_postgres_subscribe(socket, %{wait | backoff: backoff})

      _ ->
        log_error(
          socket,
          "PostgresChangesSubscribeTimeout",
          "Timed out after #{timeout}ms waiting for the postgres_changes subscription"
        )
    end
  end

  defp push_postgres_changes_subscribed(socket, channel_name) do
    message = "Subscribed to PostgreSQL"
    maybe_log_info(socket, message)
    push_system_message("postgres_changes", socket, "ok", message, channel_name)
  end

  defp add_id_to_postgres_changes(pg_change_params) do
    Enum.map(pg_change_params, fn %{params: params} ->
      id = :erlang.phash2(params)
      Map.put(params, :id, id)
    end)
  end

  defp assign_authorization_context(socket, topic, claims) do
    authorization_context =
      Authorization.build_authorization_params(%{
        tenant_id: socket.assigns.tenant,
        topic: topic,
        headers: Map.get(socket.assigns, :headers, []),
        claims: claims,
        role: claims["role"],
        sub: claims["sub"]
      })

    assign(socket, :authorization_context, authorization_context)
  end

  # Result is cached in assigns.policies for the JWT's or socket's life time (whichever comes first).
  # We recommend short-lived JWTs to force re-evaluation.
  # See https://supabase.com/docs/guides/realtime/authorization#updating-rls-policies
  defp maybe_assign_policies(topic, db_conn, %{assigns: %{private?: true}} = socket)
       when not is_nil(topic) do
    authorization_context = socket.assigns.authorization_context
    policies = socket.assigns.policies || %Policies{}
    presence_enabled? = socket.assigns.presence_enabled?

    with {:ok, policies} <-
           Authorization.get_read_authorizations(policies, db_conn, authorization_context,
             presence_enabled?: presence_enabled?
           ) do
      socket = assign(socket, :policies, policies)

      %Policies{broadcast: %{read: broadcast_read?}, presence: %{read: presence_read?}} = socket.assigns.policies

      if broadcast_read? || presence_read?,
        do: {:ok, socket},
        else: {:error, :unauthorized, "You do not have permissions to read from this Channel topic: #{topic}"}
    else
      {:error, :increase_connection_pool} ->
        {:error, :increase_connection_pool}

      {:error, :rls_policy_error, error} ->
        log_error(socket, "RlsPolicyError", error)

        {:error, :unauthorized, "You do not have permissions to read from this Channel topic: #{topic}"}

      {:error, %_{} = error} ->
        {:error, :unable_to_set_policies, error}

      other ->
        other
    end
  end

  defp maybe_assign_policies(_, _, socket), do: {:ok, assign(socket, policies: nil)}

  # presence.read gate carried in the fastlane metadata so the dispatcher can withhold
  # presence_diff from members denied presence.read:
  #   * public channel (no policies) -> true (no presence authorization, always receive diffs)
  #   * private + presence enabled at join -> the authorized presence.read value (true/false)
  #   * private + presence not enabled -> nil (read not evaluated yet). The dispatcher routes
  #     these diffs to the channel process (handle_info) instead of fastlaning, where presence.read
  #     is consulted at delivery time (it is authorized on-demand when presence is auto-enabled via
  #     a track message - see PresenceHandler).
  defp fastlane_metadata(socket, replayed_message_ids) do
    %{assigns: %{tenant: tenant_id, log_level: log_level, policies: policies}} = socket

    MessageDispatcher.fastlane_metadata(
      socket.transport_pid,
      socket.serializer,
      socket.topic,
      log_level,
      tenant_id,
      replayed_message_ids,
      if(policies, do: policies.presence.read, else: true),
      if(policies, do: policies.broadcast.read, else: true)
    )
  end

  defp maybe_resubscribe_fastlane(socket) do
    %{assigns: %{fastlane_metadata: current, tenant: tenant_id, tenant_topic: tenant_topic}} = socket

    case fastlane_metadata(socket, socket.assigns.replayed_message_ids) do
      ^current ->
        socket

      updated ->
        for pubsub_topic <- [tenant_topic, "realtime:operations:" <> tenant_id] do
          RealtimeWeb.Endpoint.unsubscribe(pubsub_topic)
          RealtimeWeb.Endpoint.subscribe(pubsub_topic, metadata: updated)
        end

        assign(socket, :fastlane_metadata, updated)
    end
  end

  defp can_replay?(%{"broadcast" => %{"replay" => _}}, topic, %{
         assigns: %{policies: %Policies{broadcast: %BroadcastPolicies{read: false}}}
       }),
       do: {:error, :unauthorized, "You do not have permissions to read from this Channel topic: #{topic}"}

  defp can_replay?(_config, _topic, _socket), do: :ok

  # Detects read permissions that were granted under the previous token but are no longer allowed
  # after re-evaluating the policies with the new token. When that happens we disconnect the channel.
  defp check_read_permissions_revoked(%Policies{} = previous, %Policies{} = current) do
    if read_revoked?(previous.broadcast.read, current.broadcast.read) or
         read_revoked?(previous.presence.read, current.presence.read),
       do: {:error, :read_permissions_revoked},
       else: :ok
  end

  defp check_read_permissions_revoked(_previous, _current), do: :ok

  defp read_revoked?(true, false), do: true
  defp read_revoked?(_previous, _current), do: false

  defp only_private?(tenant, %{assigns: %{private?: private?}}) do
    if tenant.private_only and !private? do
      {:error, :private_only}
    else
      :ok
    end
  end

  defp maybe_replay_messages(%{"broadcast" => %{"replay" => _}}, _sub_topic, _db_conn, _tenant_id, false = _private?) do
    {:error, :invalid_replay_channel}
  end

  defp maybe_replay_messages(
         %{"broadcast" => %{"replay" => replay_params}},
         sub_topic,
         db_conn,
         tenant_id,
         true = _private?
       )
       when is_map(replay_params) do
    replay_defaults = %Replay{}

    with {:ok, messages, message_ids} <-
           Realtime.Messages.replay(
             db_conn,
             tenant_id,
             sub_topic,
             replay_params["since"] || replay_defaults.since,
             replay_params["limit"] || replay_defaults.limit
           ) do
      # Send to self because we can't write to the socket before finishing the join process
      send(self(), {:replay, messages})
      {:ok, message_ids}
    end
  end

  defp maybe_replay_messages(_, _, _, _, _), do: {:ok, MapSet.new()}

  # V1 sockets are unable to represent binary payloads
  defp replay(%Message{binary_payload: binary_payload}, _meta, %{serializer: Phoenix.Socket.V1.JSONSerializer})
       when is_binary(binary_payload) do
    :ok
  end

  defp replay(%Message{binary_payload: binary_payload, event: event}, meta, socket) when is_binary(binary_payload) do
    push(socket, "broadcast", {event, :binary, binary_payload, meta})
  end

  defp replay(%Message{} = message, meta, socket) do
    payload = %{"payload" => message.payload, "event" => message.event, "type" => "broadcast", "meta" => meta}
    push(socket, "broadcast", payload)
  end

  defp max_heap_size, do: :persistent_term.get({RealtimeWeb.UserSocket, :websocket_max_heap_size})

  defp join_error({:error, _} = error) do
    Process.sleep(channel_error_backoff_ms())
    error
  end

  defp join_error(other), do: other

  defp channel_error_backoff_ms, do: :persistent_term.get({__MODULE__, :channel_error_backoff_ms})
end
