defmodule Supavisor.Protocol.Server do
  @moduledoc """
  The Supavisor.Protocol.Server module is responsible for decoding data received from the PostgreSQL server. It provides several functions to decode payloads from different types of messages.

  Message Formats: https://www.postgresql.org/docs/current/protocol-message-formats.html
  Error codes https://www.postgresql.org/docs/current/errcodes-appendix.html
  """
  require Logger
  alias Supavisor.Protocol.Debug

  @pkt_header_size 5
  @authentication_ok <<?R, 8::32, 0::32>>
  @ready_for_query <<?Z, 5::32, ?I>>
  @ssl_request <<8::32, 1234::16, 5679::16>>
  @scram_request <<?R, 23::32, 10::32, "SCRAM-SHA-256", 0, 0>>
  @msg_cancel_header <<16::32, 1234::16, 5678::16>>
  @application_name <<?S, 31::32, "application_name", 0, "Supavisor", 0>>
  @terminate_message <<?X, 4::32>>
  @parse_complete_message <<?1, 4::32>>
  @bind_complete_message <<?2, 4::32>>
  @close_complete_message <<?3, 4::32>>
  @flush <<?H, 4::integer-32>>
  @sync <<?S, 4::integer-32>>

  defmodule Pkt do
    @moduledoc """
    Represents a packet structure with tag, length, and payload fields.

    The original binary can be found on the bin field.
    """

    defstruct([:tag, :len, :payload, :bin])

    @type t :: %Pkt{
            tag: atom,
            len: integer,
            payload: any,
            bin: binary
          }

    defimpl Inspect do
      def inspect(pkt, _opts) do
        case pkt.bin do
          bin when is_binary(bin) ->
            Debug.packet_to_string(bin, :backend)

          _ ->
            "#Supavisor.Protocol.Server.Pkt<malformed>"
        end
      end
    end
  end

  defmacro cancel_message(pid, key) do
    quote do
      <<unquote(@msg_cancel_header)::binary, unquote(pid)::32, unquote(key)::32>>
    end
  end

  defmacro ssl_request_message, do: @ssl_request
  defmacro parse_complete_message, do: @parse_complete_message
  defmacro bind_complete_message, do: @bind_complete_message
  defmacro close_complete_message, do: @close_complete_message

  defmacro parameter_description_message_shape do
    quote do
      <<?t, _rest::binary>>
    end
  end

  @spec decode(iodata()) :: {:ok, [Pkt.t()], rest :: binary()}
  def decode(data), do: decode(data, [])

  @spec decode_pkt(binary()) ::
          {:ok, Pkt.t(), binary()} | {:error, :bad_packet} | {:error, :incomplete}
  def decode_pkt(bin) do
    case read_message(bin) do
      {:ok, char, bin_payload, rest} ->
        tag = tag(char)
        payload = decode_payload(tag, bin_payload)

        pkt = %Pkt{
          tag: tag,
          len: byte_size(bin_payload) + 5,
          payload: payload,
          bin: <<char, byte_size(bin_payload) + 4::32, bin_payload::binary>>
        }

        {:ok, pkt, rest}

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Decodes a message sent by the client in response to an authentication request.

  The 'p' message type is shared by PasswordMessage, SASLInitialResponse and
  SASLResponse. Its contents can only be interpreted knowing which one was
  requested, so the caller passes the expected type.
  """
  @spec decode_password_message(binary(), :password | :sasl_initial_response | :sasl_response) ::
          {:ok, {:cleartext_password, binary()}, binary()}
          | {:ok, {:scram_sha_256, map()}, binary()}
          | {:ok, {:first_msg_response, map()}, binary()}
          | {:ok, :undefined, binary()}
          | {:error, :bad_packet | :incomplete | :unexpected_message}
  def decode_password_message(bin, expected) do
    case read_message(bin) do
      {:ok, ?p, payload, rest} -> {:ok, decode_password_payload(expected, payload), rest}
      {:ok, _char, _payload, _rest} -> {:error, :unexpected_message}
      {:error, _} = error -> error
    end
  end

  @spec read_message(binary()) ::
          {:ok, char(), binary(), binary()} | {:error, :bad_packet} | {:error, :incomplete}
  defp read_message(<<char::integer-8, pkt_len::integer-32, rest::binary>>) do
    payload_len = pkt_len - 4

    case rest do
      <<payload::binary-size(payload_len), rest2::binary>> -> {:ok, char, payload, rest2}
      _ -> {:error, :incomplete}
    end
  end

  defp read_message(_), do: {:error, :bad_packet}

  @spec decode_string(binary()) :: {:ok, binary(), binary()} | {:error, :not_null_terminated}
  def decode_string(bin) do
    case :binary.match(bin, <<0>>) do
      :nomatch ->
        {:error, :not_null_terminated}

      {pos, 1} ->
        {string, <<0, rest::binary>>} = :erlang.split_binary(bin, pos)
        {:ok, string, rest}
    end
  end

  @spec md5_request(<<_::32>>) :: iodata()
  def md5_request(salt), do: [<<?R, 12::32, 5::32>>, salt]

  @spec password_request() :: iodata()
  def password_request, do: [<<?R, 8::32, 3::32>>]

  @spec exchange_first_message(binary, binary | boolean, pos_integer) :: binary
  def exchange_first_message(nonce, salt \\ false, iterations \\ 4096) do
    server_nonce =
      16
      |> :pgo_scram.get_nonce()
      |> Base.encode64()

    secret = if salt, do: Base.encode64(salt), else: server_nonce
    "r=#{nonce <> server_nonce},s=#{secret},i=#{iterations}"
  end

  @spec exchange_message(:first | :final, binary()) :: iodata()
  def exchange_message(type, message) do
    code =
      case type do
        :first -> 11
        :final -> 12
      end

    [<<?R, byte_size(message) + 8::32, code::32>>, message]
  end

  @spec error_message(binary(), binary()) :: iodata()
  def error_message(code, value) do
    message = ["SFATAL", 0, "VFATAL", 0, "C", code, 0, "M", value, 0, 0]
    [<<?E, IO.iodata_length(message) + 4::32>>, message]
  end

  @spec encode_error_message(map()) :: iodata()
  def encode_error_message(error_map) when is_map(error_map) do
    sorted_fields = Enum.sort(error_map)
    message = [Enum.map(sorted_fields, fn {char, content} -> [char, content, <<0>>] end), <<0>>]
    [<<?E, IO.iodata_length(message) + 4::32>>, message]
  end

  @spec encode_notice_message(map()) :: iodata()
  def encode_notice_message(notice_map) when is_map(notice_map) do
    sorted_fields = Enum.sort(notice_map)
    message = [Enum.map(sorted_fields, fn {char, content} -> [char, content, <<0>>] end), <<0>>]
    [<<?N, IO.iodata_length(message) + 4::32>>, message]
  end

  @spec encode_parameter_status(map) :: iodata()
  def encode_parameter_status(ps) do
    for {key, value} <- ps do
      encode_pkt(:parameter_status, key, value)
    end
  end

  @spec encode_pkt(:parameter_status, binary, binary) :: iodata()
  def encode_pkt(:parameter_status, key, value) do
    payload = [key, <<0>>, value, <<0>>]
    len = IO.iodata_length(payload) + 4
    [<<?S, len::integer-32>>, payload]
  end

  @spec backend_key_data() :: {iodata(), binary}
  def backend_key_data do
    pid = System.unique_integer([:positive, :monotonic])
    key = :crypto.strong_rand_bytes(4)
    payload = <<pid::integer-32, key::binary>>
    len = IO.iodata_length(payload) + 4
    {<<?K, len::32>>, payload}
  end

  @spec application_name :: binary()
  def application_name, do: @application_name

  @spec terminate_message :: binary()
  def terminate_message, do: @terminate_message

  @spec admin_shutdown :: map()
  def admin_shutdown do
    %{
      "S" => "FATAL",
      "V" => "FATAL",
      "C" => "57P01",
      "M" => "terminating connection due to administrator command"
    }
  end

  @spec cannot_connect_now :: map()
  def cannot_connect_now do
    %{
      "S" => "FATAL",
      "V" => "FATAL",
      "C" => "57P03",
      "M" => "pool is not accepting connections"
    }
  end

  @spec scram_request :: iodata()
  def scram_request, do: @scram_request

  @spec flush :: binary()
  def flush, do: @flush

  @spec sync :: binary()
  def sync, do: @sync

  @spec authentication_ok :: binary()
  def authentication_ok, do: @authentication_ok

  @spec ready_for_query :: binary()
  def ready_for_query, do: @ready_for_query

  @spec ssl_request :: binary()
  def ssl_request, do: @ssl_request

  @spec extended_query(iodata(), [binary()]) :: binary()
  def extended_query(statement, params \\ []) do
    IO.iodata_to_binary([
      :pgo_protocol.encode_parse_message("", statement, []),
      encode_bind(params),
      :pgo_protocol.encode_execute_message("", 0),
      :pgo_protocol.encode_sync_message()
    ])
  end

  # Internal functions

  defp encode_bind(params) do
    encoded_params =
      Enum.map(params, fn value ->
        [<<IO.iodata_length(value)::32>>, value]
      end)

    body = [
      # unnamed portal and prepared statement
      <<0>>,
      <<0>>,
      # text params only
      <<0::16>>,
      <<length(params)::16>>,
      encoded_params,
      # results are text too
      <<0::16>>
    ]

    [<<?B, IO.iodata_length(body) + 4::32>>, body]
  end

  @spec decode(binary(), list()) :: {:ok, [Pkt.t()], rest :: binary()}
  defp decode(data, acc) when byte_size(data) >= @pkt_header_size do
    case decode_pkt(data) do
      {:ok, pkt, rest} ->
        decode(rest, [pkt | acc])

      {:error, :incomplete} ->
        {:ok, Enum.reverse(acc), data}

      {:error, :bad_packet} ->
        raise "bad packet: #{inspect(data)}"
    end
  end

  defp decode(data, acc), do: {:ok, Enum.reverse(acc), data}

  @spec tag(char()) :: atom()
  defp tag(char) do
    case char do
      ?R -> :authentication
      ?K -> :backend_key_data
      ?2 -> :bind_complete
      ?3 -> :close_complete
      ?C -> :command_complete
      ?d -> :copy_data
      ?c -> :copy_done
      ?G -> :copy_in_response
      ?H -> :copy_out_response
      ?W -> :copy_both_response
      ?D -> :data_row
      ?I -> :empty_query_response
      ?E -> :error_response
      ?V -> :function_call_response
      ?n -> :no_data
      ?N -> :notice_response
      ?A -> :notification_response
      ?t -> :parameter_description
      ?S -> :parameter_status
      ?1 -> :parse_complete
      ?s -> :portal_suspended
      ?Z -> :ready_for_query
      ?T -> :row_description
      ?p -> :password_message
      _ -> :undefined
    end
  end

  @spec decode_error_response(binary()) :: %{String.t() => String.t()}
  def decode_error_response(payload) do
    fields = String.split(payload, <<0>>, trim: true)

    Enum.reduce(fields, %{}, fn field, acc ->
      case field do
        <<char::binary-1, content::binary>> -> Map.put(acc, char, content)
        _ -> acc
      end
    end)
  end

  @spec decode_payload(:authentication, binary()) ::
          atom() | {atom(), binary()} | {:undefined, any()}
  defp decode_payload(:authentication, payload) do
    case payload do
      <<0::integer-32>> ->
        :authentication_ok

      <<2::integer-32>> ->
        :authentication_kerberos_v5

      <<3::integer-32>> ->
        :authentication_cleartext_password

      <<5::integer-32, salt::binary-4>> ->
        {:authentication_md5_password, salt}

      <<6::integer-32>> ->
        :authentication_scm_credential

      <<7::integer-32>> ->
        :authentication_gss

      <<8::integer-32, rest::binary>> ->
        {:authentication_gss_continue, rest}

      <<9::integer-32>> ->
        :authentication_sspi

      <<10::integer-32, methods_b::binary>> ->
        {:authentication_sasl_password, methods_b}

      <<11::integer-32, server_first::binary>> ->
        {:authentication_server_first_message, server_first}

      <<12::integer-32, server_final_msg::binary>> ->
        {:authentication_server_final_message, server_final_msg}

      other ->
        {:undefined, other}
    end
  end

  @spec decode_payload(:parameter_status, binary()) :: {binary(), binary()} | :undefined
  defp decode_payload(:parameter_status, payload) do
    case String.split(payload, <<0>>, trim: true) do
      [k, v] -> {k, v}
      _ -> :undefined
    end
  end

  @spec decode_payload(:backend_key_data, binary()) :: %{pid: pos_integer(), key: binary()}
  defp decode_payload(:backend_key_data, <<pid::integer-32, key::integer-32>>),
    do: %{pid: pid, key: key}

  @spec decode_payload(:ready_for_query, binary()) :: :idle | :transaction | :error
  defp decode_payload(:ready_for_query, payload) do
    case payload do
      "I" -> :idle
      "T" -> :transaction
      "E" -> :error
    end
  end

  @spec decode_payload(:parse_complete, binary()) :: :parse_complete
  defp decode_payload(:parse_complete, ""), do: :parse_complete

  @spec decode_payload(:parameter_description, binary()) :: {pos_integer(), list()}
  defp decode_payload(:parameter_description, <<count::integer-16, rest::binary>>),
    do: {count, decode_parameter_description(rest, [])}

  @spec decode_payload(:row_description, binary()) :: list()
  defp decode_payload(:row_description, <<count::integer-16, rest::binary>>),
    do: decode_row_description(count, rest, [])

  @spec decode_payload(:data_row, binary()) :: nil
  defp decode_payload(:data_row, _payload), do: nil

  # https://www.postgresql.org/docs/current/protocol-error-fields.html
  @spec decode_payload(:error_response | :notice_response, binary()) ::
          %{String.t() => String.t()}
  defp decode_payload(tag, payload) when tag in [:error_response, :notice_response],
    do: decode_error_response(payload)

  defp decode_payload(_, _), do: :undefined

  @spec decode_password_payload(:password, binary()) ::
          {:cleartext_password, binary()} | :undefined
  defp decode_password_payload(:password, bin) do
    case :binary.split(bin, <<0>>) do
      [password, ""] -> {:cleartext_password, password}
      _ -> :undefined
    end
  end

  @spec decode_password_payload(:sasl_initial_response, binary()) ::
          {:scram_sha_256, map()} | :undefined
  defp decode_password_payload(
         :sasl_initial_response,
         <<"SCRAM-SHA-256", 0, _::32, channel::binary-3, bin::binary>>
       ) do
    case kv_to_map(bin) do
      {:ok, map} ->
        channel =
          case channel do
            "n,," -> "biws"
            "y,," -> "eSws"
          end

        {:scram_sha_256, Map.put(map, "c", channel)}

      {:error, _} ->
        :undefined
    end
  end

  defp decode_password_payload(:sasl_initial_response, _bin), do: :undefined

  @spec decode_password_payload(:sasl_response, binary()) ::
          {:first_msg_response, map()} | :undefined
  defp decode_password_payload(:sasl_response, bin) do
    case kv_to_map(bin) do
      {:ok, map} -> {:first_msg_response, map}
      {:error, _} -> :undefined
    end
  end

  @spec kv_to_map(binary()) :: {:ok, map()} | {:error, String.t()}
  defp kv_to_map(bin) do
    Regex.scan(~r/(\w+)=([^,]*)/, bin)
    |> Map.new(fn [_, k, v] -> {k, v} end)
    |> case do
      map when map_size(map) > 0 -> {:ok, map}
      _ -> {:error, "invalid key value string"}
    end
  end

  @spec decode_row_description(non_neg_integer(), binary(), list()) :: [map()] | {:error, :decode}
  defp decode_row_description(0, "", acc), do: Enum.reverse(acc)

  defp decode_row_description(count, rest, acc) do
    with {:ok, field_name,
          <<table_oid::integer-32, attr_num::integer-16, data_type_oid::integer-32,
            data_type_size::integer-16, type_modifier::integer-32, format_code::integer-16,
            tail::binary>>} <- decode_string(rest),
         {:ok, format} <- decode_format_code(format_code) do
      field = %{
        name: field_name,
        table_oid: table_oid,
        attr_number: attr_num,
        data_type_oid: data_type_oid,
        data_type_size: data_type_size,
        type_modifier: type_modifier,
        format: format
      }

      decode_row_description(count - 1, tail, [field | acc])
    else
      _ -> {:error, :decode}
    end
  end

  @spec decode_format_code(0 | 1) :: {:ok, :text | :binary} | {:error, :unknown_format_code}
  defp decode_format_code(code) do
    case code do
      0 -> {:ok, :text}
      1 -> {:ok, :binary}
      _ -> {:error, :unknown_format_code}
    end
  end

  @spec decode_parameter_description(binary(), list()) :: [pos_integer()]
  defp decode_parameter_description("", acc), do: Enum.reverse(acc)

  defp decode_parameter_description(<<oid::integer-32, rest::binary>>, acc),
    do: decode_parameter_description(rest, [oid | acc])
end
