defmodule Realtime.PromEx.Plugins.GenRpc do
  @moduledoc """
  GenRpc metrics
  """

  use PromEx.Plugin

  alias Realtime.GenRpcMetrics

  @event_queue_size_bytes [:prom_ex, :plugin, :gen_rpc, :queue_size, :bytes]
  @event_recv_bytes [:prom_ex, :plugin, :gen_rpc, :recv, :bytes]
  @event_recv_count [:prom_ex, :plugin, :gen_rpc, :recv, :count]
  @event_send_bytes [:prom_ex, :plugin, :gen_rpc, :send, :bytes]
  @event_send_count [:prom_ex, :plugin, :gen_rpc, :send, :count]
  @event_send_pending_bytes [:prom_ex, :plugin, :gen_rpc, :send, :pending, :bytes]

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      metrics(poll_rate)
    ]
  end

  defp metrics(poll_rate) do
    Polling.build(
      :realtime_gen_rpc,
      poll_rate,
      {__MODULE__, :execute_metrics, []},
      [
        last_value(
          [:gen_rpc, :queue_size_bytes],
          event_name: @event_queue_size_bytes,
          description: "The total number of bytes queued by the port using the ERTS driver queue implementation",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:gen_rpc, :recv_bytes],
          event_name: @event_recv_bytes,
          description: "Number of bytes received by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:gen_rpc, :recv_count],
          event_name: @event_recv_count,
          description: "Number of packets received by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:gen_rpc, :send_bytes],
          event_name: @event_send_bytes,
          description: "Number of bytes sent by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:gen_rpc, :send_count],
          event_name: @event_send_count,
          description: "Number of packets sent by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:gen_rpc, :send_pending_bytes],
          event_name: @event_send_pending_bytes,
          description: "Number of bytes waiting to be sent by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        )
      ],
      detach_on_error: false
    )
  end

  def execute_metrics do
    dist_info = GenRpcMetrics.info()

    Enum.each(dist_info, fn {node, info} ->
      execute_queue_size(node, info)
      execute_inet_stats(node, info)
    end)
  end

  defp execute_inet_stats(node, info) do
    if stats = info[:inet_stats] do
      :telemetry.execute(@event_recv_bytes, %{size: stats[:recv_oct]}, %{origin_node: node(), target_node: node})
      :telemetry.execute(@event_recv_count, %{size: stats[:recv_cnt]}, %{origin_node: node(), target_node: node})

      :telemetry.execute(@event_send_bytes, %{size: stats[:send_oct]}, %{origin_node: node(), target_node: node})
      :telemetry.execute(@event_send_count, %{size: stats[:send_cnt]}, %{origin_node: node(), target_node: node})

      :telemetry.execute(@event_send_pending_bytes, %{size: stats[:send_pend]}, %{
        origin_node: node(),
        target_node: node
      })
    end
  end

  defp execute_queue_size(node, info) do
    :telemetry.execute(@event_queue_size_bytes, %{size: info[:queue_size]}, %{origin_node: node(), target_node: node})
  end
end
