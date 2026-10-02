defmodule Supavisor.ProtocolTest do
  use ExUnit.Case, async: true

  alias Supavisor.Protocol

  describe "split_pkts/1" do
    test "returns empty list for empty input" do
      assert Protocol.split_pkts("") == {[], ""}
    end

    test "splits single complete packet" do
      # Simple query packet: tag 'Q' + length 13 + "select 1\0"
      packet =
        <<?Q, 13::32, 115, 101, 108, 101, 99, 116, 32, 49, 0>>

      assert Protocol.split_pkts(packet) == {[packet], ""}
    end

    test "splits multiple complete packets" do
      packet1 =
        <<?Q, 13::32, 115, 101, 108, 101, 99, 116, 32, 49, 0>>

      packet2 = <<?H, 4::32>>
      combined = packet1 <> packet2

      assert Protocol.split_pkts(combined) == {[packet1, packet2], ""}
    end

    test "returns incomplete packet as remaining data" do
      # Complete header but incomplete payload
      incomplete_packet = <<?Q, 10::32, 115, 101, 108>>

      assert Protocol.split_pkts(incomplete_packet) == {[], incomplete_packet}
    end

    test "returns incomplete header as remaining data" do
      # Incomplete header (only 3 bytes)
      incomplete_header = <<?Q, 0::16>>

      assert Protocol.split_pkts(incomplete_header) == {[], incomplete_header}
    end

    test "splits complete packets and returns incomplete as remaining" do
      complete_packet = <<?H, 4::32>>
      incomplete_packet = <<?Q, 10::32, 115, 101>>
      combined = <<complete_packet::binary, complete_packet::binary, incomplete_packet::binary>>

      assert Protocol.split_pkts(combined) ==
               {[complete_packet, complete_packet], incomplete_packet}
    end
  end
end
