defmodule Supavisor.Integration.TransactionPipeliningTest do
  use Supavisor.DataCase, async: false

  alias Supavisor.Support.ProtocolClient

  @moduletag :integration

  @tenants ["proxy_tenant_ps_disabled", "proxy_tenant_ps_enabled"]

  for tenant <- @tenants do
    test "delivers every reply in a pipelined batch (#{tenant})" do
      sock = connect(unquote(tenant))
      n = 50

      # Fire N simple queries in a single write so they pipeline.
      :ok = :gen_tcp.send(sock, pipeline(n))

      assert recv_ready_for_queries(sock, n) == n
    end

    test "releases and reuses the backend after a pipelined batch (#{tenant})" do
      sock = connect(unquote(tenant))

      :ok = :gen_tcp.send(sock, pipeline(5))
      assert recv_ready_for_queries(sock, 5) == 5

      # A fresh query on the same client connection must still succeed.
      :ok = :gen_tcp.send(sock, :pgo_protocol.encode_query_message("SELECT 1"))
      assert recv_ready_for_queries(sock, 1) == 1
    end

    test "regression: delivers every reply when a segment begins with a Sync (#{tenant})" do
      sock = connect(unquote(tenant))

      # A slow first statement keeps the ClientHandler :busy when the Sync arrives
      :ok = :gen_tcp.send(sock, :pgo_protocol.encode_query_message("SELECT pg_sleep(0.3)"))
      Process.sleep(50)

      # A sync, plus a query message.
      #
      # In the buggy implementation, the sync at the beginning of the packet would cause the 
      # following ReadyForQuery to trigger a checkin, and the query response wouldn't be received 
      :ok =
        :gen_tcp.send(sock, [
          <<?S, 4::32>>,
          :pgo_protocol.encode_query_message("SELECT pg_sleep(0.3)")
        ])

      # Both statements and the bare Sync each produce a ReadyForQuery.
      assert recv_ready_for_queries(sock, 3) == 3
    end

    test "does not fabricate a ReadyForQuery for an Execute sent without its Sync (#{tenant})" do
      sock = connect(unquote(tenant))
      marker = "batch#{System.unique_integer([:positive])}"

      # one :gen_tcp.send, so both batches land in the same read on
      # Supavisor's side -- batch A ends in a real Sync, batch B does not.
      :ok =
        :gen_tcp.send(sock, [
          extended_batch("select '#{marker}A' as m, pg_sleep(0.2)", sync?: true),
          extended_batch("select '#{marker}B' as m, pg_sleep(0.2)", sync?: false)
        ])

      # Batch A's real ReadyForQuery. Batch B hasn't
      # been given its Sync.
      assert recv_ready_for_queries(sock, 1) == 1

      db_conf = Application.get_env(:supavisor, Supavisor.Repo)

      {:ok, observer} =
        Postgrex.start_link(
          hostname: db_conf[:hostname],
          port: db_conf[:port],
          database: db_conf[:database],
          username: db_conf[:username],
          password: db_conf[:password]
        )

      Process.sleep(300)

      # batch B's backend SHOULD be stuck — withholding a Sync is *supposed*
      # to strand a backend
      assert stranded?(observer, marker <> "B")

      # THE CRUX: send batch B's Sync alone, in a second write - should be forwarded
      # to the still-open backend which replies with an RFQ.
      :ok = :gen_tcp.send(sock, :pgo_protocol.encode_sync_message())
      assert recv_ready_for_queries(sock, 1) == 1
      Process.sleep(200)

      refute stranded?(observer, marker <> "B"),
             "backend still stranded after its withheld Sync was sent -- fabricated ReadyForQuery"

      GenServer.stop(observer)
    end
  end

  defp connect(tenant) do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    port = Application.get_env(:supavisor, :proxy_port_transaction)

    {:ok, sock} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false])
    ProtocolClient.authenticate(sock, "#{db_conf[:username]}.#{tenant}", db_conf[:password])
    sock
  end

  # N simple queries as one iolist, so a single send pipelines them.
  defp pipeline(n) do
    Enum.map(1..n, fn i -> :pgo_protocol.encode_query_message("SELECT #{i}") end)
  end

  # Reads until `n` ReadyForQuery packets have been seen, returning the count.
  defp recv_ready_for_queries(sock, n, buf \\ <<>>) do
    {pkts, _rest} = Supavisor.Protocol.split_pkts(buf)
    count = Enum.count(pkts, &match?(<<?Z, _::binary>>, &1))

    if count >= n do
      count
    else
      case :gen_tcp.recv(sock, 0, 5000) do
        {:ok, more} ->
          recv_ready_for_queries(sock, n, buf <> more)

        {:error, reason} ->
          flunk("received only #{count}/#{n} ReadyForQuery before #{inspect(reason)}")
      end
    end
  end

  # Zero-parameter Bind (unnamed portal, unnamed statement)
  # -- the minimum needed to Execute an unnamed Parse.
  # https://www.postgresql.org/docs/current/protocol-message-formats.html
  defp encode_bind_message_no_params do
    payload = <<0, 0, 0::16, 0::16, 0::16>>
    <<?B, byte_size(payload) + 4::32, payload::binary>>
  end

  # One Extended Query Protocol batch: Parse+Bind+Execute, with the Sync
  # included or withheld per `sync?`.
  defp extended_batch(sql, sync?: sync?) do
    msgs = [
      :pgo_protocol.encode_parse_message("", sql, []),
      encode_bind_message_no_params(),
      :pgo_protocol.encode_execute_message("", 0)
    ]

    if sync?, do: msgs ++ [:pgo_protocol.encode_sync_message()], else: msgs
  end

  defp stranded?(observer, marker) do
    {:ok, res} =
      Postgrex.query(
        observer,
        "select 1 from pg_stat_activity where query like $1 and state = 'active' and wait_event_type = 'Client' and wait_event = 'ClientRead'",
        ["%#{marker}%"]
      )

    res.num_rows > 0
  end
end
