defmodule RealtimeWeb.Socket do
  @moduledoc """
  A drop-in replacement for `use Phoenix.Socket` that adds Realtime-specific
  transport behaviour:

    * Sets `:max_heap_size` on the transport process during `init/1`
    * Schedules periodic traffic measurement via `handle_info/2`
    * Wraps `handle_in/2` with error handling for malformed WebSocket messages
  """

  defmacro __using__(opts) do
    quote do
      import Phoenix.Socket
      @behaviour Phoenix.Socket
      @before_compile Phoenix.Socket
      Module.register_attribute(__MODULE__, :phoenix_channels, accumulate: true)
      @phoenix_socket_options unquote(opts)

      @behaviour Phoenix.Socket.Transport

      @doc false
      def child_spec(opts) do
        Phoenix.Socket.__child_spec__(__MODULE__, opts, @phoenix_socket_options)
      end

      @doc false
      def drainer_spec(opts) do
        Phoenix.Socket.__drainer_spec__(__MODULE__, opts, @phoenix_socket_options)
      end

      @doc false
      def connect(map), do: Phoenix.Socket.__connect__(__MODULE__, map, @phoenix_socket_options)

      @doc false
      def init(state) when is_tuple(state) do
        Process.flag(:max_heap_size, :persistent_term.get({__MODULE__, :websocket_max_heap_size}))

        Process.send_after(
          self(),
          {:measure_traffic, 0, 0},
          :persistent_term.get({__MODULE__, :measure_traffic_interval_in_ms})
        )

        Phoenix.Socket.__init__(state)
      end

      @doc false
      def handle_in({payload, opts}, {_state, socket} = full_state) do
        Phoenix.Socket.__in__({payload, opts}, full_state)
      rescue
        e in Phoenix.Socket.InvalidMessageError ->
          RealtimeWeb.RealtimeChannel.Logging.log_error(socket, "MalformedWebSocketMessage", e.message)
          {:ok, full_state}

        e in Jason.DecodeError ->
          RealtimeWeb.RealtimeChannel.Logging.log_error(
            socket,
            "MalformedWebSocketMessage",
            Jason.DecodeError.message(e)
          )

          {:ok, full_state}

        e ->
          RealtimeWeb.RealtimeChannel.Logging.log_error(socket, "UnknownErrorOnWebSocketMessage", Exception.message(e))
          {:ok, full_state}
      end

      @doc false
      def handle_info(
            {:measure_traffic, previous_recv, previous_send},
            {_, %{assigns: assigns, transport_pid: transport_pid}} = state
          ) do
        tenant_external_id = Map.get(assigns, :tenant)

        %{latest_recv: latest_recv, latest_send: latest_send} =
          RealtimeWeb.Socket.collect_traffic_telemetry(
            transport_pid,
            tenant_external_id,
            previous_recv,
            previous_send
          )

        Process.send_after(
          self(),
          {:measure_traffic, latest_recv, latest_send},
          :persistent_term.get({__MODULE__, :measure_traffic_interval_in_ms})
        )

        {:ok, state}
      end

      def handle_info(message, state), do: Phoenix.Socket.__info__(message, state)

      @doc false
      def terminate(reason, state), do: Phoenix.Socket.__terminate__(reason, state)
    end
  end

  @doc false
  def collect_traffic_telemetry(nil, _tenant_external_id, previous_recv, previous_send),
    do: %{latest_recv: previous_recv, latest_send: previous_send}

  def collect_traffic_telemetry(transport_pid, tenant_external_id, previous_recv, previous_send) do
    %{send_oct: latest_send, recv_oct: latest_recv} =
      transport_pid
      |> Process.info(:links)
      |> then(fn {:links, links} -> links end)
      |> Enum.filter(&is_port/1)
      |> Enum.reduce(%{send_oct: 0, recv_oct: 0}, fn link, acc ->
        case :inet.getstat(link, [:send_oct, :recv_oct]) do
          {:ok, stats} ->
            send_oct = Keyword.get(stats, :send_oct, 0)
            recv_oct = Keyword.get(stats, :recv_oct, 0)
            %{send_oct: acc.send_oct + send_oct, recv_oct: acc.recv_oct + recv_oct}

          {:error, _} ->
            acc
        end
      end)

    send_delta = max(0, latest_send - previous_send)
    recv_delta = max(0, latest_recv - previous_recv)

    :telemetry.execute([:realtime, :channel, :output_bytes], %{size: send_delta}, %{tenant: tenant_external_id})
    :telemetry.execute([:realtime, :channel, :input_bytes], %{size: recv_delta}, %{tenant: tenant_external_id})

    %{latest_recv: latest_recv, latest_send: latest_send}
  end
end
