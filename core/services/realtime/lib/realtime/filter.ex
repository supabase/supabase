defmodule Realtime.Filter do
  @moduledoc """
  The `column=operator.value` conditions accepted by postgres_changes subscriptions.

  See https://supabase.com/docs/guides/realtime/postgres-changes. A filter is a comma separated
  list of conditions and every one of them must match: the wire format has no `OR`.
  """

  @operators ~w(eq neq gt gte lt lte in like ilike match imatch is isdistinct)

  @doc "Operators a filter may use, in the order they are offered to the user."
  def operators, do: @operators

  @doc """
  Human label for an operator, for a picker that should not assume the reader knows PostgREST.
  """
  def operator_label("eq"), do: "="
  def operator_label("neq"), do: "≠"
  def operator_label("gt"), do: ">"
  def operator_label("gte"), do: "≥"
  def operator_label("lt"), do: "<"
  def operator_label("lte"), do: "≤"
  def operator_label("in"), do: "in"
  def operator_label("like"), do: "like"
  def operator_label("ilike"), do: "ilike"
  def operator_label("match"), do: "matches"
  def operator_label("imatch"), do: "imatches"
  def operator_label("is"), do: "is"
  def operator_label("isdistinct"), do: "is distinct from"
  def operator_label(other), do: other

  @doc "Placeholder showing the value shape an operator expects."
  def value_placeholder("in"), do: "(red,blue)"
  def value_placeholder("is"), do: "null"
  def value_placeholder(op) when op in ~w(like ilike), do: "%foo%"
  def value_placeholder(op) when op in ~w(match imatch), do: "^post-"
  def value_placeholder(_), do: "value"

  @doc "The only values `is` accepts; Postgres raises on anything else."
  def allowed_is_values, do: ~w(null true false unknown)

  @doc """
  Splits a filter into every condition it carries.

  An empty filter is an empty list, not an error. Returns `:error` if any one condition cannot be
  read, so callers can fall back to the raw string rather than drop conditions.
  """
  def parse_all(nil), do: {:ok, []}
  def parse_all(""), do: {:ok, []}

  def parse_all(filter) when is_binary(filter) do
    filter
    |> split_conditions()
    |> Enum.reduce_while([], fn segment, acc ->
      case parse_condition(segment) do
        {:ok, condition} -> {:cont, [condition | acc]}
        :error -> {:halt, :error}
      end
    end)
    |> case do
      :error -> :error
      conditions -> {:ok, Enum.reverse(conditions)}
    end
  end

  def parse_all(_), do: :error

  @doc """
  Joins conditions back into the wire filter.

  Conditions without a column are dropped: the server rejects the empty segment they would produce.
  """
  def compose_all(conditions) when is_list(conditions) do
    conditions
    |> Enum.map(&compose_condition/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.join(",")
  end

  defp compose_condition(condition) do
    column = condition |> fetch(:column) |> String.trim()

    if column == "" do
      nil
    else
      operator = condition |> fetch(:operator) |> String.trim()
      operator = if operator == "", do: "eq", else: operator
      value = condition |> fetch(:value) |> String.trim()
      prefix = if truthy?(fetch(condition, :negated)), do: "not.", else: ""

      "#{column}=#{prefix}#{operator}.#{value}"
    end
  end

  defp fetch(condition, key) do
    case Map.get(condition, key) || Map.get(condition, Atom.to_string(key)) do
      nil -> ""
      value when is_binary(value) -> value
      value -> to_string(value)
    end
  end

  # `fetch/2` stringifies everything, so a boolean `negated` arrives here as "true".
  defp truthy?(value), do: value in ["true", "on"]

  defp parse_condition(segment) do
    with [column, rest] <- String.split(segment, "=", parts: 2),
         column = String.trim(column),
         true <- column != "",
         {negated, rest} <- pop_negation(rest),
         [operator, value] <- String.split(rest, ".", parts: 2),
         true <- operator in @operators do
      {:ok, %{column: column, operator: operator, value: value, negated: negated}}
    else
      _ -> :error
    end
  end

  # A comma inside `in.(red,blue)` or inside quotes belongs to the value, not to the next condition.
  defp split_conditions(filter) do
    {done, current, _depth, _quoted} =
      filter
      |> String.graphemes()
      |> Enum.reduce({[], [], 0, false}, &scan/2)

    [current | done]
    |> Enum.reverse()
    |> Enum.map(&(&1 |> Enum.reverse() |> Enum.join() |> String.trim()))
  end

  defp scan("\"", {done, current, depth, quoted?}), do: {done, ["\"" | current], depth, not quoted?}
  defp scan(char, {done, current, depth, true}), do: {done, [char | current], depth, true}
  defp scan("(", {done, current, depth, false}), do: {done, ["(" | current], depth + 1, false}
  defp scan(")", {done, current, depth, false}), do: {done, [")" | current], max(depth - 1, 0), false}
  defp scan(",", {done, current, 0, false}), do: {[current | done], [], 0, false}
  defp scan(char, {done, current, depth, false}), do: {done, [char | current], depth, false}

  defp pop_negation("not." <> rest), do: {true, rest}
  defp pop_negation(rest), do: {false, rest}
end
