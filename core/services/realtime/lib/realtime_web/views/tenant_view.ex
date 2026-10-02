defmodule RealtimeWeb.TenantView do
  use RealtimeWeb, :view
  alias RealtimeWeb.TenantView

  def render("index.json", %{tenants: tenants}) do
    %{data: render_many(tenants, TenantView, "tenant.json")}
  end

  def render("show.json", %{tenant: tenant}) do
    %{data: render_one(tenant, TenantView, "tenant.json")}
  end

  def render("not_found.json", %{tenant: nil}) do
    %{error: "not found"}
  end

  def render("tenant.json", %{tenant: tenant}) do
    %{
      id: tenant.id,
      external_id: tenant.external_id,
      name: tenant.name,
      max_concurrent_users: tenant.max_concurrent_users,
      max_channels_per_client: tenant.max_channels_per_client,
      max_events_per_second: tenant.max_events_per_second,
      max_joins_per_second: tenant.max_joins_per_second,
      inserted_at: tenant.inserted_at,
      extensions:
        Enum.map(tenant.extensions, fn extension ->
          Map.update(extension, :settings, %{}, fn settings ->
            Map.drop(settings, ["db_password"])
          end)
        end),
      private_only: tenant.private_only,
      max_client_presence_events_per_window: tenant.max_client_presence_events_per_window,
      client_presence_window_ms: tenant.client_presence_window_ms,
      presence_enabled: tenant.presence_enabled
    }
  end
end
