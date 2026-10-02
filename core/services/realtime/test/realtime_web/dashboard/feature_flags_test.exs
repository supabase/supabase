defmodule RealtimeWeb.Dashboard.FeatureFlagsTest do
  use RealtimeWeb.ConnCase, async: false
  import Phoenix.LiveViewTest

  alias Realtime.Api
  alias Realtime.FeatureFlags.Cache
  alias Realtime.Tenants.Cache, as: TenantsCache

  @path "/admin/dashboard/feature_flags"

  setup_all do
    Application.put_env(:realtime, :dashboard_auth, :basic_auth)
    Application.put_env(:realtime, :dashboard_credentials, {"user", "pass"})

    on_exit(fn ->
      Application.delete_env(:realtime, :dashboard_auth)
      Application.delete_env(:realtime, :dashboard_credentials)
    end)

    :ok
  end

  setup do
    # These caches are global (not sandboxed); clear them so a flag/tenant from a
    # previous test can't be served stale.
    Cachex.clear(Cache)
    Cachex.clear(TenantsCache)
    conn = using_basic_auth(build_conn(), "user", "pass")
    %{conn: conn}
  end

  test "renders the page with an existing flag", %{conn: conn} do
    flag_fixture(%{name: "render_flag"})

    {:ok, _view, html} = live(conn, @path)

    assert html =~ "Feature Flags"
    assert html =~ "render_flag"
  end

  test "creates a new flag", %{conn: conn} do
    {:ok, view, _html} = live(conn, @path)

    html = view |> element("form[phx-submit='create']") |> render_submit(%{name: "brand_new_flag"})

    assert html =~ "brand_new_flag"
  end

  test "toggles a flag's global enabled state", %{conn: conn} do
    flag = flag_fixture(%{name: "toggle_flag", enabled: false})

    {:ok, view, html} = live(conn, @path)
    assert html =~ "Disabled"

    html = view |> element("button[phx-click='toggle'][phx-value-id='#{flag.id}']") |> render_click()
    assert html =~ "Enabled"
  end

  describe "tenant override manager" do
    test "shows 'No override' with Enable/Disable and no Clear when the tenant has no override",
         %{conn: conn} do
      flag = flag_fixture(%{name: "no_override_flag", enabled: true})
      tenant = tenant_fixture(%{feature_flags: %{}})

      {:ok, view, _html} = live(conn, @path)
      html = open_and_search(view, flag, tenant.external_id)

      assert html =~ tenant.external_id
      assert html =~ "No override"
      # Both set actions are available, but there is nothing to clear yet.
      assert html =~ "set_tenant_flag"
      refute html =~ "clear_tenant_flag"
    end

    test "shows 'Override: Enabled' and a Clear override action for an explicitly enabled tenant",
         %{conn: conn} do
      flag = flag_fixture(%{name: "override_on_flag", enabled: false})
      tenant = tenant_fixture(%{feature_flags: %{"override_on_flag" => true}})

      {:ok, view, _html} = live(conn, @path)
      html = open_and_search(view, flag, tenant.external_id)

      assert html =~ "Override: Enabled"
      assert html =~ "clear_tenant_flag"
    end

    test "shows 'Override: Disabled' for an explicitly disabled tenant", %{conn: conn} do
      flag = flag_fixture(%{name: "override_off_flag", enabled: true})
      tenant = tenant_fixture(%{feature_flags: %{"override_off_flag" => false}})

      {:ok, view, _html} = live(conn, @path)
      html = open_and_search(view, flag, tenant.external_id)

      assert html =~ "Override: Disabled"
      assert html =~ "clear_tenant_flag"
    end

    test "Enable button writes an explicit override", %{conn: conn} do
      flag = flag_fixture(%{name: "enable_flag", enabled: false})
      tenant = tenant_fixture(%{feature_flags: %{}})

      {:ok, view, _html} = live(conn, @path)
      open_and_search(view, flag, tenant.external_id)

      html = view |> element("button[phx-click='set_tenant_flag'][phx-value-enabled='true']") |> render_click()
      assert html =~ "Override: Enabled"

      updated = Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
      assert updated.feature_flags == %{"enable_flag" => true}
    end

    test "Clear override button removes the override", %{conn: conn} do
      flag = flag_fixture(%{name: "clear_flag", enabled: false})
      tenant = tenant_fixture(%{feature_flags: %{"clear_flag" => true}})

      {:ok, view, _html} = live(conn, @path)
      open_and_search(view, flag, tenant.external_id)

      html = view |> element("button[phx-click='clear_tenant_flag']") |> render_click()
      assert html =~ "No override"

      updated = Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
      assert updated.feature_flags == %{}
    end

    test "shows an error for an unknown tenant", %{conn: conn} do
      flag = flag_fixture(%{name: "unknown_tenant_flag", enabled: false})

      {:ok, view, _html} = live(conn, @path)
      view |> element("button[phx-click='open_tenant_manager'][phx-value-id='#{flag.id}']") |> render_click()
      html = view |> element("form[phx-submit='search_tenant']") |> render_submit(%{tenant_id: "nonexistent"})

      assert html =~ "Tenant not found"
    end
  end

  defp flag_fixture(attrs) do
    {:ok, flag} = Api.upsert_feature_flag(Map.merge(%{name: random_string(), enabled: false}, attrs))
    flag
  end

  defp open_and_search(view, flag, tenant_id) do
    view |> element("button[phx-click='open_tenant_manager'][phx-value-id='#{flag.id}']") |> render_click()
    view |> element("form[phx-submit='search_tenant']") |> render_submit(%{tenant_id: tenant_id})
  end

  defp using_basic_auth(conn, username, password) do
    header_content = "Basic " <> Base.encode64("#{username}:#{password}")
    put_req_header(conn, "authorization", header_content)
  end
end
