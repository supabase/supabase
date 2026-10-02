defmodule RealtimeWeb.UserSocket do
  # Raise Phoenix's built-in per-transport channel limit above its default of 100. Realtime
  # enforces its own per-tenant `max_channels_per_client` limit (default 100) in RealtimeChannel
  # with a dedicated error message, so we just bump to a very large number.
  use RealtimeWeb.Socket, max_channels_per_transport: 99_999
  use Realtime.Logs

  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.Tenants

  alias RealtimeWeb.TenantRateLimiters
  alias RealtimeWeb.ChannelsAuthorization
  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.RealtimeChannel.Logging
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher

  ## Channels
  channel "realtime:*", RealtimeChannel

  @default_log_level :error

  @impl true
  def id(%{assigns: %{tenant: tenant}}), do: subscribers_id(tenant)

  @spec subscribers_id(String.t()) :: String.t()
  def subscribers_id(tenant), do: "user_socket:" <> tenant

  @spec disconnect(binary()) :: :ok
  def disconnect(tenant_external_id) do
    Logger.warning("Disconnecting all sockets for tenant #{tenant_external_id}",
      external_id: tenant_external_id,
      project: tenant_external_id
    )

    disconnect_msg = %Phoenix.Socket.Broadcast{
      event: "system",
      payload: %{extension: "system", status: "ok", message: "Server requested disconnect"}
    }

    Phoenix.PubSub.broadcast!(
      Realtime.PubSub,
      "realtime:operations:" <> tenant_external_id,
      disconnect_msg,
      MessageDispatcher
    )

    Phoenix.PubSub.broadcast(Realtime.PubSub, subscribers_id(tenant_external_id), :socket_drain)
    :ok
  end

  @impl true
  def connect(params, socket, opts) do
    %{uri: %{host: host}, x_headers: headers} = opts

    {:ok, external_id} = Database.get_external_id(host)
    token = access_token(params, headers)
    log_level = log_level(params)

    Logger.metadata(external_id: external_id, project: external_id)
    Logger.put_process_level(self(), log_level)

    socket =
      socket
      |> assign(:tenant, external_id)
      |> assign(:log_level, log_level)
      |> assign(:access_token, token)

    with {:ok,
          %Tenant{
            jwt_secret: jwt_secret,
            jwt_jwks: jwt_jwks,
            suspend: false
          } = tenant} <- Tenants.Cache.fetch_tenant_by_external_id(external_id),
         {:ok, token} <- validate_token(token),
         jwt_secret_dec <- Tenant.decrypt_jwt_secret(jwt_secret),
         {:ok, claims} <- ChannelsAuthorization.authorize_conn(token, jwt_secret_dec, jwt_jwks),
         :ok <- TenantRateLimiters.check_tenant(tenant) do
      assigns = %RealtimeChannel.Assigns{
        claims: claims,
        jwt_secret: jwt_secret,
        jwt_jwks: jwt_jwks,
        tenant: external_id,
        log_level: log_level,
        tenant_token: token,
        headers: opts.x_headers
      }

      assigns = Map.from_struct(assigns)

      {:ok, assign(socket, assigns)}
    else
      {:error, :tenant_not_found} ->
        log_error("TenantNotFound", "Tenant not found: #{external_id}")
        connect_error(:tenant_not_found)

      {:ok, %Tenant{suspend: true}} ->
        Logging.log_error(socket, "RealtimeDisabledForTenant", "Realtime disabled for this tenant")
        connect_error(:tenant_suspended)

      {:error, :missing_api_key} ->
        log_error("MissingAPIKey", "API key is missing or not a valid string")
        connect_error(:missing_api_key)

      {:error, :expired_token, msg} ->
        Logging.maybe_log_warning(socket, "InvalidJWTToken", msg)
        connect_error(:expired_token)

      {:error, :missing_claims} ->
        msg = "Fields `role` and `exp` are required in JWT"
        Logging.maybe_log_warning(socket, "InvalidJWTToken", msg)
        connect_error(:missing_claims)

      {:error, :token_malformed} ->
        log_error("MalformedJWT", "The token provided is not a valid JWT")
        connect_error(:token_malformed)

      {:error, :too_many_connections} ->
        msg = "Too many connected users"
        Logging.log_error(socket, "ConnectionRateLimitReached", msg)
        connect_error(:too_many_connections)

      {:error, :too_many_joins} ->
        msg = "Too many joins per second"
        Logging.log_error(socket, "JoinsRateLimitReached", msg)
        connect_error(:too_many_joins)

      error ->
        log_error("ErrorConnectingToWebsocket", error)
        connect_error(error)
    end
  end

  @doc """
  Maps `connect/3` error reasons to proper HTTP responses for the WebSocket handshake.

  Configured as the `:error_handler` for the socket in `RealtimeWeb.Endpoint`.
  """
  @spec handle_error(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def handle_error(conn, reason) do
    {status, message} = error_response(reason)

    conn
    |> Plug.Conn.put_resp_content_type("application/json")
    |> Plug.Conn.send_resp(status, Jason.encode!(%{error: message}))
  end

  defp error_response({:error, reason}), do: error_response(reason)
  defp error_response(:missing_api_key), do: {401, "API key is missing"}
  defp error_response(:expired_token), do: {401, "Token has expired"}
  defp error_response(:missing_claims), do: {401, "Fields `role` and `exp` are required in JWT"}
  defp error_response(:token_malformed), do: {401, "The token provided is not a valid JWT"}
  defp error_response(:invalid_token), do: {401, "The token provided is not a valid JWT"}
  defp error_response(:signature_error), do: {401, "Failed to validate JWT signature"}

  defp error_response(:error_generating_signer),
    do: {401, "Failed to generate JWT signer, check your JWT secret or JWKS configuration"}

  defp error_response({:error_generating_signer, kid}) do
    {401, "Failed to generate JWT signer for key ID (kid) #{inspect(kid)}, check your JWT secret or JWKS configuration"}
  end

  defp error_response(:tenant_suspended), do: {403, "Realtime was disabled for this tenant"}

  defp error_response(:tenant_not_found), do: {404, "Tenant not found"}

  defp error_response(:too_many_connections), do: {429, "Too many connected users"}
  defp error_response(:too_many_joins), do: {429, "Too many joins per second"}

  defp error_response(_reason), do: {500, "Error connecting to Realtime"}

  defp access_token(params, headers) do
    case :proplists.lookup("x-api-key", headers) do
      :none -> Map.get(params, "apikey")
      {"x-api-key", token} -> token
    end
  end

  defp log_level(params) do
    case Map.get(params, "log_level") do
      level when level in ["info", "warning", "error"] -> String.to_existing_atom(level)
      _ -> @default_log_level
    end
  end

  defp validate_token(token) when is_binary(token), do: {:ok, token}
  defp validate_token(_), do: {:error, :missing_api_key}

  defp connect_error(reason) do
    Process.sleep(connect_error_backoff_ms())
    {:error, reason}
  end

  defp connect_error_backoff_ms, do: :persistent_term.get({__MODULE__, :connect_error_backoff_ms})
end
