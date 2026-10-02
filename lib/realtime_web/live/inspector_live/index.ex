defmodule RealtimeWeb.InspectorLive.Index do
  use RealtimeWeb, :live_view

  alias RealtimeWeb.InspectorLive.ConnComponent

  defmodule Message do
    use Ecto.Schema
    import Ecto.Changeset

    schema "f" do
      field(:event, :string)
      field(:payload, :string)
    end

    def changeset(form, params \\ %{}) do
      form
      |> cast(params, [:event, :payload])
      # Broadcast under the name as typed, so a trailing space would miss every listener.
      |> update_change(:event, &String.trim/1)
      |> validate_required([:event, :payload])
      |> validate_change(:payload, fn :payload, payload ->
        case Jason.decode(payload) do
          {:ok, _} -> []
          {:error, %Jason.DecodeError{} = error} -> [payload: "invalid JSON: #{Exception.message(error)}"]
        end
      end)
    end
  end

  @impl true
  def mount(_params, _session, socket) do
    changeset = Message.changeset(%Message{event: "test", payload: ~s({"some":"data"})})

    socket =
      socket
      |> assign(active_nav: :inspector)
      |> assign(changeset: changeset)
      |> assign(page_title: "Inspector - Supabase Realtime")
      |> assign(health: health_idle())

    {:ok, socket}
  end

  @impl true
  def handle_params(params, _url, socket) do
    send_update(ConnComponent, id: :conn, url_params: params)

    {:noreply, socket}
  end

  @impl true
  def handle_event("send_message", %{"message" => message_params}, socket) do
    case Ecto.Changeset.apply_action(Message.changeset(%Message{}, message_params), :validate) do
      {:ok, message} ->
        socket =
          push_event(socket, "send_message", %{
            "message" => %{"event" => message.event, "payload" => Jason.decode!(message.payload)}
          })

        {:noreply, socket}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  def handle_event("transport_status", %{"status" => status} = params, socket) do
    socket =
      case status do
        "ok" ->
          update_health(socket, :transport, &%{&1 | status: :open, rtt_ms: params["latency_ms"], reason: nil})

        "sent" ->
          update_health(socket, :transport, fn t ->
            if t.status == :idle, do: %{t | status: :connecting}, else: t
          end)

        "disconnected" ->
          assign(socket, :health, health_idle())

        error_status when error_status in ["error", "timeout"] ->
          update_health(socket, :transport, &%{&1 | status: :error, reason: error_status})
      end

    {:noreply, socket}
  end

  def handle_event("channel_status", %{"status" => status} = params, socket) do
    socket =
      case status do
        "joining" ->
          update_health(socket, :channel, &%{&1 | status: :joining, reason: nil})

        "joined" ->
          socket
          |> update_health(:channel, fn c ->
            %{c | status: :joined, joined_at: DateTime.utc_now(), host: params["host"], reason: nil}
          end)
          |> update_health(:broadcast, fn _ -> %{status: :active} end)

        "retrying" ->
          socket
          |> update_health(:channel, &%{&1 | status: :retrying, reason: params["reason"]})
          |> drop_subscriptions()

        "errored" ->
          socket
          |> update_health(:channel, &%{&1 | status: :errored, reason: params["reason"]})
          |> drop_subscriptions()

        "timed_out" ->
          socket
          |> update_health(:channel, &%{&1 | status: :timed_out, reason: params["reason"]})
          |> drop_subscriptions()

        "closed" ->
          assign(socket, :health, health_idle())
      end

    send_update(ConnComponent, id: :conn, subscribed_state: subscribed_state(status))

    {:noreply, socket}
  end

  def handle_event("presence_synced", %{"count" => count}, socket) do
    {:noreply, update_health(socket, :presence, fn _ -> %{status: :synced, count: count} end)}
  end

  def handle_event("postgres_subscribed", %{"schema" => schema, "table" => table, "filter" => filter}, socket) do
    socket =
      update_health(socket, :postgres, fn _ ->
        %{status: :subscribed, schema: schema, table: table, filter: filter, reason: nil}
      end)

    {:noreply, socket}
  end

  def handle_event("postgres_error", %{"reason" => reason}, socket) do
    {:noreply, update_health(socket, :postgres, &%{&1 | status: :error, reason: reason})}
  end

  defp drop_subscriptions(socket) do
    socket
    |> update_health(:transport, &%{&1 | rtt_ms: nil})
    |> update_health(:broadcast, fn _ -> %{status: :idle} end)
    |> update_health(:presence, fn _ -> %{status: :idle, count: 0} end)
    |> update_health(:postgres, &%{&1 | status: :idle, reason: nil})
  end

  defp update_health(socket, key, fun) do
    update(socket, :health, &Map.update!(&1, key, fun))
  end

  defp subscribed_state("joined"), do: "Reconnect"
  defp subscribed_state("joining"), do: "Connecting..."
  defp subscribed_state(_), do: "Connect"

  defp health_idle do
    %{
      transport: %{status: :idle, rtt_ms: nil, reason: nil},
      channel: %{status: :idle, joined_at: nil, host: nil, reason: nil},
      broadcast: %{status: :idle},
      presence: %{status: :idle, count: 0},
      postgres: %{status: :idle, schema: nil, table: nil, filter: nil, reason: nil}
    }
  end

  @doc false
  def status_variant(status) when status in [:open, :joined, :active, :synced, :subscribed], do: :success
  def status_variant(status) when status in [:connecting, :joining, :retrying], do: :info
  def status_variant(status) when status in [:error, :errored, :timed_out], do: :error
  def status_variant(_), do: :neutral

  @doc false
  def status_pulse?(status), do: status in [:connecting, :joining, :retrying]

  @doc false
  def channel_label(%{status: :joined, host: host}), do: "Connected to #{host_label(host)}"
  def channel_label(%{status: :joining}), do: "Connecting"

  def channel_label(%{status: :retrying}), do: "Reconnecting"
  def channel_label(%{status: :timed_out}), do: "Timed out"
  def channel_label(%{status: :errored, reason: nil}), do: "Connection failed"
  def channel_label(%{status: :errored, reason: reason}), do: reason
  def channel_label(_), do: "Not connected"

  @doc false
  def channel_detail(%{status: :retrying, reason: reason}) when is_binary(reason), do: reason
  def channel_detail(_), do: nil

  defp host_label(nil), do: "host"

  defp host_label(host) do
    host |> String.replace(~r{^\w+://}, "") |> String.trim_trailing("/")
  end

  @doc false
  def postgres_label(%{status: :subscribed, schema: schema, table: table}), do: "#{schema}.#{table}"
  def postgres_label(%{status: :error}), do: "error"
  def postgres_label(_), do: "off"

  @doc false
  def presence_label(%{status: :synced, count: count}), do: "#{count} online"
  def presence_label(_), do: "off"

  @doc false
  def subscription_class(status) do
    case status_variant(status) do
      :success -> "font-medium text-brand-700 dark:text-brand-300"
      :error -> "font-medium text-red-700 dark:text-red-400"
      _ -> "font-medium text-gray-400 dark:text-neutral-500"
    end
  end
end
