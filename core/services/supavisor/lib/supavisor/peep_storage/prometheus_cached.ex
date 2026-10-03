defmodule Supavisor.PeepStorage.PrometheusCached do
  @moduledoc """
  Prometheus exporter with label formatting cache. Instead of formatting tag
  maps into label strings on every scrape, formatted labels are cached in an
  ETS table keyed by tag ID.

  Designed for use with `Supavisor.PeepStorage`. Usage:

      Supavisor.PeepStorage.get_all_metrics_with_tag_ids(storage, persistent)
      |> Supavisor.PeepStorage.PrometheusCached.export()
  """

  alias Telemetry.Metrics.{Counter, Distribution, LastValue, Sum}

  def export(data) do
    [export_metrics(data), "# EOF\n"]
  end

  def export_metrics({reverse_tags_tid, cache_tid, metrics}) do
    export_metrics({reverse_tags_tid, cache_tid, %{}, metrics})
  end

  def export_metrics({reverse_tags_tid, cache_tid, global_tags, metrics}) do
    Enum.map(metrics, &format(&1, reverse_tags_tid, cache_tid, global_tags))
  end

  defp format({%Counter{}, _series} = metric, reverse_tags_tid, cache_tid, global_tags) do
    format_standard(metric, "counter", reverse_tags_tid, cache_tid, global_tags)
  end

  defp format({%Sum{} = spec, _series} = metric, reverse_tags_tid, cache_tid, global_tags) do
    format_standard(
      metric,
      spec.reporter_options[:prometheus_type] || "counter",
      reverse_tags_tid,
      cache_tid,
      global_tags
    )
  end

  defp format({%LastValue{} = spec, _series} = metric, reverse_tags_tid, cache_tid, global_tags) do
    format_standard(
      metric,
      spec.reporter_options[:prometheus_type] || "gauge",
      reverse_tags_tid,
      cache_tid,
      global_tags
    )
  end

  defp format({%Distribution{} = metric, tagged_series}, reverse_tags_tid, cache_tid, global_tags) do
    name = format_name(metric.name)
    help = ["# HELP ", name, " ", escape_help(metric.description)]
    type = ["# TYPE ", name, " histogram"]

    distributions =
      for {tags_id, {counts, sum, above_max, boundaries}} <- tagged_series,
          labels = resolve_labels(reverse_tags_tid, cache_tid, tags_id, global_tags),
          labels != :deleted do
        format_distribution(name, labels, counts, sum, above_max, boundaries)
      end

    [help, ?\n, type, ?\n, distributions]
  end

  defp format_distribution(name, labels, counts, sum, above_max, boundaries) do
    {labels_done, bucket_partial} =
      case labels do
        nil ->
          {?\s, [name, "_bucket{le=\""]}

        labels ->
          {[?{, labels, "} "], [name, "_bucket{", labels, ",le=\""]}
      end

    {samples, count} = format_buckets(boundaries, counts, bucket_partial, [], 0)

    [
      samples,
      [bucket_partial, "+Inf\"} ", Integer.to_string(count + above_max), ?\n],
      [name, "_sum", labels_done, Integer.to_string(sum), ?\n],
      [name, "_count", labels_done, Integer.to_string(count + above_max), ?\n]
    ]
  end

  defp format_buckets([], [], _bucket_partial, acc, running_count) do
    {Enum.reverse(acc), running_count}
  end

  defp format_buckets([boundary | rb], [count | rc], bucket_partial, acc, running_count) do
    new_count = running_count + count
    line = [bucket_partial, boundary, "\"} ", Integer.to_string(new_count), ?\n]
    format_buckets(rb, rc, bucket_partial, [line | acc], new_count)
  end

  defp format_standard({metric, series}, type, reverse_tags_tid, cache_tid, global_tags) do
    name = format_name(metric.name)
    help = ["# HELP ", name, " ", escape_help(metric.description)]
    type = ["# TYPE ", name, " ", to_string(type)]

    samples =
      for {tags_id, value} <- series,
          labels = resolve_labels(reverse_tags_tid, cache_tid, tags_id, global_tags),
          labels != :deleted do
        case labels do
          nil ->
            [name, " ", format_value(value), ?\n]

          labels ->
            [name, ?{, labels, ?}, " ", format_value(value), ?\n]
        end
      end

    [help, ?\n, type, ?\n, samples]
  end

  defp resolve_labels(reverse_tags_tid, cache_tid, tags_id, global_tags) do
    case :ets.lookup(cache_tid, tags_id) do
      [{_, cached}] ->
        cached

      [] ->
        case :ets.lookup(reverse_tags_tid, tags_id) do
          [{_, tags}] ->
            formatted = do_format_labels(Map.merge(global_tags, tags))
            :ets.insert(cache_tid, {tags_id, formatted})
            formatted

          [] ->
            # Entry was deleted by the metrics cleaner between the cache
            # miss and this lookup. Return :deleted so callers can skip it.
            :deleted
        end
    end
  end

  defp do_format_labels(tags) when map_size(tags) == 0, do: nil

  defp do_format_labels(tags) do
    tags
    |> Enum.sort()
    |> Enum.map_intersperse(?,, fn {k, v} -> [to_string(k), "=\"", escape(v), ?"] end)
    |> IO.iodata_to_binary()
  end

  defp format_name(name) do
    name
    |> Enum.join("_")
    |> format_name_start()
  end

  defp format_name_start(<<h, rest::binary>>) when h not in ?A..?Z and h not in ?a..?z,
    do: format_name_start(rest)

  defp format_name_start(<<rest::binary>>),
    do: format_name_rest(rest, <<>>)

  defp format_name_rest(<<h, rest::binary>>, acc)
       when h in ?A..?Z or h in ?a..?z or h in ?0..?9 or h == ?_,
       do: format_name_rest(rest, <<acc::binary, h>>)

  defp format_name_rest(<<_, rest::binary>>, acc), do: format_name_rest(rest, acc)
  defp format_name_rest(<<>>, acc), do: acc

  defp format_value(true), do: "1"
  defp format_value(false), do: "0"
  defp format_value(nil), do: "0"
  defp format_value(n) when is_integer(n), do: Integer.to_string(n)
  defp format_value(f) when is_float(f), do: Float.to_string(f)

  defp escape(nil), do: "nil"

  defp escape(value) do
    value
    |> safe_to_string()
    |> escape(<<>>)
  end

  defp safe_to_string(value) do
    case String.Chars.impl_for(value) do
      nil -> inspect(value)
      _ -> to_string(value)
    end
  end

  defp escape(<<?\", rest::binary>>, acc), do: escape(rest, <<acc::binary, ?\\, ?\">>)
  defp escape(<<?\\, rest::binary>>, acc), do: escape(rest, <<acc::binary, ?\\, ?\\>>)
  defp escape(<<?\n, rest::binary>>, acc), do: escape(rest, <<acc::binary, ?\\, ?n>>)
  defp escape(<<h, rest::binary>>, acc), do: escape(rest, <<acc::binary, h>>)
  defp escape(<<>>, acc), do: acc

  defp escape_help(value) do
    value
    |> to_string()
    |> escape_help(<<>>)
  end

  defp escape_help(<<?\\, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, ?\\, ?\\>>)
  defp escape_help(<<?\n, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, ?\\, ?n>>)
  defp escape_help(<<h, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, h>>)
  defp escape_help(<<>>, acc), do: acc
end
