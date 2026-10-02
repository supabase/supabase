defmodule Supavisor.Protocol.MessageStreamerTest do
  use ExUnit.Case, async: true

  alias Supavisor.Protocol.MessageStreamer

  require MessageStreamer

  defmodule TestHandler do
    @behaviour Supavisor.Protocol.MessageHandler

    @impl true
    def handled_message_types, do: [?A, ?B]

    @impl true
    def init_state, do: %{counter: 0}

    @impl true
    def handle_message(state, tag, len, payload) do
      new_state = %{state | counter: state.counter + 1}
      result = {:test_pkt, tag, len, payload}
      {:ok, new_state, result}
    end
  end

  setup do
    stream_state = MessageStreamer.new_stream_state(TestHandler)
    {:ok, stream_state: stream_state}
  end

  describe "MessageStreamer core functionality" do
    test "handles complete messages correctly", %{stream_state: stream_state} do
      message_bin = <<?A, 8::32, "test">>

      {:ok, new_stream_state, result} =
        MessageStreamer.handle_packets(stream_state, message_bin)

      assert MessageStreamer.stream_state(new_stream_state, :handler_state).counter == 1
      assert result == [{:test_pkt, ?A, 8, "test"}]
      assert MessageStreamer.stream_state(new_stream_state, :pending_bin) == <<>>
      assert MessageStreamer.stream_state(new_stream_state, :in_flight_pkt) == nil
    end

    test "passes through unhandled message types unchanged", %{stream_state: stream_state} do
      message_bin = <<?C, 8::32, "test">>

      {:ok, new_stream_state, result} =
        MessageStreamer.handle_packets(stream_state, message_bin)

      assert MessageStreamer.stream_state(new_stream_state, :handler_state).counter == 0
      assert result == [message_bin]
      assert MessageStreamer.stream_state(new_stream_state, :pending_bin) == <<>>
      assert MessageStreamer.stream_state(new_stream_state, :in_flight_pkt) == nil
    end

    test "handles partial messages correctly", %{stream_state: stream_state} do
      partial_bin = <<?A, 8::32, "te">>
      remaining_bin = "st"

      {:ok, intermediate_state, intermediate_result} =
        MessageStreamer.handle_packets(stream_state, partial_bin)

      assert MessageStreamer.stream_state(intermediate_state, :handler_state).counter == 0
      assert intermediate_result == []
      assert MessageStreamer.stream_state(intermediate_state, :pending_bin) == partial_bin

      {:ok, final_state, final_result} =
        MessageStreamer.handle_packets(intermediate_state, remaining_bin)

      assert MessageStreamer.stream_state(final_state, :handler_state).counter == 1
      assert final_result == [{:test_pkt, ?A, 8, "test"}]
      assert MessageStreamer.stream_state(final_state, :pending_bin) == <<>>
    end

    test "handles multiple messages in single binary", %{stream_state: stream_state} do
      combined_bin = <<?A, 8::32, "test", ?B, 9::32, "hello">>

      {:ok, new_stream_state, result} =
        MessageStreamer.handle_packets(stream_state, combined_bin)

      assert MessageStreamer.stream_state(new_stream_state, :handler_state).counter == 2
      assert result == [{:test_pkt, ?A, 8, "test"}, {:test_pkt, ?B, 9, "hello"}]
      assert MessageStreamer.stream_state(new_stream_state, :pending_bin) == <<>>
      assert MessageStreamer.stream_state(new_stream_state, :in_flight_pkt) == nil
    end

    test "handles unhandled message with in_flight_pkt correctly", %{stream_state: stream_state} do
      # Send partial unhandled message
      partial_unhandled = <<?C, 11::32, "par">>

      {:ok, intermediate_state, intermediate_result} =
        MessageStreamer.handle_packets(stream_state, partial_unhandled)

      assert MessageStreamer.stream_state(intermediate_state, :handler_state).counter == 0
      assert intermediate_result == [partial_unhandled]
      assert MessageStreamer.stream_state(intermediate_state, :in_flight_pkt) == {?C, 4}

      # Send remaining data
      remaining_data = "tial"

      {:ok, final_state, final_result} =
        MessageStreamer.handle_packets(intermediate_state, remaining_data)

      assert MessageStreamer.stream_state(final_state, :handler_state).counter == 0
      assert final_result == [remaining_data]
      assert MessageStreamer.stream_state(final_state, :pending_bin) == <<>>
      assert MessageStreamer.stream_state(final_state, :in_flight_pkt) == nil
    end

    test "streaming parsing works correctly regardless of packet sizes" do
      stream_state = MessageStreamer.new_stream_state(TestHandler)

      full_binary =
        [
          <<?A, 8::32, "msg1">>,
          <<?B, 8::32, "msg2">>,
          <<?C, 8::32, "msg3">>,
          <<?A, 9::32, "msg4x">>,
          <<?D, 10::32, "msg5xx">>,
          <<?B, 11::32, "msg6xxx">>
        ]
        |> IO.iodata_to_binary()

      for chunk_size <- [1, 3, 7, 13, 23, 37] do
        {final_state, result} =
          full_binary
          |> chunk_binary(chunk_size)
          |> Enum.reduce({stream_state, []}, fn chunk, {state, acc} ->
            {:ok, new_state, chunk_result} = MessageStreamer.handle_packets(state, chunk)
            {new_state, acc ++ chunk_result}
          end)

        # Group consecutive binaries together while preserving order
        grouped_result =
          Enum.reduce(result, [], fn
            raw_bin, [] when is_binary(raw_bin) ->
              [raw_bin]

            raw_bin, [last | rest] when is_binary(raw_bin) and is_binary(last) ->
              [<<last::binary, raw_bin::binary>> | rest]

            raw_bin, acc when is_binary(raw_bin) ->
              [raw_bin | acc]

            tuple, acc ->
              [tuple | acc]
          end)
          |> Enum.reverse()

        assert [
                 {:test_pkt, ?A, 8, "msg1"},
                 {:test_pkt, ?B, 8, "msg2"},
                 <<?C, 8::32, "msg3">>,
                 {:test_pkt, ?A, 9, "msg4x"},
                 <<?D, 10::32, "msg5xx">>,
                 {:test_pkt, ?B, 11, "msg6xxx"}
               ] = grouped_result

        assert MessageStreamer.stream_state(final_state, :pending_bin) == <<>>
        assert MessageStreamer.stream_state(final_state, :in_flight_pkt) == nil
        assert MessageStreamer.stream_state(final_state, :handler_state).counter == 4
      end
    end

    test "update_state function works correctly", %{stream_state: stream_state} do
      updated_stream_state =
        MessageStreamer.update_state(stream_state, fn state ->
          %{state | counter: 42}
        end)

      assert MessageStreamer.stream_state(updated_stream_state, :handler_state).counter == 42
    end
  end

  defp chunk_binary(binary, chunk_size) when byte_size(binary) <= chunk_size do
    [binary]
  end

  defp chunk_binary(binary, chunk_size) do
    <<chunk::binary-size(chunk_size), rest::binary>> = binary
    [chunk | chunk_binary(rest, chunk_size)]
  end
end
