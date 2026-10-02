defmodule Supavisor.ApplicationTest do
  use ExUnit.Case, async: false

  setup do
    original_global = Application.get_env(:supavisor, :metrics_pusher_enabled)
    original_tenant = Application.get_env(:supavisor, :tenant_metrics_pusher_enabled)

    on_exit(fn ->
      Application.put_env(:supavisor, :metrics_pusher_enabled, original_global)
      Application.put_env(:supavisor, :tenant_metrics_pusher_enabled, original_tenant)
    end)

    :ok
  end

  describe "metrics_pusher_children/0" do
    test "returns no children when both scopes are disabled" do
      Application.put_env(:supavisor, :metrics_pusher_enabled, false)
      Application.put_env(:supavisor, :tenant_metrics_pusher_enabled, false)

      assert Supavisor.Application.metrics_pusher_children() == []
    end

    test "returns only the global child when only the global scope is enabled" do
      Application.put_env(:supavisor, :metrics_pusher_enabled, true)
      Application.put_env(:supavisor, :tenant_metrics_pusher_enabled, false)

      assert [%{id: Supavisor.MetricsPusher.Global}] =
               Supavisor.Application.metrics_pusher_children()
    end

    test "returns only the tenant child when only the tenant scope is enabled" do
      Application.put_env(:supavisor, :metrics_pusher_enabled, false)
      Application.put_env(:supavisor, :tenant_metrics_pusher_enabled, true)

      assert [%{id: Supavisor.MetricsPusher.Tenant}] =
               Supavisor.Application.metrics_pusher_children()
    end

    test "returns both children with distinct ids when both scopes are enabled" do
      Application.put_env(:supavisor, :metrics_pusher_enabled, true)
      Application.put_env(:supavisor, :tenant_metrics_pusher_enabled, true)

      children = Supavisor.Application.metrics_pusher_children()
      ids = Enum.map(children, & &1.id)

      assert length(children) == 2

      assert Enum.sort(ids) ==
               Enum.sort([Supavisor.MetricsPusher.Global, Supavisor.MetricsPusher.Tenant])
    end
  end
end
