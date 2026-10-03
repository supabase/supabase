defmodule RealtimeWeb.Socket.UserBroadcastTest do
  use ExUnit.Case, async: true

  alias Phoenix.Socket.Broadcast
  alias RealtimeWeb.Socket.UserBroadcast

  defp user_broadcast(user_payload, opts \\ []) do
    %UserBroadcast{
      topic: "realtime:room1",
      user_event: "evt",
      user_payload: user_payload,
      user_payload_encoding: :json,
      metadata: Keyword.get(opts, :metadata)
    }
  end

  defp render(%Broadcast{payload: payload}), do: IO.iodata_to_binary(Jason.encode_to_iodata!(payload))

  describe "convert_to_json_broadcast/1 with valid JSON" do
    test "wraps an object payload and preserves the bytes verbatim" do
      assert {:ok, %Broadcast{topic: "realtime:room1", event: "broadcast"} = broadcast} =
               UserBroadcast.convert_to_json_broadcast(user_broadcast(~s|{"a":1}|))

      assert Jason.decode!(render(broadcast)) == %{
               "event" => "evt",
               "payload" => %{"a" => 1},
               "type" => "broadcast"
             }
    end

    test "includes metadata under \"meta\" when present" do
      broadcast_msg = user_broadcast(~s|{"a":1}|, metadata: %{"id" => "123", "replayed" => true})

      assert {:ok, %Broadcast{} = broadcast} = UserBroadcast.convert_to_json_broadcast(broadcast_msg)

      assert Jason.decode!(render(broadcast)) == %{
               "event" => "evt",
               "payload" => %{"a" => 1},
               "type" => "broadcast",
               "meta" => %{"id" => "123", "replayed" => true}
             }
    end

    test "emits the original bytes unchanged rather than re-encoding them" do
      raw = ~s|{ "b":2,\n"a":1 }|

      assert {:ok, %Broadcast{} = broadcast} = UserBroadcast.convert_to_json_broadcast(user_broadcast(raw))
      assert render(broadcast) =~ raw
    end

    test "accepts non-object JSON values (payload may be any JSON value)" do
      for {raw, expected} <- [
            {~s|[1,2,3]|, [1, 2, 3]},
            {~s|"hello"|, "hello"},
            {"42", 42},
            {"true", true},
            {"null", nil}
          ] do
        assert {:ok, %Broadcast{} = broadcast} = UserBroadcast.convert_to_json_broadcast(user_broadcast(raw))
        assert Jason.decode!(render(broadcast))["payload"] == expected
      end
    end
  end

  describe "convert_to_json_broadcast/1 rejects payloads that are not a single JSON value" do
    test "rejects outright invalid JSON" do
      assert {:error, "User payload is not valid JSON"} =
               UserBroadcast.convert_to_json_broadcast(user_broadcast("this is not json at all"))
    end

    test "rejects an empty payload" do
      assert {:error, "User payload is not valid JSON"} = UserBroadcast.convert_to_json_broadcast(user_broadcast(""))
    end

    test "rejects a valid value followed by trailing content (the injection vector)" do
      escapes = [
        ~s|{}, "injected":"pwned"|,
        ~s|{"a":1},"injected":"pwned","zz":{"b":2}|,
        ~s|0},"event":"postgres_changes","payload":{"x":1}|,
        ~s|"ok","x":1|,
        ~s|42 43|
      ]

      for raw <- escapes do
        assert {:error, "User payload is not valid JSON"} =
                 UserBroadcast.convert_to_json_broadcast(user_broadcast(raw)),
               "expected #{inspect(raw)} to be rejected"
      end
    end
  end

  describe "convert_to_json_broadcast/1 with a non-JSON encoding" do
    test "rejects binary-encoded payloads" do
      msg = %UserBroadcast{
        topic: "realtime:room1",
        user_event: "evt",
        user_payload: <<0, 1, 2, 3>>,
        user_payload_encoding: :binary
      }

      assert {:error, "User payload encoding is not JSON"} = UserBroadcast.convert_to_json_broadcast(msg)
    end
  end
end
