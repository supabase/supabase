defmodule Realtime.PostgresDecoderTest do
  use ExUnit.Case, async: true
  alias Realtime.Adapters.Postgres.Decoder

  alias Decoder.Messages.Begin
  alias Decoder.Messages.Commit
  alias Decoder.Messages.Insert
  alias Decoder.Messages.Origin
  alias Decoder.Messages.Relation
  alias Decoder.Messages.Relation.Column
  alias Decoder.Messages.Type
  alias Decoder.Messages.Unsupported

  test "decodes begin messages" do
    {:ok, expected_dt_no_microseconds, 0} = DateTime.from_iso8601("2019-07-18T17:02:35Z")
    expected_dt = DateTime.add(expected_dt_no_microseconds, 726_322, :microsecond)

    assert Decoder.decode_message(
             <<66, 0, 0, 0, 2, 167, 244, 168, 128, 0, 2, 48, 246, 88, 88, 213, 242, 0, 0, 2, 107>>,
             %{}
           ) ==
             %Begin{commit_timestamp: expected_dt, final_lsn: {2, 2_817_828_992}, xid: 619}
  end

  test "decodes commit messages" do
    {:ok, expected_dt_no_microseconds, 0} = DateTime.from_iso8601("2019-07-18T17:02:35Z")
    expected_dt = DateTime.add(expected_dt_no_microseconds, 726_322, :microsecond)

    assert Decoder.decode_message(
             <<67, 0, 0, 0, 0, 2, 167, 244, 168, 128, 0, 0, 0, 2, 167, 244, 168, 176, 0, 2, 48, 246, 88, 88, 213, 242>>,
             %{}
           ) == %Commit{
             flags: [],
             lsn: {2, 2_817_828_992},
             end_lsn: {2, 2_817_829_040},
             commit_timestamp: expected_dt
           }
  end

  test "decodes origin messages" do
    assert Decoder.decode_message(<<79, 0, 0, 0, 2, 167, 244, 168, 128>> <> "Elmer Fud", %{}) ==
             %Origin{
               origin_commit_lsn: {2, 2_817_828_992},
               name: "Elmer Fud"
             }
  end

  test "decodes relation messages" do
    assert Decoder.decode_message(
             <<82, 0, 0, 96, 0, 112, 117, 98, 108, 105, 99, 0, 102, 111, 111, 0, 100, 0, 2, 0, 98, 97, 114, 0, 0, 0, 0,
               25, 255, 255, 255, 255, 1, 105, 100, 0, 0, 0, 0, 23, 255, 255, 255, 255>>,
             %{}
           ) == %Relation{
             id: 24_576,
             namespace: "public",
             name: "foo",
             replica_identity: :default,
             columns: [
               %Column{
                 flags: [],
                 name: "bar",
                 type: "text",
                 type_modifier: 4_294_967_295
               },
               %Column{
                 flags: [:key],
                 name: "id",
                 type: "int4",
                 type_modifier: 4_294_967_295
               }
             ]
           }
  end

  test "decodes type messages" do
    assert Decoder.decode_message(
             <<89, 0, 0, 128, 52, 112, 117, 98, 108, 105, 99, 0, 101, 120, 97, 109, 112, 108, 101, 95, 116, 121, 112,
               101, 0>>,
             %{}
           ) ==
             %Type{
               id: 32_820,
               namespace: "public",
               name: "example_type"
             }
  end

  describe "data message (TupleData) decoder" do
    setup do
      relation = %{
        id: 24_576,
        namespace: "public",
        name: "foo",
        columns: [
          %Column{name: "id", type: "uuid"},
          %Column{name: "bar", type: "text"}
        ]
      }

      %{relation: relation}
    end

    test "decodes insert messages", %{relation: relation} do
      uuid = UUID.uuid4()
      string = Generators.random_string()

      data =
        "I" <>
          <<relation.id::integer-32>> <>
          "N" <>
          <<2::integer-16>> <>
          "b" <>
          <<16::integer-32>> <>
          UUID.string_to_binary!(uuid) <>
          "b" <>
          <<byte_size(string)::integer-32>> <>
          string

      assert Decoder.decode_message(
               data,
               %{relation.id => relation}
             ) == %Insert{
               relation_id: relation.id,
               tuple_data: {uuid, string}
             }
    end

    test "ignores unknown relations", %{relation: relation} do
      uuid = UUID.uuid4()
      string = Generators.random_string()

      data =
        "I" <>
          <<679::integer-32>> <>
          "N" <>
          <<2::integer-16>> <>
          "b" <>
          <<16::integer-32>> <>
          UUID.string_to_binary!(uuid) <>
          "b" <>
          <<byte_size(string)::integer-32>> <>
          string

      assert Decoder.decode_message(
               data,
               %{relation.id => relation}
             ) == %Unsupported{}
    end

    test "decodes insert messages with null values", %{relation: relation} do
      string = Generators.random_string()

      data =
        "I" <>
          <<relation.id::integer-32>> <>
          "N" <>
          <<2::integer-16>> <>
          "n" <>
          "b" <>
          <<byte_size(string)::integer-32>> <>
          string

      assert Decoder.decode_message(data, %{relation.id => relation}) == %Insert{
               relation_id: relation.id,
               tuple_data: {nil, string}
             }
    end

    test "decodes insert messages with bytea column" do
      relation = %{
        id: 24_576,
        namespace: "realtime",
        name: "messages",
        columns: [
          %Column{name: "id", type: "uuid"},
          %Column{name: "binary_payload", type: "bytea"}
        ]
      }

      uuid = UUID.uuid4()
      bytes = <<0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF, 0x01>>

      data =
        "I" <>
          <<relation.id::integer-32>> <>
          "N" <>
          <<2::integer-16>> <>
          "b" <>
          <<16::integer-32>> <>
          UUID.string_to_binary!(uuid) <>
          "b" <>
          <<byte_size(bytes)::integer-32>> <>
          bytes

      assert Decoder.decode_message(data, %{relation.id => relation}) == %Insert{
               relation_id: relation.id,
               tuple_data: {uuid, bytes}
             }
    end

    test "decodes insert messages with unchanged toasted values", %{relation: relation} do
      string = Generators.random_string()

      data =
        "I" <>
          <<relation.id::integer-32>> <>
          "N" <>
          <<2::integer-16>> <>
          "u" <>
          "b" <>
          <<byte_size(string)::integer-32>> <>
          string

      assert Decoder.decode_message(data, %{relation.id => relation}) == %Insert{
               relation_id: relation.id,
               tuple_data: {:unchanged_toast, string}
             }
    end
  end
end
