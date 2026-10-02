defmodule Realtime.Tenants.SingleBroadcast do
  @moduledoc """
  Handles single broadcast messages via the /api/broadcast/:topic/events/:event API.

  Unlike the batch API, this API:
  - Takes topic and event from URL path
  - Sends single message (no batching)

  This module supports both JSON and binary payloads via Content-Type header:
  - application/json
  - application/octet-stream
  """
  use Ecto.Schema
  use Realtime.Logs
  import Ecto.Changeset

  alias Realtime.Api.Tenant
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.Messages
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Connect

  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.Socket.UserBroadcast
  alias RealtimeWeb.TenantBroadcaster

  @primary_key false
  embedded_schema do
    field :topic, :string
    field :event, :string
    # map for JSON, binary for binary
    field :payload, :any, virtual: true
    field :private, :boolean, default: false
    # "json" or "binary"
    field :content_type, :string
    field :persist, :boolean, default: false
  end

  @type content_type :: :json | :binary

  @doc """
  Broadcasts a single message to the specified topic.

  ## Parameters
  - `auth_params` - `%Realtime.Tenants.Authorization{}` struct
  - `tenant` - Tenant struct
  - `topic` - Channel topic from URL (e.g., "room:123")
  - `event` - Event name from URL (e.g., "message")
  - `payload` - Message payload (map for JSON, binary for binary)
  - `content_type` - :json or :binary
  - `opts`
    - `:private` - Whether this is a private broadcast (requires authorization). Defaults to `false`
    - `:persist` - Whether the message is stored in `realtime.messages`, requires `:private`. Defaults to `false`
  """
  @spec broadcast(
          Authorization.t(),
          Tenant.t(),
          String.t(),
          String.t(),
          map() | binary(),
          content_type(),
          keyword()
        ) :: :ok | {:error, term()} | {:error, atom(), String.t()}
  def broadcast(auth_params, tenant, topic, event, payload, content_type, opts \\ [])

  def broadcast(_auth_params, %Tenant{suspend: true}, _topic, _event, _payload, _content_type, _opts) do
    {:error, :forbidden, "Tenant is suspended"}
  end

  def broadcast(auth_params, %Tenant{} = tenant, topic, event, payload, content_type, opts) do
    private = Keyword.get(opts, :private, false)
    persist = Keyword.get(opts, :persist, false)

    with %Ecto.Changeset{valid?: true} <-
           validate_message(topic, event, private, payload, content_type, persist, tenant),
         events_per_second_rate = Tenants.events_per_second_rate(tenant),
         :ok <- check_rate_limit(events_per_second_rate, tenant) do
      if private do
        handle_private_message(
          tenant,
          auth_params,
          topic,
          event,
          payload,
          content_type,
          events_per_second_rate,
          persist
        )
      else
        send_message_and_count(tenant, events_per_second_rate, topic, event, payload, content_type, _public? = true)
        :ok
      end
    else
      %Ecto.Changeset{valid?: false} = changeset -> {:error, changeset}
      error -> error
    end
  end

  defp validate_message(topic, event, private, payload, content_type, persist, tenant) do
    %__MODULE__{}
    |> cast(%{topic: topic, event: event, private: private, content_type: to_string(content_type), persist: persist}, [
      :topic,
      :event,
      :private,
      :content_type,
      :persist
    ])
    |> put_change(:payload, payload)
    |> validate_required([:topic, :event, :content_type])
    |> validate_payload_present(content_type, payload)
    |> validate_inclusion(:content_type, ["json", "binary"])
    |> validate_payload_size(tenant, content_type)
    |> validate_persist_is_private()
  end

  defp validate_persist_is_private(changeset) do
    case {get_field(changeset, :persist), get_field(changeset, :private)} do
      {true, false} -> add_error(changeset, :persist, "can only be used on private channels")
      _persist_and_private -> changeset
    end
  end

  defp validate_payload_present(changeset, content_type, payload) do
    case {content_type, payload} do
      # Binary payloads: <<>> is valid, nil is not
      {:binary, payload} when is_binary(payload) ->
        changeset

      {:binary, nil} ->
        add_error(changeset, :payload, "can't be blank")

      # JSON payloads: any value (including nil map) is acceptable if present
      {:json, nil} ->
        add_error(changeset, :payload, "can't be blank")

      {:json, _} ->
        changeset

      _ ->
        changeset
    end
  end

  defp validate_payload_size(changeset, tenant, content_type) do
    payload = get_change(changeset, :payload)

    if is_nil(payload) do
      changeset
    else
      case content_type do
        :json ->
          case Tenants.validate_payload_size(tenant, payload) do
            :ok -> changeset
            _ -> add_error(changeset, :payload, "Payload size exceeds tenant limit")
          end

        :binary when is_binary(payload) ->
          # For binary, we check the actual byte size plus overhead
          # to match the behavior of validate_payload_size which uses erlang.external_size
          # Binary external size is byte_size + some overhead for the term encoding
          max_payload_size = tenant.max_payload_size_in_kb * 1000 + 500
          payload_size = :erlang.external_size(payload)

          if payload_size > max_payload_size do
            add_error(changeset, :payload, "Payload size exceeds tenant limit")
          else
            changeset
          end

        :binary ->
          # Not a binary, will fail validation
          changeset
      end
    end
  end

  defp handle_private_message(tenant, auth_params, topic, event, payload, content_type, rate_counter, persist) do
    persist? = persist and FeatureFlags.enabled?("broadcast_persistence", tenant.external_id)

    with {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant.external_id),
         {:ok, %Policies{broadcast: %BroadcastPolicies{write: true}} = policies} <-
           permissions_for_message(db_conn, auth_params, topic, persist?) do
      send_message_and_count(tenant, rate_counter, topic, event, payload, content_type, false)
      if persist?, do: maybe_persist(policies.broadcast, db_conn, tenant, topic, event, payload)
      :ok
    else
      {:ok, %Policies{}} ->
        {:error, :forbidden, "Unauthorized"}

      {:error, :rls_policy_error, error} ->
        log_error("RlsPolicyError", error)
        {:error, :unprocessable_entity, "RLS policy error"}

      {:error, :query_canceled, error} ->
        log_error("QueryCanceled", error)
        {:error, :unprocessable_entity, "Query canceled"}

      {:error, :rpc_error, error} ->
        log_error("RpcError", error)
        {:error, :internal_server_error, "RPC error"}

      {:error, :missing_partition} ->
        log_error("MissingPartition", "Realtime was unable to find the expected messages partition")
        {:error, :unprocessable_entity, "Missing messages partition"}

      {:error, :increase_connection_pool} ->
        {:error, :too_many_requests, "Connection pool exhausted"}

      {:error, :tenant_database_unavailable} ->
        log_error("UnableToConnectToProject", "Realtime was unable to connect to the project database")
        {:error, :unprocessable_entity, "Tenant database unavailable"}

      {:error, :initializing} ->
        {:error, :unprocessable_entity, "Tenant database initializing"}

      {:error, :tenant_database_connection_initializing} ->
        {:error, :unprocessable_entity, "Tenant database connection initializing"}

      {:error, :tenant_db_too_many_connections} ->
        log_error("DatabaseLackOfConnections", "Database can't accept more connections, Realtime won't connect")
        {:error, :unprocessable_entity, "Tenant database has too many connections"}

      {:error, :connect_rate_limit_reached} ->
        {:error, :unprocessable_entity, "Connect rate limit reached"}

      {:error, error} ->
        log_error("UnableToSetPolicies", error)
        {:error, :internal_server_error, "Unable to authorize broadcast"}
    end
  end

  # Currently the API has no ACK so just persist the message asyncly and log in case of errors.
  defp maybe_persist(%BroadcastPolicies{persist: true}, db_conn, tenant, topic, event, payload) do
    Task.Supervisor.start_child(Realtime.TaskSupervisor, fn ->
      case Messages.persist(db_conn, tenant.external_id, topic, event, payload) do
        {:ok, _id} -> :ok
        error -> log_error("UnableToPersistMessage", error)
      end
    end)

    :ok
  end

  defp maybe_persist(_broadcast_policies, _db_conn, _tenant, _topic, _event, _payload), do: :ok

  defp permissions_for_message(db_conn, auth_params, topic, persist?) do
    auth_params = %{auth_params | topic: topic}

    case Authorization.get_write_authorizations(db_conn, auth_params, :broadcast) do
      {:ok, %Policies{broadcast: %BroadcastPolicies{write: true}} = policies} when persist? ->
        Authorization.get_write_authorizations(policies, db_conn, auth_params, :persistence)

      result ->
        result
    end
  end

  defp check_rate_limit(events_per_second_rate, %Tenant{} = tenant) do
    %{max_events_per_second: max_events_per_second} = tenant
    {:ok, %{avg: events_per_second}} = RateCounter.get(events_per_second_rate)

    if events_per_second >= max_events_per_second do
      {:error, :too_many_requests, "You have exceeded your rate limit"}
    else
      :ok
    end
  end

  defp send_message_and_count(tenant, events_per_second_rate, topic, event, payload, content_type, public?) do
    tenant_topic = Tenants.tenant_topic(tenant, topic, public?)

    broadcast =
      case content_type do
        :json ->
          build_json_broadcast(tenant_topic, event, payload)

        :binary ->
          build_binary_broadcast(tenant_topic, event, payload)
      end

    GenCounter.add(events_per_second_rate.id)

    TenantBroadcaster.pubsub_broadcast(
      tenant.external_id,
      tenant_topic,
      broadcast,
      RealtimeChannel.MessageDispatcher,
      :broadcast
    )
  end

  defp build_json_broadcast(topic, event, payload) do
    %UserBroadcast{
      topic: topic,
      user_event: event,
      # We don't use Jason.encode_to_iodata because this message will be sent through gen_rpc which will
      # call term_to_iovec and then binary_to_term from the remote peer. All of this is more expensive on an
      # iolist compared to a single binary. Reconstructing a single binary is cheaper than an iolist
      user_payload: Jason.encode!(payload),
      user_payload_encoding: :json,
      metadata: nil
    }
  end

  defp build_binary_broadcast(topic, event, binary) do
    %UserBroadcast{
      topic: topic,
      user_event: event,
      user_payload: binary,
      user_payload_encoding: :binary,
      metadata: nil
    }
  end
end
