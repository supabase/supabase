defmodule RealtimeWeb.Socket.V2SerializerTest do
  use ExUnit.Case, async: true

  alias Phoenix.Socket.{Broadcast, Message, Reply}
  alias RealtimeWeb.Socket.UserBroadcast
  alias RealtimeWeb.Socket.V2Serializer

  @serializer V2Serializer
  @v2_fastlane_json "[null,null,\"t\",\"e\",{\"m\":1}]"
  @v2_msg_json "[null,null,\"t\",\"e\",{\"m\":1}]"

  @client_push <<
    # push
    0::size(8),
    # join_ref_size
    2,
    # ref_size
    3,
    # topic_size
    5,
    # event_size
    5,
    "12",
    "123",
    "topic",
    "event",
    101,
    102,
    103
  >>

  @client_binary_user_broadcast_push <<
    # user broadcast push
    3::size(8),
    # join_ref_size
    2,
    # ref_size
    3,
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    0,
    # binary encoding
    0::size(8),
    "12",
    "123",
    "topic",
    "user_event",
    101,
    102,
    103
  >>

  @client_json_user_broadcast_push <<
    # user broadcast push
    3::size(8),
    # join_ref_size
    2,
    # ref_size
    3,
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    0,
    # json encoding
    1::size(8),
    "12",
    "123",
    "topic",
    "user_event",
    123,
    34,
    97,
    34,
    58,
    34,
    98,
    34,
    125
  >>

  @client_binary_user_broadcast_push_with_metadata <<
    # user broadcast push
    3::size(8),
    # join_ref_size
    2,
    # ref_size
    3,
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    14,
    # binary encoding
    0::size(8),
    "12",
    "123",
    "topic",
    "user_event",
    ~s<{"store":true}>,
    101,
    102,
    103
  >>

  @reply <<
    # reply
    1::size(8),
    # join_ref_size
    2,
    # ref_size
    3,
    # topic_size
    5,
    # status_size
    2,
    "12",
    "123",
    "topic",
    "ok",
    101,
    102,
    103
  >>

  @broadcast <<
    # broadcast
    2::size(8),
    # topic_size
    5,
    # event_size
    5,
    "topic",
    "event",
    101,
    102,
    103
  >>

  @binary_user_broadcast <<
    # user broadcast
    4::size(8),
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    17,
    # binary encoding
    0::size(8),
    "topic",
    "user_event",
    # metadata
    123,
    34,
    114,
    101,
    112,
    108,
    97,
    121,
    101,
    100,
    34,
    58,
    116,
    114,
    117,
    101,
    125,
    # payload
    101,
    102,
    103
  >>

  @binary_user_broadcast_no_metadata <<
    # user broadcast
    4::size(8),
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    0,
    # binary encoding
    0::size(8),
    "topic",
    "user_event",
    # metadata
    # payload
    101,
    102,
    103
  >>

  @json_user_broadcast <<
    # user broadcast
    4::size(8),
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    17,
    # json encoding
    1::size(8),
    "topic",
    "user_event",
    # metadata
    123,
    34,
    114,
    101,
    112,
    108,
    97,
    121,
    101,
    100,
    34,
    58,
    116,
    114,
    117,
    101,
    125,
    # payload
    123,
    34,
    97,
    34,
    58,
    34,
    98,
    34,
    125
  >>

  @json_user_broadcast_no_metadata <<
    # broadcast
    4::size(8),
    # topic_size
    5,
    # user_event_size
    10,
    # metadata_size
    0,
    # json encoding
    1::size(8),
    "topic",
    "user_event",
    # metadata
    # payload
    123,
    34,
    97,
    34,
    58,
    34,
    98,
    34,
    125
  >>

  defp encode!(serializer, msg) do
    case serializer.encode!(msg) do
      {:socket_push, :text, encoded} ->
        assert is_list(encoded)
        IO.iodata_to_binary(encoded)

      {:socket_push, :binary, encoded} ->
        assert is_binary(encoded)
        encoded
    end
  end

  defp decode!(serializer, msg, opts), do: serializer.decode!(msg, opts)

  defp fastlane!(serializer, msg) do
    case serializer.fastlane!(msg) do
      {:socket_push, :text, encoded} ->
        assert is_list(encoded)
        IO.iodata_to_binary(encoded)

      {:socket_push, :binary, encoded} ->
        assert is_binary(encoded)
        encoded
    end
  end

  test "encode!/1 encodes `Phoenix.Socket.Message` as JSON" do
    msg = %Message{topic: "t", event: "e", payload: %{m: 1}}
    assert encode!(@serializer, msg) == @v2_msg_json
  end

  test "encode!/1 raises when payload is not a map" do
    msg = %Message{topic: "t", event: "e", payload: "invalid"}
    assert_raise ArgumentError, fn -> encode!(@serializer, msg) end
  end

  test "encode!/1 encodes `Phoenix.Socket.Reply` as JSON" do
    msg = %Reply{topic: "t", payload: %{m: 1}}
    encoded = encode!(@serializer, msg)

    assert Jason.decode!(encoded) == [
             nil,
             nil,
             "t",
             "phx_reply",
             %{"response" => %{"m" => 1}, "status" => nil}
           ]
  end

  test "decode!/2 decodes `Phoenix.Socket.Message` from JSON" do
    assert %Message{topic: "t", event: "e", payload: %{"m" => 1}} ==
             decode!(@serializer, @v2_msg_json, opcode: :text)
  end

  test "fastlane!/1 encodes a broadcast into a message as JSON" do
    msg = %Broadcast{topic: "t", event: "e", payload: %{m: 1}}
    assert fastlane!(@serializer, msg) == @v2_fastlane_json
  end

  test "fastlane!/1 raises when payload is not a map" do
    msg = %Broadcast{topic: "t", event: "e", payload: "invalid"}
    assert_raise ArgumentError, fn -> fastlane!(@serializer, msg) end
  end

  describe "binary encode" do
    test "general pushed message" do
      push = <<
        # push
        0::size(8),
        # join_ref_size
        2,
        # topic_size
        5,
        # event_size
        5,
        "12",
        "topic",
        "event",
        101,
        102,
        103
      >>

      assert encode!(@serializer, %Phoenix.Socket.Message{
               join_ref: "12",
               ref: nil,
               topic: "topic",
               event: "event",
               payload: {:binary, <<101, 102, 103>>}
             }) == push
    end

    test "encode with oversized headers" do
      assert_raise ArgumentError, ~r/unable to convert topic to binary/, fn ->
        encode!(@serializer, %Phoenix.Socket.Message{
          join_ref: "12",
          ref: nil,
          topic: String.duplicate("t", 256),
          event: "event",
          payload: {:binary, <<101, 102, 103>>}
        })
      end

      assert_raise ArgumentError, ~r/unable to convert event to binary/, fn ->
        encode!(@serializer, %Phoenix.Socket.Message{
          join_ref: "12",
          ref: nil,
          topic: "topic",
          event: String.duplicate("e", 256),
          payload: {:binary, <<101, 102, 103>>}
        })
      end

      assert_raise ArgumentError, ~r/unable to convert join_ref to binary/, fn ->
        encode!(@serializer, %Phoenix.Socket.Message{
          join_ref: String.duplicate("j", 256),
          ref: nil,
          topic: "topic",
          event: "event",
          payload: {:binary, <<101, 102, 103>>}
        })
      end
    end

    test "reply" do
      assert encode!(@serializer, %Phoenix.Socket.Reply{
               join_ref: "12",
               ref: "123",
               topic: "topic",
               status: :ok,
               payload: {:binary, <<101, 102, 103>>}
             }) == @reply
    end

    test "reply with oversized headers" do
      assert_raise ArgumentError, ~r/unable to convert ref to binary/, fn ->
        encode!(@serializer, %Phoenix.Socket.Reply{
          join_ref: "12",
          ref: String.duplicate("r", 256),
          topic: "topic",
          status: :ok,
          payload: {:binary, <<101, 102, 103>>}
        })
      end
    end

    test "fastlane binary Broadcast" do
      assert fastlane!(@serializer, %Broadcast{
               topic: "topic",
               event: "event",
               payload: {:binary, <<101, 102, 103>>}
             }) == @broadcast
    end

    test "binary user broadcast pushed message" do
      assert encode!(@serializer, %Phoenix.Socket.Message{
               join_ref: "12",
               ref: nil,
               topic: "topic",
               event: "broadcast",
               payload: {"user_event", :binary, <<101, 102, 103>>, %{"replayed" => true}}
             }) == @binary_user_broadcast
    end

    test "fastlane binary UserBroadcast" do
      assert fastlane!(@serializer, %UserBroadcast{
               topic: "topic",
               user_event: "user_event",
               metadata: %{"replayed" => true},
               user_payload_encoding: :binary,
               user_payload: <<101, 102, 103>>
             }) == @binary_user_broadcast
    end

    test "fastlane binary UserBroadcast no metadata" do
      assert fastlane!(@serializer, %UserBroadcast{
               topic: "topic",
               user_event: "user_event",
               metadata: nil,
               user_payload_encoding: :binary,
               user_payload: <<101, 102, 103>>
             }) == @binary_user_broadcast_no_metadata
    end

    test "fastlane json UserBroadcast" do
      assert fastlane!(@serializer, %UserBroadcast{
               topic: "topic",
               user_event: "user_event",
               metadata: %{"replayed" => true},
               user_payload_encoding: :json,
               user_payload: "{\"a\":\"b\"}"
             }) == @json_user_broadcast
    end

    test "fastlane json UserBroadcast no metadata" do
      assert fastlane!(@serializer, %UserBroadcast{
               topic: "topic",
               user_event: "user_event",
               user_payload_encoding: :json,
               user_payload: "{\"a\":\"b\"}"
             }) == @json_user_broadcast_no_metadata
    end

    test "fastlane with oversized headers" do
      assert_raise ArgumentError, ~r/unable to convert topic to binary/, fn ->
        fastlane!(@serializer, %Broadcast{
          topic: String.duplicate("t", 256),
          event: "event",
          payload: {:binary, <<101, 102, 103>>}
        })
      end

      assert_raise ArgumentError, ~r/unable to convert event to binary/, fn ->
        fastlane!(@serializer, %Broadcast{
          topic: "topic",
          event: String.duplicate("e", 256),
          payload: {:binary, <<101, 102, 103>>}
        })
      end

      assert_raise ArgumentError, ~r/unable to convert topic to binary/, fn ->
        fastlane!(@serializer, %UserBroadcast{
          topic: String.duplicate("t", 256),
          user_event: "user_event",
          user_payload_encoding: :json,
          user_payload: "{\"a\":\"b\"}"
        })
      end

      assert_raise ArgumentError, ~r/unable to convert user_event to binary/, fn ->
        fastlane!(@serializer, %UserBroadcast{
          topic: "topic",
          user_event: String.duplicate("e", 256),
          user_payload_encoding: :json,
          user_payload: "{\"a\":\"b\"}"
        })
      end

      assert_raise ArgumentError, ~r/unable to convert metadata to binary/, fn ->
        fastlane!(@serializer, %UserBroadcast{
          topic: "topic",
          user_event: "user_event",
          metadata: %{k: String.duplicate("e", 256)},
          user_payload_encoding: :json,
          user_payload: "{\"a\":\"b\"}"
        })
      end
    end
  end

  describe "decode!/2 invalid text formats" do
    test "raises on a bare JSON string" do
      raw = Jason.encode!("just a string")

      assert_raise Phoenix.Socket.InvalidMessageError, fn ->
        decode!(@serializer, raw, opcode: :text)
      end
    end

    test "raises on a V1 map" do
      raw = Jason.encode!(%{"topic" => "t", "event" => "e", "payload" => %{"m" => 1}, "ref" => "1", "join_ref" => "11"})

      assert_raise Phoenix.Socket.InvalidMessageError, fn ->
        decode!(@serializer, raw, opcode: :text)
      end
    end
  end

  describe "binary decode" do
    test "pushed message" do
      assert decode!(@serializer, @client_push, opcode: :binary) == %Phoenix.Socket.Message{
               join_ref: "12",
               ref: "123",
               topic: "topic",
               event: "event",
               payload: {:binary, <<101, 102, 103>>}
             }
    end

    test "binary user pushed message with metadata" do
      assert decode!(@serializer, @client_binary_user_broadcast_push_with_metadata, opcode: :binary) ==
               %Phoenix.Socket.Message{
                 join_ref: "12",
                 ref: "123",
                 topic: "topic",
                 event: "broadcast",
                 payload: {"user_event", :binary, <<101, 102, 103>>, %{"store" => true}}
               }
    end

    test "binary user pushed message" do
      assert decode!(@serializer, @client_binary_user_broadcast_push, opcode: :binary) == %Phoenix.Socket.Message{
               join_ref: "12",
               ref: "123",
               topic: "topic",
               event: "broadcast",
               payload: {"user_event", :binary, <<101, 102, 103>>, %{}}
             }
    end

    test "json binary user pushed message" do
      assert decode!(@serializer, @client_json_user_broadcast_push, opcode: :binary) == %Phoenix.Socket.Message{
               join_ref: "12",
               ref: "123",
               topic: "topic",
               event: "broadcast",
               payload: {"user_event", :json, "{\"a\":\"b\"}", %{}}
             }
    end
  end
end
