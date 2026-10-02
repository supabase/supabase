# Based on https://github.com/rkallos/peep/blob/708546ed069aebdf78ac1f581130332bd2e8b5b1/lib/peep/prometheus.ex
defmodule Realtime.Monitoring.Prometheus do
  @moduledoc """
  Prometheus exporter module

  Use a temporary ets table to cache formatted names and label values
  """

  alias Telemetry.Metrics.{Counter, Distribution, LastValue, Sum}

  def export(metrics) do
    cache = :ets.new(:cache, [:set, :private, read_concurrency: false, write_concurrency: :auto])

    result = [Enum.map(metrics, &format(&1, cache)), "# EOF\n"]
    :ets.delete(cache)
    result
  end

  defp format({%Counter{}, _series} = metric, cache) do
    format_standard(metric, "counter", cache)
  end

  defp format({%Sum{} = spec, _series} = metric, cache) do
    format_standard(metric, spec.reporter_options[:prometheus_type] || "counter", cache)
  end

  defp format({%LastValue{} = spec, _series} = metric, cache) do
    format_standard(metric, spec.reporter_options[:prometheus_type] || "gauge", cache)
  end

  defp format({%Distribution{} = metric, tagged_series}, cache) do
    name = format_name(metric.name, cache)
    help = ["# HELP ", name, " ", escape_help(metric.description)]
    type = ["# TYPE ", name, " histogram"]

    distributions =
      Enum.map(tagged_series, fn {tags, buckets} ->
        format_distribution(name, tags, buckets, cache)
      end)

    [help, ?\n, type, ?\n, distributions]
  end

  defp format_distribution(name, tags, buckets, cache) do
    has_labels? = not Enum.empty?(tags)

    buckets_as_floats =
      Map.drop(buckets, [:sum, :infinity])
      |> Enum.map(fn {bucket_string, count} -> {String.to_float(bucket_string), count} end)
      |> Enum.sort()

    {prefix_sums, count} = prefix_sums(buckets_as_floats)

    {labels_done, bucket_partial} =
      if has_labels? do
        labels = format_labels(tags, cache)
        {[?{, labels, "} "], [name, "_bucket{", labels, ",le=\""]}
      else
        {?\s, [name, "_bucket{le=\""]}
      end

    samples =
      prefix_sums
      |> Enum.map(fn {upper_bound, count} ->
        [bucket_partial, format_value(upper_bound), "\"} ", Integer.to_string(count), ?\n]
      end)

    sum = Map.get(buckets, :sum, 0)
    inf = Map.get(buckets, :infinity, 0)

    [
      samples,
      [bucket_partial, "+Inf\"} ", Integer.to_string(count + inf), ?\n],
      [name, "_sum", labels_done, Integer.to_string(sum), ?\n],
      [name, "_count", labels_done, Integer.to_string(count + inf), ?\n]
    ]
  end

  defp format_standard({metric, series}, type, cache) do
    name = format_name(metric.name, cache)
    help = ["# HELP ", name, " ", escape_help(metric.description)]
    type = ["# TYPE ", name, " ", to_string(type)]

    samples =
      Enum.map(series, fn {labels, value} ->
        has_labels? = not Enum.empty?(labels)

        if has_labels? do
          [name, ?{, format_labels(labels, cache), ?}, " ", format_value(value), ?\n]
        else
          [name, " ", format_value(value), ?\n]
        end
      end)

    [help, ?\n, type, ?\n, samples]
  end

  defp format_labels(labels, cache) do
    labels
    |> Enum.sort()
    |> Enum.map_intersperse(?,, fn {k, v} -> [to_string(k), "=\"", escape(v, cache), ?"] end)
  end

  defp format_name(name, cache) do
    case :ets.lookup_element(cache, name, 2, nil) do
      nil ->
        result =
          name
          |> Enum.join("_")
          |> format_name_start()
          |> IO.iodata_to_binary()

        :ets.insert(cache, {name, result})
        result

      result ->
        result
    end
  end

  # Name must start with an ascii letter
  defp format_name_start(<<h, rest::binary>>) when h not in ?A..?Z and h not in ?a..?z,
    do: format_name_start(rest)

  defp format_name_start(<<rest::binary>>),
    do: format_name_rest(rest, <<>>)

  # Otherwise only letters, numbers, or _
  defp format_name_rest(<<h, rest::binary>>, acc)
       when h in ?A..?Z or h in ?a..?z or h in ?0..?9 or h == ?_,
       do: format_name_rest(rest, [acc, h])

  defp format_name_rest(<<_, rest::binary>>, acc), do: format_name_rest(rest, acc)
  defp format_name_rest(<<>>, acc), do: acc

  defp format_value(true), do: "1"
  defp format_value(false), do: "0"
  defp format_value(nil), do: "0"
  defp format_value(n) when is_integer(n), do: Integer.to_string(n)
  defp format_value(f) when is_float(f), do: Float.to_string(f)

  defp escape(nil, _cache), do: "nil"

  defp escape(value, cache) do
    case :ets.lookup_element(cache, value, 2, nil) do
      nil ->
        result =
          value
          |> safe_to_string()
          |> do_escape(<<>>)
          |> IO.iodata_to_binary()

        :ets.insert(cache, {value, result})
        result

      result ->
        result
    end
  end

  defp safe_to_string(value) do
    case String.Chars.impl_for(value) do
      nil -> inspect(value)
      _ -> to_string(value)
    end
  end

  defp do_escape(<<?\", rest::binary>>, acc), do: do_escape(rest, [acc, ?\\, ?\"])
  defp do_escape(<<?\\, rest::binary>>, acc), do: do_escape(rest, [acc, ?\\, ?\\])
  defp do_escape(<<?\n, rest::binary>>, acc), do: do_escape(rest, [acc, ?\\, ?n])
  defp do_escape(<<h, rest::binary>>, acc), do: do_escape(rest, [acc, h])
  defp do_escape(<<>>, acc), do: acc

  defp escape_help(value) do
    value
    |> to_string()
    |> escape_help(<<>>)
  end

  defp escape_help(<<?\\, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, ?\\, ?\\>>)
  defp escape_help(<<?\n, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, ?\\, ?n>>)
  defp escape_help(<<h, rest::binary>>, acc), do: escape_help(rest, <<acc::binary, h>>)
  defp escape_help(<<>>, acc), do: acc

  defp prefix_sums(buckets), do: prefix_sums(buckets, [], 0)
  defp prefix_sums([], acc, sum), do: {Enum.reverse(acc), sum}

  defp prefix_sums([{bucket, count} | rest], acc, sum) do
    new_sum = sum + count
    new_bucket = {bucket, new_sum}
    prefix_sums(rest, [new_bucket | acc], new_sum)
  end
end
