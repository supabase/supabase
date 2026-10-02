defmodule SupavisorWeb.TenantView do
  use SupavisorWeb, :view
  alias SupavisorWeb.TenantView
  alias SupavisorWeb.UserView

  def render("index.json", %{tenants: tenants}) do
    %{data: render_many(tenants, TenantView, "tenant.json")}
  end

  def render("show.json", %{tenant: tenant}) do
    %{data: render_one(tenant, TenantView, "tenant.json")}
  end

  def render("tenant.json", %{tenant: tenant}) do
    %{tenant | users: render_many(tenant.users, UserView, "user.json")}
  end

  def render("error.json", %{error: reason}) do
    %{error: reason}
  end

  def render("show_terminate.json", %{result: result}) do
    %{result: result}
  end

  def render("list_network_bans.json", %{bans: bans}) do
    %{banned_ipv4_addresses: bans}
  end

  def render("not_found.json", _) do
    %{error: "not found"}
  end
end
