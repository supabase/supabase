defmodule RealtimeWeb.InspectorLive.EventLogComponent do
  use RealtimeWeb, :live_component

  @limit 500
  @client_log_categories [:transport, :channel, :worker, :error]
  @channel_categories [:system, :broadcast, :presence, :postgres]
  @categories @client_log_categories ++ @channel_categories
  @default_categories @channel_categories

  @impl true
  def mount(socket) do
    socket =
      socket
      |> assign(
        paused: false,
        buffer: [],
        buffered_count: 0,
        event_seq: 0,
        event_count: 0,
        active_categories: MapSet.new(@default_categories)
      )
      |> stream(:events, [])

    {:ok, socket}
  end

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def handle_event("log_event", params, socket) do
    seq = socket.assigns.event_seq + 1

    entry = %{
      id: "evt-#{seq}",
      category: category(params["category"]),
      event: params["event"] || "",
      payload: params["payload"] || %{},
      received_at: parse_time(params["received_at"]),
      latency_ms: params["latency_ms"]
    }

    socket = assign(socket, event_seq: seq, event_count: socket.assigns.event_count + 1)

    socket =
      if socket.assigns.paused do
        buffer = [entry | socket.assigns.buffer] |> Enum.take(@limit)
        assign(socket, buffer: buffer, buffered_count: socket.assigns.buffered_count + 1)
      else
        # Newest-first: prepend at the top and prune the oldest from the end.
        stream_insert(socket, :events, entry, at: 0, limit: @limit)
      end

    {:noreply, socket}
  end

  def handle_event("pause", _params, socket), do: {:noreply, assign(socket, :paused, true)}

  def handle_event("resume", _params, socket) do
    # Buffer is newest-first; insert oldest → newest each at the top so the newest ends up first.
    socket =
      socket.assigns.buffer
      |> Enum.reverse()
      |> Enum.reduce(socket, fn entry, acc -> stream_insert(acc, :events, entry, at: 0, limit: @limit) end)
      |> assign(paused: false, buffer: [], buffered_count: 0)

    {:noreply, socket}
  end

  def handle_event("clear", _params, socket) do
    {:noreply, socket |> stream(:events, [], reset: true) |> assign(event_count: 0)}
  end

  def handle_event("toggle_category", %{"category" => category}, socket) do
    category = category(category)
    active = socket.assigns.active_categories

    active =
      if MapSet.member?(active, category),
        do: MapSet.delete(active, category),
        else: MapSet.put(active, category)

    {:noreply, assign(socket, :active_categories, active)}
  end

  def handle_event("toggle_group", %{"group" => group}, socket) do
    categories = group_categories(group)
    active = socket.assigns.active_categories
    all_active? = Enum.all?(categories, &MapSet.member?(active, &1))

    active =
      if all_active?,
        do: Enum.reduce(categories, active, &MapSet.delete(&2, &1)),
        else: Enum.reduce(categories, active, &MapSet.put(&2, &1))

    {:noreply, assign(socket, :active_categories, active)}
  end

  attr :label, :string, required: true
  attr :group, :string, required: true
  attr :categories, :list, required: true
  attr :active_categories, :any, required: true
  attr :myself, :any, required: true
  attr :caption, :string, default: nil
  attr :hint, :string, default: nil

  def category_group(assigns) do
    ~H"""
    <div class="flex flex-wrap items-center gap-2">
      <span class="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">
        <%= @label %>
        <span
          :if={@hint}
          title={@hint}
          aria-label={@hint}
          tabindex="0"
          class="cursor-help rounded-full border border-gray-300 dark:border-neutral-600 text-gray-400 dark:text-neutral-500 w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold normal-case"
        >
          ?
        </span>
      </span>
      <button
        type="button"
        phx-click="toggle_group"
        phx-value-group={@group}
        phx-target={@myself}
        class="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700"
      >
        <%= if group_active?(@group, @active_categories), do: "Disable all", else: "Enable all" %>
      </button>
      <button
        :for={category <- @categories}
        type="button"
        phx-click="toggle_category"
        phx-value-category={category}
        phx-target={@myself}
        class={[
          "px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
          if(MapSet.member?(@active_categories, category),
            do:
              "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700",
            else:
              "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700"
          )
        ]}
      >
        <%= category %>
      </button>
      <span :if={@caption} class="text-xs text-gray-400 dark:text-neutral-500 italic"><%= @caption %></span>
    </div>
    """
  end

  @doc false
  def categories, do: @categories

  @doc false
  def client_log_categories, do: @client_log_categories

  @doc false
  def channel_categories, do: @channel_categories

  @doc false
  def group_active?(group, active_categories) do
    group |> group_categories() |> Enum.all?(&MapSet.member?(active_categories, &1))
  end

  defp group_categories("client_log"), do: @client_log_categories
  defp group_categories("channel"), do: @channel_categories

  @doc false
  def category_variant(:error), do: :error
  def category_variant(:transport), do: :neutral
  def category_variant(:worker), do: :neutral
  def category_variant(:channel), do: :info
  def category_variant(:system), do: :neutral
  def category_variant(:broadcast), do: :success
  def category_variant(:presence), do: :info
  def category_variant(:postgres), do: :warning

  @doc """
  Turns a raw wire-protocol string into something readable.

  supabase-js logs Phoenix frames verbatim, e.g. `realtime:room_a phx_join (6, 6)`, where the
  trailing numbers are the join reference and message reference. Those mean nothing to someone
  checking whether their broadcast arrived, so they are dropped and the protocol verb is named.
  The original string is kept as the cell's title.
  """
  def event_label("connected to " <> _), do: "Transport connected"
  def event_label("connecting to " <> _), do: "Transport connecting"

  def event_label(event) when is_binary(event) do
    {status, topic, verb} = parse_event(event)

    case {status, verb} do
      {_, "phx_join"} -> "Joining #{channel_name(topic)}"
      {"ok", "phx_reply"} -> "Joined #{channel_name(topic)}"
      {"error", "phx_reply"} -> "Join rejected"
      {_, "phx_reply"} -> "Reply"
      {_, "phx_leave"} -> "Leaving #{channel_name(topic)}"
      {_, "phx_close"} -> "Channel closed"
      {_, "phx_error"} -> "Channel error"
      {_, "close"} -> "Channel closed"
      {_, "leave"} -> "Leaving #{channel_name(topic)}"
      {_, "error"} -> "Channel error"
      {_, "broadcast"} -> "Broadcast"
      {_, "postgres_changes"} -> "Database change"
      {_, "presence_state"} -> "Presence sync"
      {_, "presence_diff"} -> "Presence change"
      {_, "system"} -> "Subscription confirmed"
      {_, nil} -> event
      {_, other} -> other
    end
  end

  def event_label(event), do: to_string(event)

  defp parse_event(event) do
    tokens =
      event
      |> String.replace(~r{\s*\([^)]*\)\s*$}, "")
      |> String.split(" ", trim: true)

    topic = Enum.find(tokens, &String.contains?(&1, ":"))

    # Whatever is left once the topic is removed is either just the verb, or a status followed by
    # the verb. A single leading "error" is the verb itself, not a status.
    case Enum.reject(tokens, &String.contains?(&1, ":")) do
      [status, verb] -> {status, topic, verb}
      [verb] -> {nil, topic, verb}
      _ -> {nil, topic, nil}
    end
  end

  defp channel_name(nil), do: "channel"

  defp channel_name(topic) do
    case String.split(topic, ":", parts: 2) do
      [_prefix, name] when name != "" -> name
      _ -> topic
    end
  end

  @doc false
  def time_label(%DateTime{} = dt) do
    dt
    |> DateTime.to_time()
    |> Time.truncate(:millisecond)
    |> Time.to_string()
  end

  @summary_limit 160

  @doc false
  def payload_summary(payload) when payload in [nil, %{}], do: "—"

  def payload_summary(payload) do
    json = Jason.encode!(payload)

    if String.length(json) > @summary_limit do
      String.slice(json, 0, @summary_limit) <> "…"
    else
      json
    end
  end

  defp category(value) when value in ~w(transport channel worker error system broadcast presence postgres) do
    String.to_existing_atom(value)
  end

  defp category(_), do: :system

  defp parse_time(nil), do: DateTime.utc_now()

  defp parse_time(iso) do
    case DateTime.from_iso8601(iso) do
      {:ok, dt, _} -> dt
      _ -> DateTime.utc_now()
    end
  end
end
