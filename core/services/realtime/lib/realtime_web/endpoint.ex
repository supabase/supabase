defmodule RealtimeWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :realtime
  alias RealtimeWeb.Plugs.BaggageRequestId

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # Set :encryption_salt if you would also like to encrypt it.
  @session_options [
    store: :cookie,
    key: "_realtime_key",
    signing_salt: "5OUq5X4H"
  ]

  @fullsweep_after Application.compile_env!(:realtime, :websocket_fullsweep_after)

  socket "/socket", RealtimeWeb.UserSocket,
    websocket: [
      connect_info: [:peer_data, :uri, :x_headers],
      error_handler: {RealtimeWeb.UserSocket, :handle_error, []},
      fullsweep_after: @fullsweep_after,
      max_frame_size: 5_000_000,
      # https://github.com/ninenines/cowboy/blob/24d32de931a0c985ff7939077463fc8be939f0e9/doc/src/manual/cowboy_websocket.asciidoc#L228
      # active_n: The number of packets Cowboy will request from the socket at once.
      # This can be used to tweak the performance of the server. Higher values reduce
      # the number of times Cowboy need to request more packets from the port driver at
      # the expense of potentially higher memory being used.
      active_n: 100,
      # Skip validating UTF8 for faster frame processing.
      # Currently all text frames are handled only with JSON which already requires UTF-8
      validate_utf8: false,
      serializer: [
        {Phoenix.Socket.V1.JSONSerializer, "~> 1.0.0"},
        {RealtimeWeb.Socket.V2Serializer, "~> 2.0.0"}
      ]
    ],
    longpoll: [
      connect_info: [:peer_data, :uri, :x_headers],
      serializer: [
        {Phoenix.Socket.V1.JSONSerializer, "~> 1.0.0"},
        {Phoenix.Socket.V2.JSONSerializer, "~> 2.0.0"}
      ]
    ]

  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session_options]]

  # Serve at "/" the static files from "priv/static" directory.
  #
  # You should set gzip to true if you are running phx.digest
  # when deploying your static files in production.
  plug Plug.Static,
    at: "/",
    from: :realtime,
    gzip: false,
    only: RealtimeWeb.static_paths()

  # plug PromEx.Plug, path: "/metrics", prom_ex_module: Realtime.PromEx

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug BaggageRequestId, baggage_key: BaggageRequestId.baggage_key()

  plug Plug.Telemetry,
    event_prefix: [:phoenix, :endpoint],
    log: {__MODULE__, :log_level, []}

  # Disables logging for routes /healthcheck and /api/tenants/:tenant_id/health when DISABLE_HEALTHCHECK_LOGGING=true
  def log_level(%{path_info: ["healthcheck"]}) do
    if Application.get_env(:realtime, :disable_healthcheck_logging, false), do: false, else: :info
  end

  def log_level(%{path_info: ["api", "tenants", _, "health"]}) do
    if Application.get_env(:realtime, :disable_healthcheck_logging, false), do: false, else: :info
  end

  def log_level(%{status: status}) when is_integer(status) and status >= 500, do: :error
  def log_level(%{status: status}) when is_integer(status) and status >= 400, do: :warning

  def log_level(_), do: :info

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json, RealtimeWeb.Plugs.Parsers.OctetStream],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug RealtimeWeb.Router
end
