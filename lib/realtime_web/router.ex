defmodule RealtimeWeb.Router do
  use RealtimeWeb, :router

  require Logger

  import RealtimeWeb.ChannelsAuthorization, only: [authorize: 3]

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, {RealtimeWeb.LayoutView, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:check_auth, [:api_jwt_secret, :api_blocklist])
    plug(:set_span_request_id)
  end

  pipeline :open_cors do
    plug(Corsica, origins: "*")
  end

  pipeline :tenant_api do
    plug(:accepts, ["json"])
    plug(RealtimeWeb.Plugs.AssignTenant)
    plug(RealtimeWeb.Plugs.RateLimiter)
    plug(:set_span_request_id)
  end

  pipeline :secure_tenant_api do
    plug(RealtimeWeb.AuthTenant)
    plug(:set_span_request_id)
  end

  pipeline :broadcast_single do
    plug(:accepts, ["json", "octet-stream"])
    plug(RealtimeWeb.Plugs.ValidateBroadcastContentType)
    plug(RealtimeWeb.Plugs.AssignTenant)
    plug(RealtimeWeb.Plugs.RateLimiter)
    plug(:set_span_request_id)
  end

  pipeline :dashboard_admin do
    plug(:dashboard_auth)
  end

  pipeline :metrics do
    plug(:check_auth, [:metrics_jwt_secret, :metrics_blocklist])
  end

  pipeline :openapi do
    plug(OpenApiSpex.Plug.PutApiSpec, module: RealtimeWeb.ApiSpec)
  end

  scope "/", RealtimeWeb do
    get("/healthcheck", PageController, :healthcheck)
  end

  scope "/", RealtimeWeb do
    pipe_through(:browser)

    live("/", InspectorLive.Index, :index)
    live("/status", StatusLive.Index, :index)
    get("/inspector", PageController, :redirect_to_root)
    get("/inspector/new", PageController, :redirect_to_root)
  end

  scope "/swaggerui" do
    pipe_through(:browser)
    get("/", OpenApiSpex.Plug.SwaggerUI, path: "/api/openapi")
  end

  scope "/metrics", RealtimeWeb do
    pipe_through(:metrics)

    get("/", MetricsController, :index)
    get("/:region", MetricsController, :region)
  end

  scope "/api" do
    pipe_through(:openapi)

    get("/openapi", OpenApiSpex.Plug.RenderSpec, [])
  end

  scope "/api", RealtimeWeb do
    pipe_through(:api)

    resources("/tenants", TenantController, param: "tenant_id", except: [:edit, :new])
    post("/tenants/:tenant_id/reload", TenantController, :reload)
    post("/tenants/:tenant_id/shutdown", TenantController, :shutdown)
    get("/tenants/:tenant_id/health", TenantController, :health)
    post("/tenants/health", TenantController, :bulk_health)
  end

  scope "/api", RealtimeWeb do
    pipe_through(:tenant_api)

    get("/ping", PingController, :ping)
  end

  scope "/api", RealtimeWeb do
    pipe_through([:open_cors, :tenant_api, :secure_tenant_api])

    post("/broadcast", BroadcastController, :broadcast)
  end

  scope "/api", RealtimeWeb do
    pipe_through([:open_cors, :broadcast_single, :secure_tenant_api])

    post("/broadcast/:topic/events/:event", BroadcastSingleController, :broadcast)
  end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  scope "/admin" do
    pipe_through [:browser, :dashboard_admin]

    live_dashboard("/dashboard",
      ecto_repos: [
        Realtime.Repo,
        Realtime.Repo.Replica.FRA,
        Realtime.Repo.Replica.IAD,
        Realtime.Repo.Replica.SIN,
        Realtime.Repo.Replica.SJC
      ],
      ecto_psql_extras_options: [long_running_queries: [threshold: "200 milliseconds"]],
      metrics: RealtimeWeb.Telemetry,
      additional_pages: [
        route_name: RealtimeWeb.Dashboard.ProcessDump,
        recon_trace: RealtimeWeb.Dashboard.ReconTrace,
        node_info: RealtimeWeb.Dashboard.NodeInfo,
        muster: RealtimeWeb.Dashboard.Muster,
        tenant_info: RealtimeWeb.Dashboard.TenantInfo,
        tenant_migrations: RealtimeWeb.Dashboard.TenantMigrations,
        sql_inspector: RealtimeWeb.Dashboard.SqlInspector,
        feature_flags: RealtimeWeb.Dashboard.FeatureFlags
      ]
    )
  end

  defp check_auth(conn, [secret_key, blocklist_key]) do
    secrets = :realtime |> Application.fetch_env!(secret_key) |> List.wrap()
    blocklist = Application.get_env(:realtime, blocklist_key, [])

    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         token <- Regex.replace(~r/\s|\n/, URI.decode(token), ""),
         false <- token in blocklist,
         {:ok, _claims} <- authorize_any(token, secrets) do
      conn
    else
      _ ->
        conn
        |> send_resp(403, "")
        |> halt()
    end
  end

  defp authorize_any(token, secrets) do
    Enum.find_value(secrets, {:error, :unauthorized}, fn secret ->
      case authorize(token, secret, nil) do
        {:ok, claims} -> {:ok, claims}
        _ -> nil
      end
    end)
  end

  defp dashboard_auth(conn, _opts) do
    case Application.fetch_env!(:realtime, :dashboard_auth) do
      :zta ->
        {conn, user} = NimbleZTA.Cloudflare.authenticate(Realtime.ZTA, conn)
        if user, do: conn, else: conn |> send_resp(403, "") |> halt()

      :basic_auth ->
        {user, password} = Application.fetch_env!(:realtime, :dashboard_credentials)
        Plug.BasicAuth.basic_auth(conn, username: user, password: password)
    end
  catch
    :exit, reason ->
      Logger.error("ZTA authentication failed: #{inspect(reason)}")
      conn |> send_resp(503, "") |> halt()
  end

  defp set_span_request_id(conn, _) do
    # Must have been set by BaggageRequestId
    # We can't set the span attribute there because the phoenix span only starts after it reaches the Router
    if request_id = Logger.metadata()[:request_id] do
      OpenTelemetry.Tracer.set_attribute(:request_id, request_id)
    end

    conn
  end
end
