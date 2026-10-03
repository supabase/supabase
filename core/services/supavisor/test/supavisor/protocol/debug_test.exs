defmodule Supavisor.Protocol.DebugTest do
  use ExUnit.Case

  alias Supavisor.Protocol.{Debug, PreparedStatements, Server}

  describe "packet_to_string/2" do
    test "formats frontend Query message" do
      packet = <<?Q, 13::32, "SELECT 1", 0>>
      assert Debug.packet_to_string(packet, :frontend) == "Query(\"SELECT 1\")"
    end

    test "formats backend CommandComplete message" do
      packet = <<?C, 13::32, "SELECT 1", 0>>
      assert Debug.packet_to_string(packet, :backend) == "CommandComplete(\"SELECT 1\")"
    end

    test "formats backend ParameterStatus message" do
      packet = <<?S, 17::32, "TimeZone", 0, "UTC", 0>>
      assert Debug.packet_to_string(packet, :backend) == "ParameterStatus(TimeZone=\"UTC\")"
    end

    test "formats backend AuthenticationOk message" do
      packet = <<?R, 8::32, 0::32>>
      assert Debug.packet_to_string(packet, :backend) == "AuthenticationOk"
    end

    test "formats backend ReadyForQuery idle message" do
      packet = <<?Z, 5::32, ?I>>
      assert Debug.packet_to_string(packet, :backend) == "ReadyForQuery(idle)"
    end

    test "formats frontend Parse message" do
      packet = <<?P, 21::32, "stmt1", 0, "SELECT 1", 0, 0, 0>>
      assert Debug.packet_to_string(packet, :frontend) == "Parse(statement=\"stmt1\")"
    end

    test "formats frontend Bind message" do
      packet = <<?B, 24::32, "portal1", 0, "stmt1", 0, 0, 0, 0, 0, 0, 0>>

      assert Debug.packet_to_string(packet, :frontend) ==
               "Bind(portal=\"portal1\", statement=\"stmt1\")"
    end

    test "formats frontend Close statement message" do
      packet = <<?C, 11::32, ?S, "stmt1", 0>>
      assert Debug.packet_to_string(packet, :frontend) == "Close(statement=\"stmt1\")"
    end

    test "formats frontend Close portal message" do
      packet = <<?C, 13::32, ?P, "portal1", 0>>
      assert Debug.packet_to_string(packet, :frontend) == "Close(portal=\"portal1\")"
    end

    test "distinguishes same tag between frontend and backend" do
      describe_packet = <<?D, 11::32, ?S, "stmt1", 0>>
      datarow_packet = <<?D, 11::32, 0, 1, 0, 0, 0, 1, "1">>

      assert Debug.packet_to_string(describe_packet, :frontend) == "Describe(statement=\"stmt1\")"
      assert Debug.packet_to_string(datarow_packet, :backend) == "DataRow"
    end

    test "formats internal tuple packets" do
      assert Debug.packet_to_string({:bind_pkt, "stmt1", nil, nil}, :frontend) ==
               "BindMessage(statement=\"stmt1\")"

      assert Debug.packet_to_string({:describe_pkt, "stmt1", nil, nil}, :frontend) ==
               "DescribeMessage(statement=\"stmt1\")"

      assert Debug.packet_to_string({:parse_pkt, "stmt2", nil}, :backend) ==
               "ParseMessage(statement=\"stmt2\")"
    end

    test "handles structs with bin field" do
      server_pkt = %{bin: <<?Z, 5::32, ?I>>}
      client_pkt = %{bin: <<?Q, 13::32, "SELECT 1", 0>>}

      assert Debug.packet_to_string(server_pkt, :backend) == "ReadyForQuery(idle)"
      assert Debug.packet_to_string(client_pkt, :frontend) == "Query(\"SELECT 1\")"
    end

    test "handles unknown packets" do
      unknown_packet = <<255, 4::32>>
      assert Debug.packet_to_string(unknown_packet, :frontend) =~ "UnknownPacket"
      assert Debug.packet_to_string(unknown_packet, :backend) =~ "UnknownPacket"
    end

    test "truncates long SQL queries" do
      long_query = "SELECT * FROM very_long_table_name_with_many_columns_that_exceeds_limit"
      packet = <<?Q, byte_size(long_query) + 5::32, long_query::binary, 0>>
      result = Debug.packet_to_string(packet, :frontend)

      assert result =~ "Query("
      assert result =~ "..."
      assert String.length(result) < String.length("Query(\"#{long_query}\")")
    end

    test "formats Server.Pkt struct" do
      packet = <<?Z, 5::32, ?I>>
      {:ok, server_pkt, _} = Server.decode_pkt(packet)

      assert Debug.packet_to_string(server_pkt, :backend) == "ReadyForQuery(idle)"
    end

    test "formats prepared statement tuple" do
      storage = PreparedStatements.init_storage()

      {:ok, _storage, {:parse_pkt, stmt_name, _pkt}} =
        PreparedStatements.handle_parse_message(storage, 16, <<"stmt1", 0, "SELECT 1", 0, 0, 0>>)

      assert Debug.packet_to_string({:parse_pkt, stmt_name, nil}, :frontend) ==
               "ParseMessage(statement=\"#{stmt_name}\")"
    end
  end
end
