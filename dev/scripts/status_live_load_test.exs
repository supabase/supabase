# Local load test for RealtimeWeb.StatusLive.Index (REAL-929).
#
# Feeds synthetic "admin:cluster" broadcasts at a realistic, production-scale rate
# (rate = N^2/15 msgs/sec, matching Realtime.Latency's real N-node fan-out) and watches
# the target LiveView process's mailbox/memory via Process.info/2, so "does the mailbox
# stay bounded" can be answered locally with real numbers instead of waiting on the
# production crash log or a real multi-node cluster.
#
# Usage:
#
#   mise run db-start
#   mix phx.server --no-halt scripts/status_live_load_test.exs
#
# then open http://localhost:4000/status in a browser tab (as soon as you see the
# startup banner — the load window is still bounded by LOAD_DURATION_MS).
#
#
# Env vars (all optional):
#   LOAD_NODE_COUNT     simulated cluster size, rate = N*N/15 msgs/sec (default 100)
#   LOAD_DURATION_MS    how long to sustain the load, in ms (default 60_000)
#   LOAD_POLL_MS        how often to poll/print mailbox + memory, in ms (default 1_000)
#
defmodule RealtimeLoadTest.StatusLive do
  @moduledoc false

  alias Realtime.Latency.Payload
  alias RealtimeWeb.Endpoint

  @tick_ms 100
  @regions ~w(us-east-1 us-west-1 eu-west-2 ap-southeast-1 sa-east-1 eu-central-2 ap-northeast-1 ca-central-1)
  @ping_frequency_seconds 15

  def run(node_count, duration_ms, poll_ms) do
    fake_node_existence(node_count)

    rate = node_count * node_count / @ping_frequency_seconds
    ticks_per_second = to_timeout(second: 1) / @tick_ms
    broadcasts_per_tick = max(round(rate / ticks_per_second), 1)
    ticks_until_report = max(div(poll_ms, @tick_ms), 1)
    total_ticks = div(duration_ms, @tick_ms)

    print_banner(node_count, rate, duration_ms, poll_ms)

    state = %{
      sent: 0,
      tick: 0,
      start_ms: monotonic_ms(),
      views: %{}
    }

    state = loadtest(node_count, broadcasts_per_tick, ticks_until_report, total_ticks, state)

    print_summary(state, node_count, rate, duration_ms)
  end

  # Make the status page see our synthetic node ids too, so we have meaningful rendering
  # Works via a purpose built escape hatch.
  defp fake_node_existence(node_count) do
    extra_node_ids = Enum.map(0..(node_count - 1), &"loadnode-#{&1}")
    Application.put_env(:realtime, RealtimeWeb.StatusLive.Index, extra_node_ids: extra_node_ids)
  end

  defp loadtest(node_count, messages_per_tick, ticks_until_report, total_ticks, state) do
    send_batch(node_count, state.sent, messages_per_tick)
    state = %{state | sent: state.sent + messages_per_tick, tick: state.tick + 1}

    state =
      if rem(state.tick, ticks_until_report) == 0 do
        poll_and_report(state)
      else
        state
      end

    if state.tick >= total_ticks do
      state
    else
      # this isn't quite exact (work + sleep for tick_ms) but good enough for what we do
      Process.sleep(@tick_ms)
      loadtest(node_count, messages_per_tick, ticks_until_report, total_ticks, state)
    end
  end

  # We're sending only a sub-set of messages per second, so we keep track of how many
  # we've sent so we simulate the full NxN space.
  defp send_batch(node_count, base_index, count) do
    Enum.each(base_index..(base_index + count - 1), fn index ->
      Endpoint.broadcast("admin:cluster", "pong", payload(node_count, index))
    end)
  end

  defp payload(node_count, index) do
    from_index = rem(index, node_count)
    to_index = rem(div(index, node_count), node_count)

    %Payload{
      from_node: "loadnode-#{from_index}",
      from_region: region(from_index),
      node: "loadnode-#{to_index}",
      region: region(to_index),
      latency: 5 + :rand.uniform(20),
      response: {:ok, {:pong, region(to_index)}},
      timestamp: DateTime.utc_now()
    }
  end

  defp region(idx), do: Enum.at(@regions, rem(idx, length(@regions)))

  # Phoenix.LiveView.Channel tags its own process dictionary with the view module for
  # exactly this kind of introspection, so a real, connected `/status` tab can be found.
  defp find_status_live_pids do
    for pid <- Process.list(),
        {:dictionary, dict} <- [Process.info(pid, :dictionary)],
        {:"$initial_call", {RealtimeWeb.StatusLive.Index, :mount, 3}} <- dict,
        do: pid
  end

  defp poll_and_report(state) do
    elapsed_ms = monotonic_ms() - state.start_ms

    case find_status_live_pids() do
      [] ->
        IO.puts("[load] t=#{format_time(elapsed_ms)}  sent=#{state.sent}  no /status tab found yet")
        state

      pids ->
        Enum.reduce(pids, state, &record_sample(&2, &1, elapsed_ms))
    end
  end

  defp record_sample(state, pid, elapsed_ms) do
    case Process.info(pid, [:message_queue_len, :memory]) do
      nil ->
        IO.puts("[load] t=#{format_time(elapsed_ms)}  #{inspect(pid)} is DEAD")
        state

      info ->
        qlen = info[:message_queue_len]
        mem = info[:memory]

        IO.puts(
          "[load] t=#{format_time(elapsed_ms)}  #{inspect(pid)}  sent=#{state.sent}  " <>
            "actual=#{format_rate(state.sent, elapsed_ms)}/s mem=#{format_bytes(mem)} queue_len=#{pad(qlen)}"
        )

        view = Map.get(state.views, pid, %{samples: []})
        view = %{view | samples: [{elapsed_ms, qlen, mem} | view.samples]}
        state = %{state | views: Map.put(state.views, pid, view)}

        state
    end
  end

  defp print_banner(node_count, rate, duration_ms, poll_ms) do
    port = Endpoint.config(:http)[:port]

    IO.puts(
      "[load] N=#{node_count}  target_rate=#{Float.round(rate, 1)} msgs/s  " <>
        "duration=#{duration_ms / 1000}s  poll_every=#{poll_ms}ms"
    )

    IO.puts("[load] open http://localhost:#{port}/status now to attach a tab to monitor")
  end

  defp print_summary(state, node_count, rate, duration_ms) do
    elapsed_ms = monotonic_ms() - state.start_ms

    IO.puts("[load] ================= SUMMARY =================")

    IO.puts(
      "[load] N=#{node_count}  target_rate=#{Float.round(rate, 1)} msgs/s  duration=#{duration_ms / 1000}s (ran #{format_time(elapsed_ms)})"
    )

    IO.puts("[load] messages sent: #{state.sent}  (actual throughput: #{format_rate(state.sent, elapsed_ms)} msgs/s)")

    if map_size(state.views) == 0 do
      IO.puts("[load] no /status tab was ever found — nothing to report")
    else
      Enum.each(state.views, fn {pid, view} -> print_view_summary(pid, view) end)
    end

    IO.puts("[load] =============================================")
  end

  defp print_view_summary(pid, view) do
    samples = Enum.reverse(view.samples)
    {_, first_qlen, first_mem} = List.first(samples)
    {_, last_qlen, last_mem} = List.last(samples)
    peak_qlen = samples |> Enum.map(&elem(&1, 1)) |> Enum.max()
    peak_mem = samples |> Enum.map(&elem(&1, 2)) |> Enum.max()

    IO.puts("[load] #{inspect(pid)}:")
    IO.puts("[load]   queue_len: start=#{first_qlen}  peak=#{peak_qlen}  final=#{last_qlen}")

    IO.puts(
      "[load]   memory:    start=#{format_bytes(first_mem)}  peak=#{format_bytes(peak_mem)}  final=#{format_bytes(last_mem)}"
    )
  end

  defp format_time(ms), do: "#{Float.round(ms / 1000, 1)}s"
  defp format_rate(_sent, 0), do: "0.0"
  defp format_rate(sent, elapsed_ms), do: Float.round(sent * 1000 / elapsed_ms, 1)
  defp format_bytes(bytes), do: String.pad_leading("#{Float.round(bytes / 1_000_000, 1)} MB", 8)
  defp pad(n, padding \\ 6), do: n |> Integer.to_string() |> String.pad_leading(padding)

  defp monotonic_ms(), do: System.monotonic_time(:millisecond)
end

node_count = Realtime.Env.get_integer("LOAD_NODE_COUNT", 100)
duration_ms = Realtime.Env.get_integer("LOAD_DURATION_MS", 60_000)
poll_ms = Realtime.Env.get_integer("LOAD_POLL_MS", 1_000)

RealtimeLoadTest.StatusLive.run(node_count, duration_ms, poll_ms)
