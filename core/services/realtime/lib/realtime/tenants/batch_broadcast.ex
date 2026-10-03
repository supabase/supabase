defmodule Realtime.Tenants.BatchBroadcast do
  @moduledoc """
  Virtual schema with a representation of a batched broadcast.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias Realtime.Api.Tenant
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Connect

  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.TenantBroadcaster

  embedded_schema do
    embeds_many :messages, Message do
      field :event, :string
      field :topic, :string
      field :payload, :map
      field :private, :boolean, default: false
    end
  end

  @spec broadcast(
          auth_params :: map() | nil,
          tenant :: Tenant.t(),
          messages :: %{
            messages: list(%{id: String.t(), topic: String.t(), payload: map(), event: String.t(), private: boolean()})
          },
          super_user :: boolean()
        ) :: :ok | {:error, atom() | Ecto.Changeset.t()}
  def broadcast(auth_params, tenant, messages, super_user \\ false)

  def broadcast(%Plug.Conn{} = conn, %Tenant{} = tenant, messages, super_user) do
    auth_params = %{
      tenant_id: tenant.external_id,
      headers: conn.req_headers,
      claims: conn.assigns.claims,
      role: conn.assigns.role,
      sub: conn.assigns.sub
    }

    broadcast(auth_params, %Tenant{} = tenant, messages, super_user)
  end

  def broadcast(_auth_params, %Tenant{suspend: true}, _messages, _super_user) do
    {:error, :forbidden, "Tenant is suspended"}
  end

  def broadcast(auth_params, %Tenant{} = tenant, messages, super_user) do
    with %Ecto.Changeset{valid?: true} = changeset <- changeset(%__MODULE__{}, messages, tenant),
         %Ecto.Changeset{changes: %{messages: messages}} = changeset,
         events_per_second_rate = Tenants.events_per_second_rate(tenant),
         :ok <- check_rate_limit(events_per_second_rate, tenant, length(messages)) do
      events =
        messages
        |> Enum.map(fn %{changes: event} -> event end)
        |> Enum.group_by(fn event -> Map.get(event, :private, false) end)

      # Handle events for public channel
      events
      |> Map.get(false, [])
      |> Enum.each(fn message ->
        send_message_and_count(tenant, events_per_second_rate, message, true)
      end)

      # Handle events for private channel
      events
      |> Map.get(true, [])
      |> Enum.group_by(fn event -> Map.get(event, :topic) end)
      |> Enum.each(fn {topic, events} ->
        if super_user do
          Enum.each(events, fn message -> send_message_and_count(tenant, events_per_second_rate, message, false) end)
        else
          case permissions_for_message(tenant, auth_params, topic) do
            %Policies{broadcast: %BroadcastPolicies{write: true}} ->
              Enum.each(events, fn message -> send_message_and_count(tenant, events_per_second_rate, message, false) end)

            _ ->
              nil
          end
        end
      end)

      :ok
    else
      %Ecto.Changeset{valid?: false} = changeset -> {:error, changeset}
      error -> error
    end
  end

  def broadcast(_, nil, _, _), do: {:error, :tenant_not_found}

  defp changeset(payload, attrs, tenant) do
    payload
    |> cast(attrs, [])
    |> cast_embed(:messages, required: true, with: fn message, attrs -> message_changeset(message, tenant, attrs) end)
  end

  defp message_changeset(message, tenant, attrs) do
    message
    |> cast(attrs, [:id, :topic, :payload, :event, :private])
    |> maybe_put_private_change()
    |> validate_required([:topic, :payload, :event])
    |> validate_payload_size(tenant)
  end

  defp maybe_put_private_change(changeset) do
    case get_change(changeset, :private) do
      nil -> put_change(changeset, :private, false)
      _ -> changeset
    end
  end

  defp validate_payload_size(changeset, tenant) do
    payload = get_change(changeset, :payload)

    case Tenants.validate_payload_size(tenant, payload) do
      :ok -> changeset
      _ -> add_error(changeset, :payload, "Payload size exceeds tenant limit")
    end
  end

  @event_type "broadcast"
  defp send_message_and_count(tenant, events_per_second_rate, message, public?) do
    tenant_topic = Tenants.tenant_topic(tenant, message.topic, public?)

    payload = %{"payload" => message.payload, "event" => message.event, "type" => "broadcast"}

    payload =
      if message[:id],
        do: Map.put(payload, "meta", %{"id" => message.id}),
        else: payload

    broadcast = %Phoenix.Socket.Broadcast{topic: message.topic, event: @event_type, payload: payload}

    GenCounter.add(events_per_second_rate.id)

    TenantBroadcaster.pubsub_broadcast(
      tenant.external_id,
      tenant_topic,
      broadcast,
      RealtimeChannel.MessageDispatcher,
      :broadcast
    )
  end

  defp permissions_for_message(_, nil, _), do: nil

  defp permissions_for_message(tenant, auth_params, topic) do
    with {:ok, db_conn} <- Connect.lookup_or_start_connection(tenant.external_id) do
      auth_params =
        auth_params
        |> Map.put(:topic, topic)
        |> Authorization.build_authorization_params()

      case Authorization.get_write_authorizations(db_conn, auth_params, :broadcast) do
        {:ok, policies} -> policies
        {:error, :not_found} -> nil
        error -> error
      end
    end
  end

  defp check_rate_limit(events_per_second_rate, %Tenant{} = tenant, total_messages_to_broadcast) do
    %{max_events_per_second: max_events_per_second} = tenant
    {:ok, %{avg: events_per_second}} = RateCounter.get(events_per_second_rate)

    cond do
      events_per_second > max_events_per_second ->
        {:error, :too_many_requests, "You have exceeded your rate limit"}

      total_messages_to_broadcast + events_per_second > max_events_per_second ->
        {:error, :too_many_requests, "Too many messages to broadcast, please reduce the batch size"}

      true ->
        :ok
    end
  end
end
