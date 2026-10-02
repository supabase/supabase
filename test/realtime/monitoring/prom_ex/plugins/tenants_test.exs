defmodule Realtime.PromEx.Plugins.TenantsTest do
  use Realtime.DataCase, async: false

  alias Realtime.GenRpc
  alias Realtime.PromEx.Plugins.Tenants
  alias Realtime.Rpc
  alias Realtime.Tenants.Connect

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_tenants
    @impl true
    def plugins do
      [{Tenants, poll_rate: 50}]
    end
  end

  defmodule Test do
    def success, do: {:ok, "success"}
    def failure, do: {:error, "failure"}
    def exception, do: raise(RuntimeError)
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  describe "event_metrics erpc" do
    setup do
      %{tenant: random_string()}
    end

    test "global success", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "erpc", success: true), timeout: 200) || 0
      assert {:ok, "success"} = Rpc.enhanced_call(node(), Test, :success, [], tenant_id: tenant)
      assert_eventually metric_value(metric, mechanism: "erpc", success: true) == previous_value + 1
    end

    test "global failure", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "erpc", success: false), timeout: 200) || 0
      assert {:error, "failure"} = Rpc.enhanced_call(node(), Test, :failure, [], tenant_id: tenant)
      assert_eventually metric_value(metric, mechanism: "erpc", success: false) == previous_value + 1
    end

    test "global exception", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "erpc", success: false), timeout: 200) || 0

      assert {:error, :rpc_error, %RuntimeError{message: "runtime error"}} =
               Rpc.enhanced_call(node(), Test, :exception, [], tenant_id: tenant)

      assert_eventually metric_value(metric, mechanism: "erpc", success: false) == previous_value + 1
    end
  end

  describe "event_metrics gen_rpc" do
    setup do
      %{tenant: random_string()}
    end

    test "global success", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "gen_rpc", success: true), timeout: 200) || 0
      assert GenRpc.multicall(Test, :success, [], tenant_id: tenant) == [{node(), {:ok, "success"}}]
      assert_eventually metric_value(metric, mechanism: "gen_rpc", success: true) == previous_value + 1
    end

    test "global failure", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "gen_rpc", success: false), timeout: 200) || 0
      assert GenRpc.multicall(Test, :failure, [], tenant_id: tenant) == [{node(), {:error, "failure"}}]
      assert_eventually metric_value(metric, mechanism: "gen_rpc", success: false) == previous_value + 1
    end

    test "global exception", %{tenant: tenant} do
      metric = "realtime_global_rpc_count"
      previous_value = wait(metric_value(metric, mechanism: "gen_rpc", success: false), timeout: 200) || 0
      node = node()

      assert assert [{^node, {:error, :rpc_error, {:EXIT, {%RuntimeError{message: "runtime error"}, _stacktrace}}}}] =
                      GenRpc.multicall(Test, :exception, [], tenant_id: tenant)

      assert_eventually metric_value(metric, mechanism: "gen_rpc", success: false) == previous_value + 1
    end
  end

  describe "pooling metrics" do
    setup do
      local_tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      {:ok, %{tenant: local_tenant}}
    end

    test "conneted based on Connect module information for local node only", %{tenant: tenant} do
      previous_value = wait!(metric_value("realtime_tenants_connected"), timeout: 1_000)
      {:ok, _} = Connect.lookup_or_start_connection(tenant.external_id)
      assert_eventually metric_value("realtime_tenants_connected") == previous_value + 1
    end
  end

  defp metric_value(metric, expected_tags \\ nil) do
    MetricsHelper.search(PromEx.get_metrics(MetricsTest), metric, expected_tags)
  end
end
