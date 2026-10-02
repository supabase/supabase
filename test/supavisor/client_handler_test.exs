defmodule Supavisor.ClientHandlerTest do
  use ExUnit.Case, async: true

  alias Supavisor.Protocol.FrontendMessageHandler
  alias Supavisor.Protocol.MessageStreamer

  @subject Supavisor.ClientHandler

  defp sockpair do
    {:ok, listen} = :gen_tcp.listen(0, mode: :binary, active: false)
    {:ok, {address, port}} = :inet.sockname(listen)
    this = self()
    ref = make_ref()

    spawn(fn ->
      {:ok, recv} = :gen_tcp.accept(listen)
      :gen_tcp.controlling_process(recv, this)
      send(this, {ref, recv})
    end)

    {:ok, send} = :gen_tcp.connect(address, port, mode: :binary, active: false)
    assert_receive {^ref, recv}

    {send, recv}
  end

  describe "TLS alert handling" do
    setup do
      sock =
        {:sslsocket,
         {
           :gen_tcp,
           :some_port,
           :tls_connection,
           [session_id_tracker: :some_pid]
         }, [:some_pid]}

      data = %{sock: {:ssl, sock}}
      {:ok, sock: sock, data: data}
    end

    test "handles fatal TLS alert by terminating", %{sock: sock, data: data} do
      error =
        {:ssl_error, sock,
         {
           :tls_alert,
           {:user_canceled,
            ~c"TLS server: In state connection received CLIENT ALERT: Fatal - User Canceled\n"}
         }}

      assert {:stop, :normal} == @subject.handle_event(:info, error, nil, data)
    end

    test "handles warning TLS alert by keeping connection alive", %{sock: sock, data: data} do
      error =
        {:ssl_error, sock,
         {
           :tls_alert,
           {:close_notify,
            ~c"TLS server: In state connection received CLIENT ALERT: Warning - Close Notify\n"}
         }}

      assert :keep_state_and_data == @subject.handle_event(:info, error, nil, data)
    end

    test "handles non-alert SSL errors by keeping state", %{sock: sock, data: data} do
      error = {:ssl_error, sock, :some_other_reason}

      assert :keep_state_and_data == @subject.handle_event(:info, error, nil, data)
    end
  end

  describe "waiting for a free client slot" do
    alias Supavisor.Errors.MaxConnectionsError

    setup do
      %{
        exception: MaxConnectionsError.new(:transaction, 2),
        retry_event: {:hello, {:single, {"user", "tenant", "postgres", nil, false, false, nil}}},
        budget: Application.get_env(:supavisor, :admission_retries)
      }
    end

    test "holds the connection and schedules a retry while budget remains", ctx do
      data = %{admission_retries: 0, id: nil}
      retry_event = ctx.retry_event

      assert {:keep_state, %{admission_retries: 1},
              {{:timeout, :admission_retry}, delay, ^retry_event}} =
               @subject.wait_for_slot_or_terminate(data, retry_event, ctx.exception)

      assert delay > 0
    end

    test "keeps counting retries so the total wait stays bounded", ctx do
      data = %{admission_retries: ctx.budget - 1, id: nil}

      assert {:keep_state, %{admission_retries: retries}, _action} =
               @subject.wait_for_slot_or_terminate(data, ctx.retry_event, ctx.exception)

      assert retries == ctx.budget
    end

    test "sends the original error to the client once the budget is exhausted", ctx do
      {client, server} = sockpair()
      data = %{admission_retries: ctx.budget, id: nil, sock: {:gen_tcp, server}}

      assert {:stop, :normal} =
               @subject.wait_for_slot_or_terminate(data, ctx.retry_event, ctx.exception)

      assert {:ok, response} = :gen_tcp.recv(client, 0, 1_000)
      assert response =~ "EMAXCONN"
      assert response =~ "max client connections reached"
    end

    test "replays the pending event when the retry timer fires", ctx do
      retry_event = ctx.retry_event

      assert {:keep_state_and_data, {:next_event, :internal, ^retry_event}} =
               @subject.handle_event(
                 {:timeout, :admission_retry},
                 retry_event,
                 :handshake,
                 %{}
               )
    end
  end

  describe "socket DOWN handler" do
    test "handles DOWN message for matching ref" do
      ref = make_ref()
      data = %{sock_ref: ref, mode: :transaction}

      assert {:stop, :normal} =
               @subject.handle_event(:info, {:DOWN, ref, :port, self(), :normal}, :idle, data)
    end

    test "ignores DOWN message with non-matching ref" do
      ref = make_ref()
      other_ref = make_ref()
      data = %{sock_ref: ref}

      assert :keep_state_and_data =
               @subject.handle_event(
                 :info,
                 {:DOWN, other_ref, :port, self(), :normal},
                 :idle,
                 data
               )
    end
  end

  describe "ban check" do
    alias Supavisor.ClientHandler.Checks
    alias Supavisor.Errors.TenantBannedError
    alias Supavisor.Tenants.Tenant

    test "returns :ok when tenant is not banned" do
      info = %{tenant: %Tenant{banned_at: nil, ban_reason: nil}}
      assert :ok = Checks.check_tenant_not_banned(info)
    end

    test "returns TenantBannedError for a permanent ban (banned_until nil)" do
      info = %{
        tenant: %Tenant{
          banned_at: ~U[2026-01-01 00:00:00Z],
          ban_reason: "abuse",
          banned_until: nil
        }
      }

      assert {:error, %TenantBannedError{ban_reason: "abuse"}} =
               Checks.check_tenant_not_banned(info)
    end

    test "returns TenantBannedError when banned_until is in the future" do
      future = DateTime.utc_now() |> DateTime.add(3600, :second)

      info = %{
        tenant: %Tenant{
          banned_at: ~U[2026-01-01 00:00:00Z],
          ban_reason: "abuse",
          banned_until: future
        }
      }

      assert {:error, %TenantBannedError{ban_reason: "abuse"}} =
               Checks.check_tenant_not_banned(info)
    end

    test "returns :ok when banned_until is in the past (ban expired)" do
      past = DateTime.utc_now() |> DateTime.add(-3600, :second)

      info = %{
        tenant: %Tenant{
          banned_at: ~U[2026-01-01 00:00:00Z],
          ban_reason: "abuse",
          banned_until: past
        }
      }

      assert :ok = Checks.check_tenant_not_banned(info)
    end

    test "TenantBannedError produces a FATAL postgres error message" do
      error = %TenantBannedError{ban_reason: "billing"}
      postgres_error = TenantBannedError.postgres_error(error)
      assert postgres_error["S"] == "FATAL"
      assert postgres_error["M"] =~ "EBANNED"
      assert postgres_error["M"] =~ "billing"
    end
  end

  describe "startup packet log_level option" do
    test "sets process log level from options" do
      bin =
        <<79::32,
          "\x00\x03\x00\x00user\x00postgres.dev_tenant\x00database\x00postgres\x00options\x00-c log_level=debug\x00\x00">>

      data = %{sock: {:gen_tcp, :fake_port}, id: "test", app_name: nil, invalid_options: []}

      assert {:keep_state, %{app_name: ""},
              {:next_event, :internal,
               {:hello, {:single, {"postgres", "dev_tenant", "postgres", nil, false, nil, nil}}}}} =
               @subject.handle_event(:info, {:tcp, :fake_port, bin}, :handshake, data)

      assert Logger.get_process_level(self()) == :debug
    end
  end

  describe "handle_event/4 :busy ReadyForQuery expectation" do
    test "forwards the expected ReadyForQuery count to the DbHandler in transaction mode" do
      {db_sock, _recv} = sockpair()

      data = %{
        mode: :transaction,
        db_connection: {:pool, self(), {:gen_tcp, db_sock}},
        tenant_feature_flags: %{},
        stream_state: MessageStreamer.new_stream_state(FrontendMessageHandler)
      }

      # Three pipelined simple queries produce three ReadyForQuery replies.
      batch =
        <<?Q, 12::32, "SELECT 1">> <> <<?Q, 12::32, "SELECT 2">> <> <<?Q, 12::32, "SELECT 3">>

      assert {:keep_state, _data} =
               @subject.handle_event(:info, {:tcp, :sock, batch}, :busy, data)

      assert_received {:"$gen_cast", {:expect_ready_for_query, 3, false}}
    end

    test "reports an extended batch left open without its Sync" do
      {db_sock, _recv} = sockpair()

      data = %{
        mode: :transaction,
        db_connection: {:pool, self(), {:gen_tcp, db_sock}},
        tenant_feature_flags: %{},
        stream_state: MessageStreamer.new_stream_state(FrontendMessageHandler)
      }

      # Parse/Bind/Execute with no Sync: no ReadyForQuery is expected, but the
      # backend is left holding the batch.
      batch =
        <<?P, 16::32, 0, "select 1", 0, 0, 0>> <>
          <<?B, 12::32, 0, 0, 0, 0, 0, 0, 0, 0>> <> <<?E, 9::32, 0, 0, 0, 0, 200>>

      assert {:keep_state, _data} =
               @subject.handle_event(:info, {:tcp, :sock, batch}, :busy, data)

      assert_received {:"$gen_cast", {:expect_ready_for_query, 0, true}}
    end

    test "a Sync closes a previously open batch" do
      {db_sock, _recv} = sockpair()

      data = %{
        mode: :transaction,
        db_connection: {:pool, self(), {:gen_tcp, db_sock}},
        tenant_feature_flags: %{},
        stream_state: MessageStreamer.new_stream_state(FrontendMessageHandler)
      }

      batch = <<?P, 16::32, 0, "select 1", 0, 0, 0>> <> <<?E, 9::32, 0, 0, 0, 0, 200>>

      assert {:keep_state, data} =
               @subject.handle_event(:info, {:tcp, :sock, batch}, :busy, data)

      assert_received {:"$gen_cast", {:expect_ready_for_query, 0, true}}

      assert {:keep_state, _data} =
               @subject.handle_event(:info, {:tcp, :sock, <<?S, 4::32>>}, :busy, data)

      assert_received {:"$gen_cast", {:expect_ready_for_query, 1, false}}
    end

    test "does not send an expectation in session mode" do
      {db_sock, _recv} = sockpair()

      data = %{
        mode: :session,
        db_connection: {:pool, self(), {:gen_tcp, db_sock}},
        tenant_feature_flags: %{},
        stream_state: MessageStreamer.new_stream_state(FrontendMessageHandler)
      }

      batch = <<?Q, 12::32, "SELECT 1">> <> <<?Q, 12::32, "SELECT 2">>

      assert {:keep_state, _data} =
               @subject.handle_event(:info, {:tcp, :sock, batch}, :busy, data)

      refute_received {:"$gen_cast", {:expect_ready_for_query, _count, _open_batch?}}
    end
  end
end
