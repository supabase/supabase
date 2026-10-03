# copied from https://github.com/akoutmos/prom_ex/blob/master/lib/prom_ex/plugins/phoenix.ex

if Code.ensure_loaded?(Phoenix) do
  defmodule Realtime.PromEx.Plugins.Phoenix do
    @moduledoc false
    use PromEx.Plugin

    alias Phoenix.Socket
    alias RealtimeWeb.Endpoint.HTTP, as: HTTP

    @stop_event [:prom_ex, :plugin, :phoenix, :stop]
    @event_all_connections [:prom_ex, :plugin, :phoenix, :all_connections]

    @impl true
    def event_metrics(opts) do
      otp_app = Keyword.fetch!(opts, :otp_app)
      metric_prefix = Keyword.get(opts, :metric_prefix, PromEx.metric_prefix(otp_app, :phoenix))
      phoenix_event_prefixes = fetch_event_prefixes!(opts)

      set_up_telemetry_proxy(phoenix_event_prefixes)

      # Event metrics definitions
      [
        channel_events(metric_prefix),
        socket_events(metric_prefix)
      ]
    end

    @impl true
    def polling_metrics(opts) do
      otp_app = Keyword.fetch!(opts, :otp_app)
      metric_prefix = Keyword.get(opts, :metric_prefix, PromEx.metric_prefix(otp_app, :phoenix))
      poll_rate = Keyword.get(opts, :poll_rate)

      [
        metrics(metric_prefix, poll_rate)
      ]
    end

    def metrics(metric_prefix, poll_rate) do
      Polling.build(
        :phoenix_all_connections,
        poll_rate,
        {__MODULE__, :execute_metrics, []},
        [
          last_value(
            metric_prefix ++ [:connections, :total],
            event_name: @event_all_connections,
            description: "The total open connections to ranch.",
            measurement: :total
          ),
          last_value(
            metric_prefix ++ [:connections, :active],
            event_name: @event_all_connections,
            description: "Connections actively processing a request or WebSocket frame.",
            measurement: :active
          ),
          last_value(
            metric_prefix ++ [:connections, :max],
            event_name: @event_all_connections,
            description: "The configured maximum connections limit for the ranch listener.",
            measurement: :max
          )
        ],
        detach_on_error: false
      )
    end

    def execute_metrics do
      info = if :ranch.info()[HTTP], do: :ranch.info(HTTP), else: %{}

      :telemetry.execute(
        @event_all_connections,
        %{
          total: Map.get(info, :all_connections, -1),
          active: Map.get(info, :active_connections, -1),
          max: Map.get(info, :max_connections, -1)
        },
        %{}
      )
    end

    defmodule Buckets do
      @moduledoc false
      use Peep.Buckets.Custom, buckets: [10, 100, 500, 1_000, 5_000, 10_000]
    end

    defp channel_events(metric_prefix) do
      Event.build(
        :phoenix_channel_event_metrics,
        [
          # Capture the number of channel joins that have occurred
          counter(
            metric_prefix ++ [:channel, :joined, :total],
            event_name: [:phoenix, :channel_joined],
            description: "The number of channel joins that have occurred.",
            tag_values: fn %{
                             result: result,
                             socket: %Socket{transport: transport, endpoint: endpoint}
                           } ->
              %{
                transport: transport,
                result: result,
                endpoint: normalize_module_name(endpoint)
              }
            end,
            tags: [:result, :transport, :endpoint]
          ),

          # Capture channel handle_in duration
          distribution(
            metric_prefix ++ [:channel, :handled_in, :duration, :milliseconds],
            event_name: [:phoenix, :channel_handled_in],
            measurement: :duration,
            description: "The time it takes for the application to respond to channel messages.",
            reporter_options: [peep_bucket_calculator: Buckets],
            tag_values: fn %{socket: %Socket{endpoint: endpoint}} ->
              %{
                endpoint: normalize_module_name(endpoint)
              }
            end,
            tags: [:endpoint],
            unit: {:native, :millisecond}
          )
        ]
      )
    end

    defp socket_events(metric_prefix) do
      Event.build(
        :phoenix_socket_event_metrics,
        [
          # Capture socket connection duration
          distribution(
            metric_prefix ++ [:socket, :connected, :duration, :milliseconds],
            event_name: [:phoenix, :socket_connected],
            measurement: :duration,
            description: "The time it takes for the application to establish a socket connection.",
            reporter_options: [peep_bucket_calculator: Buckets],
            tag_values: fn %{result: result, endpoint: endpoint, transport: transport, serializer: serializer} ->
              %{
                transport: transport,
                result: result,
                endpoint: normalize_module_name(endpoint),
                serializer: serializer
              }
            end,
            tags: [:result, :transport, :endpoint, :serializer],
            unit: {:native, :millisecond}
          )
        ]
      )
    end

    defp set_up_telemetry_proxy(phoenix_event_prefixes) do
      phoenix_event_prefixes
      |> Enum.each(fn telemetry_prefix ->
        stop_event = telemetry_prefix ++ [:stop]

        :telemetry.attach(
          [:prom_ex, :phoenix, :proxy] ++ telemetry_prefix,
          stop_event,
          &__MODULE__.handle_proxy_phoenix_event/4,
          %{}
        )
      end)
    end

    @doc false
    def handle_proxy_phoenix_event(_event_name, event_measurement, event_metadata, _config) do
      :telemetry.execute(@stop_event, event_measurement, event_metadata)
    end

    defp normalize_module_name(name) when is_atom(name) do
      name
      |> Atom.to_string()
      |> String.trim_leading("Elixir.")
    end

    defp normalize_module_name(name), do: name

    defp fetch_event_prefixes!(opts) do
      opts
      |> fetch_either!(:router, :endpoints)
      |> case do
        endpoints when is_list(endpoints) ->
          endpoints
          |> Enum.map(fn
            {_endpoint, endpoint_opts} ->
              Keyword.get(endpoint_opts, :event_prefix, [:phoenix, :endpoint])
          end)

        _router ->
          [Keyword.get(opts, :event_prefix, [:phoenix, :endpoint])]
      end
      |> MapSet.new()
      |> MapSet.to_list()
    end

    defp fetch_either!(keywordlist, key1, key2) do
      case {Keyword.has_key?(keywordlist, key1), Keyword.has_key?(keywordlist, key2)} do
        {true, _} ->
          keywordlist[key1]

        {false, true} ->
          keywordlist[key2]

        {false, false} ->
          raise KeyError,
                "Neither #{inspect(key1)} nor #{inspect(key2)} found in #{inspect(keywordlist)}"
      end
    end
  end
else
  defmodule PromEx.Plugins.Phoenix do
    @moduledoc false
    use PromEx.Plugin

    @impl true
    def event_metrics(_opts) do
      PromEx.Plugin.no_dep_raise(__MODULE__, "Phoenix")
    end
  end
end
