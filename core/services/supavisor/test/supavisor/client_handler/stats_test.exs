defmodule Supavisor.ClientHandler.StatsTest do
  use Supavisor.E2ECase, async: false

  alias Supavisor.TelemetryHelper

  @moduletag telemetry: true

  setup ctx do
    ref = make_ref()

    :telemetry.attach(
      {ctx.test, :client_network},
      [:supavisor, :client, :network, :stat],
      &TelemetryHelper.handle_event/4,
      {self(), ref}
    )

    :telemetry.attach(
      {ctx.test, :db_network},
      [:supavisor, :db, :network, :stat],
      &TelemetryHelper.handle_event/4,
      {self(), ref}
    )

    :telemetry.attach(
      {ctx.test, :client_query},
      [:supavisor, :client, :query, :stop],
      &TelemetryHelper.handle_event/4,
      {self(), ref}
    )

    :telemetry.attach(
      {ctx.test, :client_handler_state},
      [:supavisor, :client_handler, :state],
      &TelemetryHelper.handle_event/4,
      {self(), ref}
    )

    on_exit(fn ->
      :telemetry.detach({ctx.test, :client_network})
      :telemetry.detach({ctx.test, :db_network})
      :telemetry.detach({ctx.test, :client_query})
      :telemetry.detach({ctx.test, :client_handler_state})
    end)

    {:ok, telemetry: ref}
  end

  setup ctx do
    if ctx[:external_id] do
      {:ok, db: "postgres", user: "postgres.#{ctx.external_id}"}
    else
      create_instance([__MODULE__, ctx.line])
    end
  end

  defp setup_connection(mode, ctx) do
    port_key = if mode == :transaction, do: :proxy_port_transaction, else: :proxy_port_session

    start_supervised!(
      {SingleConnection,
       hostname: "localhost",
       port: Application.fetch_env!(:supavisor, port_key),
       database: ctx.db,
       username: ctx.user,
       password: "postgres"}
    )
  end

  defp flush_mailbox(ref) do
    receive do
      {^ref, _, _} -> flush_mailbox(ref)
    after
      100 -> :ok
    end
  end

  for mode <- [:transaction, :session] do
    test "client network usage increase on query in #{mode} mode",
         %{
           telemetry: telemetry,
           external_id: external_id
         } = ctx do
      mode = unquote(mode)
      conn = setup_connection(mode, ctx)

      assert_receive {^telemetry, {:client_network, _, %{tenant: ^external_id, mode: ^mode}}, _}

      assert {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      assert_receive {^telemetry,
                      {:client_network, %{recv_oct: recv, send_oct: sent},
                       %{tenant: ^external_id, mode: ^mode}}, _}

      assert recv > 0
      assert sent > 0
    end

    test "client network usage increase on just auth in #{mode} mode",
         %{
           external_id: external_id,
           telemetry: telemetry
         } = ctx do
      mode = unquote(mode)
      _conn = setup_connection(mode, ctx)

      assert_receive {^telemetry,
                      {:client_network, %{recv_oct: recv, send_oct: sent},
                       %{tenant: ^external_id, mode: ^mode}}, _}

      assert recv > 0
      assert sent > 0
    end
  end

  @tag external_id: "metrics_tenant", mode: :transaction
  test "proxy telemetry events", %{telemetry: telemetry} = ctx do
    assert {:ok, _pid, other_node} = Supavisor.Support.Cluster.start_node()

    :erpc.call(other_node, :telemetry, :attach, [
      {ctx.test, :client_network},
      [:supavisor, :client, :network, :stat],
      &TelemetryHelper.handle_event/4,
      {self(), telemetry}
    ])

    :erpc.call(other_node, :telemetry, :attach, [
      {ctx.test, :client_query},
      [:supavisor, :client, :query, :stop],
      &TelemetryHelper.handle_event/4,
      {self(), telemetry}
    ])

    :erpc.call(other_node, :telemetry, :attach, [
      {ctx.test, :db_network},
      [:supavisor, :db, :network, :stat],
      &TelemetryHelper.handle_event/4,
      {self(), telemetry}
    ])

    # Ensures we start the pool on the local node
    _this_conn =
      start_supervised!(
        {SingleConnection,
         hostname: "localhost",
         port: Application.fetch_env!(:supavisor, :proxy_port_transaction),
         database: ctx.db,
         username: ctx.user,
         password: "postgres"},
        id: :postgrex_this
      )

    stop_supervised!(:postgrex_this)

    # Flush any telemetry from the first connection
    flush_mailbox(telemetry)

    proxied_conn =
      start_supervised!(
        {SingleConnection,
         hostname: "localhost",
         port: Application.fetch_env!(:supavisor, :secondary_proxy_port),
         database: ctx.db,
         username: ctx.user,
         password: "postgres"},
        id: :postgrex_another
      )

    assert {:ok, _} = SingleConnection.query(proxied_conn, "SELECT 1")

    this_node = Node.self()
    external_id = ctx.external_id

    assert_receive {^telemetry, {:client_network, _, %{tenant: ^external_id}}, ^other_node},
                   10_000

    refute_receive {^telemetry, {:client_network, _, %{tenant: ^external_id}}, ^this_node}, 2_500

    # Verify db_network telemetry is emitted from this_node only
    assert_receive {^telemetry, {:db_network, _, %{tenant: ^external_id}}, ^this_node}
    refute_receive {^telemetry, {:db_network, _, %{tenant: ^external_id}}, ^other_node}, 2_500

    # Verify query telemetry is received on both nodes with correct proxy metadata
    assert_receive {^telemetry, {:client_query, _, %{tenant: ^external_id, proxy: false}},
                    ^this_node}

    assert_receive {^telemetry, {:client_query, _, %{tenant: ^external_id, proxy: true}},
                    ^other_node}
  end

  for mode <- [:transaction, :session] do
    test "server network usage increase on query in #{mode} mode",
         %{telemetry: telemetry} = ctx do
      mode = unquote(mode)
      external_id = ctx.external_id
      conn = setup_connection(mode, ctx)

      # Consume auth telemetry
      assert_receive {^telemetry, {:db_network, _, %{tenant: ^external_id, mode: ^mode}}, _}

      assert {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      assert_receive {^telemetry,
                      {:db_network, %{recv_oct: recv, send_oct: sent},
                       %{tenant: ^external_id, mode: ^mode}}, _}

      assert recv > 0
      assert sent > 0
    end

    test "server network usage increase on just auth in #{mode} mode",
         %{telemetry: telemetry} =
           ctx do
      mode = unquote(mode)
      external_id = ctx.external_id
      _conn = setup_connection(mode, ctx)

      assert_receive {^telemetry,
                      {:db_network, %{recv_oct: recv, send_oct: sent},
                       %{tenant: ^external_id, mode: ^mode}}, _}

      assert recv > 0
      assert sent > 0
    end
  end

  for mode <- [:transaction, :session] do
    test "client query telemetry emitted on single query in #{mode} mode",
         %{
           telemetry: telemetry,
           external_id: external_id
         } = ctx do
      mode = unquote(mode)
      conn = setup_connection(mode, ctx)

      assert {:ok, _} = SingleConnection.query(conn, "SELECT 1")

      assert_receive {^telemetry,
                      {:client_query, %{duration: duration},
                       %{tenant: ^external_id, mode: ^mode}}, _}

      assert is_integer(duration)
      assert duration > 0
    end

    test "client query telemetry emitted on multiple queries in #{mode} mode",
         %{
           telemetry: telemetry,
           external_id: external_id
         } = ctx do
      mode = unquote(mode)
      conn = setup_connection(mode, ctx)

      # This test specifically validates the fix for session mode where db_status wasn't being called
      for _i <- 1..3 do
        assert {:ok, _} = SingleConnection.query(conn, "SELECT 1")

        assert_receive {^telemetry,
                        {:client_query, %{duration: duration},
                         %{tenant: ^external_id, mode: ^mode}}, _}

        assert is_integer(duration)
        assert duration > 0
      end
    end
  end

  for mode <- [:transaction, :session] do
    test "client handler state transitions emit telemetry in #{mode} mode",
         %{
           telemetry: telemetry,
           external_id: external_id
         } = ctx do
      _conn = setup_connection(unquote(mode), ctx)

      # State transitions (idle <-> busy are not emitted by design):
      assert_receive {^telemetry,
                      {:client_handler_state, %{duration: _},
                       %{
                         from_state: :handshake,
                         to_state: :auth_scram_first_wait,
                         tenant: ^external_id
                       }}, _}

      assert_receive {^telemetry,
                      {:client_handler_state, %{duration: _},
                       %{
                         from_state: :auth_scram_first_wait,
                         to_state: :auth_scram_final_wait,
                         tenant: ^external_id
                       }}, _}

      assert_receive {^telemetry,
                      {:client_handler_state, %{duration: _},
                       %{
                         from_state: :auth_scram_final_wait,
                         to_state: :connecting,
                         tenant: ^external_id
                       }}, _}

      assert_receive {^telemetry,
                      {:client_handler_state, %{duration: _},
                       %{from_state: :connecting, to_state: :idle, tenant: ^external_id}}, _}
    end
  end
end
