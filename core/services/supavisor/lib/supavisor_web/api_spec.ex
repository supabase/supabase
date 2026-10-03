defmodule SupavisorWeb.ApiSpec do
  @moduledoc false

  alias OpenApiSpex.Info
  alias OpenApiSpex.OpenApi
  alias OpenApiSpex.Paths
  alias OpenApiSpex.SecurityScheme
  alias OpenApiSpex.Server

  alias SupavisorWeb.Endpoint
  alias SupavisorWeb.Router

  @behaviour OpenApi

  @impl OpenApi
  def spec do
    OpenApiSpex.resolve_schema_modules(%OpenApi{
      servers: [Server.from_endpoint(Endpoint)],
      info: %Info{
        title: to_string(Application.spec(:supavisor, :description)),
        version: to_string(Application.spec(:supavisor, :vsn))
      },
      paths: Paths.from_router(Router),
      security: [%{"authorization" => [%SecurityScheme{type: "http", scheme: "bearer"}]}]
    })
  end
end
