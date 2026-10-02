defmodule MetricsHelper do
  @spec search(String.t(), String.t(), map() | keyword() | nil) ::
          {:ok, String.t(), map(), String.t()} | {:error, String.t()}
  def search(prometheus_metrics, metric_name, expected_tags \\ nil) do
    # Escape the metric_name to handle any special regex characters
    escaped_name = Regex.escape(metric_name)
    regex = ~r/^(?<name>#{escaped_name})\{(?<tags>[^}]+)\}\s+(?<value>\d+(?:\.\d+)?)$/

    prometheus_metrics
    |> IO.iodata_to_binary()
    |> String.split("\n", trim: true)
    |> Enum.find_value(
      nil,
      fn item ->
        case parse(item, regex, expected_tags) do
          {:ok, value} -> value
          {:error, _reason} -> false
        end
      end
    )
    |> case do
      nil -> nil
      number -> String.to_integer(number)
    end
  end

  defp parse(metric_string, regex, expected_tags) do
    case Regex.named_captures(regex, metric_string) do
      %{"name" => _name, "tags" => tags_string, "value" => value} ->
        tags = parse_tags(tags_string)

        if expected_tags && !matching_tags(tags, expected_tags) do
          {:error, "Tags do not match expected tags"}
        else
          {:ok, value}
        end

      nil ->
        {:error, "Invalid metric format or metric name mismatch"}
    end
  end

  defp parse_tags(tags_string) do
    ~r/(?<key>[a-zA-Z_][a-zA-Z0-9_]*)="(?<value>[^"]*)"/
    |> Regex.scan(tags_string, capture: :all_names)
    |> Enum.map(fn [key, value] -> {key, value} end)
    |> Map.new()
  end

  defp matching_tags(tags, expected_tags) do
    Enum.all?(expected_tags, fn {k, v} -> Map.get(tags, to_string(k)) == to_string(v) end)
  end
end
