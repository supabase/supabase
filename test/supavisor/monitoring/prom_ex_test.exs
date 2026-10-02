defmodule Supavisor.Monitoring.PromExTest do
  use Supavisor.DataCase, async: true
  use ExUnitProperties

  require Supavisor

  alias Supavisor.PromEx.Plugins.{Cluster, Tenant}

  @subject Supavisor.Monitoring.PromEx

  describe "tenant_metric?/1" do
    test "classifies by tag presence, not by which plugin module defined the metric" do
      tenant_tagged = %Telemetry.Metrics.Counter{
        name: [:supavisor, :some, :metric],
        event_name: [:supavisor, :some, :metric],
        tags: [:tenant, :user]
      }

      # Mirrors Tenant.concurrent_tenants/1's `[:supavisor, :tenants, :active]`
      # last_value: defined inside the Tenant plugin module, but not tagged
      # per-tenant.
      tagless_metric_in_tenant_module = %Telemetry.Metrics.LastValue{
        name: [:supavisor, :tenants, :active],
        event_name: [:supavisor, :tenants],
        tags: []
      }

      assert @subject.tenant_metric?(tenant_tagged)
      refute @subject.tenant_metric?(tagless_metric_in_tenant_module)
    end
  end

  describe "fetch_metrics_by_tenant/0" do
    setup do
      tenants = for i <- 1..3, do: "fetch_by_tenant_#{System.unique_integer([:positive])}_#{i}"

      for {tenant, i} <- Enum.with_index(tenants, 1) do
        id =
          Supavisor.id(type: :single, tenant: tenant, user: "user", mode: :session, db: "db_name")

        Tenant.emit_telemetry_for_tenant(id, i, "app")
      end

      {:ok, tenants: tenants}
    end

    test "groups each tenant's measurements under its own key", %{tenants: tenants} do
      by_tenant = @subject.fetch_metrics_by_tenant()

      for {tenant, expected_active} <- Enum.with_index(tenants, 1) do
        assert %{^tenant => metrics} = by_tenant

        assert [^expected_active] =
                 Enum.find(metrics, fn {metric, _} ->
                   metric.name == [:supavisor, :connections, :active]
                 end)
                 |> elem(1)
                 |> Map.values()
      end
    end

    test "omits metrics that carry no tenant tag" do
      Cluster.emit_cluster_size()

      grouped = @subject.fetch_metrics_by_tenant()
      assert map_size(grouped) > 0

      for {_tenant, metrics} <- grouped,
          {metric, _series} <- metrics do
        assert metric.name != [:supavisor, :prom_ex, :cluster, :size]
        assert :tenant in metric.tags
      end
    end
  end

  describe "get_metrics/1" do
    @sources %{
      {:darwin, :aarch64} => {
        "https://github.com/prometheus/prom2json/releases/download/v1.4.1/prom2json-1.4.1.darwin-arm64.tar.gz",
        "prom2json-1.4.1.darwin-arm64/prom2json"
      },
      {:linux, :aarch64} => {
        "https://github.com/prometheus/prom2json/releases/download/v1.4.1/prom2json-1.4.1.linux-arm64.tar.gz",
        "prom2json-1.4.1.linux-arm64/prom2json"
      },
      {:linux, :x86_64} => {
        "https://github.com/prometheus/prom2json/releases/download/v1.4.1/prom2json-1.4.1.linux-amd64.tar.gz",
        "prom2json-1.4.1.linux-amd64/prom2json"
      }
    }

    setup do
      {:ok, prom2json: Supavisor.Downloader.ensure("prom2json", @sources)}
    end

    @tag :tmp_dir
    test "returned metrics are parseable", %{tmp_dir: dir, prom2json: exe} do
      metrics = @subject.get_metrics()
      file = Path.join(dir, "prom.out")
      File.write!(file, metrics)

      assert {_, 0} = System.cmd(exe, [file])
    end

    @tag :tmp_dir
    property "non-standard DB names do not cause parsing issues", %{tmp_dir: dir, prom2json: exe} do
      tenant = "tenant"
      user = "user"

      check all db_name <- string(:printable, min_length: 1, max_length: 63) do
        Supavisor.Monitoring.Telem.client_join(
          :ok,
          Supavisor.id(type: :single, tenant: tenant, user: user, mode: :session, db: db_name)
        )

        metrics = @subject.get_metrics()
        file = Path.join(dir, "prom.out")
        File.write!(file, metrics)

        assert {out, 0} = System.cmd(exe, [file])
        assert {:ok, measurements} = JSON.decode(out)

        assert %{"metrics" => metrics} =
                 Enum.find(measurements, &(&1["name"] == "supavisor_client_joins_ok"))

        assert Enum.find(metrics, &(&1["labels"]["db_name"] == db_name))
      end
    end

    @tag :tmp_dir
    property "non-standard user names do not cause parsing issues", %{
      tmp_dir: dir,
      prom2json: exe
    } do
      tenant = "tenant"
      db_name = "db_name"

      check all user <- string(:printable, min_length: 1, max_length: 63) do
        Supavisor.Monitoring.Telem.client_join(
          :ok,
          Supavisor.id(type: :single, tenant: tenant, user: user, mode: :session, db: db_name)
        )

        metrics = @subject.get_metrics()
        file = Path.join(dir, "prom.out")
        File.write!(file, metrics)

        assert {out, 0} = System.cmd(exe, [file])
        assert {:ok, measurements} = JSON.decode(out)

        assert %{"metrics" => metrics} =
                 Enum.find(measurements, &(&1["name"] == "supavisor_client_joins_ok"))

        assert Enum.find(metrics, &(&1["labels"]["db_name"] == db_name))
      end
    end

    @tag :tmp_dir
    property "non-standard tenant names do not cause parsing issues", %{
      tmp_dir: dir,
      prom2json: exe
    } do
      db_name = "db_name"
      user = "user"

      check all tenant <- string(:printable, min_length: 1) do
        Supavisor.Monitoring.Telem.client_join(
          :ok,
          Supavisor.id(type: :single, tenant: tenant, user: user, mode: :session, db: db_name)
        )

        metrics = @subject.get_metrics()
        file = Path.join(dir, "prom.out")
        File.write!(file, metrics)

        assert {out, 0} = System.cmd(exe, [file])
        assert {:ok, measurements} = JSON.decode(out)

        assert %{"metrics" => metrics} =
                 Enum.find(measurements, &(&1["name"] == "supavisor_client_joins_ok"))

        assert Enum.find(metrics, &(&1["labels"]["db_name"] == db_name))
      end
    end

    @tag :tmp_dir
    test "get_metrics(:tenant) includes tenant-tagged LastValue metrics but excludes global ones",
         %{tmp_dir: dir, prom2json: exe} do
      tenant = "prom_ex_split_test_tenant_1"

      Tenant.emit_telemetry_for_tenant(
        Supavisor.id(type: :single, tenant: tenant, user: "user", mode: :session, db: "db_name"),
        1,
        ""
      )

      Cluster.emit_cluster_size()

      metrics = @subject.get_metrics(:tenant)
      file = Path.join(dir, "prom.out")
      File.write!(file, metrics)

      assert {out, 0} = System.cmd(exe, [file])
      assert {:ok, measurements} = JSON.decode(out)

      assert %{"metrics" => series} =
               Enum.find(measurements, &(&1["name"] == "supavisor_connections_active"))

      assert Enum.find(series, &(&1["labels"]["tenant"] == tenant))
      refute Enum.find(measurements, &(&1["name"] == "supavisor_prom_ex_cluster_size"))
    end

    @tag :tmp_dir
    test "get_metrics(:global) includes global LastValue metrics but excludes tenant-tagged ones",
         %{tmp_dir: dir, prom2json: exe} do
      tenant = "prom_ex_split_test_tenant_2"

      Tenant.emit_telemetry_for_tenant(
        Supavisor.id(type: :single, tenant: tenant, user: "user", mode: :session, db: "db_name"),
        1,
        ""
      )

      Cluster.emit_cluster_size()

      metrics = @subject.get_metrics(:global)
      file = Path.join(dir, "prom.out")
      File.write!(file, metrics)

      assert {out, 0} = System.cmd(exe, [file])
      assert {:ok, measurements} = JSON.decode(out)

      assert Enum.find(measurements, &(&1["name"] == "supavisor_prom_ex_cluster_size"))

      case Enum.find(measurements, &(&1["name"] == "supavisor_connections_active")) do
        nil -> :ok
        %{"metrics" => series} -> refute Enum.find(series, &(&1["labels"]["tenant"] == tenant))
      end
    end
  end
end
