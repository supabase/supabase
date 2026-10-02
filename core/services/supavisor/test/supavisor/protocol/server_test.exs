defmodule Supavisor.Protocol.ServerTest do
  use ExUnit.Case, async: true

  require Supavisor.Protocol.Server, as: Server

  @initial_data %{
    "DateStyle" => "ISO, MDY",
    "IntervalStyle" => "postgres",
    "TimeZone" => "UTC",
    "application_name" => "supavisor",
    "client_encoding" => "UTF8",
    "default_transaction_read_only" => "off",
    "in_hot_standby" => "off",
    "integer_datetimes" => "on",
    "is_superuser" => "on",
    "server_encoding" => "UTF8",
    "server_version" => "14.6 (Debian 14.6-1.pgdg110+1)",
    "session_authorization" => "postgres",
    "standard_conforming_strings" => "on"
  }

  @auth_bin_error <<69, 0, 0, 0, 111, 83, 70, 65, 84, 65, 76, 0, 86, 70, 65, 84, 65, 76, 0, 67,
                    50, 56, 80, 48, 49, 0, 77, 112, 97, 115, 115, 119, 111, 114, 100, 32, 97, 117,
                    116, 104, 101, 110, 116, 105, 99, 97, 116, 105, 111, 110, 32, 102, 97, 105,
                    108, 101, 100, 32, 102, 111, 114, 32, 117, 115, 101, 114, 32, 34, 116, 101,
                    115, 116, 95, 119, 114, 111, 110, 103, 95, 117, 115, 101, 114, 34, 0, 70, 97,
                    117, 116, 104, 46, 99, 0, 76, 51, 51, 53, 0, 82, 97, 117, 116, 104, 95, 102,
                    97, 105, 108, 101, 100, 0, 0>>

  test "encode_parameter_status/1" do
    result = Server.encode_parameter_status(@initial_data)

    for entry <- @initial_data do
      assert {key, value} = entry
      assert is_binary(key)
      assert is_binary(value)
      encoded = Server.encode_pkt(:parameter_status, key, value)
      assert encoded in result
    end
  end

  test "encode_pkt/3" do
    key = "TimeZone"
    value = "UTC"
    result = Server.encode_pkt(:parameter_status, key, value)

    assert result == [<<?S, 17::32>>, [key, <<0>>, value, <<0>>]]
  end

  test "backend_key_data/0" do
    {header, payload} = Server.backend_key_data()
    len = byte_size(payload) + 4

    assert {:ok,
            [
              %Server.Pkt{
                tag: :backend_key_data,
                len: 13,
                payload: %{pid: _, key: _}
              }
            ], ""} = Server.decode([header, payload] |> IO.iodata_to_binary())

    assert header == <<?K, len::32>>
    assert byte_size(payload) == 8
  end

  test "decode_payload for error_response" do
    assert {:ok,
            [
              %Server.Pkt{
                tag: :error_response,
                len: 112,
                bin: @auth_bin_error,
                payload: %{
                  "S" => "FATAL",
                  "V" => "FATAL",
                  "C" => "28P01",
                  "M" => "password authentication failed for user \"test_wrong_user\"",
                  "F" => "auth.c",
                  "L" => "335",
                  "R" => "auth_failed"
                }
              }
            ], ""} = Server.decode(@auth_bin_error)
  end

  test "cancel_message/2" do
    pid = 123
    key = 123_456
    expected = <<0, 0, 0, 16, 4, 210, 22, 46, 0, 0, 0, 123, 0, 1, 226, 64>>

    assert Server.cancel_message(pid, key) == expected
  end

  test "application_name/0" do
    expected =
      <<83, 0, 0, 0, 31, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 95, 110, 97, 109,
        101, 0, 83, 117, 112, 97, 118, 105, 115, 111, 114, 0>>

    assert Server.application_name() == expected
  end

  test "terminate_message/0" do
    expected = <<88, 0, 0, 0, 4>>
    assert Server.terminate_message() == expected
  end

  test "flush/0" do
    expected = <<72, 0, 0, 0, 4>>
    assert Server.flush() == expected
  end

  test "authentication_ok/0" do
    expected = <<82, 0, 0, 0, 8, 0, 0, 0, 0>>
    assert Server.authentication_ok() == expected
  end

  test "ssl_request/0" do
    expected = <<0, 0, 0, 8, 4, 210, 22, 47>>
    assert Server.ssl_request() == expected
  end

  test "ssl_request_message/0" do
    assert Server.ssl_request_message() == <<0, 0, 0, 8, 4, 210, 22, 47>>
  end

  test "decode_pkt/1 with invalid packets" do
    assert Server.decode_pkt(<<>>) == {:error, :bad_packet}
    assert Server.decode_pkt(<<82, 0, 0, 0, 8, 0, 0>>) == {:error, :incomplete}
  end

  test "decode_pkt/1 with valid packet" do
    input = <<82, 0, 0, 0, 8, 0, 0, 0, 0>>
    assert {:ok, packet, rest} = Server.decode_pkt(input)
    assert packet.tag == :authentication
    assert packet.len == 9
    assert packet.payload == :authentication_ok
    assert rest == ""
  end

  test "decode_string/1 with valid input" do
    input = <<83, 67, 82, 65, 77, 45, 83, 72, 65, 45, 50, 53, 54, 0, 0>>
    expected_string = "SCRAM-SHA-256"
    expected_rest = <<0>>
    assert Server.decode_string(input) == {:ok, expected_string, expected_rest}
  end

  test "decode_string/1 with invalid input" do
    input = <<83, 67, 82, 65, 77, 45, 83, 72, 65, 45, 50, 53, 54>>
    assert Server.decode_string(input) == {:error, :not_null_terminated}
  end

  test "md5_request/1" do
    salt = <<1, 2, 3, 4>>
    result = Server.md5_request(salt) |> IO.iodata_to_binary()
    assert result == <<82, 0, 0, 0, 12, 0, 0, 0, 5, 1, 2, 3, 4>>
  end

  test "exchange_first_message/3" do
    nonce = "^!^\"^#^$"
    salt = Base.decode64!("RUsreCtyT2NNeUVnK0ZwWGlqckFHY01CQlE9PQ==")
    result = Server.exchange_first_message(nonce, salt)
    assert String.starts_with?(result, "r=^!^\"^#^$")
    assert String.contains?(result, ",s=#{Base.encode64(salt)},")
    assert String.ends_with?(result, ",i=4096")
  end

  test "exchange_message/2" do
    message = "test"

    assert Server.exchange_message(:first, message) ==
             [<<82, 0, 0, 0, 12, 0, 0, 0, 11>>, message]

    assert Server.exchange_message(:final, message) ==
             [<<82, 0, 0, 0, 12, 0, 0, 0, 12>>, message]
  end

  test "error_message/2" do
    code = "28P01"
    value = "password authentication failed"
    result = Server.error_message(code, value) |> IO.iodata_to_binary()

    assert result ==
             <<69, 0, 0, 0, 58, 83, 70, 65, 84, 65, 76, 0, 86, 70, 65, 84, 65, 76, 0, 67, 50, 56,
               80, 48, 49, 0, 77, 112, 97, 115, 115, 119, 111, 114, 100, 32, 97, 117, 116, 104,
               101, 110, 116, 105, 99, 97, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 0,
               0>>
  end

  test "encode_error_message/1" do
    message = %{
      "S" => "FATAL",
      "V" => "FATAL",
      "C" => "28P01",
      "M" => "password authentication failed"
    }

    result = Server.encode_error_message(message) |> IO.iodata_to_binary()

    assert result ==
             <<?E, 0, 0, 0, ?:, ?C, "28P01", 0, ?M, "password authentication failed", 0, ?S,
               "FATAL", 0, ?V, "FATAL", 0, 0>>
  end

  test "encode_notice_message/1" do
    message = %{
      "S" => "NOTICE",
      "V" => "NOTICE",
      "C" => "22023",
      "M" => ~s(parameter "jit" requires a Boolean value)
    }

    result = Server.encode_notice_message(message) |> IO.iodata_to_binary()

    assert result ==
             <<?N, 0, 0, 0, 70, ?C, "22023", 0, ?M, ~s(parameter "jit" requires a Boolean value),
               0, ?S, "NOTICE", 0, ?V, "NOTICE", 0, 0>>
  end

  test "scram_request/0" do
    assert Server.scram_request() ==
             <<82, 0, 0, 0, 23, 0, 0, 0, 10, 83, 67, 82, 65, 77, 45, 83, 72, 65, 45, 50, 53, 54,
               0, 0>>
  end

  test "sync/0" do
    assert Server.sync() == <<83, 0, 0, 0, 4>>
  end

  test "ready_for_query/0" do
    assert Server.ready_for_query() == <<90, 0, 0, 0, 5, 73>>
  end

  test "extended_query/2" do
    statement = "SELECT set_config('application_name', $1, false)"
    bin = Server.extended_query(statement, ["my app's name"])

    assert bin == <<
             # Parse: empty statement name, the query text, no parameter type oids
             ?P,
             56::32,
             0,
             statement::binary,
             0,
             0::16,
             # Bind: unnamed portal + statement, no format codes, one text param, no result formats
             ?B,
             29::32,
             0,
             0,
             0::16,
             1::16,
             13::32,
             "my app's name",
             0::16,
             # Execute: unnamed portal, no row limit
             ?E,
             9::32,
             0,
             0::32,
             # Sync
             ?S,
             4::32
           >>
  end

  test "decode_pkt/1 correctly maps all message tags" do
    tag_tests = [
      {82, :authentication, <<0, 0, 0, 0>>},
      {75, :backend_key_data, <<0, 0, 0, 0, 0, 0, 0, 0>>},
      {50, :bind_complete, ""},
      {51, :close_complete, ""},
      {67, :command_complete, "SELECT 0\0"},
      {100, :copy_data, ""},
      {99, :copy_done, ""},
      {71, :copy_in_response, <<0, 0>>},
      {72, :copy_out_response, <<0, 0>>},
      {87, :copy_both_response, <<0, 0>>},
      {68, :data_row, <<0, 0>>},
      {73, :empty_query_response, ""},
      {69, :error_response, "S\0V\0C\0M\0\0"},
      {86, :function_call_response, ""},
      {110, :no_data, ""},
      {78, :notice_response, "N\0\0"},
      {65, :notification_response, <<0, 0, 0, 0, "c\0p\0">>},
      {116, :parameter_description, <<0, 0>>},
      {83, :parameter_status, "key\0value\0"},
      {83, :parameter_status, "invalid_format"},
      {49, :parse_complete, ""},
      {115, :portal_suspended, ""},
      {90, :ready_for_query, "I"},
      {84, :row_description, <<0, 0>>},
      {112, :password_message, ""},
      {88, :undefined, ""},
      {95, :undefined, ""}
    ]

    for {tag_code, expected_tag, payload} <- tag_tests do
      packet = <<tag_code, byte_size(payload) + 4::32, payload::binary>>
      assert {:ok, %Server.Pkt{tag: actual_tag}, ""} = Server.decode_pkt(packet)
      assert actual_tag == expected_tag, "Failed for tag code #{tag_code}"
    end
  end

  test "decode parameter_status payloads" do
    payload = "key\0value\0"
    packet = <<83, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, %Server.Pkt{tag: :parameter_status, payload: {key, value}}, ""} =
             Server.decode_pkt(packet)

    assert key == "key"
    assert value == "value"

    invalid_payloads = [
      "single_value\0",
      "too\0many\0values\0",
      "",
      "no_null_terminator"
    ]

    for payload <- invalid_payloads do
      packet = <<83, byte_size(payload) + 4::32, payload::binary>>

      assert {:ok, %Server.Pkt{tag: :parameter_status, payload: :undefined}, ""} =
               Server.decode_pkt(packet)
    end
  end

  test "decode ready_for_query states" do
    states = [
      {73, :idle},
      {84, :transaction},
      {69, :error}
    ]

    for {state_byte, expected_state} <- states do
      packet = <<90, 5::32, state_byte>>

      assert {:ok, %Server.Pkt{tag: :ready_for_query, payload: actual_state}, ""} =
               Server.decode_pkt(packet)

      assert actual_state == expected_state, "Failed for state #{<<state_byte>>}"
    end
  end

  test "decode authentication message payloads" do
    auth_tests = [
      {<<0, 0, 0, 0>>, :authentication_ok},
      {<<0, 0, 0, 2>>, :authentication_kerberos_v5},
      {<<0, 0, 0, 3>>, :authentication_cleartext_password},
      {<<0, 0, 0, 5, 1, 2, 3, 4>>, {:authentication_md5_password, <<1, 2, 3, 4>>}},
      {<<0, 0, 0, 6>>, :authentication_scm_credential},
      {<<0, 0, 0, 7>>, :authentication_gss},
      {<<0, 0, 0, 8, "gss data">>, {:authentication_gss_continue, "gss data"}},
      {<<0, 0, 0, 9>>, :authentication_sspi},
      {<<0, 0, 0, 10, "SCRAM-SHA-256">>, {:authentication_sasl_password, "SCRAM-SHA-256"}},
      {<<0, 0, 0, 11, "first msg">>, {:authentication_server_first_message, "first msg"}},
      {<<0, 0, 0, 12, "final msg">>, {:authentication_server_final_message, "final msg"}},
      {<<"invalid">>, {:undefined, "invalid"}}
    ]

    for {payload, expected_result} <- auth_tests do
      packet = <<82, byte_size(payload) + 4::32, payload::binary>>

      assert {:ok, %Server.Pkt{tag: :authentication, payload: result}, ""} =
               Server.decode_pkt(packet)

      assert result == expected_result, "Failed for authentication type #{inspect(payload)}"
    end
  end

  test "decode_password_message/2 with SASLInitialResponse" do
    payload = <<"SCRAM-SHA-256", 0, 0, 0, 0, 1, "n,,", "p=tls-server-end-point,,m=abc,r=def">>
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, result, ""} = Server.decode_password_message(packet, :sasl_initial_response)

    assert {:scram_sha_256,
            %{"p" => "tls-server-end-point", "m" => "abc", "r" => "def", "c" => "biws"}} = result

    payload = <<"SCRAM-SHA-256", 0, 0, 0, 0, 1, "y,,", "p=tls-server-end-point,,m=abc,r=def">>
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, result, ""} = Server.decode_password_message(packet, :sasl_initial_response)

    assert {:scram_sha_256,
            %{"p" => "tls-server-end-point", "m" => "abc", "r" => "def", "c" => "eSws"}} = result

    payload = <<"SCRAM-SHA-256", 0, 0, 0, 0, 1, "n,,", "invalid format">>
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, :undefined, ""} =
             Server.decode_password_message(packet, :sasl_initial_response)

    payload = "secret\0"
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, :undefined, ""} =
             Server.decode_password_message(packet, :sasl_initial_response)
  end

  test "decode_password_message/2 with SASLResponse" do
    payload = "p=value1,r=value2"
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, {:first_msg_response, %{"p" => "value1", "r" => "value2"}}, ""} =
             Server.decode_password_message(packet, :sasl_response)

    payload = "invalid"
    packet = <<112, byte_size(payload) + 4::32, payload::binary>>

    assert {:ok, :undefined, ""} = Server.decode_password_message(packet, :sasl_response)
  end

  test "decode_password_message/2 with PasswordMessage" do
    for password <- ["secret", "md5-prefixed-password", "p=value1,r=value2", ""] do
      payload = password <> "\0"
      packet = <<112, byte_size(payload) + 4::32, payload::binary>>

      assert {:ok, {:cleartext_password, ^password}, ""} =
               Server.decode_password_message(packet, :password)
    end

    for payload <- ["no_null_terminator", "two\0strings\0"] do
      packet = <<112, byte_size(payload) + 4::32, payload::binary>>

      assert {:ok, :undefined, ""} = Server.decode_password_message(packet, :password)
    end
  end

  test "decode_password_message/2 with other messages" do
    packet = <<?Z, 5::32, ?I>>

    assert {:error, :unexpected_message} = Server.decode_password_message(packet, :password)

    assert {:error, :incomplete} =
             Server.decode_password_message(<<112, 10::32, "abc">>, :password)

    assert {:error, :bad_packet} = Server.decode_password_message(<<>>, :password)
  end

  test "decode row description message" do
    input =
      <<84, 0, 0, 0, 33, 0, 1, 63, 99, 111, 108, 117, 109, 110, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        23, 0, 4, 255, 255, 255, 255, 0, 0, 68, 0, 0, 0, 11, 0, 1, 0, 0, 0, 1, 49, 67, 0, 0, 0,
        13, 83, 69, 76, 69, 67, 84, 32, 49, 0, 90, 0, 0, 0, 5, 73>>

    assert {:ok, packet1, rest1} = Server.decode_pkt(input)
    assert packet1.tag == :row_description

    assert [
             %{
               name: "?column?",
               table_oid: 0,
               attr_number: 0,
               data_type_oid: 23,
               data_type_size: 4,
               type_modifier: 4_294_967_295,
               format: :text
             }
           ] = packet1.payload

    assert {:ok, packet2, rest2} = Server.decode_pkt(rest1)
    assert packet2.tag == :data_row
    assert {:ok, packet3, rest3} = Server.decode_pkt(rest2)
    assert packet3.tag == :command_complete
    assert packet3.len == 14
    assert {:ok, packet4, rest4} = Server.decode_pkt(rest3)
    assert packet4.tag == :ready_for_query
    assert packet4.payload == :idle
    assert rest4 == ""
  end

  test "decode_pkt with real postgres message sequence" do
    input =
      <<84, 0, 0, 0, 33, 0, 1, 63, 99, 111, 108, 117, 109, 110, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        23, 0, 4, 255, 255, 255, 255, 0, 0, 68, 0, 0, 0, 11, 0, 1, 0, 0, 0, 1, 49, 67, 0, 0, 0,
        13, 83, 69, 76, 69, 67, 84, 32, 49, 0, 90, 0, 0, 0, 5, 73>>

    assert {:ok, packet1, rest1} = Server.decode_pkt(input)
    assert packet1.tag == :row_description

    assert [
             %{
               name: "?column?",
               table_oid: 0,
               attr_number: 0,
               data_type_oid: 23,
               data_type_size: 4,
               type_modifier: 4_294_967_295,
               format: :text
             }
           ] = packet1.payload

    assert {:ok, packet2, rest2} = Server.decode_pkt(rest1)
    assert packet2.tag == :data_row

    assert {:ok, packet3, rest3} = Server.decode_pkt(rest2)
    assert packet3.tag == :command_complete
    assert packet3.len == 14

    assert {:ok, packet4, rest4} = Server.decode_pkt(rest3)
    assert packet4.tag == :ready_for_query
    assert packet4.payload == :idle
    assert rest4 == ""
  end

  test "decode_format_code returns error" do
    field_binary = [
      "test_field",
      <<0>>,
      <<0, 0, 4, 210>>,
      <<0, 1>>,
      <<0, 0, 0, 25>>,
      <<255, 255>>,
      <<0, 0, 0, 0>>,
      <<0, 255>>
    ]

    payload = [<<0, 1>>, field_binary]

    packet = [<<84>>, <<IO.iodata_length(payload) + 4::32>>, payload] |> IO.iodata_to_binary()

    assert {:ok, %Server.Pkt{tag: :row_description, payload: {:error, :decode}}, ""} =
             Server.decode_pkt(packet)
  end

  test "decode_row_description returns error on invalid string" do
    field_binary = [
      <<0, 1>>,
      "invalid_field_name"
    ]

    packet =
      [<<84>>, <<IO.iodata_length(field_binary) + 4::32>>, field_binary] |> IO.iodata_to_binary()

    assert {:ok, %Server.Pkt{tag: :row_description, payload: {:error, :decode}}, ""} =
             Server.decode_pkt(packet)
  end

  test "decode_format_code handles both text and binary formats" do
    field_binary = [
      "test_field",
      <<0>>,
      <<0, 0, 4, 210>>,
      <<0, 1>>,
      <<0, 0, 0, 25>>,
      <<255, 255>>,
      <<0, 0, 0, 0>>
    ]

    field_binary_text = field_binary ++ [<<0, 0>>]
    field_binary_binary = field_binary ++ [<<0, 1>>]

    payload_text = [<<0, 1>>, field_binary_text]
    payload_binary = [<<0, 1>>, field_binary_binary]

    packet_text =
      [<<84>>, <<IO.iodata_length(payload_text) + 4::32>>, payload_text] |> IO.iodata_to_binary()

    packet_binary =
      [<<84>>, <<IO.iodata_length(payload_binary) + 4::32>>, payload_binary]
      |> IO.iodata_to_binary()

    {:ok, pkt_text, _} = Server.decode_pkt(packet_text)
    {:ok, pkt_binary, _} = Server.decode_pkt(packet_binary)

    assert [%{format: :text}] = pkt_text.payload
    assert [%{format: :binary}] = pkt_binary.payload
  end

  test "decode_parameter_description decodes multiple parameters" do
    packet = <<116, 0, 0, 0, 14, 0, 2, 0, 0, 0, 23, 0, 0, 0, 25>>

    {:ok, pkt, ""} = Server.decode_pkt(packet)
    assert pkt.tag == :parameter_description
    assert {2, [23, 25]} = pkt.payload
  end
end
