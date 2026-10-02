defmodule Supavisor.ClientHandler do
  @moduledoc """
  This module is responsible for handling incoming connections to the Supavisor server.

  It implements the Ranch protocol behavior and a gen_statem behavior. It handles SSL negotiation,
  user authentication, tenant subscription, and dispatching of messages to the appropriate tenant
  supervisor. Each client connection is assigned to a specific tenant supervisor.
  """

  require Logger

  require Record
  require Supavisor

  @behaviour :ranch_protocol
  @behaviour :gen_statem
  @proto [:tcp, :ssl]
  @switch_active_count Application.compile_env(:supavisor, :switch_active_count)
  @subscribe_retries Application.compile_env(:supavisor, :subscribe_retries)
  @admission_retries Application.compile_env(:supavisor, :admission_retries)
  @admission_backoff Application.compile_env(:supavisor, :admission_backoff)
  @max_checkout_retries 2
  @timeout_subscribe 500
  @ssl_handshake_timeout 2_500
  @handshake_timeout 5_000
  @clients_registry Supavisor.Registry.TenantClients
  @proxy_clients_registry Supavisor.Registry.TenantProxyClients
  @max_startup_packet_size Supavisor.Protocol.max_startup_packet_size()

  alias Supavisor.{
    DbHandler,
    FeatureFlag,
    HandlerHelpers,
    Helpers,
    Manager,
    Monitoring.Telem,
    Protocol.Debug,
    Tenants
  }

  alias Supavisor.ClientHandler.{
    AuthMethods,
    Cancel,
    Checks,
    Data,
    Error,
    ProtocolHelpers,
    Proxy
  }

  alias Supavisor.Protocol.{FrontendMessageHandler, MessageStreamer, StartupOptions}
  require MessageStreamer

  alias Supavisor.Errors.{
    CheckoutTimeoutError,
    ClientSocketClosedError,
    DbHandlerExitedError,
    HandshakeTimeoutError,
    MaxConnectionsError,
    PoolCheckoutError,
    PoolConfigNotFoundError,
    PoolRanchNotFoundError,
    SslHandshakeError,
    StartupPacketTooLargeError,
    SubscribeRetriesExhaustedError,
    WorkerNotFoundError
  }

  require Supavisor.Protocol.Server, as: Server
  require Supavisor.Protocol.PreparedStatements, as: PreparedStatements

  @impl true
  def start_link(ref, transport, opts) do
    pid = :proc_lib.spawn_link(__MODULE__, :init, [ref, transport, opts])
    {:ok, pid}
  end

  @impl true
  def callback_mode, do: [:handle_event_function, :state_enter]

  @spec db_status(pid(), :ready_for_query) :: :ok
  def db_status(pid, status), do: :gen_statem.cast(pid, {:db_status, status})

  @spec send_error_and_terminate(pid(), iodata()) :: :ok
  def send_error_and_terminate(pid, error_message),
    do: :gen_statem.cast(pid, {:send_error_and_terminate, error_message})

  @spec graceful_shutdown(pid()) :: :ok
  def graceful_shutdown(pid), do: :gen_statem.cast(pid, :graceful_shutdown)

  @impl true
  def init(_), do: :ignore

  def init(ref, trans, opts) do
    Process.flag(:trap_exit, true)
    Helpers.set_max_heap_size(90)

    {:ok, sock} = :ranch.handshake(ref)
    sock_ref = Port.monitor(sock)
    peer_ip = Helpers.peer_ip(sock)
    local = opts[:local] || false

    Logger.metadata(peer_ip: peer_ip, local: local, state: :init)
    :ok = trans.setopts(sock, active: @switch_active_count)
    Logger.debug("ClientHandler is: #{inspect(self())}")

    now = System.monotonic_time()

    data = %Data{
      sock: {:gen_tcp, sock},
      trans: trans,
      sock_ref: sock_ref,
      peer_ip: peer_ip,
      local: local,
      ssl: false,
      connection_params: nil,
      mode: opts.mode,
      stream_state: MessageStreamer.new_stream_state(FrontendMessageHandler),
      stats: %{},
      idle_timeout: 0,
      heartbeat_interval: 0,
      connection_start: now,
      state_entered_at: now,
      subscribe_retries: 0,
      admission_retries: 0
    }

    :gen_statem.enter_loop(__MODULE__, [hibernate_after: 5_000], :handshake, data, [
      {:state_timeout, @handshake_timeout, :handshake_timeout}
    ])
  end

  @impl true
  def handle_event(:info, {_proto, _, <<"GET", _::binary>>}, :handshake, data) do
    Logger.debug("ClientHandler: Client is trying to request HTTP")

    HandlerHelpers.sock_send(
      data.sock,
      "HTTP/1.1 204 OK\r\nx-app-version: #{Application.spec(:supavisor, :vsn)}\r\n\r\n"
    )

    {:stop, :normal}
  end

  # cancel request
  def handle_event(:info, {_, _, Server.cancel_message(pid, key)}, _state, _) do
    Logger.debug("ClientHandler: Got cancel query for #{inspect({pid, key})}")
    :ok = Cancel.send_cancel_query(pid, key)
    {:stop, :normal}
  end

  # send cancel request to db
  def handle_event(:info, :cancel_query, state, data) do
    :ok = Cancel.maybe_forward_cancel_to_db(state, data)
    :keep_state_and_data
  end

  def handle_event(
        :info,
        {:tcp, _, Server.ssl_request_message()},
        :handshake,
        %{sock: sock} = data
      ) do
    certs_keys = Helpers.downstream_certs_keys()

    # SSL negotiation, S/N/Error
    if certs_keys != [] do
      :ok = HandlerHelpers.setopts(sock, active: false)

      opts = [
        verify: :verify_none,
        certs_keys: certs_keys,
        sni_fun: fn _hostname -> :undefined end
      ]

      with :ok <- client_sock_send(data, "S", :handshake),
           {:ok, ssl_sock} <- :ssl.handshake(elem(sock, 1), opts, @ssl_handshake_timeout) do
        socket = {:ssl, ssl_sock}
        :ok = HandlerHelpers.setopts(socket, active: @switch_active_count)
        {:keep_state, %{data | sock: socket, ssl: true}}
      else
        {:error, %ClientSocketClosedError{} = exception} ->
          Error.terminate_with_error(data, exception, :handshake)

        {:error, reason} ->
          Error.terminate_with_error(data, %SslHandshakeError{reason: reason}, :handshake)
      end
    else
      Logger.warning(
        "ClientHandler: User requested SSL connection but no downstream cert/key found"
      )

      case client_sock_send(data, "N", :handshake) do
        :ok ->
          :keep_state_and_data

        {:error, exception} ->
          Error.terminate_with_error(data, exception, :handshake)
      end
    end
  end

  def handle_event(:state_timeout, :handshake_timeout, :handshake, data) do
    Error.terminate_with_error(data, %HandshakeTimeoutError{}, :handshake)
  end

  def handle_event(:info, {_, _, bin}, :handshake, data)
      when byte_size(bin) > @max_startup_packet_size do
    Error.terminate_with_error(
      data,
      %StartupPacketTooLargeError{packet_size: byte_size(bin)},
      :handshake
    )
  end

  def handle_event(:info, {_, _, bin}, :handshake, data) do
    case ProtocolHelpers.parse_startup_packet(bin) do
      {:ok, {type, {user, tenant_or_alias, db_name, search_path, jit, client_tls, client_ip}},
       app_name, log_level, invalid} ->
        event =
          {:hello,
           {type, {user, tenant_or_alias, db_name, search_path, jit, client_tls, client_ip}}}

        if log_level, do: Logger.put_process_level(self(), log_level)

        {:keep_state, %{data | app_name: app_name, invalid_options: invalid},
         {:next_event, :internal, event}}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :handshake)
    end
  end

  def handle_event(
        :internal,
        {:hello,
         {type, {user, tenant_or_alias, db_name, search_path, client_jit, client_tls, client_ip}} =
           hello_args},
        :handshake,
        %{sock: sock} = data
      ) do
    sni_hostname = HandlerHelpers.try_get_sni(sock)

    # When receiving a proxied connection on a local listener, client_tls and
    # client_ip carry the original client's TLS status and IP address (the socket
    # peer is the forwarding node). Otherwise, use what we observed on the socket.
    effective_ssl = if(data.local && client_tls, do: client_tls, else: data.ssl)
    peer_ip = ProtocolHelpers.effective_peer_ip(data.local, client_ip, data.peer_ip)
    data = %{data | peer_ip: peer_ip}

    Logger.metadata(
      project: tenant_or_alias,
      user: user,
      mode: data.mode,
      type: type,
      app_name: data.app_name,
      db_name: db_name,
      peer_ip: peer_ip
    )

    case Tenants.get_user_cache(type, user, tenant_or_alias, sni_hostname) do
      {:ok, info} ->
        upstream_tls = upstream_tls(info.tenant, effective_ssl)

        resolved_tenant = tenant_or_alias || info.tenant.external_id

        id =
          Supavisor.id(
            type: type,
            tenant: resolved_tenant,
            user: user,
            mode: data.mode,
            db: db_name,
            search_path: search_path,
            upstream_tls: upstream_tls
          )

        with :ok <- Checks.check_tenant_not_banned(info),
             :ok <- Checks.check_ssl_enforcement(data, info, user),
             :ok <- Checks.check_address_allowed(sock, info),
             :ok <- Manager.check_client_limit(id, info, data.mode),
             {:ok, auth_method} <-
               AuthMethods.fetch_authentication_method(
                 info.tenant,
                 client_jit,
                 effective_ssl,
                 user
               ) do
          Logger.debug("ClientHandler: Authentication method: #{inspect(auth_method)}")
          new_data = set_tenant_info(data, info, user, id, db_name, client_jit)

          {:keep_state, new_data,
           {:next_event, :internal, {:start_authentication, auth_method, info}}}
        else
          {:error, %MaxConnectionsError{} = exception} ->
            wait_for_slot_or_terminate(%{data | id: id}, {:hello, hello_args}, exception)

          {:error, exception} when is_exception(exception) ->
            Error.terminate_with_error(%{data | id: id}, exception, :handshake)
        end

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :handshake)
    end
  end

  # Named timeout: a :state_timeout would cancel @handshake_timeout.
  def handle_event({:timeout, :admission_retry}, retry_event, _state, _data) do
    {:keep_state_and_data, {:next_event, :internal, retry_event}}
  end

  def handle_event(
        :internal,
        {:start_authentication, auth_method, info},
        _state,
        data
      ) do
    Logger.debug("ClientHandler: Handle exchange, auth method: #{inspect(auth_method)}")

    {auth_request, next_state, auth_context} =
      case auth_method do
        :jit ->
          {Server.password_request(), :auth_password_wait,
           AuthMethods.Jit.new_context(info, data.id, data.peer_ip)}

        :password ->
          {Server.password_request(), :auth_password_wait,
           AuthMethods.Password.new_context(info, data.id)}

        :scram_sha_256 ->
          {Server.scram_request(), :auth_scram_first_wait,
           AuthMethods.SCRAM.new_context(info, data.id)}
      end

    with :ok <- Supavisor.CircuitBreaker.check({data.tenant, data.peer_ip}, :auth_error),
         :ok <- client_sock_send(data, auth_request, :handshake) do
      {:next_state, next_state, %{data | auth_context: auth_context},
       {:timeout, 15_000, :auth_timeout}}
    else
      {:error, exception} ->
        Error.terminate_with_error(data, exception, :handshake)
    end
  end

  def handle_event(:internal, :subscribe, _state, data) do
    Logger.debug("ClientHandler: Subscribe to tenant #{Supavisor.inspect_id(data.id)}")

    # CB check disabled until we ensure there are no false positives
    # :ok <- Supavisor.CircuitBreaker.check(data.tenant, :db_connection),
    with {:ok, sup} <-
           Supavisor.start_dist(data.id, data.connection_params.secrets,
             availability_zone: data.tenant_availability_zone,
             log_level: nil
           ),
         :not_proxy <-
           if(node(sup) != node() and data.mode != :proxy, do: :proxy, else: :not_proxy),
         {:ok, opts} <- Supavisor.subscribe(data.id),
         manager_ref = Process.monitor(opts.workers.manager),
         data = Map.merge(data, opts.workers),
         {:ok, db_connection} <- maybe_checkout(:on_connect, data),
         :ok <- maybe_set_application_name(data, db_connection) do
      if data.admission_retries > 0, do: Telem.client_admission(:admitted, data.id)

      data = %{
        data
        | manager: manager_ref,
          db_connection: db_connection,
          idle_timeout: opts.idle_timeout,
          admission_retries: 0
      }

      Registry.register(@clients_registry, data.id,
        started_at: System.monotonic_time(),
        app_name: data.app_name,
        include_app_name: include_app_name?(data)
      )

      cond do
        data.client_ready ->
          {:next_state, :idle, data, handle_actions(data)}

        opts.ps == [] ->
          {:keep_state, data, {:timeout, 1_000, :wait_ps}}

        true ->
          {:keep_state, data, {:next_event, :internal, {:greetings, opts.ps}}}
      end
    else
      {:error, %WorkerNotFoundError{}} ->
        timeout_subscribe_or_terminate(data)

      {:error, %PoolConfigNotFoundError{}} ->
        timeout_subscribe_or_terminate(data)

      # The pre-auth `check_client_limit/3` is advisory; this is the authoritative check.
      {:error, %MaxConnectionsError{} = exception} ->
        wait_for_slot_or_terminate(data, :subscribe, exception)

      {:error, exception} when is_exception(exception) ->
        Error.terminate_with_error(data, exception, :handshake)

      :proxy ->
        case Supavisor.get_pool_ranch(data.id) do
          {:ok, pool_ranch} ->
            Logger.metadata(proxy: true)

            Registry.register(@proxy_clients_registry, data.id,
              app_name: data.app_name,
              include_app_name: include_app_name?(data)
            )

            {:keep_state, %{data | pool_ranch: pool_ranch}, {:next_event, :internal, :connect_db}}

          {:error, %PoolRanchNotFoundError{}} ->
            timeout_subscribe_or_terminate(data)
        end
    end
  end

  def handle_event(:internal, :connect_db, _state, data) do
    Logger.debug("ClientHandler: Trying to connect to DB")

    with {:ok, db_pid} <-
           Proxy.start_proxy_connection(
             data.id,
             data.max_clients,
             data.connection_params,
             data.tenant_feature_flags,
             data.pool_ranch,
             client_ssl: data.ssl,
             client_jit: data.use_jit_flow,
             client_ip: forwardable_peer_ip(data.peer_ip)
           ),
         {:ok, db_sock} <- DbHandler.checkout(db_pid, data.sock, self(), data.mode) do
      {:keep_state, %{data | db_connection: {nil, db_pid, db_sock}, mode: :proxy}}
    else
      {:error, exception} ->
        Error.terminate_with_error(data, exception, :authenticated)
    end
  end

  def handle_event(:internal, {:greetings, ps}, _state, data) do
    {header, <<pid::32, key::32>> = payload} = Server.backend_key_data()
    notices = invalid_option_notices(data.invalid_options)
    msg = [ps, [header, payload], notices, Server.ready_for_query()]
    :ok = Cancel.listen_cancel_query(pid, key)

    case client_sock_send(data, msg, :handshake) do
      :ok ->
        Telem.client_connection_time(data.connection_start, data.id)
        {:next_state, :idle, %{data | client_ready: true}, handle_actions(data)}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :handshake)
    end
  end

  def handle_event(:timeout, :subscribe, _state, _) do
    {:keep_state_and_data, {:next_event, :internal, :subscribe}}
  end

  def handle_event(:timeout, :wait_ps, _state, data) do
    Logger.warning(
      "ClientHandler: Wait parameter status timeout, send default #{inspect(data.ps)}}"
    )

    ps = Server.encode_parameter_status(data.ps)
    {:keep_state_and_data, {:next_event, :internal, {:greetings, ps}}}
  end

  def handle_event(:state_timeout, :idle_terminate, _state, data) do
    Logger.warning("ClientHandler: Terminate an idle connection by #{data.idle_timeout} timeout")
    {:stop, :normal}
  end

  def handle_event(:timeout, :heartbeat_check, _state, data) do
    Logger.debug("ClientHandler: Send heartbeat to client")

    case client_sock_send(data, Server.application_name(), :idle) do
      :ok ->
        {:keep_state_and_data, {:timeout, data.heartbeat_interval, :heartbeat_check}}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :authenticated)
    end
  end

  def handle_event(:info, {:parameter_status, ps}, :connecting, _) do
    {:keep_state_and_data, {:next_event, :internal, {:greetings, ps}}}
  end

  # TLS alert handling: WARNING alerts keep the connection alive, FATAL alerts terminate it.
  # For FATAL alerts, Erlang doesn't send ssl_closed, so we must terminate here.
  # The alert level is only available by parsing the message string ("Warning - " or "Fatal - ").
  def handle_event(:info, {:ssl_error, sock, {:tls_alert, {_reason, msg}}}, _, %{sock: {_, sock}}) do
    msg_string = to_string(msg)

    if String.contains?(msg_string, "Fatal -") do
      Logger.warning(
        "ClientHandler: Received fatal TLS alert: #{msg_string}, terminating connection"
      )

      {:stop, :normal}
    else
      Logger.warning(
        "ClientHandler: Received TLS warning alert: #{msg_string}, keeping connection alive"
      )

      :keep_state_and_data
    end
  end

  def handle_event(:info, {:ssl_error, sock, reason}, _, %{sock: {_, sock}}) do
    Logger.error("ClientHandler: TLS error #{inspect(reason)}")
    :keep_state_and_data
  end

  # client closed connection
  def handle_event(_, {closed, _}, state, data)
      when closed in [:tcp_closed, :ssl_closed] do
    handle_socket_close(state, data)
  end

  # If the linked DbHandler went down normally, we can trust it to have
  # sent/logged a proper error message and just terminate
  def handle_event(:info, {:EXIT, _db_pid, :normal}, _state, _data) do
    {:stop, :normal}
  end

  def handle_event(:info, {:EXIT, db_pid, reason}, state, data) do
    context = if state in [:idle, :busy], do: :authenticated, else: :handshake

    Error.terminate_with_error(
      data,
      %DbHandlerExitedError{pid: db_pid, reason: reason},
      context
    )
  end

  # pool's manager went down
  def handle_event(:info, {:DOWN, ref, _, _, reason}, state, %{manager: ref} = data) do
    Logger.error(
      "ClientHandler: Manager #{inspect(data.manager)} went down #{inspect(reason)} state #{inspect(state)}"
    )

    case {state, reason} do
      {_, :shutdown} -> {:stop, {:shutdown, :manager_shutdown}}
      {:idle, _} -> {:next_state, :connecting, data, {:next_event, :internal, :subscribe}}
      {:connecting, _} -> {:keep_state_and_data, {:next_event, :internal, :subscribe}}
      {:busy, _} -> {:keep_state_and_data, :postpone}
    end
  end

  # socket went down
  def handle_event(
        :info,
        {:DOWN, ref, _, _, _reason},
        state,
        %{sock_ref: ref} = data
      ) do
    handle_socket_close(state, data)
  end

  # emulate handle_cast
  def handle_event(:cast, {:db_status, :ready_for_query}, :busy, data) do
    Logger.debug("ClientHandler: Client is ready")

    # In transaction mode the DbHandler checks itself back into the pool once
    # it finishes forwarding the response; we only drop our reference to it.
    db_connection = if data.mode == :transaction, do: nil, else: data.db_connection

    {_, stats} =
      if data.local,
        do: {nil, data.stats},
        else: Telem.network_usage(:client, data.sock, data.id, data.stats)

    Telem.client_query_time(data.query_start, data.id, data.mode == :proxy)

    {:next_state, :idle, %{data | db_connection: db_connection, stats: stats},
     handle_actions(data)}
  end

  def handle_event(:cast, {:db_status, :ready_for_query}, :idle, _) do
    :keep_state_and_data
  end

  def handle_event(:cast, {:send_error_and_terminate, error_message}, _state, data) do
    HandlerHelpers.sock_send(data.sock, error_message)
    {:stop, :normal}
  end

  def handle_event(:cast, :graceful_shutdown, :busy, _data) do
    {:keep_state_and_data, :postpone}
  end

  def handle_event(:cast, :graceful_shutdown, _state, data) do
    HandlerHelpers.sock_send(data.sock, Server.encode_error_message(Server.admin_shutdown()))

    {:stop, :normal}
  end

  def handle_event(:info, {sock_error, _sock, msg}, state, _data)
      when sock_error in [:tcp_error, :ssl_error] do
    Logger.error("ClientHandler: Socket error: #{inspect(msg)}, state was #{state}")

    {:stop, :normal}
  end

  def handle_event(:info, {event, _socket}, _, data) when event in [:tcp_passive, :ssl_passive] do
    HandlerHelpers.setopts(data.sock, active: @switch_active_count)
    :keep_state_and_data
  end

  # Authentication state handlers

  def handle_event(:info, {proto, _socket, bin}, :auth_password_wait, data)
      when proto in @proto do
    result =
      case data.auth_context do
        %AuthMethods.Jit.Context{} ->
          AuthMethods.Jit.handle_password(data.auth_context, bin)

        %AuthMethods.Password.Context{} ->
          AuthMethods.Password.handle_password(data.auth_context, bin)
      end

    case result do
      {:ok, secrets} ->
        handle_auth_success(secrets, data)

      {:error, exception} ->
        handle_auth_failure(exception, data)
    end
  end

  # SCRAM authentication - waiting for first message
  def handle_event(:info, {proto, _socket, bin}, :auth_scram_first_wait, data)
      when proto in @proto do
    with {:ok, message, auth_context} <-
           AuthMethods.SCRAM.handle_scram_first(data.auth_context, bin),
         :ok <- client_sock_send(data, Server.exchange_message(:first, message), :handshake) do
      new_data = %{data | auth_context: auth_context}
      {:next_state, :auth_scram_final_wait, new_data, {:timeout, 15_000, :auth_timeout}}
    else
      {:error, %ClientSocketClosedError{} = exception} ->
        Error.terminate_with_error(data, exception, :handshake)

      {:error, exception} ->
        handle_auth_failure(exception, data)
    end
  end

  # SCRAM authentication - waiting for final response
  def handle_event(:info, {proto, _socket, bin}, :auth_scram_final_wait, data)
      when proto in @proto do
    with {:ok, message, final_secrets} <-
           AuthMethods.SCRAM.handle_scram_final(data.auth_context, bin),
         :ok <- client_sock_send(data, message, :handshake) do
      handle_auth_success(final_secrets, data)
    else
      {:error, %ClientSocketClosedError{} = exception} ->
        Error.terminate_with_error(data, exception, :handshake)

      {:error, exception} ->
        handle_auth_failure(exception, data)
    end
  end

  # Authentication timeout handler
  def handle_event(:timeout, :auth_timeout, auth_state, data)
      when auth_state in [
             :auth_scram_first_wait,
             :auth_scram_final_wait,
             :auth_password_wait
           ] do
    exception = %Supavisor.Errors.AuthTimeoutError{context: auth_state}
    handle_auth_failure(exception, data)
  end

  def handle_event(:enter, old_state, new_state, data) do
    Logger.metadata(state: new_state)

    case {old_state, new_state} do
      # This is emitted on initialization
      {:handshake, :handshake} ->
        {:next_state, new_state, data}

      # We are not interested in idle->busy->idle transitions
      {:idle, :busy} ->
        {:next_state, new_state, data}

      {:busy, :idle} ->
        {:next_state, new_state, data, idle_timeout_action(data)}

      {_, :idle} ->
        {:next_state, new_state, record_state_duration(old_state, new_state, data),
         idle_timeout_action(data)}

      _ ->
        {:next_state, new_state, record_state_duration(old_state, new_state, data)}
    end
  end

  # Terminate request
  def handle_event(_kind, {proto, _, <<?X, 4::32>>}, state, data) when proto in @proto do
    Logger.info("ClientHandler: Terminate received from client")
    maybe_cleanup_db_handler(state, data)
    {:stop, :normal}
  end

  # Sync when idle and no db_connection - return sync directly
  def handle_event(
        _kind,
        {proto, _, <<?S, 4::32, _::binary>>},
        :idle,
        %{db_connection: nil} = data
      )
      when proto in @proto do
    Logger.debug("ClientHandler: Receive sync")

    case client_sock_send(data, Server.ready_for_query(), :idle) do
      :ok ->
        {:keep_state, data, handle_actions(data)}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :authenticated)
    end
  end

  # Any message when idle - checkout and send to db
  def handle_event(_kind, {proto, socket, msg}, :idle, data) when proto in @proto do
    case maybe_checkout(:on_query, data) do
      {:ok, db_connection} ->
        {:next_state, :busy,
         %{data | db_connection: db_connection, query_start: System.monotonic_time()},
         [{:next_event, :internal, {proto, socket, msg}}]}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :authenticated)
    end
  end

  # Any message when busy: send to db
  def handle_event(_kind, {proto, _, msg}, :busy, data) when proto in @proto do
    case handle_data(msg, data) do
      {:ok, updated_data} ->
        {:keep_state, updated_data}

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :authenticated)
    end
  end

  # Any message when connecting - postpone
  def handle_event(_kind, {proto, _socket, _msg}, :connecting, _data) when proto in @proto do
    {:keep_state_and_data, :postpone}
  end

  def handle_event(type, content, state, _data) do
    msg = [
      {"type", type},
      {"content", content},
      {"state", state}
    ]

    Logger.warning("ClientHandler: Undefined msg: #{inspect(msg, pretty: true)}")

    :keep_state_and_data
  end

  @impl true
  def terminate(reason, state, _data) do
    Logger.metadata(state: state)

    level =
      case reason do
        :normal -> :debug
        _ -> :error
      end

    Logger.log(level, "ClientHandler: terminating with reason #{inspect(reason)}")
  end

  defp maybe_set_application_name(%{mode: :session, app_name: app_name}, {_pool, db_pid, _sock})
       when is_binary(app_name) and app_name != "" do
    case DbHandler.set_application_name(db_pid, app_name) do
      :ok ->
        :ok

      error ->
        Logger.warning("ClientHandler: failed to set application_name: #{inspect(error)}")
        :ok
    end
  end

  defp maybe_set_application_name(_data, _db_connection), do: :ok

  defp include_app_name?(data) do
    FeatureFlag.enabled?(data.tenant_feature_flags, "app_name_metric")
  end

  defp maybe_cleanup_db_handler(state, data) do
    if state == :idle and data.mode == :session and data.db_connection != nil and
         !Supavisor.Helpers.no_warm_pool_user?(data.user) do
      Logger.debug("ClientHandler: Performing session cleanup before termination")
      {pool, db_pid, _} = data.db_connection

      # We unsubscribe to free up space for new clients during the cleanup time.
      Supavisor.Manager.unsubscribe(data.id)

      case DbHandler.attempt_cleanup(db_pid) do
        :ok ->
          Process.unlink(db_pid)
          :poolboy.checkin(pool, db_pid)

        # In case of error, both processes will be terminated
        _error ->
          :ok
      end
    end
  end

  @impl true
  def format_status(status) do
    Map.put(status, :queue, [])
  end

  ## Internal functions
  defp handle_auth_success(final_secrets, data) do
    Logger.info("ClientHandler: Connection authenticated")
    cache_validated_password(data, final_secrets)

    if data.mode != :proxy do
      Supavisor.UpstreamAuthentication.put_upstream_auth_secrets(data.id, final_secrets)
    end

    case client_sock_send(data, Server.authentication_ok(), :handshake) do
      :ok ->
        Telem.client_join(:ok, data.id)

        connection_params = %{data.connection_params | secrets: final_secrets}

        conn_type =
          if data.mode == :proxy,
            do: :connect_db,
            else: :subscribe

        {
          :next_state,
          :connecting,
          %{data | auth_context: nil, connection_params: connection_params},
          {:next_event, :internal, conn_type}
        }

      {:error, exception} ->
        Error.terminate_with_error(data, exception, :handshake)
    end
  end

  defp cache_validated_password(%{tenant: tenant}, %Supavisor.Secrets.PasswordSecrets{} = secrets) do
    case Supavisor.ClientAuthentication.get_validation_secrets(tenant, secrets.user) do
      {:ok, %{password_secrets: nil} = validation} ->
        updated = %{validation | password_secrets: secrets}
        Supavisor.ClientAuthentication.put_validation_secrets(tenant, secrets.user, updated)

      _ ->
        :ok
    end
  end

  defp cache_validated_password(_data, _secrets), do: :ok

  # Helpers.peer_ip/1 returns "undefined" when the socket address can't be read;
  # don't forward that to the pool node.
  defp forwardable_peer_ip("undefined"), do: nil
  defp forwardable_peer_ip(peer_ip), do: peer_ip

  defp handle_auth_failure(exception, data) do
    Supavisor.CircuitBreaker.record_failure({data.tenant, data.peer_ip}, :auth_error)
    Error.terminate_with_error(data, exception, :handshake)
  end

  @spec maybe_checkout(:on_connect | :on_query, map, non_neg_integer()) ::
          {:ok, Data.db_connection()} | {:ok, nil} | {:error, Exception.t()}
  defp maybe_checkout(event, data, attempt \\ 0)

  defp maybe_checkout(_, %{mode: mode, db_connection: {pool, db_pid, db_sock}}, _)
       when is_pid(db_pid) and mode in [:session, :proxy] do
    {:ok, {pool, db_pid, db_sock}}
  end

  defp maybe_checkout(:on_connect, %{mode: :transaction}, _), do: {:ok, nil}

  defp maybe_checkout(event, data, attempt) do
    timeout = data.timeout |> div(attempt + 1)
    start = System.monotonic_time(:microsecond)

    with {:ok, db_pid} <- pool_checkout(data.pool, timeout, data.mode),
         {:ok, db_sock} <- DbHandler.checkout(db_pid, data.sock, self(), data.mode) do
      same_box = if node(db_pid) == node(), do: :local, else: :remote
      Telem.pool_checkout_time(System.monotonic_time(:microsecond) - start, data.id, same_box)
      {:ok, {data.pool, db_pid, db_sock}}
    else
      {:error, %Supavisor.Errors.DbHandlerExitedError{}} ->
        if attempt < @max_checkout_retries do
          Logger.warning(
            "ClientHandler: DbHandler exited during checkout, retrying (attempt #{attempt + 1})"
          )

          maybe_checkout(event, data, attempt + 1)
        else
          {:error, %Supavisor.Errors.CheckoutRetriesExhaustedError{}}
        end

      other ->
        other
    end
  end

  @spec handle_data(binary(), map()) :: {:ok, map()} | {:error, Exception.t()}
  defp handle_data(data_to_send, data) do
    Logger.debug(
      "ClientHandler: Forward pkt to db #{Debug.packet_to_string(data_to_send, :frontend)} #{inspect(data.db_connection)}"
    )

    with {:ok, new_stream_state, pkts} <-
           ProtocolHelpers.process_client_packets(data_to_send, data.mode, data),
         {:ok, new_stream_state} <- maybe_expect_ready_for_query(data, new_stream_state),
         :ok <- sock_send(pkts, data) do
      {:ok, %{data | stream_state: new_stream_state}}
    else
      {:error, exception} ->
        {:error, exception}
    end
  end

  defp maybe_expect_ready_for_query(
         %{mode: :transaction, db_connection: {_pool, db_pid, _sock}},
         stream_state
       ) do
    {count, open_batch?, stream_state} = handle_rfq_producers(stream_state)
    DbHandler.expect_ready_for_query(db_pid, count, open_batch?)
    {:ok, stream_state}
  end

  defp maybe_expect_ready_for_query(_data, stream_state), do: {:ok, stream_state}

  defp handle_rfq_producers(stream_state) do
    handler_state = MessageStreamer.stream_state(stream_state, :handler_state)

    # The count is per write, so it is reset on read. `open_batch?` outlives the
    # write that opened the batch and is only cleared by the client's Sync.
    {handler_state.rfq_producers, handler_state.open_batch?,
     MessageStreamer.update_state(stream_state, fn s -> %{s | rfq_producers: 0} end)}
  end

  @spec handle_actions(map) :: [{:timeout, non_neg_integer, atom}]
  defp handle_actions(%{} = data) do
    if data.heartbeat_interval > 0,
      do: [{:timeout, data.heartbeat_interval, :heartbeat_check}],
      else: []
  end

  defp idle_timeout_action(%{idle_timeout: timeout}) when timeout > 0,
    do: [{:state_timeout, timeout, :idle_terminate}]

  defp idle_timeout_action(_data), do: []

  defp record_state_duration(old_state, new_state, data) do
    now = System.monotonic_time()

    :telemetry.execute(
      [:supavisor, :client_handler, :state],
      %{duration: now - data.state_entered_at},
      %{from_state: old_state, to_state: new_state, tenant: data.tenant}
    )

    %{data | state_entered_at: now}
  end

  @spec invalid_option_notices([{String.t(), String.t()}]) :: iodata()
  defp invalid_option_notices(invalid) do
    Enum.map(invalid, fn opt ->
      Server.encode_notice_message(StartupOptions.invalid_option_notice(opt))
    end)
  end

  @spec client_sock_send(map(), iodata(), :handshake | :idle) ::
          :ok | {:error, ClientSocketClosedError.t()}
  defp client_sock_send(data, bin, client_state) do
    case HandlerHelpers.sock_send(data.sock, bin) do
      :ok ->
        :ok

      {:error, reason} ->
        {:error,
         %ClientSocketClosedError{mode: data.mode, client_state: client_state, reason: reason}}
    end
  end

  @spec sock_send([PreparedStatements.handled_pkt()] | binary(), map()) :: :ok | {:error, term()}
  defp sock_send(bin_or_pkts, data) do
    {_pool, db_handler, db_sock} = data.db_connection

    case bin_or_pkts do
      pkts when is_list(pkts) ->
        # Chunking to ensure we send bigger packets
        pkts
        |> Enum.chunk_by(&is_tuple/1)
        |> Enum.reduce_while(:ok, fn chunk, _acc ->
          case chunk do
            [t | _] = prepared_pkts when is_tuple(t) ->
              Supavisor.DbHandler.handle_prepared_statement_pkts(db_handler, prepared_pkts)

            bins ->
              HandlerHelpers.sock_send(db_sock, bins)
          end
          |> case do
            :ok -> {:cont, :ok}
            error -> {:halt, error}
          end
        end)

      bin ->
        HandlerHelpers.sock_send(elem(data.db_connection, 2), bin)
    end
  end

  @spec timeout_subscribe_or_terminate(map()) :: :gen_statem.handle_event_result()
  def timeout_subscribe_or_terminate(%{subscribe_retries: subscribe_retries} = data) do
    if subscribe_retries < @subscribe_retries do
      Logger.warning("ClientHandler: Retry subscribe #{inspect(subscribe_retries)}")

      {:keep_state, %{data | subscribe_retries: subscribe_retries + 1},
       {:timeout, @timeout_subscribe, :subscribe}}
    else
      Error.terminate_with_error(data, %SubscribeRetriesExhaustedError{}, :handshake)
    end
  end

  @doc """
  Replays `retry_event` after a backoff while the admission budget lasts, then terminates with `exception`.
  """
  @spec wait_for_slot_or_terminate(map(), term(), Exception.t()) ::
          :gen_statem.handle_event_result()
  def wait_for_slot_or_terminate(%{admission_retries: retries} = data, retry_event, exception) do
    if retries < @admission_retries do
      Logger.debug("ClientHandler: Waiting for a free client slot, attempt #{retries + 1}")

      {:keep_state, %{data | admission_retries: retries + 1},
       {{:timeout, :admission_retry}, admission_backoff(), retry_event}}
    else
      Telem.client_admission(:rejected, data.id)
      Error.terminate_with_error(data, exception, :handshake)
    end
  end

  defp admission_backoff do
    jitter = max(div(@admission_backoff, 4), 1)
    max(@admission_backoff - jitter + :rand.uniform(2 * jitter), 0)
  end

  defp pool_checkout(pool, timeout, mode) do
    {:ok, :poolboy.checkout(pool, true, timeout)}
  catch
    :exit, {:timeout, _} ->
      {:error, %CheckoutTimeoutError{mode: mode, timeout_ms: timeout}}

    :exit, reason ->
      {:error, %PoolCheckoutError{reason: reason}}
  end

  defp set_tenant_info(data, info, user, id, db_name, client_jit) do
    proxy_type =
      if info.tenant.require_user,
        do: :password,
        else: :auth_query

    connection_params = %Supavisor.ConnectionParameters{
      application_name: data.app_name,
      database: db_name,
      host: to_charlist(info.tenant.db_host),
      sni_hostname:
        if(info.tenant.sni_hostname != nil, do: to_charlist(info.tenant.sni_hostname)),
      port: info.tenant.db_port,
      ip_version: Helpers.ip_version(info.tenant.ip_version, info.tenant.db_host),
      upstream_ssl: Supavisor.id(id, :upstream_tls),
      upstream_tls_ca: info.tenant.upstream_tls_ca,
      upstream_verify: info.tenant.upstream_verify
    }

    %{
      data
      | id: id,
        tenant: info.tenant.external_id,
        tenant_feature_flags: info.tenant.feature_flags,
        # Cluster pools are placed without a zone, as their replicas may be in
        # different ones, see `Supavisor.start_local_pool/3`
        tenant_availability_zone:
          if(Supavisor.id(id, :type) == :single, do: info.tenant.availability_zone),
        user: user,
        db_name: db_name,
        timeout: info.user.pool_checkout_timeout,
        ps: info.tenant.default_parameter_status,
        proxy_type: proxy_type,
        heartbeat_interval: info.tenant.client_heartbeat_interval * 1000,
        connection_params: connection_params,
        max_clients: info.user.max_clients || info.tenant.default_max_clients,
        use_jit_flow: client_jit
    }
  end

  defp upstream_tls(%{use_jit: true}, ssl?), do: ssl?
  defp upstream_tls(%{upstream_ssl: upstream_ssl}, _ssl?), do: upstream_ssl

  defp handle_socket_close(state, data) do
    maybe_cleanup_db_handler(state, data)

    error = %ClientSocketClosedError{mode: data.mode, client_state: state}
    context = if state in [:idle, :busy], do: :authenticated, else: :handshake
    Error.terminate_with_error(data, error, context)
  end
end
