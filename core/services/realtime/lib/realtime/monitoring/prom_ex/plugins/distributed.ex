defmodule Realtime.PromEx.Plugins.Distributed do
  @moduledoc """
  Distributed erlang metrics
  """

  use PromEx.Plugin
  alias Realtime.DistributedMetrics

  @event_node_queue_size [:prom_ex, :plugin, :dist, :queue_size]
  @event_recv_bytes [:prom_ex, :plugin, :dist, :recv, :bytes]
  @event_recv_count [:prom_ex, :plugin, :dist, :recv, :count]
  @event_send_bytes [:prom_ex, :plugin, :dist, :send, :bytes]
  @event_send_count [:prom_ex, :plugin, :dist, :send, :count]
  @event_send_pending_bytes [:prom_ex, :plugin, :dist, :send, :pending, :bytes]

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      metrics(poll_rate)
    ]
  end

  defp metrics(poll_rate) do
    Polling.build(
      :realtime_vm_dist,
      poll_rate,
      {__MODULE__, :execute_metrics, []},
      [
        last_value(
          [:dist, :queue_size],
          event_name: @event_node_queue_size,
          description: "Number of bytes in the output distribution queue",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:dist, :recv_bytes],
          event_name: @event_recv_bytes,
          description: "Number of bytes received by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:dist, :recv_count],
          event_name: @event_recv_count,
          description: "Number of packets received by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:dist, :send_bytes],
          event_name: @event_send_bytes,
          description: "Number of bytes sent by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:dist, :send_count],
          event_name: @event_send_count,
          description: "Number of packets sent by the socket.",
          measurement: :size,
          tags: [:origin_node, :target_node]
        ),
        last_value(
          [:dist, :send_pending_bytes],
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
    dist_info = DistributedMetrics.info()

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
    with {:ok, size} <- info[:queue_size] do
      :telemetry.execute(@event_node_queue_size, %{size: size}, %{origin_node: node(), target_node: node})
    end
  end
end
