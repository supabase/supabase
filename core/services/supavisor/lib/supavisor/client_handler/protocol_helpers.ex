defmodule Supavisor.ClientHandler.ProtocolHelpers do
  @moduledoc """
  Protocol parsing and analysis helpers for client connections.

  This module contains pure business logic for:
  - Startup packet parsing and validation
  - Protocol message analysis and routing
  - Client packet processing
  - Protocol data transformation utilities

  All functions are pure (other than potential logs).
  """

  require Logger

  alias Supavisor.{
    Errors.InvalidUserInfoError,
    Errors.StartupMessageError,
    Errors.MaxPreparedStatementsError,
    Errors.PreparedStatementNotFoundError,
    Errors.SimpleQueryNotSupportedError,
    Errors.DuplicatePreparedStatementError,
    FeatureFlag,
    HandlerHelpers,
    Helpers,
    Protocol.MessageStreamer,
    Protocol.Client,
    Protocol.StartupOptions
  }

  require Supavisor.Protocol.PreparedStatements, as: PreparedStatements

  @type packet_processing_result ::
          {:ok, MessageStreamer.stream_state(), [PreparedStatements.handled_pkt()] | binary()}
          | {:error, MaxPreparedStatementsError.t()}
          | {:error, SimpleQueryNotSupportedError.t()}
          | {:error, DuplicatePreparedStatementError.t()}
          | {:error, PreparedStatementNotFoundError.t()}

  @type startup_message_data() ::
          {atom(),
           {String.t(), String.t(), String.t() | nil, String.t() | nil, boolean(),
            boolean() | nil, String.t() | nil}}

  ## Startup Packet Processing

  @doc """
  Parses and validates startup packet data.

  Returns parsed user info, application name, log level, and list of invalid options.
  """
  @spec parse_startup_packet(binary()) ::
          {:ok, startup_message_data(), String.t() | nil, Logger.level() | nil,
           [{String.t(), String.t()}]}
          | {:error, StartupMessageError.t() | InvalidUserInfoError.t()}
  def parse_startup_packet(bin) do
    with {:ok, hello} <- Client.decode_startup_packet(bin),
         {options, invalid} = StartupOptions.validate(hello.payload["options"] || %{}),
         {:ok, user_info} <- extract_and_validate_user_info(hello.payload, options) do
      Logger.debug("ClientHandler: Client startup message: #{inspect(hello)}")
      app_name = normalize_app_name(hello.payload["application_name"])
      log_level = options["log_level"]

      {:ok, user_info, app_name, log_level, invalid}
    end
  end

  @doc """
  Extracts and validates user information from startup payload.
  """
  @spec extract_and_validate_user_info(map(), map()) ::
          {:ok, startup_message_data()}
          | {:error, InvalidUserInfoError.t()}
  def extract_and_validate_user_info(payload, options) do
    {type, {user, tenant_or_alias, db_name}} = HandlerHelpers.parse_user_info(payload)

    if Helpers.validate_name(user) and (is_nil(db_name) or Helpers.validate_name(db_name)) do
      search_path = payload["search_path"] || options["search_path"]
      jit = Map.get(options, "jit", false)
      client_tls = Map.get(options, "client_tls")
      # Set by a peer node when it forwards a proxied connection; carries the
      # original client's IP. Only honored on local listeners, see effective_peer_ip/3.
      client_ip = options["client_ip"]
      {:ok, {type, {user, tenant_or_alias, db_name, search_path, jit, client_tls, client_ip}}}
    else
      {:error, %InvalidUserInfoError{user: user, db_name: db_name}}
    end
  end

  @doc """
  Resolves the peer IP to attribute a connection to.

  Proxied connections arrive on a `local: true` listener from a peer node, so the
  socket's peer is that node rather than the client. The forwarding node passes the
  original client's IP in the `client_ip` startup option; we use it only when the
  listener is local (never reachable by external clients) and the value is a valid
  IP address. Otherwise the socket's peer IP is kept.
  """
  @spec effective_peer_ip(local? :: boolean(), forwarded_ip :: String.t() | nil, String.t()) ::
          String.t()
  def effective_peer_ip(_local? = true, forwarded_ip, socket_peer_ip)
      when is_binary(forwarded_ip) do
    case :inet.parse_strict_address(to_charlist(forwarded_ip)) do
      {:ok, ip} -> List.to_string(:inet.ntoa(ip))
      {:error, _} -> socket_peer_ip
    end
  end

  def effective_peer_ip(_local?, _forwarded_ip, socket_peer_ip), do: socket_peer_ip

  ## Client Packet Processing

  @doc """
  Processes client packets for prepared statements based on mode and feature flags.

  Returns processed packets or passes through unchanged based on configuration.
  """
  @spec process_client_packets(binary(), atom(), map()) :: packet_processing_result()
  def process_client_packets(
        bin,
        :transaction,
        %{tenant_feature_flags: tenant_feature_flags} = data
      ) do
    translate? = FeatureFlag.enabled?(tenant_feature_flags, "named_prepared_statements")

    stream_state =
      MessageStreamer.update_state(data.stream_state, &%{&1 | translate?: translate?})

    MessageStreamer.handle_packets(stream_state, bin)
  end

  def process_client_packets(bin, _mode, data) do
    {:ok, data.stream_state, bin}
  end

  ## Protocol Utilities

  @doc """
  Normalizes application name from client connection.

  Returns sanitized string or default "" for missing/invalid names.
  """
  @spec normalize_app_name(any()) :: String.t()
  def normalize_app_name(name) when is_binary(name), do: name
  def normalize_app_name(nil), do: ""

  def normalize_app_name(name) do
    Logger.debug("ClientHandler: Invalid application name #{inspect(name)}")
    ""
  end
end
