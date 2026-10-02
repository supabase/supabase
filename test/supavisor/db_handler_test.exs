defmodule Supavisor.DbHandlerTest do
  use ExUnit.Case, async: true

  alias Supavisor.Errors.CheckoutError
  alias Supavisor.Errors.CheckoutTimeoutError
  alias Supavisor.Errors.DbHandlerExitedError

  import Supavisor.Asserts

  alias Supavisor.DbHandler, as: Db
  alias Supavisor.Protocol.BackendMessageHandler
  alias Supavisor.Protocol.MessageStreamer
  alias Supavisor.Protocol.PreparedStatements.BackendStorage
  alias Supavisor.Protocol.Server

  require BackendMessageHandler
  require MessageStreamer
  require Supavisor

  # import Mock
  setup do
    {:ok, id: make_id()}
  end

  defp make_id do
    Supavisor.id(
      type: :single,
      tenant: "tenant_#{System.unique_integer([:positive])}",
      user: "user",
      mode: :transaction,
      db: "postgres"
    )
  end

  defmodule MockDbHandler do
    use GenServer

    def start_link(behavior) do
      GenServer.start_link(__MODULE__, behavior)
    end

    def init(behavior) do
      {:ok, %{behavior: behavior, sock: {:fake_db_sock, self()}}}
    end

    def handle_call({:checkout, _sock, _caller}, _from, %{behavior: behavior} = state) do
      case behavior do
        :normal ->
          {:reply, {:ok, state.sock}, state}

        :crash ->
          raise "simulated crash"

        :normal_exit ->
          {:stop, :normal, state}

        :db_termination ->
          {:stop, {:shutdown, :db_termination}, state}

        :timeout ->
          # Don't reply to simulate timeout
          {:noreply, state}

        :terminating_with_error ->
          pg_error = %{"S" => "FATAL", "C" => "28P01", "M" => "password authentication failed"}

          {:reply,
           {:error,
            %Supavisor.Errors.CheckoutError{
              pid: self(),
              postgres_error: pg_error
            }}, state}
      end
    end
  end

  defmodule FakeManager do
    use GenServer

    def start_link(config) do
      GenServer.start_link(__MODULE__, config)
    end

    def init(config) do
      # Register with the expected name
      Registry.register(Supavisor.Registry.Tenants, {:manager, config.id}, nil)
      {:ok, config}
    end

    def handle_call(:get_config, _from, state) do
      config = %{
        id: state.id,
        connection_params: state.connection_params,
        user: state.user,
        tenant: state.tenant,
        mode: state.mode,
        replica_type: state.replica_type,
        log_level: state.log_level,
        tenant_feature_flags: state.tenant_feature_flags
      }

      {:reply, config, state}
    end

    def handle_call(:get_auth, _from, state) do
      {:reply, state.connection_params, state}
    end

    def handle_cast({:shutdown_with_error, _error}, state) do
      {:noreply, state}
    end
  end

  alias Supavisor.ConnectionParameters
  alias Supavisor.Secrets.{PasswordSecrets, SASLSecrets}

  defp connection_params(overrides \\ %{}) do
    defaults = %{
      host: ~c"localhost",
      port: 5432,
      ip_version: :inet,
      database: "postgres",
      application_name: "Supavisor"
    }

    merged = Map.merge(defaults, overrides)
    struct!(ConnectionParameters, merged)
  end

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

  # A `:busy` DbHandler data map.
  defp busy_data(overrides \\ %{}) do
    {backend_sock, _recv} = sockpair()
    {client_sock, _recv} = sockpair()

    base = %{
      caller: self(),
      pool: self(),
      mode: :transaction,
      sock: {:gen_tcp, backend_sock},
      client_sock: {:gen_tcp, client_sock},
      id: make_id(),
      stats: %{},
      expected_rfq: 0,
      open_batch?: false,
      backend_message_streaming: true,
      stream_state: MessageStreamer.new_stream_state(BackendMessageHandler)
    }

    Map.merge(base, overrides)
  end

  describe "init/1" do
    test "starts with correct state", %{id: id} do
      secrets = %PasswordSecrets{user: "user", password: "pass"}
      conn_params = connection_params(%{secrets: secrets})
      tenant = "test_tenant"
      user = "user"

      table = :ets.new(:tenant_cache, [:set, :public])
      Registry.register(Supavisor.Registry.Tenants, {:cache, id}, table)

      Supavisor.UpstreamAuthentication.put_upstream_auth_secrets(id, secrets)

      manager_config = %{
        id: id,
        connection_params: conn_params,
        tenant: {:single, tenant},
        user: user,
        mode: :transaction,
        replica_type: :single,
        log_level: nil,
        tenant_feature_flags: %{}
      }

      {:ok, _manager} = start_supervised({FakeManager, manager_config})

      args = %{id: id}

      {:ok, :connect, data, {:next_event, :internal, :connect}} = Db.init(args)
      assert data.sock == nil
      assert data.caller == nil
      assert data.connection_params.secrets == secrets
      assert data.tenant == manager_config.tenant
      assert data.db_state == nil
      assert data.parameter_status == %{}
      assert data.nonce == nil
      assert data.server_proof == nil
    end

    test "enters waiting_for_secrets state when upstream secrets are missing", %{id: id} do
      conn_params = connection_params()
      tenant = "test_tenant"
      user = "user"

      table = :ets.new(:tenant_cache, [:set, :public])
      Registry.register(Supavisor.Registry.Tenants, {:cache, id}, table)

      manager_config = %{
        id: id,
        connection_params: conn_params,
        tenant: {:single, tenant},
        user: user,
        mode: :transaction,
        replica_type: :single,
        log_level: nil,
        tenant_feature_flags: %{}
      }

      {:ok, _manager} = start_supervised({FakeManager, manager_config})

      args = %{id: id}

      assert {:ok, :waiting_for_secrets, data, []} = Db.init(args)
      assert data.id == id
      assert data.manager_ref != nil
    end

    test "transitions from waiting_for_secrets to connect when secrets become available",
         %{id: id} do
      conn_params = connection_params()
      tenant = "test_tenant"
      user = "user"
      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      table = :ets.new(:tenant_cache, [:set, :public])
      Registry.register(Supavisor.Registry.Tenants, {:cache, id}, table)

      manager_config = %{
        id: id,
        connection_params: conn_params,
        tenant: {:single, tenant},
        user: user,
        mode: :transaction,
        replica_type: :single,
        log_level: nil,
        tenant_feature_flags: %{}
      }

      {:ok, _manager} = start_supervised({FakeManager, manager_config})

      args = %{id: id}
      assert {:ok, :waiting_for_secrets, data, []} = Db.init(args)

      Supavisor.UpstreamAuthentication.put_upstream_auth_secrets(id, secrets)

      # Notify that secrets are available
      assert {:next_state, :connect, updated_data, {:next_event, :internal, :connect}} =
               Db.handle_event(:cast, :secrets_available, :waiting_for_secrets, data)

      assert updated_data.connection_params.secrets == secrets
      assert updated_data.manager_ref == nil
    end
  end

  describe "handle_event/4" do
    test "db is available", %{id: id} do
      {:ok, sock} = :gen_tcp.listen(0, mode: :binary, active: false)
      {:ok, {host, port}} = :inet.sockname(sock)

      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      conn_params =
        connection_params(%{
          host: host,
          port: port,
          database: "some database",
          application_name: "some application name",
          secrets: secrets
        })

      state =
        Db.handle_event(:internal, :connect, :connect, %{
          connection_params: conn_params,
          sock: {:gen_tcp, nil},
          id: id,
          mode: :session,
          proxy: false
        })

      assert {:next_state, :authentication,
              %{
                connection_params: ^conn_params,
                sock: {:gen_tcp, _},
                id: ^id,
                mode: :session
              }, {:state_timeout, 15_000, :authentication_timeout}} = state
    end

    test "db is not available", %{id: id} do
      # We assume that there is nothing running on this port
      # credo:disable-for-next-line Credo.Check.Readability.LargeNumbers
      {host, port} = {{127, 0, 0, 1}, 12345}

      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      conn_params =
        connection_params(%{
          host: host,
          port: port,
          database: "some database",
          application_name: "some application name",
          secrets: secrets
        })

      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:internal, :connect, :connect, %{
                 connection_params: conn_params,
                 sock: nil,
                 id: id,
                 proxy: false,
                 tenant: {:single, "some tenant"}
               })

      assert error["C"] == "08006"
    end

    test "connection_params.host given as a literal-address charlist is parsed and connected", %{
      id: id
    } do
      # credo:disable-for-next-line Credo.Check.Readability.LargeNumbers
      {host, port} = {~c"127.0.0.1", 12345}

      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      conn_params =
        connection_params(%{
          host: host,
          port: port,
          database: "some database",
          application_name: "some application name",
          secrets: secrets
        })

      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:internal, :connect, :connect, %{
                 connection_params: conn_params,
                 sock: nil,
                 id: id,
                 proxy: false,
                 tenant: {:single, "some tenant"}
               })

      assert error["C"] == "08006"
    end

    test "db connection times out", %{id: id} do
      # TEST-NET-1 (RFC 5737) — reserved for documentation, packets are
      # blackholed on a normal network so the TCP connect attempt times out
      # rather than getting refused.
      {host, port} = {{192, 0, 2, 1}, 5432}

      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      conn_params =
        connection_params(%{
          host: host,
          port: port,
          database: "some database",
          application_name: "some application name",
          secrets: secrets
        })

      # proxy: true uses the 1s connect timeout, keeping the test fast.
      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:internal, :connect, :connect, %{
                 connection_params: conn_params,
                 sock: nil,
                 id: id,
                 proxy: true,
                 tenant: {:single, "some tenant"}
               })

      assert error == %{
               "S" => "FATAL",
               "C" => "08006",
               "M" => "Failed to connect to database: {:error, :timeout}"
             }
    end

    test "authentication state times out", %{id: id} do
      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:state_timeout, :authentication_timeout, :authentication, %{
                 id: id,
                 proxy: false,
                 tenant: {:single, "some tenant"}
               })

      assert error == %{
               "S" => "FATAL",
               "C" => "08006",
               "M" =>
                 "Failed to connect to database: authentication did not complete within 15000ms"
             }
    end

    test "checkout returns error when in waiting_for_secrets state", %{id: id} do
      data = %{id: id}
      from = {self(), make_ref()}

      expected_postgres_error = %{
        "S" => "FATAL",
        "C" => "28P01",
        "M" =>
          "Authentication credentials are invalid. Please reconnect with fresh credentials to restore pool functionality."
      }

      assert {:keep_state_and_data,
              {:reply, ^from,
               {:error, %Supavisor.Errors.CheckoutError{postgres_error: ^expected_postgres_error}}}} =
               Db.handle_event(
                 {:call, from},
                 {:checkout, nil, self()},
                 :waiting_for_secrets,
                 data
               )
    end

    test "rejects connection when DB responds with SSL negotiation 'N'", %{id: id} do
      {:ok, listen} = :gen_tcp.listen(0, mode: :binary, active: false)
      {:ok, {host, port}} = :inet.sockname(listen)

      this = self()

      spawn(fn ->
        {:ok, recv} = :gen_tcp.accept(listen)

        :gen_tcp.controlling_process(recv, this)

        {:ok, _message} = :gen_tcp.recv(recv, 0)

        :gen_tcp.send(recv, <<?N>>)
      end)

      secrets = %PasswordSecrets{user: "some user", password: "secret"}

      conn_params =
        connection_params(%{
          host: host,
          port: port,
          database: "some database",
          application_name: "some application name",
          secrets: secrets,
          upstream_ssl: true
        })

      data = %{
        connection_params: conn_params,
        sock: {:gen_tcp, nil},
        id: id,
        proxy: false,
        tenant: {:single, "some tenant"},
        client_sock: nil
      }

      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:internal, :connect, :connect, data)

      assert error["C"] == "08006"
    end
  end

  describe "handle_event/4 info tcp authentication authentication_cleartext_password payload events" do
    test "keeps state while sending the cleartext password" do
      # `82` is `?R`, which identifies the payload tag as `:authentication`
      # `0, 0, 0, 8` is the packet length
      # `0, 0, 0, 3` is the authentication type, identified as `:authentication_cleartext_password`
      bin = <<82, 0, 0, 0, 8, 0, 0, 0, 3>>

      {a, b} = sockpair()

      content = {:tcp, b, bin}

      conn_params =
        connection_params(%{
          secrets: %PasswordSecrets{user: "some_user", password: "some_password"}
        })

      data = %{
        connection_params: conn_params,
        sock: {:gen_tcp, a}
      }

      assert {:keep_state, ^data} = Db.handle_event(:info, content, :authentication, data)

      assert {:ok, message} = :gen_tcp.recv(b, 0)

      password = <<"some_password", 0>>

      assert message ==
               <<?p, byte_size(password) + 4::32-big, password::binary>>
    end
  end

  describe "handle_event/4 info tcp authentication authentication_sasl_password payload events" do
    setup do
      {send, recv} = sockpair()

      conn_params =
        connection_params(%{
          secrets: %PasswordSecrets{user: "user", password: "pass"}
        })

      data = %{
        connection_params: conn_params,
        sock: {:gen_tcp, send},
        nonce: "some nonce"
      }

      %{data: data, recv: recv}
    end

    test "handles SASL authentication and sets nonce", %{data: data, recv: recv} do
      # ``?R` identifies the payload tag as `:authentication`
      # `22::32` is the packet length
      # `10::32` is the authentication type, identified as `:authentication_sasl_password`
      # `"SCRAM-SHA-256", 0` is payload`
      bin = <<?R, 22::32, 10::32, "SCRAM-SHA-256", 0>>

      content = {:tcp, recv, bin}

      assert {:keep_state, %{nonce: nonce}} =
               Db.handle_event(:info, content, :authentication, data)

      assert nonce != data.nonce
    end

    test "does not set a nonce when SASL authentication fails", %{data: data, recv: recv} do
      bin = <<?R, 21::32, 10::32, "SCRAM-SHA-256">>

      content = {:tcp, recv, bin}

      assert {:keep_state, %{nonce: nil}} = Db.handle_event(:info, content, :authentication, data)
    end
  end

  describe "handle_event/4 info tcp authentication authentication_server_first_message payload events" do
    test "handles server first message" do
      server_first = "r=nonce12345nonce67890,s=c2FsdA==,i=4096"
      pkt_len = 8 + byte_size(server_first)
      bin = <<?R, pkt_len::32, 11::32, server_first::binary>>

      {a, b} = sockpair()
      content = {:tcp, b, bin}

      secrets = %SASLSecrets{
        user: "user",
        digest: "SCRAM-SHA-256",
        iterations: 4096,
        salt: "salt",
        client_key: :binary.copy(<<1>>, 32),
        stored_key: :binary.copy(<<2>>, 32),
        server_key: :binary.copy(<<3>>, 32)
      }

      conn_params = connection_params(%{secrets: secrets})

      data = %{
        connection_params: conn_params,
        sock: {:gen_tcp, a},
        nonce: "nonce12345",
        server_proof: nil,
        derived_secrets: nil
      }

      assert {:keep_state, %{server_proof: server_proof}} =
               Db.handle_event(:info, content, :authentication, data)

      assert server_proof != data.server_proof
    end
  end

  describe "handle_event/4 info tcp error_response" do
    test "handles server invalid password", %{id: id} do
      bin =
        Server.error_message("28P01", "password authentication failed") |> IO.iodata_to_binary()

      {_a, b} = sockpair()
      content = {:tcp, b, bin}

      data = %{
        id: id,
        mode: :session,
        user: "some user",
        client_sock: nil,
        terminating_error: nil
      }

      # Step 1: Receive error from DB, should prepare to terminate
      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:info, content, :authentication, data)

      assert error == %{
               "C" => "28P01",
               "M" => "password authentication failed",
               "S" => "FATAL",
               "V" => "FATAL"
             }

      # Step 2: Process internal event, should transition to terminating_with_error
      assert {:next_state, :terminating_with_error, new_data} =
               Db.handle_event(
                 :internal,
                 {:terminate_with_error, error, :keep_pool},
                 :authentication,
                 data
               )

      assert new_data.terminating_error == error

      # Verify the cast was sent to self
      assert_received {:"$gen_cast", :finalize_termination}

      # Step 3: Process finalize_termination cast, should stop
      assert {:stop, :normal} =
               Db.handle_event(:cast, :finalize_termination, :terminating_with_error, new_data)
    end

    test "encodes and forwards server error to client socket", %{id: id} do
      bin = Server.error_message("XX000", "generic error") |> IO.iodata_to_binary()
      {send, recv} = sockpair()
      content = {:tcp, recv, bin}

      data = %{
        id: id,
        mode: :session,
        user: "some user",
        client_sock: {:gen_tcp, send},
        terminating_error: nil
      }

      # Step 1: Receive error from DB, should prepare to terminate
      assert {:keep_state_and_data,
              {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}} =
               Db.handle_event(:info, content, :authentication, data)

      assert error == %{"C" => "XX000", "M" => "generic error", "S" => "FATAL", "V" => "FATAL"}

      # Step 2: Process internal event, should forward error to client and transition to terminating_with_error
      assert {:next_state, :terminating_with_error, new_data} =
               Db.handle_event(
                 :internal,
                 {:terminate_with_error, error, :keep_pool},
                 :authentication,
                 data
               )

      assert new_data.terminating_error == error

      # Verify error was sent to client socket
      expected_error_bin = Server.encode_error_message(error) |> IO.iodata_to_binary()
      assert {:ok, ^expected_error_bin} = :gen_tcp.recv(recv, 0, 1000)

      # Verify the cast was sent to self
      assert_received {:"$gen_cast", :finalize_termination}

      # Step 3: Process finalize_termination cast, should stop
      assert {:stop, :normal} =
               Db.handle_event(:cast, :finalize_termination, :terminating_with_error, new_data)
    end
  end

  describe "handle_event/4 info tcp authentication authentication_md5_password payload events" do
    setup do
      bin = <<82, 0, 0, 0, 12, 0, 0, 0, 5, 100, 100, 100, 100>>

      {send, recv} = sockpair()

      data = %{sock: {:gen_tcp, send}}

      content = {:tcp, recv, bin}

      %{data: data, send: send, recv: recv, content: content}
    end

    test "keeps state while sending the digested md5 using the password method", %{
      data: data,
      recv: recv,
      content: content
    } do
      conn_params =
        connection_params(%{
          secrets: %PasswordSecrets{user: "some_user", password: "some_password"}
        })

      data = Map.put(data, :connection_params, conn_params)

      assert {:keep_state, ^data} = Db.handle_event(:info, content, :authentication, data)

      assert {:ok, message} = :gen_tcp.recv(recv, 0)

      assert message == <<?p, 40::integer-32, "md5", "ae5546ff52734a18d0277977f626946c", 0>>
    end

    test "keeps state while sending the digested md5 using secret", %{
      data: data,
      recv: recv,
      content: content
    } do
      conn_params =
        connection_params(%{
          secrets: %PasswordSecrets{user: "some_user", password: "some_password"}
        })

      data = Map.put(data, :connection_params, conn_params)

      assert {:keep_state, ^data} = Db.handle_event(:info, content, :authentication, data)

      assert {:ok, message} = :gen_tcp.recv(recv, 0)

      assert message == <<?p, 40::integer-32, "md5", "ae5546ff52734a18d0277977f626946c", 0>>
    end
  end

  describe "handle_event/4 info tcp error" do
    test "handles server invalid auth response" do
      bin = <<?X, 4::32>>

      {_a, b} = sockpair()
      content = {:tcp, b, bin}

      log =
        ExUnit.CaptureLog.capture_log(fn ->
          assert {:stop, :auth_error, %{}} =
                   Db.handle_event(:info, content, :authentication, %{})
        end)

      expected_pkt = %Supavisor.Protocol.Server.Pkt{
        tag: :undefined,
        len: 5,
        payload: :undefined,
        bin: <<?X, 4::32>>
      }

      assert log =~
               "DbHandler: Undefined auth response #{inspect({:unexpected_packet, expected_pkt})}"
    end
  end

  describe "handle_event/4 info tcp notice_response during authentication" do
    test "logs and keeps state when receiving a standalone notice", %{id: id} do
      message = ["SNOTICE", 0, "C00000", 0, "Msome notice", 0, 0]
      bin = IO.iodata_to_binary([<<?N, IO.iodata_length(message) + 4::32>>, message])

      {_a, b} = sockpair()
      content = {:tcp, b, bin}

      data = %{
        connection_params:
          connection_params(%{
            secrets: %PasswordSecrets{user: "user", password: "pass"}
          }),
        sock: {:gen_tcp, nil},
        id: id,
        mode: :session
      }

      log =
        ExUnit.CaptureLog.capture_log([level: :notice], fn ->
          assert :keep_state_and_data = Db.handle_event(:info, content, :authentication, data)
        end)

      expected_payload =
        inspect(%{"S" => "NOTICE", "C" => "00000", "M" => "some notice"})

      assert log =~ "DbHandler: Notice during authentication: " <> expected_payload
    end
  end

  describe "checkout/4 error handling" do
    test "successful checkout" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :normal})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:ok, {:fake_db_sock, ^mock_pid}} =
               Db.checkout(mock_pid, dummy_sock, caller, :transaction, 1000)
    end

    test "handles process crash during checkout" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :crash})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:error, %DbHandlerExitedError{pid: ^mock_pid}} =
               result = Db.checkout(mock_pid, dummy_sock, caller, :transaction, 1000)

      assert_valid_error(result)
    end

    test "handles process normal exit during checkout" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :normal_exit})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:error, %DbHandlerExitedError{pid: ^mock_pid, reason: :normal}} =
               result = Db.checkout(mock_pid, dummy_sock, caller, :transaction, 1000)

      assert_valid_error(result)
    end

    test "handles db_termination exit during checkout" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :db_termination})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:error, %DbHandlerExitedError{pid: ^mock_pid, reason: {:shutdown, :db_termination}}} =
               result = Db.checkout(mock_pid, dummy_sock, caller, :transaction, 1000)

      {:error, error} = assert_valid_error(result)
      assert Exception.message(error) =~ "connection to database closed"
    end

    test "handles checkout timeout" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :timeout})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:error, %CheckoutTimeoutError{timeout_ms: 100, mode: :transaction}} =
               result = Db.checkout(mock_pid, dummy_sock, caller, :transaction, 100)

      assert_valid_error(result)
    end

    test "handles checkout during terminating_with_error state" do
      {:ok, mock_pid} = start_supervised({MockDbHandler, :terminating_with_error})
      dummy_sock = {:gen_tcp, self()}
      caller = self()

      assert {:error, %CheckoutError{pid: _, postgres_error: %{"S" => "FATAL"}}} =
               result =
               Db.checkout(mock_pid, dummy_sock, caller, :transaction, 1000)

      assert_valid_error(result)
    end
  end

  describe "attempt_cleanup/1" do
    test "returns error when called on transaction mode" do
      {send, recv} = sockpair()

      data = %{
        sock: {:gen_tcp, send},
        mode: :transaction,
        caller: self()
      }

      assert {:keep_state_and_data,
              {:reply, _from, {:error, :cleanup_not_supported_in_transaction_mode}}} =
               Db.handle_event({:call, {self(), make_ref()}}, :cleanup, :idle, data)

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "returns error when called in invalid state" do
      {send, recv} = sockpair()

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self()
      }

      assert {:keep_state_and_data, {:reply, _from, {:error, :cant_cleanup_now}}} =
               Db.handle_event({:call, {self(), make_ref()}}, :cleanup, :connect, data)

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "sends DISCARD ALL when called in idle state" do
      {send, recv} = sockpair()

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self()
      }

      from = {self(), make_ref()}

      assert {:next_state, :waiting_cleanup, new_data, {:state_timeout, 5_000, :cleanup_timeout}} =
               Db.handle_event({:call, from}, :cleanup, :idle, data)

      assert new_data.waiting_cleanup == from
      assert new_data.pending_bin == <<>>

      assert {:ok, message} = :gen_tcp.recv(recv, 0, 1000)
      assert message =~ "DISCARD ALL"

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "sends DISCARD ALL when called in busy state" do
      {send, recv} = sockpair()

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self()
      }

      from = {self(), make_ref()}

      assert {:next_state, :waiting_cleanup, new_data, {:state_timeout, 5_000, :cleanup_timeout}} =
               Db.handle_event({:call, from}, :cleanup, :busy, data)

      assert new_data.waiting_cleanup == from
      assert new_data.pending_bin == <<>>

      assert {:ok, message} = :gen_tcp.recv(recv, 0, 1000)
      assert message =~ "DISCARD ALL"

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "transitions to idle when receiving ReadyForQuery" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self(),
        waiting_cleanup: from,
        pending_bin: <<>>
      }

      ready_for_query = Server.ready_for_query()
      content = {:tcp, recv, ready_for_query}

      assert {:next_state, :idle, new_data, {:reply, ^from, :ok}} =
               Db.handle_event(:info, content, :waiting_cleanup, data)

      assert new_data.caller == nil
      assert new_data.waiting_cleanup == nil
      assert new_data.pending_bin == nil

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "buffers incomplete messages while waiting for ReadyForQuery" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self(),
        waiting_cleanup: from,
        pending_bin: <<>>
      }

      partial_message = <<"partial">>
      content = {:tcp, recv, partial_message}

      assert {:keep_state, new_data} =
               Db.handle_event(:info, content, :waiting_cleanup, data)

      assert new_data.pending_bin == partial_message

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "stops when buffer limit exceeded" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        caller: self(),
        waiting_cleanup: from,
        pending_bin: <<>>
      }

      large_message = :binary.copy(<<1>>, 70_000)
      content = {:tcp, recv, large_message}

      assert {:stop, :normal} =
               Db.handle_event(:info, content, :waiting_cleanup, data)

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "stops on cleanup timeout" do
      data = %{
        mode: :session,
        caller: self()
      }

      assert {:stop, :normal} =
               Db.handle_event(:state_timeout, :cleanup_timeout, :waiting_cleanup, data)
    end
  end

  describe "set_application_name/2" do
    test "returns error when called on transaction mode" do
      {send, recv} = sockpair()

      data = %{sock: {:gen_tcp, send}, mode: :transaction}

      assert {:keep_state_and_data,
              {:reply, _from, {:error, :set_application_name_not_supported_in_transaction_mode}}} =
               Db.handle_event(
                 {:call, {self(), make_ref()}},
                 {:set_application_name, "app"},
                 :idle,
                 data
               )

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "skips when called in invalid state" do
      from = {self(), make_ref()}

      data = %{mode: :session}

      assert {:keep_state_and_data, {:reply, ^from, :ok}} =
               Db.handle_event({:call, from}, {:set_application_name, "app"}, :idle, data)

      assert {:keep_state_and_data, {:reply, ^from, :ok}} =
               Db.handle_event(
                 {:call, from},
                 {:set_application_name, "app"},
                 :authentication,
                 data
               )
    end

    test "sends a parameterized set_config query" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{sock: {:gen_tcp, send}, mode: :session}

      assert {:next_state, :setting_application_name, new_data,
              {:state_timeout, 5_000, :set_application_name_timeout}} =
               Db.handle_event(
                 {:call, from},
                 {:set_application_name, "my app's name"},
                 :busy,
                 data
               )

      assert new_data.set_app_name_from == from
      assert new_data.pending_bin == <<>>

      assert {:ok, message} = :gen_tcp.recv(recv, 0, 1000)
      assert message =~ "SELECT set_config('application_name', $1, false)"
      assert message =~ "my app's name"

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "swallows the response and replies :ok, returning to :busy" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        set_app_name_from: from,
        pending_bin: <<>>
      }

      content = {:tcp, recv, Server.ready_for_query()}

      assert {:next_state, :busy, new_data, {:reply, ^from, :ok}} =
               Db.handle_event(:info, content, :setting_application_name, data)

      assert new_data.pending_bin == nil
      assert new_data.set_app_name_from == nil

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "buffers incomplete messages while waiting for ReadyForQuery" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        set_app_name_from: from,
        pending_bin: <<>>
      }

      partial_message = <<"partial">>
      content = {:tcp, recv, partial_message}

      assert {:keep_state, new_data} =
               Db.handle_event(:info, content, :setting_application_name, data)

      assert new_data.pending_bin == partial_message

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "stops when buffer limit exceeded" do
      {send, recv} = sockpair()
      from = {self(), make_ref()}

      data = %{
        sock: {:gen_tcp, send},
        mode: :session,
        set_app_name_from: from,
        pending_bin: <<>>
      }

      large_message = :binary.copy(<<1>>, 70_000)
      content = {:tcp, recv, large_message}

      assert {:stop, :normal} =
               Db.handle_event(:info, content, :setting_application_name, data)

      :gen_tcp.close(send)
      :gen_tcp.close(recv)
    end

    test "stops on set application_name timeout" do
      data = %{mode: :session}

      assert {:stop, :normal} =
               Db.handle_event(
                 :state_timeout,
                 :set_application_name_timeout,
                 :setting_application_name,
                 data
               )
    end
  end

  describe "handle_event/4 prepared statement packets" do
    test "replays a missing parse before a named statement describe" do
      {backend_send, backend_recv} = sockpair()
      {client_send, client_recv} = sockpair()
      statement_name = "server_stmt"
      parse_pkt = <<?P, 27::32, statement_name::binary, 0, "select 1", 0, 0, 0>>
      describe_pkt = <<?D, 17::32, ?S, statement_name::binary, 0>>
      from = {self(), make_ref()}

      data =
        busy_data(%{
          sock: {:gen_tcp, backend_send},
          client_sock: {:gen_tcp, client_send},
          prepared_statements_storage: BackendStorage.LRU,
          prepared_statements: BackendStorage.LRU.new()
        })

      assert {:keep_state, new_data, {:reply, ^from, :ok}} =
               Db.handle_event(
                 {:call, from},
                 {:handle_ps_pkts, [{:describe_pkt, statement_name, describe_pkt, parse_pkt}]},
                 :busy,
                 data
               )

      assert {:ok, sent} = :gen_tcp.recv(backend_recv, 0, 1000)
      assert sent == parse_pkt <> describe_pkt

      assert BackendStorage.LRU.member?(new_data.prepared_statements, statement_name)

      handler_state = MessageStreamer.stream_state(new_data.stream_state, :handler_state)

      assert :queue.to_list(BackendMessageHandler.handler_state(handler_state, :action_queue)) ==
               [{:intercept, :parse}]

      assert {:keep_state, after_parse} =
               Db.handle_event(:info, {:tcp, :sock, <<?1, 4::32>>}, :busy, new_data)

      assert {:error, :timeout} = :gen_tcp.recv(client_recv, 0, 50)

      handler_state = MessageStreamer.stream_state(after_parse.stream_state, :handler_state)
      assert :queue.is_empty(BackendMessageHandler.handler_state(handler_state, :action_queue))
    end

    test "sends only describe when the named statement exists on the backend" do
      {backend_send, backend_recv} = sockpair()
      statement_name = "server_stmt"
      parse_pkt = <<?P, 27::32, statement_name::binary, 0, "select 1", 0, 0, 0>>
      describe_pkt = <<?D, 17::32, ?S, statement_name::binary, 0>>
      from = {self(), make_ref()}

      prepared_statements =
        BackendStorage.LRU.new()
        |> BackendStorage.LRU.put(statement_name)

      data =
        busy_data(%{
          sock: {:gen_tcp, backend_send},
          prepared_statements_storage: BackendStorage.LRU,
          prepared_statements: prepared_statements
        })

      assert {:keep_state, new_data, {:reply, ^from, :ok}} =
               Db.handle_event(
                 {:call, from},
                 {:handle_ps_pkts, [{:describe_pkt, statement_name, describe_pkt, parse_pkt}]},
                 :busy,
                 data
               )

      assert {:ok, ^describe_pkt} = :gen_tcp.recv(backend_recv, 0, 1000)

      handler_state = MessageStreamer.stream_state(new_data.stream_state, :handler_state)
      assert :queue.is_empty(BackendMessageHandler.handler_state(handler_state, :action_queue))
    end
  end

  describe "handle_event/4 :busy ReadyForQuery batching" do
    test "releases the backend once the single expected ReadyForQuery arrives" do
      data = busy_data(%{expected_rfq: 1})

      assert {:next_state, :idle, new_data} =
               Db.handle_event(:info, {:tcp, :sock, Server.ready_for_query()}, :busy, data)

      assert new_data.caller == nil
      assert new_data.expected_rfq == 0
      assert_received {:"$gen_cast", {:db_status, :ready_for_query}}
    end

    test "holds the backend until every pipelined ReadyForQuery has arrived" do
      data = busy_data(%{expected_rfq: 3})

      # Only one of the three expected replies so far: stay busy, no release.
      assert {:keep_state, data} =
               Db.handle_event(:info, {:tcp, :sock, Server.ready_for_query()}, :busy, data)

      refute_received {:"$gen_cast", {:db_status, :ready_for_query}}
      assert data.expected_rfq == 2

      # The remaining two arrive together, draining the batch, so we release.
      two = Server.ready_for_query() <> Server.ready_for_query()

      assert {:next_state, :idle, _new_data} =
               Db.handle_event(:info, {:tcp, :sock, two}, :busy, data)

      assert_received {:"$gen_cast", {:db_status, :ready_for_query}}
    end

    test "does not release mid-transaction even when the expected count is met" do
      data = busy_data(%{expected_rfq: 1})
      in_transaction = <<?Z, 5::32, ?T>>

      assert {:keep_state, data} =
               Db.handle_event(:info, {:tcp, :sock, in_transaction}, :busy, data)

      refute_received {:"$gen_cast", {:db_status, :ready_for_query}}
      assert data.expected_rfq == 0
    end

    test "detects a ReadyForQuery that splits across two socket reads" do
      <<first::binary-size(4), second::binary>> = Server.ready_for_query()
      data = busy_data(%{expected_rfq: 1})

      # Partial ReadyForQuery: nothing framed yet, stay busy.
      assert {:keep_state, data} =
               Db.handle_event(:info, {:tcp, :sock, first}, :busy, data)

      refute_received {:"$gen_cast", {:db_status, :ready_for_query}}

      # Second read completes it, the framer reassembles it, and we release.
      assert {:next_state, :idle, _new_data} =
               Db.handle_event(:info, {:tcp, :sock, second}, :busy, data)

      assert_received {:"$gen_cast", {:db_status, :ready_for_query}}
    end

    test "expect_ready_for_query cast accumulates the expected count" do
      data = busy_data()

      assert {:keep_state, data} =
               Db.handle_event(:cast, {:expect_ready_for_query, 2, false}, :busy, data)

      assert data.expected_rfq == 2

      assert {:keep_state, data} =
               Db.handle_event(:cast, {:expect_ready_for_query, 3, false}, :busy, data)

      assert data.expected_rfq == 5
    end

    test "expect_ready_for_query cast tracks whether a batch is left open" do
      data = busy_data()

      assert {:keep_state, data} =
               Db.handle_event(:cast, {:expect_ready_for_query, 0, true}, :busy, data)

      assert data.open_batch?

      assert {:keep_state, data} =
               Db.handle_event(:cast, {:expect_ready_for_query, 1, false}, :busy, data)

      refute data.open_batch?
    end

    test "does not check in while the client holds an extended batch open" do
      data = %{busy_data() | expected_rfq: 1, open_batch?: true, mode: :transaction}

      rfq = <<?Z, 5::32, ?I>>

      assert {:keep_state, data} = Db.handle_event(:info, {:tcp, :sock, rfq}, :busy, data)

      refute_received {:"$gen_cast", {:db_status, :ready_for_query}}
      assert data.caller
    end

    test "checks in once the batch is closed" do
      data = %{busy_data() | expected_rfq: 1, open_batch?: false, mode: :transaction}

      rfq = <<?Z, 5::32, ?I>>

      assert {:next_state, :idle, _data} =
               Db.handle_event(:info, {:tcp, :sock, rfq}, :busy, data)

      assert_received {:"$gen_cast", {:db_status, :ready_for_query}}
    end
  end
end
