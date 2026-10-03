defmodule Supavisor.Integration.PreparedStatementsTest do
  use Supavisor.DataCase, async: false

  require Logger

  alias Supavisor.Protocol.PreparedStatements
  alias Supavisor.Support.ProtocolClient

  @tenant "proxy_tenant_ps_enabled"

  @sample_query """
  SELECT schemaname, tablename, tableowner, hasindexes
  FROM pg_tables
  WHERE schemaname = $1
  ORDER BY tablename;
  """

  setup do
    db_conf = Application.get_env(:supavisor, Repo)

    conn_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_transaction),
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username] <> "." <> @tenant,
      show_sensitive_data_on_connection_error: true
    ]

    conns =
      for _i <- 1..10 do
        {:ok, conn} = Postgrex.start_link(conn_opts)
        conn
      end

    {:ok, %{conns: conns, conn_opts: conn_opts}}
  end

  test "prepare unnamed", %{conns: [conn | _]} do
    query = Postgrex.prepare!(conn, "", @sample_query)
    assert {:ok, _, %{rows: _}} = Postgrex.execute(conn, query, ["public"])

    query = Postgrex.prepare!(conn, "", @sample_query)
    assert {:ok, _, %{rows: _}} = Postgrex.execute(conn, query, ["private"])
  end

  test "prepared statement limit (client)", %{conns: [conn | _]} do
    limit = PreparedStatements.client_limit()

    for i <- 0..(limit - 1) do
      query = Postgrex.prepare!(conn, "q_#{i}", @sample_query)
      assert {:ok, _, %{rows: _}} = Postgrex.execute(conn, query, ["public"])
    end

    assert_raise Postgrex.Error, ~r/max prepared statements limit reached/, fn ->
      Postgrex.prepare!(conn, "q_err", @sample_query)
    end
  end

  test "prepared statement memory limit (client)", %{conns: [conn | _]} do
    # Create large queries until we hit the memory limit
    # Each query is roughly 126KB, so we can fit 7 before hitting the 1MB limit
    for i <- 1..7 do
      large_query = generate_large_query()
      Postgrex.prepare!(conn, "large_q_#{i}", large_query)
    end

    # Verify we can't create another large query after hitting memory limit
    assert_raise Postgrex.Error, ~r/max prepared statements memory limit reached/, fn ->
      large_query = generate_large_query()
      Postgrex.prepare!(conn, "memory_q_err", large_query)
    end
  end

  test "prepared statement soft limit (backend)", %{conns: conns} do
    test_pid = self()
    limit = PreparedStatements.client_limit()

    for {conn, i} <- Enum.with_index(conns, 1), j <- 1..limit do
      query = Postgrex.prepare!(conn, "q_#{i * j}", query_with_index(i * j))
      assert {:ok, _, %{rows: _}} = Postgrex.execute(conn, query, ["public"])
    end

    # trick: to ensure we check all backends, we start a transaction for each,
    # so we don't get the same connection twice
    for conn <- conns do
      spawn_link(fn ->
        Postgrex.transaction(conn, fn conn ->
          assert %{rows: [[count]]} =
                   Postgrex.query!(conn, "SELECT COUNT(*) FROM pg_prepared_statements", [])

          send(test_pid, {self(), count})

          receive do
            :end -> :ok
          end
        end)
      end)
    end

    for _c <- conns do
      assert_receive {pid, count}
      assert count <= PreparedStatements.backend_limit()
      send(pid, :end)
    end
  end

  test "prepare once, run twice (concurrent processes)", %{conns: conns} do
    test_pid = self()
    process_count = 200

    processes =
      for _ <- 0..process_count do
        conn = Enum.random(conns)

        spawn_link(fn ->
          name =
            :crypto.strong_rand_bytes(16)
            |> Base.encode16(case: :lower)

          receive do
            :q1 -> :ok
          end

          query = Postgrex.prepare!(conn, name, @sample_query)

          assert {:ok, q1, %{rows: _}} =
                   Postgrex.execute(conn, query, ["public"])

          assert q1.ref == query.ref

          receive do
            :q2 -> :ok
          end

          assert {:ok, q2, %{rows: _}} = Postgrex.execute(conn, query, ["private"])
          assert q2.ref == query.ref
          send(test_pid, :done)
        end)
      end

    for p <- processes do
      send(p, :q1)
    end

    for p <- processes do
      send(p, :q2)
    end

    for _ <- 1..process_count do
      assert_receive :done, 1000
    end
  end

  # In this scenario, client 1 prepares the statement. When client 2 tries to prepare it
  # again and get routed to the same backend connection (which already has it prepared),
  # it should work transparently for the client, as if it was prepared by client 2.
  test "prepared on client connection 1, then later on 2", %{conns: [c1, c2 | _]} do
    {:ok, q1} = Postgrex.prepare(c1, "prepared_statement", @sample_query)
    assert {:ok, _, _} = Postgrex.execute(c1, q1, ["public"])

    # We need to give some time to ensure that the same backend connection is back
    # in the pool (we use LIFO)
    :timer.sleep(20)

    {:ok, q2} = Postgrex.prepare(c2, "prepared_statement", @sample_query)
    assert {:ok, _, _} = Postgrex.execute(c2, q2, ["private"])
  end

  test "describes a named statement after its original backend is checked out" do
    client = connect_protocol_client()
    statement_name = "metadata_statement"

    initial_query = [
      :pgo_protocol.encode_parse_message(statement_name, "SELECT $1::int", []),
      encode_bind_message(statement_name, "7"),
      :pgo_protocol.encode_execute_message("", 0),
      :pgo_protocol.encode_sync_message()
    ]

    :ok = :gen_tcp.send(client, initial_query)
    initial_response = recv_until_ready_for_query(client)
    refute Enum.any?(initial_response, &match?(<<?E, _::binary>>, &1))

    holder = connect_protocol_client()
    :ok = :gen_tcp.send(holder, :pgo_protocol.encode_query_message("BEGIN"))
    holder_response = recv_until_ready_for_query(holder)
    assert Enum.any?(holder_response, &match?(<<?Z, 5::32, ?T>>, &1))

    :ok =
      :gen_tcp.send(client, [
        encode_describe_statement_message(statement_name),
        :pgo_protocol.encode_sync_message()
      ])

    describe_response = recv_until_ready_for_query(client)

    refute Enum.any?(describe_response, &match?(<<?E, _::binary>>, &1))
    assert Enum.any?(describe_response, &match?(<<?t, _::binary>>, &1))
    assert Enum.any?(describe_response, &match?(<<?T, _::binary>>, &1))

    :ok = :gen_tcp.send(holder, :pgo_protocol.encode_query_message("ROLLBACK"))
    recv_until_ready_for_query(holder)
  end

  test "prepared statements error on simple query protocol", %{conn_opts: conn_opts} do
    expected_message =
      "(EPSSIMPLEQUERY) transaction mode only supports prepared statements using the Extended Query Protocol"

    {:ok, conn} = start_supervised({SingleConnection, conn_opts})

    {:error, %Postgrex.Error{postgres: %{message: ^expected_message}}} =
      SingleConnection.query(conn, "PREPARE q0 AS SELECT $1")

    {:ok, conn} = start_supervised({SingleConnection, conn_opts})

    {:error, %Postgrex.Error{postgres: %{message: ^expected_message}}} =
      SingleConnection.query(conn, "EXECUTE q0('test')")

    {:ok, conn} = start_supervised({SingleConnection, conn_opts})

    {:error, %Postgrex.Error{postgres: %{message: ^expected_message}}} =
      SingleConnection.query(conn, "DEALLOCATE q0")

    {:ok, conn} = start_supervised({SingleConnection, conn_opts})

    {:error, %Postgrex.Error{postgres: %{message: ^expected_message}}} =
      SingleConnection.query(conn, "SELECT 1; PREPARE stmt AS SELECT 2")
  end

  test "allowed statements work on simple query protocol", %{conn_opts: conn_opts} do
    {:ok, conn} = start_supervised({SingleConnection, conn_opts})

    {:ok, _result} = SingleConnection.query(conn, "SELECT 1")

    {:ok, _result} =
      SingleConnection.query(
        conn,
        "INSERT INTO public.test (details) VALUES ('simple_query_test')"
      )

    {:ok, _result} =
      SingleConnection.query(
        conn,
        "UPDATE public.test SET details = 'updated' WHERE details = 'simple_query_test'"
      )

    {:ok, _result} =
      SingleConnection.query(conn, "DELETE FROM public.test WHERE details = 'updated'")
  end

  defp generate_large_query do
    large_array =
      List.duplicate(
        "'very_long_string_to_consume_memory_in_the_statement_storage'",
        2000
      )
      |> Enum.join(", ")

    """
    SELECT schemaname, tablename, tableowner, hasindexes
    FROM pg_tables
    WHERE tablename IN (#{large_array})
    OR schemaname = 'public'
    ORDER BY tablename;
    """
  end

  defp query_with_index(i) do
    """
    SELECT schemaname, tablename, tableowner, hasindexes
    FROM pg_tables
    WHERE schemaname = $1
    AND #{i} > 0
    ORDER BY tablename;
    """
  end

  defp connect_protocol_client do
    db_conf = Application.get_env(:supavisor, Repo)
    port = Application.get_env(:supavisor, :proxy_port_transaction)
    {:ok, sock} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false])

    ProtocolClient.authenticate(
      sock,
      "#{db_conf[:username]}.#{@tenant}",
      db_conf[:password]
    )

    sock
  end

  defp encode_bind_message(statement_name, value) do
    payload =
      IO.iodata_to_binary([
        0,
        statement_name,
        0,
        <<0::16, 1::16, byte_size(value)::32>>,
        value,
        <<0::16>>
      ])

    <<?B, byte_size(payload) + 4::32, payload::binary>>
  end

  defp encode_describe_statement_message(statement_name) do
    payload = <<?S, statement_name::binary, 0>>
    <<?D, byte_size(payload) + 4::32, payload::binary>>
  end

  defp recv_until_ready_for_query(sock, buffered \\ <<>>, packets \\ []) do
    {received_packets, rest} = Supavisor.Protocol.split_pkts(buffered)
    packets = packets ++ received_packets

    if Enum.any?(received_packets, &match?(<<?Z, _::binary>>, &1)) do
      packets
    else
      {:ok, more} = :gen_tcp.recv(sock, 0, 5000)
      recv_until_ready_for_query(sock, rest <> more, packets)
    end
  end
end
