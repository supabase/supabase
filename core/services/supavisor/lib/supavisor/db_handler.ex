defmodule Supavisor.DbHandler do
  @moduledoc """
  This module contains functions to start a connection to the database, send
  requests to the database, and handle incoming messages from clients.

  The state machine uses the Supavisor.Protocol.Server module to decode messages
  from the database and sends messages to the client socket it received on checkout.

  ## Startup modes

  DbHandler has two startup paths depending on the mode:

  ### Pool mode (transaction/session)

  Started via `start_link/1` by poolboy with a Manager config. Fetches auth
  secrets (or enters `:waiting_for_secrets` if unavailable), then connects to
  the database immediately. Workers are long-lived and shared across clients
  via checkout/checkin.

  ### Proxy mode

  Started via `start_link/1` under a DynamicSupervisor with full connection
  args. Connects to the proxy node immediately. One worker per client, with the
  DynamicSupervisor's `:max_children` enforcing the connection limit.
  """

  @behaviour :gen_statem

  require Logger
  require Supavisor
  require Supavisor.Protocol.BackendMessageHandler, as: BackendMessageHandler
  require Supavisor.Protocol.Server, as: Server
  require Supavisor.Protocol.MessageStreamer, as: MessageStreamer

  alias Supavisor.ConnectionParameters
  alias Supavisor.Errors.CheckoutError
  alias Supavisor.Errors.CheckoutTimeoutError
  alias Supavisor.Errors.DbHandlerExitedError
  alias Supavisor.Secrets.PasswordSecrets
  alias Supavisor.Protocol.{PreparedStatements, StartupOptions}
  alias Supavisor.Protocol.PreparedStatements.BackendStorage

  alias Supavisor.{
    ClientHandler,
    HandlerHelpers,
    Helpers,
    Monitoring.Telem,
    Protocol.BackendMessageHandler,
    Protocol.Debug,
    Protocol.MessageStreamer,
    Protocol.Server
  }

  @type state ::
          :connect
          | :connect_cooldown
          | :authentication
          | :idle
          | :busy
          | :terminating_with_error
          | :waiting_for_secrets
          | :setting_application_name

  @sock_closed [:tcp_closed, :ssl_closed]
  @proto [:tcp, :ssl]
  @switch_active_count Application.compile_env(:supavisor, :switch_active_count)
  @cleanup_buffer_limit 65_536
  @connect_cooldown_ms 2_500
  @authentication_timeout_ms 15_000
  @tls_send_chunk_size 8192

  @auth_error_actions %{
    "28P01" => {:keep_pool, :invalidate_secrets},
    "28000" => {:keep_pool, :invalidate_secrets},
    "3D000" => {:shutdown_pool, :none},
    "42501" => {:shutdown_pool, :none},
    "22023" => {:shutdown_pool, :none},
    "57P03" => {:graceful_shutdown_pool, :none}
  }

  @doc """
  Starts a DbHandler state machine.
  """
  def start_link(config),
    do: :gen_statem.start_link(__MODULE__, config, hibernate_after: 5_000)

  def child_spec(config) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [config]},
      restart: :temporary
    }
  end

  @doc """
  Checks out a DbHandler process

  Requires a client socket. The DbHandler will forward messages directly to the
  client socket when possible.

  Returns the server socket, which the client may write messages directly to.
  """
  @spec checkout(pid(), Supavisor.sock(), pid(), Supavisor.mode(), timeout()) ::
          {:ok, Supavisor.sock()}
          | {:error, DbHandlerExitedError.t()}
          | {:error, CheckoutError.t()}
          | {:error, CheckoutTimeoutError.t()}
  def checkout(pid, sock, caller, mode, timeout \\ 15_000) do
    :gen_statem.call(pid, {:checkout, sock, caller}, timeout)
  catch
    :exit, {:timeout, _} ->
      {:error, %CheckoutTimeoutError{mode: mode, timeout_ms: timeout}}

    :exit, {reason, _} ->
      {:error, %DbHandlerExitedError{pid: pid, reason: reason}}
  end

  @doc """
  Tells the DbHandler how many more ReadyForQuery messages to expect for the batch being forwarded.

  The ClientHandler should send this *before* forwarding the messages that produce them,
  so the count reaches the DbHandler before the responses do.

  `open_batch?` reports whether the client left an extended protocol batch
  waiting for its Sync. The connection cannot be released while that is true,
  since the backend is still holding the batch.
  """
  @spec expect_ready_for_query(pid(), non_neg_integer(), boolean()) :: :ok
  def expect_ready_for_query(pid, count, open_batch?),
    do: :gen_statem.cast(pid, {:expect_ready_for_query, count, open_batch?})

  @doc """
  Attempts to clean up session state by sending DISCARD ALL to the database.

  The caller is responsible for ensuring that:
  - The DbHandler is NOT actively processing a query
  - The DbHandler is NOT in a transaction (no uncommitted changes)
  - The DbHandler is in session mode (not transaction mode)
  """
  @spec attempt_cleanup(pid()) :: :ok | {:error, term()}
  def attempt_cleanup(db_handler_pid) do
    :gen_statem.call(db_handler_pid, :cleanup, 5_000)
  catch
    :exit, reason ->
      {:error, {:exit, reason}}
  end

  @doc """
  Sets `application_name` on the backend connection.

  Intended to be called while the DbHandler is checked out (`:busy`), which is
  how the only caller uses it — right after checkout during connection setup.
  In any other state it is a best-effort no-op that replies `:ok` without
  touching the backend. Only supported in session mode.
  """
  @spec set_application_name(pid(), String.t()) :: :ok | {:error, term()}
  def set_application_name(db_handler_pid, name) do
    :gen_statem.call(db_handler_pid, {:set_application_name, name}, 5_000)
  catch
    :exit, reason ->
      {:error, {:exit, reason}}
  end

  @doc """
  Sends prepared statement packets to a DbHandler

  Different from most packets, prepared statements packets involve state at the DbHandler,
  and hence can't be sent directly to the database socket. Instead, they should be sent
  to the DbHandler through this function.
  """
  @spec handle_prepared_statement_pkts(pid, [PreparedStatements.handled_pkt()]) :: :ok
  def handle_prepared_statement_pkts(pid, pkts) do
    :gen_statem.call(pid, {:handle_ps_pkts, pkts}, 15_000)
  end

  @doc """
  Stops a DbHandler
  """
  @spec stop(pid()) :: :ok
  def stop(pid) do
    Logger.debug("DbHandler: Stop pid #{inspect(pid)}")
    :gen_statem.stop(pid, {:shutdown, :client_termination}, 5_000)
  end

  @doc """
  Notifies a DbHandler that secrets are now available
  """
  @spec notify_secrets_available(pid()) :: :ok
  def notify_secrets_available(pid) do
    :gen_statem.cast(pid, :secrets_available)
  end

  @impl true
  def init(args) do
    Process.flag(:trap_exit, true)

    {id, config} =
      case args do
        %{proxy: true} -> {args.id, args}
        %{} -> {args.id, Supavisor.Manager.get_config(args.id)}
      end

    proxy = Map.get(config, :proxy, false)

    Helpers.set_log_level(config.log_level)
    Helpers.set_max_heap_size(90)
    Logger.metadata(project: config.tenant, user: config.user, mode: config.mode)

    conn_params =
      if proxy do
        config.connection_params
      else
        %ConnectionParameters{config.connection_params | application_name: "Supavisor"}
      end

    storage_mod = BackendStorage.select(config.tenant_feature_flags)

    pool = if pool_name = Map.get(args, :pool), do: GenServer.whereis(pool_name)

    data = %{
      id: id,
      sock: nil,
      connection_params: conn_params,
      user: config.user,
      tenant: config.tenant,
      tenant_feature_flags: config.tenant_feature_flags,
      db_state: nil,
      parameter_status: %{},
      nonce: nil,
      server_proof: nil,
      stats: %{},
      prepared_statements_storage: storage_mod,
      prepared_statements: storage_mod.new(),
      proxy: proxy,
      client_tls: Map.get(config, :client_tls),
      client_jit: Map.get(config, :client_jit),
      client_ip: Map.get(config, :client_ip),
      stream_state: MessageStreamer.new_stream_state(BackendMessageHandler),
      backend_message_streaming: true,
      mode: config.mode,
      replica_type: config.replica_type,
      caller: nil,
      client_sock: nil,
      expected_rfq: 0,
      open_batch?: false,
      pool: pool,
      terminating_error: nil,
      manager_ref: nil,
      derived_secrets: nil
    }

    Telem.handler_action(:db_handler, :started, id)

    cooldown =
      if data.proxy,
        do: 0,
        else: connect_cooldown_remaining(id)

    if cooldown > 0 do
      {:ok, :connect_cooldown, data, {:state_timeout, cooldown, :connect}}
    else
      {initial_state, data, actions} = resolve_secrets(data)
      {:ok, initial_state, data, actions}
    end
  end

  @impl true
  def callback_mode, do: [:handle_event_function]

  @impl true
  def handle_event(:state_timeout, :connect, :connect_cooldown, data) do
    {next_state, data, actions} = resolve_secrets(data)
    {:next_state, next_state, data, actions}
  end

  def handle_event(:internal, :connect, :connect, %{connection_params: conn_params} = data) do
    Logger.debug("DbHandler: Try to connect to DB")

    sock_opts = [
      conn_params.ip_version,
      mode: :binary,
      packet: :raw,
      nodelay: true,
      active: false
    ]

    Telem.handler_action(:db_handler, :db_connection, data.id)

    connect_timeout = if data.proxy, do: 1_000, else: 5_000

    host =
      case :inet.parse_address(conn_params.host) do
        {:ok, ip} -> ip
        {:error, _} -> conn_params.host
      end

    case :gen_tcp.connect(host, conn_params.port, sock_opts, connect_timeout) do
      {:ok, sock} ->
        # Ensure buffer >= recbuf to avoid unnecessary copying
        # Set once at connection time as best effort; OS may adjust recbuf later via auto-tuning.
        {:ok, [{:recbuf, recbuf}]} = :inet.getopts(sock, [:recbuf])
        :ok = :inet.setopts(sock, buffer: recbuf)

        Logger.debug("DbHandler: connection_params #{inspect(conn_params, pretty: true)}")

        case try_ssl_handshake({:gen_tcp, sock}, conn_params) do
          {:ok, sock} ->
            tenant = if data.proxy, do: proxy_tenant(data.id)

            options = %{
              "search_path" => Supavisor.id(data.id, :search_path),
              "client_tls" => if(data.proxy, do: to_string(data.client_tls)),
              "jit" => if(data.proxy, do: to_string(data.client_jit)),
              "client_ip" => if(data.proxy, do: data.client_ip)
            }

            case send_startup(sock, conn_params, tenant, options) do
              :ok ->
                :ok = activate(sock)

                {:next_state, :authentication, %{data | sock: sock},
                 {:state_timeout, @authentication_timeout_ms, :authentication_timeout}}

              {:error, reason} ->
                Logger.error("DbHandler: Send startup error #{inspect(reason)}")
                handle_connection_failure(reason, data)
            end

          {:error, reason} ->
            Logger.error("DbHandler: Handshake error #{inspect(reason)}")
            handle_connection_failure(reason, data)
        end

      other ->
        Logger.error(
          "DbHandler: Connection failed #{inspect(other)} to #{inspect(conn_params.host)}:#{inspect(conn_params.port)}"
        )

        handle_connection_failure(other, data)
    end
  end

  def handle_event(:internal, {:terminate_with_error, error, pool_action}, _state, data) do
    Logger.debug("DbHandler: Transitioning to terminating_with_error state")

    case pool_action do
      :shutdown_pool when not data.proxy ->
        Supavisor.Manager.shutdown_with_error(data.id, error)

      :graceful_shutdown_pool when not data.proxy ->
        Supavisor.Manager.stop_pool(data.id)

      _ ->
        :ok
    end

    # If not checked out yet, the postponed checkout will handle sending the error
    if data.client_sock != nil do
      encode_and_forward_error(error, data)
    end

    # Use cast to allow postponed events to be processed first
    :gen_statem.cast(self(), :finalize_termination)

    # This state will handle postponed checkout calls by returning the error
    {:next_state, :terminating_with_error, %{data | terminating_error: error}}
  end

  def handle_event(:cast, :finalize_termination, :terminating_with_error, _data) do
    Logger.debug("DbHandler: Stopping from terminating_with_error state")
    {:stop, :normal}
  end

  def handle_event(:state_timeout, :cleanup_timeout, :waiting_cleanup, _data) do
    Logger.error("DbHandler: Cleanup timeout, shutting down")
    {:stop, :normal}
  end

  def handle_event(:state_timeout, :authentication_timeout, :authentication, data) do
    Logger.error("DbHandler: Authentication timeout after #{@authentication_timeout_ms}ms")
    handle_connection_failure({:error, :authentication_timeout}, data)
  end

  def handle_event(:info, {proto, _, bin}, :authentication, data) when proto in @proto do
    {:ok, dec_pkt, _} = Server.decode(bin)
    Logger.debug("DbHandler: dec_pkt, #{inspect(dec_pkt, pretty: true)}")

    resp = Enum.reduce(dec_pkt, %{}, &handle_auth_pkts(&1, &2, data))

    case resp do
      {:authentication_sasl, nonce} ->
        {:keep_state, %{data | nonce: nonce}}

      {:authentication_server_first_message, server_proof, derived_secrets} ->
        {:keep_state,
         Map.merge(data, %{server_proof: server_proof, derived_secrets: derived_secrets})}

      %{authentication_server_final_message: _server_final} ->
        :keep_state_and_data

      %{authentication_ok: true} ->
        :keep_state_and_data

      resp when resp == %{} ->
        :keep_state_and_data

      :authentication_md5 ->
        {:keep_state, data}

      :authentication_cleartext ->
        {:keep_state, data}

      {:error_response, error} ->
        {pool_action, side_effect} = Map.get(@auth_error_actions, error["C"], {:keep_pool, :none})

        if side_effect == :invalidate_secrets do
          handle_authentication_error(data, error["M"] || "Authentication failed")
        end

        Logger.error("DbHandler: Auth error #{inspect(error)}")

        {:keep_state_and_data,
         {:next_event, :internal, {:terminate_with_error, error, pool_action}}}

      {:ready_for_query, acc} ->
        ps = acc.ps

        Logger.info(
          "DbHandler: Backend authenticated, backend_pid: #{inspect(acc[:backend_key_data][:pid])}"
        )

        if data.mode != :proxy do
          Supavisor.set_parameter_status(data.id, ps)
          cache_derived_secrets(data)
        end

        {:next_state, :idle, Map.merge(data, %{parameter_status: ps, derived_secrets: nil})}

      other ->
        Logger.error("DbHandler: Undefined auth response #{inspect(other)}")
        {:stop, :auth_error, data}
    end
  end

  # the process received message from db while idle
  def handle_event(:info, {proto, _, bin}, :idle, %{backend_message_streaming: true} = data)
      when proto in @proto do
    Logger.debug("DbHandler: Got db response when idle")

    {:ok, updated_data, _packets} = process_backend_streaming(bin, data)

    {:keep_state, updated_data}
  end

  # hot code reload compat: remove after full rollout
  def handle_event(:info, {proto, _, _bin}, :idle, _data) when proto in @proto do
    Logger.debug("DbHandler: Got db response when idle")
    :keep_state_and_data
  end

  def handle_event(:cast, {:expect_ready_for_query, count, open_batch?}, _state, data) do
    {:keep_state, %{data | expected_rfq: data.expected_rfq + count, open_batch?: open_batch?}}
  end

  # forward the message to the client
  def handle_event(:info, {proto, _, bin}, :busy, %{caller: caller} = data)
      when is_pid(caller) and proto in @proto do
    Logger.debug("DbHandler: Got messages: #{Debug.packet_to_string(bin, :backend)}")

    {:ok, data, to_send} = process_backend_streaming(bin, data)
    {count, last_status, data} = handle_ready_for_query(data)

    # A batch is done when we have received the expected number of `ReadyForQuery`
    # messages, the last status is idle and not mid-transaction, and the client
    # is not holding an extended protocol batch open awaiting its Sync.
    outstanding = data.expected_rfq - count
    batch_done? = outstanding <= 0 and last_status == ?I and not data.open_batch?
    data = %{data | expected_rfq: max(outstanding, 0)}

    # db_status must be enqueued in the ClientHandler's mailbox before the final
    # ReadyForQuery reaches the client socket: the client sends its next query as
    # soon as it reads ReadyForQuery, and if that arrives while the ClientHandler
    # is still :busy it gets forwarded to a connection the client no longer owns.
    if batch_done?, do: ClientHandler.db_status(data.caller, :ready_for_query)

    send_result = if to_send == [], do: :ok, else: client_send(data, to_send)

    case send_result do
      {:error, reason} ->
        # Still linked to the ClientHandler (checkin is what unlinks), so
        # stopping tears the client connection down with us.
        Logger.error("DbHandler: Failed to forward message to client: #{inspect(reason)}")
        {:stop, :normal}

      :ok ->
        if batch_done? do
          case data.mode do
            :transaction ->
              {_, stats} = Telem.network_usage(:db, data.sock, data.id, data.stats)
              checkin(data)

              {:next_state, :idle,
               %{data | stats: stats, caller: nil, client_sock: nil, expected_rfq: 0}}

            :proxy ->
              {:keep_state, data}

            :session ->
              {_, stats} = Telem.network_usage(:db, data.sock, data.id, data.stats)
              {:keep_state, %{data | stats: stats}}
          end
        else
          {:keep_state, data}
        end
    end
  end

  def handle_event(:info, {proto, _, bin}, :waiting_cleanup, %{caller: caller} = data)
      when is_pid(caller) and proto in @proto do
    buffered_bin = data.pending_bin <> bin

    cond do
      String.ends_with?(buffered_bin, Server.ready_for_query()) ->
        new_data = %{data | caller: nil, waiting_cleanup: nil, pending_bin: nil}
        {:next_state, :idle, new_data, {:reply, data.waiting_cleanup, :ok}}

      byte_size(buffered_bin) > @cleanup_buffer_limit ->
        Logger.error("DbHandler: Cleanup buffer limit exceeded, shutting down")
        {:stop, :normal}

      true ->
        {:keep_state, %{data | pending_bin: buffered_bin}}
    end
  end

  def handle_event({:call, from}, {:set_application_name, name}, state, data) do
    cond do
      data.mode == :transaction ->
        Logger.error(
          "DbHandler: set_application_name called on transaction mode - only supported in session mode"
        )

        {:keep_state_and_data,
         {:reply, from, {:error, :set_application_name_not_supported_in_transaction_mode}}}

      # Only when checked out to this client (:busy).
      state == :busy ->
        app_name = "Supavisor - #{name}"
        Logger.debug("DbHandler: Setting application_name to #{inspect(app_name)}")

        query =
          Server.extended_query("SELECT set_config('application_name', $1, false)", [app_name])

        :ok = HandlerHelpers.sock_send(data.sock, query)

        {:next_state, :setting_application_name,
         Map.merge(data, %{set_app_name_from: from, pending_bin: <<>>}),
         {:state_timeout, 5_000, :set_application_name_timeout}}

      true ->
        {:keep_state_and_data, {:reply, from, :ok}}
    end
  end

  # Swallow the SET application_name response so it never reaches the client.
  def handle_event(:info, {proto, _, bin}, :setting_application_name, data)
      when proto in @proto do
    buffered_bin = data.pending_bin <> bin

    cond do
      String.ends_with?(buffered_bin, Server.ready_for_query()) ->
        {:next_state, :busy, %{data | pending_bin: nil, set_app_name_from: nil},
         {:reply, data.set_app_name_from, :ok}}

      byte_size(buffered_bin) > @cleanup_buffer_limit ->
        Logger.error("DbHandler: application_name buffer limit exceeded, shutting down")
        {:stop, :normal}

      true ->
        {:keep_state, %{data | pending_bin: buffered_bin}}
    end
  end

  def handle_event(
        :state_timeout,
        :set_application_name_timeout,
        :setting_application_name,
        _data
      ) do
    Logger.error("DbHandler: set application_name timeout, shutting down")
    {:stop, :normal}
  end

  def handle_event({:call, from}, {:handle_ps_pkts, pkts}, :busy, data) do
    {iodata, data} = Enum.reduce(pkts, {[], data}, &handle_prepared_statement_pkt/2)

    {close_pkts, prepared_statements} = evict_exceeding(data)

    :ok = HandlerHelpers.sock_send(data.sock, Enum.reverse([close_pkts | iodata]))

    data = %{
      data
      | stream_state:
          Enum.reduce(close_pkts, data.stream_state, fn _, stream_state ->
            MessageStreamer.update_state(stream_state, fn BackendMessageHandler.handler_state(
                                                            action_queue: queue
                                                          ) = s ->
              BackendMessageHandler.handler_state(s,
                action_queue: :queue.in({:intercept, :close}, queue)
              )
            end)
          end),
        prepared_statements: prepared_statements
    }

    {:keep_state, data, {:reply, from, :ok}}
  end

  def handle_event({:call, from}, {:checkout, _sock, _caller}, :terminating_with_error, data) do
    Logger.debug("DbHandler: checkout call during terminating_with_error, replying with error")
    error = %Supavisor.Errors.CheckoutError{pid: self(), postgres_error: data.terminating_error}
    {:keep_state_and_data, {:reply, from, {:error, error}}}
  end

  def handle_event({:call, from}, {:checkout, _sock, _caller}, :waiting_for_secrets, _data) do
    Logger.debug("DbHandler: checkout call during waiting_for_secrets, replying with error")

    postgres_error = %{
      "S" => "FATAL",
      "C" => "28P01",
      "M" =>
        "Authentication credentials are invalid. Please reconnect with fresh credentials to restore pool functionality."
    }

    error = %Supavisor.Errors.CheckoutError{pid: self(), postgres_error: postgres_error}
    {:keep_state_and_data, {:reply, from, {:error, error}}}
  end

  def handle_event({:call, from}, {:checkout, sock, caller}, state, data) do
    Logger.debug("DbHandler: checkout call when state was #{state}: #{inspect(caller)}")

    if state in [:idle, :busy] do
      Process.link(caller)

      if data.mode == :proxy do
        bin_ps = Server.encode_parameter_status(data.parameter_status)
        send(caller, {:parameter_status, bin_ps})
      end

      {:next_state, :busy, %{data | client_sock: sock, caller: caller, expected_rfq: 0},
       {:reply, from, {:ok, data.sock}}}
    else
      {:keep_state_and_data, :postpone}
    end
  end

  def handle_event({:call, from}, :ps, :busy, data) do
    Logger.debug("DbHandler: get parameter status")
    {:keep_state_and_data, {:reply, from, data.parameter_status}}
  end

  def handle_event({:call, from}, :cleanup, state, data) do
    Logger.debug("DbHandler: Cleanup requested, current state: #{inspect(state)}")

    cond do
      data.mode == :transaction ->
        Logger.error(
          "DbHandler: Cleanup called on transaction mode - only supported in session mode"
        )

        {:keep_state_and_data,
         {:reply, from, {:error, :cleanup_not_supported_in_transaction_mode}}}

      state in [:idle, :busy] ->
        Logger.debug("DbHandler: Starting cleanup, sending DISCARD ALL")
        msg = :pgo_protocol.encode_query_message("DISCARD ALL")
        :ok = HandlerHelpers.sock_send(data.sock, msg)

        {:next_state, :waiting_cleanup,
         Map.merge(data, %{waiting_cleanup: from, pending_bin: <<>>}),
         {:state_timeout, 5_000, :cleanup_timeout}}

      true ->
        Logger.warning("DbHandler: Cannot cleanup in state #{inspect(state)}")
        {:keep_state_and_data, {:reply, from, {:error, :cant_cleanup_now}}}
    end
  end

  def handle_event(_, {closed, _}, :authentication, data) when closed in @sock_closed do
    Logger.error("DbHandler: Connection closed unexpectedly during authentication")

    handle_connection_failure({:error, :db_connection_closed_in_auth}, data)
  end

  def handle_event(_, {closed, _}, state, data) when closed in @sock_closed do
    case last_fatal_error(data) do
      %{"M" => msg, "C" => code} ->
        status = if state == :busy, do: "checked out by a client", else: "idle in the pool"
        Logger.error("DbHandler: Session terminated by server while #{status}: #{msg} (#{code})")
        {:stop, :normal, data}

      _ ->
        if state != :terminating_with_error do
          status = if state == :busy, do: "checked out by a client", else: "idle in the pool"
          Logger.error("DbHandler: Connection closed unexpectedly while #{status}")
        end

        {:stop, {:shutdown, :db_termination}, data}
    end
  end

  # linked client_handler went down
  def handle_event(_, {:EXIT, pid, reason}, _state, data) do
    if reason != :normal do
      Logger.error(
        "DbHandler: ClientHandler #{inspect(pid)} went down with reason #{inspect(reason)}"
      )
    end

    HandlerHelpers.sock_send(data.sock, Server.terminate_message())
    HandlerHelpers.sock_close(data.sock)
    {:stop, :normal}
  end

  def handle_event({:call, from}, :get_state_and_mode, state, data) do
    {:keep_state_and_data, {:reply, from, {state, data.mode}}}
  end

  def handle_event(:cast, :secrets_available, :waiting_for_secrets, data) do
    Logger.info("DbHandler: Secrets are now available, transitioning to connect state")

    Process.demonitor(data.manager_ref, [:flush])

    case get_connection_params_with_secrets(data.connection_params, data.id) do
      {:ok, conn_params_with_secrets} ->
        {:next_state, :connect,
         %{data | connection_params: conn_params_with_secrets, manager_ref: nil},
         {:next_event, :internal, :connect}}

      {:error, :no_secrets} ->
        Logger.error("DbHandler: Still no secrets available after notification")
        :keep_state_and_data
    end
  end

  def handle_event(:info, {:DOWN, ref, :process, _pid, reason}, :waiting_for_secrets, data)
      when ref == data.manager_ref do
    Logger.error("DbHandler: Manager died while waiting for secrets: #{inspect(reason)}")
    {:stop, :normal, data}
  end

  def handle_event(:info, {event, _socket}, _, data) when event in [:tcp_passive, :ssl_passive] do
    HandlerHelpers.setopts(data.sock, active: @switch_active_count)
    :keep_state_and_data
  end

  def handle_event(type, content, state, data) do
    msg = [
      {"type", type},
      {"content", content},
      {"state", state},
      {"data", data}
    ]

    Logger.debug("DbHandler: Undefined msg: #{inspect(msg, pretty: true)}")

    :keep_state_and_data
  end

  @impl true
  def terminate(_reason, :terminating_with_error, data) do
    Telem.handler_action(:db_handler, :stopped, data.id)
  end

  def terminate(reason, state, data) do
    Telem.handler_action(:db_handler, :stopped, data.id)

    case reason do
      :normal ->
        :ok

      :shutdown ->
        :ok

      reason ->
        Logger.error(
          "DbHandler: Terminating with reason #{inspect(reason)} when state was #{inspect(state)}"
        )
    end
  end

  @impl true
  def format_status(status) do
    Map.put(status, :queue, [])
  end

  @spec encode_and_forward_error(map(), map()) :: :ok | :noop
  defp encode_and_forward_error(message, data) do
    case data do
      %{client_sock: sock} when not is_nil(sock) ->
        client_send(data, Server.encode_error_message(message))

      _other ->
        :noop
    end
  end

  @spec try_ssl_handshake(Supavisor.tcp_sock(), ConnectionParameters.t()) ::
          {:ok, Supavisor.sock()} | {:error, term()}
  defp try_ssl_handshake(sock, %ConnectionParameters{upstream_ssl: true} = conn_params) do
    case HandlerHelpers.sock_send(sock, Server.ssl_request()) do
      :ok -> ssl_recv(sock, conn_params)
      error -> error
    end
  end

  defp try_ssl_handshake(sock, _), do: {:ok, sock}

  @spec ssl_recv(Supavisor.tcp_sock(), ConnectionParameters.t()) ::
          {:ok, Supavisor.ssl_sock()} | {:error, term}
  defp ssl_recv({:gen_tcp, sock} = s, conn_params) do
    case :gen_tcp.recv(sock, 1, 15_000) do
      {:ok, <<?S>>} -> ssl_connect(s, conn_params)
      {:ok, <<?N>>} -> {:error, :ssl_not_available}
      {:error, _} = error -> error
    end
  end

  @spec ssl_connect(Supavisor.tcp_sock(), ConnectionParameters.t(), pos_integer) ::
          {:ok, Supavisor.ssl_sock()} | {:error, term}
  defp ssl_connect({:gen_tcp, sock}, conn_params, timeout \\ 5000) do
    opts =
      case conn_params.upstream_verify do
        :peer ->
          [
            verify: :verify_peer,
            cacerts: [conn_params.upstream_tls_ca],
            # unclear behavior on pg14
            server_name_indication: conn_params.sni_hostname || conn_params.host,
            customize_hostname_check: [{:match_fun, fn _, _ -> true end}],
            receiver_spawn_opts: [min_heap_size: 2048]
          ]

        :none ->
          [verify: :verify_none, receiver_spawn_opts: [min_heap_size: 2048]]
      end

    case :ssl.connect(sock, opts, timeout) do
      {:ok, ssl_sock} ->
        {:ok, {:ssl, ssl_sock}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @spec send_startup(Supavisor.sock(), ConnectionParameters.t(), String.t() | nil, map()) ::
          :ok | {:error, term}
  def send_startup(sock, conn_params, tenant, options) do
    user =
      if is_nil(tenant),
        do: conn_params.secrets.user,
        else: "#{conn_params.secrets.user}.#{tenant}"

    options = Map.reject(options, fn {_k, v} -> is_nil(v) end)

    msg =
      :pgo_protocol.encode_startup_message(
        [
          {"user", user},
          {"database", conn_params.database},
          {"application_name", conn_params.application_name}
        ] ++
          if(options != %{},
            do: [{"options", StartupOptions.encode(options)}],
            else: []
          )
      )

    HandlerHelpers.sock_send(sock, msg)
  end

  # The node of the pool parses the user name like the node of the client did
  @spec proxy_tenant(Supavisor.id()) :: String.t()
  defp proxy_tenant(Supavisor.id(type: :cluster, tenant: cluster_alias)),
    do: "cluster." <> cluster_alias

  defp proxy_tenant(Supavisor.id(tenant: tenant)), do: tenant

  @spec activate(Supavisor.sock()) :: :ok | {:error, term}
  defp activate({:gen_tcp, sock}) do
    :inet.setopts(sock, active: @switch_active_count)
  end

  defp activate({:ssl, sock}) do
    :ssl.setopts(sock, active: @switch_active_count)
  end

  @spec handle_auth_pkts(map(), map(), map()) :: any()
  defp handle_auth_pkts(%{tag: :parameter_status, payload: {k, v}}, acc, _),
    do: update_in(acc, [:ps], fn ps -> Map.put(ps || %{}, k, v) end)

  defp handle_auth_pkts(%{tag: :ready_for_query, payload: db_state}, acc, _),
    do: {:ready_for_query, Map.put(acc, :db_state, db_state)}

  defp handle_auth_pkts(%{tag: :backend_key_data, payload: payload}, acc, data) do
    if data.mode != :proxy do
      Logger.metadata(backend_pid: payload[:pid])
    end

    key = self()

    conn = %{
      host: data.connection_params.host,
      port: data.connection_params.port,
      ip_version: data.connection_params.ip_version
    }

    Registry.register(Supavisor.Registry.PoolPids, key, Map.merge(payload, conn))
    Logger.debug("DbHandler: Backend #{inspect(key)} data: #{inspect(payload)}")
    Map.put(acc, :backend_key_data, payload)
  end

  defp handle_auth_pkts(%{payload: {:authentication_sasl_password, methods_b}}, _, data) do
    nonce =
      case Server.decode_string(methods_b) do
        {:ok, req_method, _} ->
          Logger.debug("DbHandler: SASL method #{inspect(req_method)}")
          nonce = :pgo_scram.get_nonce(16)
          user = data.connection_params.secrets.user
          client_first = :pgo_scram.get_client_first(user, nonce)
          client_first_size = IO.iodata_length(client_first)

          sasl_initial_response = [
            "SCRAM-SHA-256",
            0,
            <<client_first_size::32-integer>>,
            client_first
          ]

          bin = :pgo_protocol.encode_scram_response_message(sasl_initial_response)
          :ok = HandlerHelpers.sock_send(data.sock, bin)
          nonce

        other ->
          Logger.error("DbHandler: Undefined sasl method #{inspect(other)}")
          nil
      end

    {:authentication_sasl, nonce}
  end

  defp handle_auth_pkts(
         %{payload: {:authentication_server_first_message, server_first}},
         _,
         data
       ) do
    nonce = data.nonce
    server_first_parts = Helpers.parse_server_first(server_first, nonce)

    secrets = data.connection_params.secrets

    {client_final_message, server_proof, derived_secrets} =
      Helpers.get_client_final(secrets, server_first_parts, nonce, secrets.user, "biws")

    bin = :pgo_protocol.encode_scram_response_message(client_final_message)
    :ok = HandlerHelpers.sock_send(data.sock, bin)

    {:authentication_server_first_message, server_proof, derived_secrets}
  end

  defp handle_auth_pkts(
         %{payload: {:authentication_server_final_message, server_final}},
         acc,
         _data
       ),
       do: Map.put(acc, :authentication_server_final_message, server_final)

  defp handle_auth_pkts(
         %{payload: :authentication_ok},
         acc,
         _data
       ),
       do: Map.put(acc, :authentication_ok, true)

  defp handle_auth_pkts(%{payload: {:authentication_md5_password, salt}} = dec_pkt, _, data) do
    Logger.debug("DbHandler: dec_pkt, #{inspect(dec_pkt, pretty: true)}")

    %PasswordSecrets{password: password, user: user} = data.connection_params.secrets

    digest = Helpers.md5([password, user])

    payload = ["md5", Helpers.md5([digest, salt]), 0]
    bin = [?p, <<IO.iodata_length(payload) + 4::signed-32>>, payload]
    :ok = HandlerHelpers.sock_send(data.sock, bin)
    :authentication_md5
  end

  defp handle_auth_pkts(%{payload: :authentication_cleartext_password} = dec_pkt, _, data) do
    Logger.debug("DbHandler: dec_pkt, #{inspect(dec_pkt, pretty: true)}")

    %PasswordSecrets{password: password} = data.connection_params.secrets
    payload = <<password::binary, 0>>
    bin = [?p, <<IO.iodata_length(payload) + 4::signed-32>>, payload]
    :ok = HandlerHelpers.sock_send(data.sock, bin)
    :authentication_cleartext
  end

  defp handle_auth_pkts(%{tag: :error_response, payload: error}, _acc, _data),
    do: {:error_response, error}

  defp handle_auth_pkts(%{tag: :notice_response, payload: notice}, acc, _data) do
    Logger.notice("DbHandler: Notice during authentication: #{inspect(notice)}")
    acc
  end

  defp handle_auth_pkts(pkt, _acc, _data), do: {:unexpected_packet, pkt}

  defp cache_derived_secrets(%{id: id, derived_secrets: derived_secrets})
       when not is_nil(derived_secrets) do
    Supavisor.UpstreamAuthentication.put_upstream_auth_secrets(id, derived_secrets)
  end

  defp cache_derived_secrets(_data), do: :ok

  @spec handle_authentication_error(map(), String.t()) :: any()
  defp handle_authentication_error(%{mode: :proxy}, _reason), do: :ok

  defp handle_authentication_error(%{mode: _other} = data, _reason) do
    tenant = Supavisor.id(data.id, :tenant)
    Supavisor.ClientAuthentication.invalidate_global(tenant, data.user)
    Supavisor.UpstreamAuthentication.delete_upstream_auth_secrets(data.id)
  end

  # Returning to the pool only after the response is fully forwarded keeps
  # workers flushing to slow clients out of circulation. If the caller died
  # mid-send (link gone), poolboy's owner monitor already reclaimed the worker
  # and may have handed it out, so checking in again would corrupt the pool.
  @spec checkin(map()) :: :ok
  defp checkin(%{caller: caller, pool: pool}) do
    {:links, links} = Process.info(self(), :links)

    if caller in links do
      Process.unlink(caller)
      :poolboy.checkin(pool, self())
    end

    :ok
  end

  defp handle_ready_for_query(data) do
    handler_state = MessageStreamer.stream_state(data.stream_state, :handler_state)
    count = BackendMessageHandler.handler_state(handler_state, :rfq_count)
    last_status = BackendMessageHandler.handler_state(handler_state, :last_rfq_status)

    # also reset the state.
    stream_state =
      MessageStreamer.update_state(data.stream_state, fn s ->
        BackendMessageHandler.handler_state(s, rfq_count: 0, last_rfq_status: nil)
      end)

    {count, last_status, %{data | stream_state: stream_state}}
  end

  # libpq's async API hangs when a TLS record leaves bytes in OpenSSL's
  # buffer that pqReadData doesn't drain; the client then polls the socket
  # for data that's already arrived. Keeping records within libpq's 8KB
  # input buffer avoids it.
  # https://www.postgresql.org/message-id/flat/57d1e8b1-d016-4cea-9b60-63cbdb40eb81%40iki.fi
  defp client_send(%{client_sock: {:ssl, _} = sock}, payload) do
    chunk_send(:erlang.iolist_to_iovec(payload), sock)
  end

  defp client_send(%{client_sock: sock}, payload) do
    HandlerHelpers.sock_send(sock, payload)
  end

  defp chunk_send([], _sock), do: :ok

  defp chunk_send(iovec, sock) do
    {chunk, rest} = take_chunk(iovec, @tls_send_chunk_size, [])

    case HandlerHelpers.sock_send(sock, chunk) do
      :ok -> chunk_send(rest, sock)
      err -> err
    end
  end

  defp take_chunk([bin | rest], remaining, acc) when byte_size(bin) <= remaining do
    take_chunk(rest, remaining - byte_size(bin), [bin | acc])
  end

  defp take_chunk([bin | rest], remaining, acc) do
    <<head::binary-size(remaining), tail::binary>> = bin
    {:lists.reverse([head | acc]), [tail | rest]}
  end

  defp take_chunk([], _remaining, acc), do: {:lists.reverse(acc), []}

  # If the prepared statement exists for us, it exists for the server, so we just send the
  # packet to the socket. If it doesn't, we must send the parse pkt first.
  #
  # If we replay a parse, we need to intercept the parse response, otherwise the client will
  # receive an unexpected message.
  defp handle_prepared_statement_pkt(
         {packet_type, stmt_name, pkt, parse_pkt},
         {iodata, data}
       )
       when packet_type in [:bind_pkt, :describe_pkt] do
    storage_mod = data.prepared_statements_storage

    if storage_mod.member?(data.prepared_statements, stmt_name) do
      {[pkt | iodata],
       %{data | prepared_statements: storage_mod.touch(data.prepared_statements, stmt_name)}}
    else
      new_data = %{
        data
        | stream_state:
            MessageStreamer.update_state(
              data.stream_state,
              fn BackendMessageHandler.handler_state(action_queue: queue) = s ->
                BackendMessageHandler.handler_state(s,
                  action_queue: :queue.in({:intercept, :parse}, queue)
                )
              end
            ),
          prepared_statements: storage_mod.put(data.prepared_statements, stmt_name)
      }

      {[[parse_pkt, pkt] | iodata], new_data}
    end
  end

  defp handle_prepared_statement_pkt({:close_pkt, stmt_name, pkt}, {iodata, data}) do
    storage_mod = data.prepared_statements_storage

    {[pkt | iodata],
     %{
       data
       | prepared_statements: storage_mod.delete(data.prepared_statements, stmt_name),
         stream_state:
           MessageStreamer.update_state(data.stream_state, fn BackendMessageHandler.handler_state(
                                                                action_queue: queue
                                                              ) = s ->
             BackendMessageHandler.handler_state(s,
               action_queue: :queue.in({:forward, :close}, queue)
             )
           end)
     }}
  end

  # If we stop generating unique id per statement, and instead do deterministic ids,
  # we need to potentially drop parse pkts and return a parse response
  defp handle_prepared_statement_pkt({:parse_pkt, stmt_name, pkt}, {iodata, data}) do
    storage_mod = data.prepared_statements_storage

    if storage_mod.member?(data.prepared_statements, stmt_name) do
      {iodata,
       %{
         data
         | prepared_statements: storage_mod.touch(data.prepared_statements, stmt_name),
           stream_state:
             MessageStreamer.update_state(
               data.stream_state,
               fn BackendMessageHandler.handler_state(action_queue: queue) = s ->
                 BackendMessageHandler.handler_state(s,
                   action_queue: :queue.in({:inject, :parse}, queue)
                 )
               end
             )
       }}
    else
      prepared_statements = storage_mod.put(data.prepared_statements, stmt_name)

      {[pkt | iodata],
       %{
         data
         | prepared_statements: prepared_statements,
           stream_state:
             MessageStreamer.update_state(
               data.stream_state,
               fn BackendMessageHandler.handler_state(action_queue: queue) = s ->
                 BackendMessageHandler.handler_state(s,
                   action_queue: :queue.in({:forward, :parse}, queue)
                 )
               end
             )
       }}
    end
  end

  defp evict_exceeding(%{
         prepared_statements: prepared_statements,
         prepared_statements_storage: storage_mod,
         id: id
       }) do
    limit = PreparedStatements.backend_limit()

    if storage_mod.size(prepared_statements) >= limit do
      count = div(limit, 5)
      {evicted, prepared_statements} = storage_mod.evict(prepared_statements, count)
      close_pkts = Enum.map(evicted, &PreparedStatements.build_close_pkt/1)
      Telem.prepared_statements_evicted(length(evicted), id)

      {close_pkts, prepared_statements}
    else
      {[], prepared_statements}
    end
  end

  defp process_backend_streaming(bin, data) do
    case MessageStreamer.handle_packets(data.stream_state, bin) do
      {:ok, new_stream_state, packets} ->
        {:ok, %{data | stream_state: new_stream_state}, packets}

      err ->
        err
    end
  end

  defp last_fatal_error(%{backend_message_streaming: true} = data) do
    BackendMessageHandler.handler_state(
      MessageStreamer.stream_state(data.stream_state, :handler_state),
      :fatal_error
    )
  end

  # hot code reload compat: remove after full rollout
  defp last_fatal_error(_data), do: nil

  defp get_connection_params_with_secrets(conn_params, id) do
    case Supavisor.UpstreamAuthentication.get_upstream_auth_secrets(id) do
      {:ok, upstream_auth_secrets} ->
        {:ok, %{conn_params | secrets: upstream_auth_secrets}}

      _other ->
        {:error, :no_secrets}
    end
  end

  defp handle_connection_failure(reason, data) do
    if not data.proxy do
      Supavisor.CircuitBreaker.record_failure(data.tenant, :db_connection)
      Supavisor.ConnectBackoff.record_failure(data.id, System.monotonic_time(:millisecond))
    end

    error = %{
      "S" => "FATAL",
      "C" => "08006",
      "M" => "Failed to connect to database: #{format_reason(reason)}"
    }

    {:keep_state_and_data, {:next_event, :internal, {:terminate_with_error, error, :keep_pool}}}
  end

  defp format_reason({:error, :authentication_timeout}),
    do: "authentication did not complete within #{@authentication_timeout_ms}ms"

  defp format_reason(reason), do: inspect(reason)

  defp resolve_secrets(data) do
    if data.proxy do
      {:connect, data, {:next_event, :internal, :connect}}
    else
      case get_connection_params_with_secrets(data.connection_params, data.id) do
        {:ok, conn_params_with_secrets} ->
          {:connect, %{data | connection_params: conn_params_with_secrets},
           {:next_event, :internal, :connect}}

        {:error, :no_secrets} ->
          Logger.warning("DbHandler: Secrets not available, entering waiting state")
          manager_pid = Supavisor.get_local_manager(data.id)
          ref = Process.monitor(manager_pid)
          Supavisor.Manager.register_waiting_for_secrets(data.id, self())
          {:waiting_for_secrets, %{data | manager_ref: ref}, []}
      end
    end
  end

  defp connect_cooldown_remaining(id) do
    case Supavisor.ConnectBackoff.last_failure(id) do
      nil ->
        0

      last_failure ->
        elapsed = System.monotonic_time(:millisecond) - last_failure
        @connect_cooldown_ms - elapsed
    end
  end
end
