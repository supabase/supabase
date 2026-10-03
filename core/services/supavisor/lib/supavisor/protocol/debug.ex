defmodule Supavisor.Protocol.Debug do
  @moduledoc """
  Debugging utilities for PostgreSQL protocol messages.

  This module provides utilities to format PostgreSQL protocol messages for debugging
  and logging purposes. It handles both frontend (client->server) and backend
  (server->client) messages, converting binary protocol data into human-readable strings.

  ## Usage

      iex> packet = <<?P, 16::32, 0, "select 1", 0, 0, 0>>
      iex> Supavisor.Protocol.Debug.packet_to_string(packet, :frontend)
      "Parse(statement=\"\")"

      iex> Supavisor.Protocol.Debug.inspect_packet(packet, :frontend, "Client")
      # Prints: Client: Parse(statement="")
      # Returns: original packet

  """

  @type message_source :: :frontend | :backend
  @type packet :: binary()
  @type structured_packet ::
          {:parse_pkt | :close_pkt, String.t(), packet()}
          | {:bind_pkt | :describe_pkt, String.t(), packet(), packet()}
  @type debug_input :: packet() | structured_packet() | %{bin: packet()}
  @type format_result :: String.t()
  @type extract_result :: {String.t(), binary()} | nil

  @doc """
  Converts a PostgreSQL protocol packet to a human-readable string.

  Handles both structured packets (tuples, structs) and raw binary packets.
  For binary packets, attempts to parse and format all contained messages.

  ## Examples

      iex> packet = <<?Q, 12::32, "SELECT 1">>
      iex> packet_to_string(packet, :frontend)
      "Query(\"SELECT 1\")"

  """
  @spec packet_to_string(debug_input(), message_source()) :: format_result()
  def packet_to_string(packet, source) do
    case packet do
      {:bind_pkt, stmt_name, _pkt, _parse_pkt} ->
        format_structured_packet(:bind, stmt_name)

      {:close_pkt, stmt_name, _pkt} ->
        format_structured_packet(:close, stmt_name)

      {:describe_pkt, stmt_name, _pkt, _parse_pkt} ->
        format_structured_packet(:describe, stmt_name)

      {:parse_pkt, stmt_name, _pkt} ->
        format_structured_packet(:parse, stmt_name)

      %{bin: bin} when is_binary(bin) ->
        packet_to_string(bin, source)

      bin when is_binary(bin) ->
        format_binary_packet(bin, source)

      other ->
        "UnknownPacket(#{inspect(other)})"
    end
  end

  defp format_structured_packet(:bind, stmt_name),
    do: "BindMessage(statement=#{inspect(stmt_name)})"

  defp format_structured_packet(:close, stmt_name),
    do: "CloseMessage(statement=#{inspect(stmt_name)})"

  defp format_structured_packet(:describe, stmt_name),
    do: "DescribeMessage(statement=#{inspect(stmt_name)})"

  defp format_structured_packet(:parse, stmt_name),
    do: "ParseMessage(statement=#{inspect(stmt_name)})"

  defp format_binary_packet(bin, source) do
    {packets, remaining} = Supavisor.Protocol.split_pkts(bin)
    packets_str = Enum.map_join(packets, ", ", &format_raw_binary(&1, source))

    case {packets_str, remaining} do
      {"", ""} -> format_raw_binary(bin, source)
      {"", _} -> "Incomplete(#{inspect(remaining)})"
      {str, ""} -> str
      {str, _} -> str <> ", Incomplete(#{inspect(remaining)})"
    end
  end

  defp format_raw_binary(<<tag, _length::32, rest::binary>>, source),
    do: format_message_by_tag(tag, source, rest)

  defp format_raw_binary(<<tag, rest::binary>>, source),
    do: format_message_by_tag(tag, source, rest)

  defp format_raw_binary(other, _source),
    do: "UnknownPacket(#{inspect(other)})"

  @doc """
  Prints a formatted packet to stdout and returns the original packet.

  Useful for debugging packet flows in pipelines while preserving the original data.

  ## Examples

      iex> packet = <<?S, 4::32>>
      iex> inspect_packet(packet, :frontend, "Client")
      # Prints: Client: Sync
      # Returns: <<?S, 4::32>>

  """
  @spec inspect_packet(debug_input(), message_source(), String.t() | nil) :: debug_input()
  def inspect_packet(packet, source, label \\ nil) do
    packet_str = packet_to_string(packet, source)
    output = if label, do: "#{label}: #{packet_str}", else: packet_str
    IO.puts(output)
    packet
  end

  defp format_message_by_tag(tag, :frontend, data), do: format_frontend_message(tag, data)
  defp format_message_by_tag(tag, :backend, data), do: format_backend_message(tag, data)

  defp format_frontend_message(tag, data) do
    case tag do
      ?B -> format_bind_message(data)
      ?C -> format_close_message(data)
      ?D -> format_describe_message(data)
      ?E -> format_execute_message(data)
      ?F -> format_function_call(data)
      ?H -> "Flush"
      ?P -> format_parse_message(data)
      ?Q -> format_query_message(data)
      ?S -> "Sync"
      ?X -> "Terminate"
      ?p -> "Password/SASL/GSS"
      _ -> format_unknown_message(tag, :frontend)
    end
  end

  defp format_backend_message(tag, data) do
    case tag do
      ?1 -> "ParseComplete"
      ?2 -> "BindComplete"
      ?3 -> "CloseComplete"
      ?A -> format_notification_response(data)
      ?C -> format_command_complete(data)
      ?D -> "DataRow"
      ?E -> format_error_response(data)
      ?G -> "CopyInResponse"
      ?H -> "CopyOutResponse"
      ?I -> "EmptyQueryResponse"
      ?K -> "BackendKeyData"
      ?N -> "NoticeResponse"
      ?R -> format_authentication_message(data)
      ?S -> format_parameter_status(data)
      ?T -> "RowDescription"
      ?V -> "FunctionCallResponse"
      ?Z -> format_ready_for_query_message(data)
      ?c -> "CopyDone"
      ?d -> "CopyData"
      ?n -> "NoData"
      ?s -> "PortalSuspended"
      ?t -> "ParameterDescription"
      ?v -> "NegotiateProtocolVersion"
      _ -> format_unknown_message(tag, :backend)
    end
  end

  defp format_unknown_message(tag, source) do
    "UnknownPacket(tag=#{inspect(<<tag>>)}, source=#{source})"
  end

  @spec safe_extract_string(binary(), (extract_result() -> format_result())) :: format_result()
  defp safe_extract_string(data, format_fun) when is_function(format_fun, 1) do
    case extract_null_terminated_string(data) do
      {string, rest} -> format_fun.({string, rest})
      nil -> format_malformed_message()
    end
  end

  @spec safe_extract_two_strings(binary(), (String.t(), String.t() -> format_result())) ::
          format_result()
  defp safe_extract_two_strings(data, format_fun) when is_function(format_fun, 2) do
    with {first_string, rest1} <- extract_null_terminated_string(data),
         {second_string, _rest2} <- extract_null_terminated_string(rest1) do
      format_fun.(first_string, second_string)
    else
      _ -> format_malformed_message()
    end
  end

  @spec format_malformed_message() :: format_result()
  defp format_malformed_message, do: "MalformedMessage"

  @spec format_object_type(byte()) :: String.t()
  defp format_object_type(?S), do: "statement"
  defp format_object_type(_), do: "portal"

  defp format_authentication_message(<<auth_type::32, _rest::binary>>) do
    case auth_type do
      0 -> "AuthenticationOk"
      2 -> "AuthenticationKerberosV5"
      3 -> "AuthenticationCleartextPassword"
      5 -> "AuthenticationMD5Password"
      6 -> "AuthenticationSCMCredential"
      7 -> "AuthenticationGSS"
      8 -> "AuthenticationGSSContinue"
      9 -> "AuthenticationSSPI"
      10 -> "AuthenticationSASL"
      11 -> "AuthenticationSASLContinue"
      12 -> "AuthenticationSASLFinal"
      _ -> "AuthenticationUnknown(#{auth_type})"
    end
  end

  defp format_authentication_message(_), do: format_malformed_message()

  defp format_ready_for_query_message(<<status>>) do
    case status do
      ?I -> "ReadyForQuery(idle)"
      ?T -> "ReadyForQuery(transaction_block)"
      ?E -> "ReadyForQuery(failed_transaction_block)"
      _ -> "ReadyForQuery(unknown(#{inspect(<<status>>)}))"
    end
  end

  defp format_ready_for_query_message(_), do: format_malformed_message()

  ## Frontend message formatters

  defp format_bind_message(data) do
    safe_extract_two_strings(data, fn portal_name, stmt_name ->
      "Bind(portal=#{inspect(portal_name)}, statement=#{inspect(stmt_name)})"
    end)
  end

  defp format_close_message(data) do
    case data do
      <<type, rest::binary>> ->
        safe_extract_string(rest, fn {name, _} ->
          type_str = format_object_type(type)
          "Close(#{type_str}=#{inspect(name)})"
        end)

      _ ->
        format_malformed_message()
    end
  end

  defp format_describe_message(data) do
    case data do
      <<type, rest::binary>> ->
        safe_extract_string(rest, fn {name, _} ->
          type_str = format_object_type(type)
          "Describe(#{type_str}=#{inspect(name)})"
        end)

      _ ->
        format_malformed_message()
    end
  end

  defp format_execute_message(data) do
    safe_extract_string(data, fn {portal_name, _} ->
      "Execute(portal=#{inspect(portal_name)})"
    end)
  end

  defp format_parse_message(data) do
    safe_extract_string(data, fn {stmt_name, _} ->
      "Parse(statement=#{inspect(stmt_name)})"
    end)
  end

  defp format_query_message(data) do
    safe_extract_string(data, fn {query, _} ->
      truncated_query = truncate_sql(query)
      "Query(#{truncated_query})"
    end)
  end

  defp format_function_call(data) do
    case data do
      <<_oid::32, rest::binary>> ->
        case extract_null_terminated_string(rest) do
          {function_name, _} -> "FunctionCall(#{function_name})"
          _ -> "FunctionCall"
        end

      _ ->
        "FunctionCall"
    end
  end

  defp format_command_complete(data) do
    safe_extract_string(data, fn {tag, _} ->
      "CommandComplete(#{inspect(tag)})"
    end)
  end

  defp format_error_response(data) do
    case extract_error_fields(data) do
      %{"M" => message} -> "ErrorResponse(#{inspect(message)})"
      _ -> format_malformed_message()
    end
  end

  defp format_parameter_status(data) do
    safe_extract_two_strings(data, fn name, value ->
      "ParameterStatus(#{name}=\"#{value}\")"
    end)
  end

  defp format_notification_response(<<_pid::32, rest::binary>>) do
    safe_extract_string(rest, fn {channel, rest2} ->
      case extract_null_terminated_string(rest2) do
        {payload, _} -> "NotificationResponse(#{channel}, #{inspect(payload)})"
        _ -> "NotificationResponse(#{channel})"
      end
    end)
  end

  defp format_notification_response(_) do
    format_malformed_message()
  end

  @spec extract_null_terminated_string(binary()) :: extract_result()
  defp extract_null_terminated_string(binary) do
    case :binary.split(binary, <<0>>) do
      [string, rest] -> {string, rest}
      [_] -> nil
    end
  end

  @spec truncate_sql(String.t()) :: String.t()
  defp truncate_sql(sql) when byte_size(sql) <= 50, do: inspect(sql)

  defp truncate_sql(sql) do
    <<truncated::binary-size(47), _::binary>> = sql
    inspect(truncated <> "...")
  end

  @spec extract_error_fields(binary()) :: map()
  defp extract_error_fields(data) do
    extract_error_fields(data, %{})
  end

  @spec extract_error_fields(binary(), map()) :: map()
  defp extract_error_fields(<<0>>, acc), do: acc

  defp extract_error_fields(<<field_type, rest::binary>>, acc) do
    case extract_null_terminated_string(rest) do
      {value, rest2} ->
        extract_error_fields(rest2, Map.put(acc, <<field_type>>, value))

      _ ->
        acc
    end
  end

  defp extract_error_fields(_, acc), do: acc
end
