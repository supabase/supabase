defmodule Supavisor.Protocol.PreparedStatements.PreparedStatementTest do
  use ExUnit.Case, async: true

  import Supavisor.Asserts

  alias Supavisor.Protocol.PreparedStatements
  alias Supavisor.Protocol.PreparedStatements.PreparedStatement
  alias Supavisor.Protocol.PreparedStatements.Storage

  setup do
    client_statements = Storage.new()

    {:ok, client_statements: client_statements}
  end

  describe "message handlers" do
    test "handle_parse_message with unnamed statement passes through unchanged", %{
      client_statements: client_statements
    } do
      len = 16
      payload = <<0, "select 1", 0, 0, 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_parse_message(client_statements, len, payload)

      # Should return unchanged
      assert new_client_statements == client_statements
      assert result == <<?P, 16::32, 0, "select 1", 0, 0, 0>>
    end

    test "handle_close_message updates statement name and removes from storage" do
      parse_pkt = <<?P, 27::32, "server_stmt", 0, "select 1", 0, 0, 0>>
      prepared_statement = %PreparedStatement{name: "server_stmt", parse_pkt: parse_pkt}
      {:ok, client_statements} = Storage.put(Storage.new(), "test_stmt", prepared_statement)

      len = 15
      payload = <<?S, "test_stmt", 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_close_message(client_statements, len, payload)

      # Should remove from client_statements
      assert new_client_statements == Storage.new()

      # Should return close_pkt tuple with statement name
      assert {:close_pkt, "server_stmt", result_bin} = result

      # Verify the result binary has the correct format
      assert <<?C, _len::32, ?S, "server_stmt", 0>> = result_bin
    end

    test "handle_parse_message generates new server-side name", %{
      client_statements: client_statements
    } do
      len = 25
      payload = <<"test_stmt", 0, "select 1", 0, 0, 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_parse_message(client_statements, len, payload)

      # Should add mapping to client_statements
      assert Storage.statement_count(new_client_statements) == 1
      prepared_statement = Storage.get(new_client_statements, "test_stmt")
      assert prepared_statement != nil
      assert %PreparedStatement{} = prepared_statement
      assert String.starts_with?(prepared_statement.name, "sv_")

      # Should return parse_pkt tuple with statement name
      assert {:parse_pkt, server_name, result_bin} = result
      assert server_name == prepared_statement.name

      # Verify the result binary has the correct format
      assert <<?P, _len::32, ^server_name::binary-size(byte_size(prepared_statement.name)), 0,
               "select 1", 0, 0, 0>> = result_bin

      assert prepared_statement.parse_pkt == result_bin
    end

    test "bind message updates statement name" do
      parse_pkt =
        <<?P, 27::32, "server_stmt", 0, "select 1", 0, 0, 0>>

      prepared_statement = %PreparedStatement{name: "server_stmt", parse_pkt: parse_pkt}
      {:ok, client_statements} = Storage.put(Storage.new(), "test_stmt", prepared_statement)

      len = 21
      payload = <<0, "test_stmt", 0, 0, 0, 0, 0, 0, 0, 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_bind_message(client_statements, len, payload)

      # Should not change client_statements
      assert new_client_statements == client_statements

      # Should return bind_pkt tuple with statement name
      assert {:bind_pkt, "server_stmt", result_bin, returned_parse_pkt} = result
      assert returned_parse_pkt == parse_pkt

      # Verify the result binary has the correct format
      assert <<?B, _len::32, 0, "server_stmt", 0, 0, 0, 0, 0, 0, 0, 0>> = result_bin
    end

    test "describe message updates statement name" do
      parse_pkt =
        <<?P, 27::32, "server_stmt", 0, "select 1", 0, 0, 0>>

      prepared_statement = %PreparedStatement{name: "server_stmt", parse_pkt: parse_pkt}
      {:ok, client_statements} = Storage.put(Storage.new(), "test_stmt", prepared_statement)

      len = 15
      payload = <<?S, "test_stmt", 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_describe_message(client_statements, len, payload)

      # Should not change client_statements
      assert new_client_statements == client_statements

      # Should return describe_pkt tuple with statement name and cached parse packet
      assert {:describe_pkt, "server_stmt", result_bin, returned_parse_pkt} = result
      assert returned_parse_pkt == parse_pkt

      # Verify the result binary has the correct format
      assert <<?D, _len::32, ?S, "server_stmt", 0>> = result_bin
    end

    test "bind message with unknown statement name", %{client_statements: client_statements} do
      len = 21
      payload = <<0, "test_stmt", 0, 0, 0, 0, 0, 0, 0, 0>>

      assert {:error, %Supavisor.Errors.PreparedStatementNotFoundError{name: "test_stmt"}} =
               error = PreparedStatements.handle_bind_message(client_statements, len, payload)

      assert_valid_error(error)
    end

    test "describe message with unknown statement name", %{client_statements: client_statements} do
      len = 15
      payload = <<?S, "test_stmt", 0>>

      assert {:error, %Supavisor.Errors.PreparedStatementNotFoundError{name: "test_stmt"}} =
               error = PreparedStatements.handle_describe_message(client_statements, len, payload)

      assert_valid_error(error)
    end

    test "describe message for unnamed statement is passed through unchanged", %{
      client_statements: client_statements
    } do
      len = 6
      payload = <<?S, 0>>

      {:ok, new_client_statements, result} =
        PreparedStatements.handle_describe_message(client_statements, len, payload)

      # Should return unchanged
      assert new_client_statements == client_statements
      assert result == <<?D, 6::32, ?S, 0>>
    end

    test "parse message returns error when client limit is reached" do
      client_statements =
        Enum.reduce(1..PreparedStatements.client_limit(), Storage.new(), fn i, acc ->
          {:ok, new_acc} =
            Storage.put(acc, "stmt_#{i}", %PreparedStatement{
              name: "server_stmt_#{i}",
              parse_pkt: <<>>
            })

          new_acc
        end)

      len = 25
      payload = <<"test_stmt", 0, "select 1", 0, 0, 0>>

      assert {:error, %Supavisor.Errors.MaxPreparedStatementsError{}} =
               error = PreparedStatements.handle_parse_message(client_statements, len, payload)

      assert_valid_error(error)
    end

    test "parse message returns error for duplicate PS" do
      {:ok, client_statements} =
        Storage.put(Storage.new(), "stmt", %PreparedStatement{
          name: "server_stmt",
          parse_pkt: <<>>
        })

      len = 20
      payload = <<"stmt", 0, "select 1", 0, 0, 0>>

      assert {:error, %Supavisor.Errors.DuplicatePreparedStatementError{name: "stmt"}} =
               error = PreparedStatements.handle_parse_message(client_statements, len, payload)

      assert_valid_error(error)
    end

    test "parse message returns error when memory limit is reached" do
      # Create a large prepared statement that will push us over the memory limit
      large_query = String.duplicate("a", PreparedStatements.client_memory_limit_bytes() - 19)

      large_parse_pkt =
        <<?P, byte_size(large_query) + 18::32, "large_stmt", 0, large_query::binary, 0, 0, 0>>

      large_statement = %PreparedStatement{name: "large_stmt", parse_pkt: large_parse_pkt}

      {:ok, client_statements} = Storage.put(Storage.new(), "existing_stmt", large_statement)

      # Try to add another statement that would exceed memory limit
      len = 25
      payload = <<"test_stmt", 0, "select 1", 0, 0, 0>>

      assert {:error, %Supavisor.Errors.MaxPreparedStatementsMemoryError{}} =
               error = PreparedStatements.handle_parse_message(client_statements, len, payload)

      assert_valid_error(error)
    end
  end
end
