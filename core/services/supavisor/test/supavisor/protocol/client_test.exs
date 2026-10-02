defmodule Supavisor.Protocol.ClientTest do
  use ExUnit.Case, async: true

  alias Supavisor.Protocol.Client

  test "decode_startup_packet/1" do
    input =
      <<0, 0, 0, 191, 0, 3, 0, 0, 117, 115, 101, 114, 0, 112, 111, 115, 116, 103, 114, 101, 115,
        0, 100, 97, 116, 97, 98, 97, 115, 101, 0, 112, 111, 115, 116, 103, 114, 101, 115, 0, 114,
        101, 112, 108, 105, 99, 97, 116, 105, 111, 110, 0, 100, 97, 116, 97, 98, 97, 115, 101, 0,
        111, 112, 116, 105, 111, 110, 115, 0, 45, 99, 32, 100, 97, 116, 101, 115, 116, 121, 108,
        101, 61, 73, 83, 79, 32, 45, 99, 32, 105, 110, 116, 101, 114, 118, 97, 108, 115, 116, 121,
        108, 101, 61, 112, 111, 115, 116, 103, 114, 101, 115, 32, 45, 99, 32, 101, 120, 116, 114,
        97, 95, 102, 108, 111, 97, 116, 95, 100, 105, 103, 105, 116, 115, 61, 51, 0, 97, 112, 112,
        108, 105, 99, 97, 116, 105, 111, 110, 95, 110, 97, 109, 101, 0, 109, 121, 95, 115, 117,
        98, 115, 99, 114, 105, 112, 116, 105, 111, 110, 0, 99, 108, 105, 101, 110, 116, 95, 101,
        110, 99, 111, 100, 105, 110, 103, 0, 85, 84, 70, 56, 0, 0>>

    assert {:ok, packet} = Client.decode_startup_packet(input)
    assert packet.len == 191
    assert packet.tag == :startup

    assert packet.payload == %{
             "user" => "postgres",
             "database" => "postgres",
             "replication" => "database",
             "options" => %{
               "datestyle" => "ISO",
               "intervalstyle" => "postgres",
               "extra_float_digits" => "3"
             },
             "application_name" => "my_subscription",
             "client_encoding" => "UTF8"
           }

    assert Client.decode_startup_packet(<<1, 2, 3>>) ==
             {:error,
              %Supavisor.Errors.StartupMessageError{
                reason: :bad_startup_payload,
                payload: <<1, 2, 3>>
              }}

    assert Client.decode_startup_packet(<<0, 0, 0, 8, 0, 3, 0, 0>>) ==
             {:error,
              %Supavisor.Errors.StartupMessageError{reason: :bad_startup_payload, payload: ""}}
  end
end
