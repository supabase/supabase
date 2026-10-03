defmodule Supavisor.Protocol.StartupOptions do
  @moduledoc """
  Handles the PostgreSQL `options` startup parameter.

  The `options` field in a StartupMessage is a single string of command-line
  arguments (`-c name=value` / `--name=value` GUC settings). This module handles
  parsing, validation, and serialization of that string.
  """

  # All characters matched by C's isspace(): space, tab, newline,
  # carriage return, vertical tab, form feed.
  @whitespace [?\s, ?\t, ?\n, ?\r, ?\v, ?\f]
  @escape_targets ["\\", " ", "\t", "\n", "\r", "\v", "\f"]

  @doc """
  Parses a PostgreSQL startup `options` string into a map of GUC settings.

  ## Examples

      iex> Supavisor.Protocol.StartupOptions.parse("-c search_path=public -c work_mem=64MB")
      %{"search_path" => "public", "work_mem" => "64MB"}

      iex> Supavisor.Protocol.StartupOptions.parse("--search_path=public")
      %{"search_path" => "public"}

  """
  @spec parse(String.t()) :: map()
  def parse(str) do
    str
    |> tokenize()
    |> parse_tokens(%{})
  end

  # Tokenize by whitespace, handling backslash escapes
  # per pg_split_opts (src/backend/utils/init/postinit.c:497).
  #
  # - Backslash followed by any char => literal char (backslash consumed)
  # - Trailing backslash => consumed silently
  defp tokenize(str), do: tokenize(str, [], [])

  defp tokenize(<<>>, [], acc), do: Enum.reverse(acc)

  defp tokenize(<<>>, current, acc),
    do: Enum.reverse([current |> Enum.reverse() |> IO.iodata_to_binary() | acc])

  defp tokenize(<<c, rest::binary>>, [], acc) when c in @whitespace,
    do: tokenize(rest, [], acc)

  defp tokenize(<<c, rest::binary>>, current, acc) when c in @whitespace do
    token = current |> Enum.reverse() |> IO.iodata_to_binary()
    tokenize(rest, [], [token | acc])
  end

  # Trailing backslash: consumed, nothing appended (per pg_split_opts)
  defp tokenize(<<?\\>>, current, acc), do: tokenize(<<>>, current, acc)

  defp tokenize(<<?\\, c, rest::binary>>, current, acc),
    do: tokenize(rest, [<<c>> | current], acc)

  defp tokenize(<<c, rest::binary>>, current, acc),
    do: tokenize(rest, [<<c>> | current], acc)

  # Parse tokens into key-value pairs.
  # Supports: -c name=value, --name=value
  defp parse_tokens([], acc), do: acc

  defp parse_tokens(["-c", pair | rest], acc) do
    case String.split(pair, "=", parts: 2) do
      [name, value] -> parse_tokens(rest, Map.put(acc, name, value))
      _ -> parse_tokens(rest, acc)
    end
  end

  defp parse_tokens(["--" <> pair | rest], acc) do
    case String.split(pair, "=", parts: 2) do
      [name, value] -> parse_tokens(rest, Map.put(acc, name, value))
      _ -> parse_tokens(rest, acc)
    end
  end

  # Skip unrecognized tokens
  defp parse_tokens([_ | rest], acc), do: parse_tokens(rest, acc)

  # Supavisor specific startup options schema.
  @schema %{
    "jit" => :boolean,
    "client_tls" => :boolean,
    "search_path" => :string,
    "log_level" => {:enum, [:debug, :info, :notice, :warning, :error]}
  }

  @doc """
  Validates and type-converts a parsed options map against the known schema.

  ## Examples

      iex> Supavisor.Protocol.StartupOptions.validate(%{"jit" => "1", "work_mem" => "64MB"})
      {%{"jit" => true, "work_mem" => "64MB"}, []}

      iex> Supavisor.Protocol.StartupOptions.validate(%{"jit" => "maybe"})
      {%{}, [{"jit", "maybe"}]}

  """
  @spec validate(map()) :: {map(), [{String.t(), String.t()}]}
  def validate(opts) do
    Enum.reduce(opts, {%{}, []}, fn {name, value}, {options, invalid} ->
      case @schema do
        %{^name => type} ->
          case cast(type, value) do
            {:ok, cast} -> {Map.put(options, name, cast), invalid}
            :error -> {options, [{name, value} | invalid]}
          end

        _ ->
          {Map.put(options, name, value), invalid}
      end
    end)
  end

  # PostgreSQL parameter type casting.
  # Ref: https://www.postgresql.org/docs/current/config-setting.html#CONFIG-SETTING-NAMES-VALUES
  defp cast(:boolean, value) do
    down = String.downcase(value)

    cond do
      down != "" and String.starts_with?("true", down) -> {:ok, true}
      down != "" and String.starts_with?("false", down) -> {:ok, false}
      down != "" and String.starts_with?("yes", down) -> {:ok, true}
      down != "" and String.starts_with?("no", down) -> {:ok, false}
      # "o" alone is ambiguous (on/off), so PG requires 2+ chars: "of" -> off.
      byte_size(down) >= 2 and String.starts_with?("on", down) -> {:ok, true}
      byte_size(down) >= 2 and String.starts_with?("off", down) -> {:ok, false}
      down == "1" -> {:ok, true}
      down == "0" -> {:ok, false}
      true -> :error
    end
  end

  defp cast({:enum, allowed}, value) do
    down = String.downcase(value)

    case Enum.find(allowed, fn atom -> Atom.to_string(atom) == down end) do
      nil -> :error
      atom -> {:ok, atom}
    end
  end

  defp cast(:string, value), do: {:ok, value}

  @doc """
  Builds a `NoticeResponse` field map for an invalid option.

  ## Examples

      iex> Supavisor.Protocol.StartupOptions.invalid_option_notice({"jit", "maybe"})
      %{"S" => "NOTICE", "V" => "NOTICE", "C" => "22023",
        "M" => ~s(parameter "jit" requires a Boolean value)}

  """
  @spec invalid_option_notice({String.t(), String.t()}) :: map()
  def invalid_option_notice({name, value}) do
    base = %{"S" => "NOTICE", "V" => "NOTICE", "C" => "22023"}

    case @schema do
      %{^name => :boolean} ->
        Map.put(base, "M", ~s(parameter "#{name}" requires a Boolean value))

      %{^name => {:enum, allowed}} ->
        hint = "Available values: " <> Enum.map_join(allowed, ", ", &Atom.to_string/1) <> "."

        base
        |> Map.put("M", ~s(invalid value for parameter "#{name}": "#{value}"))
        |> Map.put("H", hint)

      _ ->
        Map.put(base, "M", ~s(invalid value for parameter "#{name}": "#{value}"))
    end
  end

  @doc """
  Encodes a map of GUC settings into a PostgreSQL startup `options` string.

  All `isspace()` characters and backslashes in values are backslash-escaped per `pg_split_opts`.

  ## Examples

      iex> Supavisor.Protocol.StartupOptions.encode(%{"search_path" => "public"})
      "--search_path=public"

      iex> Supavisor.Protocol.StartupOptions.encode(%{"search_path" => "schemaA, schemaB"})
      "--search_path=schemaA,\\\\ schemaB"

  """
  @spec encode(map()) :: String.t()
  def encode(opts) when opts == %{}, do: ""

  def encode(opts) do
    Enum.map_join(opts, " ", fn {name, value} -> "--#{name}=#{escape_value(value)}" end)
  end

  defp escape_value(value) do
    :binary.replace(value, @escape_targets, <<"\\">>, [:global, {:insert_replaced, 1}])
  end
end
