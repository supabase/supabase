defmodule Realtime.MetricsCleanerTest do
  use Realtime.DataCase, async: true

  alias Realtime.MetricsCleaner
  alias Realtime.Tenants.Connect
  alias Forum.Census

  # `get_metrics/0` renders the whole Prometheus payload, so probe it at the cleaner's own
  # schedule rather than at the assertion macros' much finer default.
  @probe_interval_ms 50

  # The tests configure `vacant_metric_threshold_in_seconds: 1`, so a metric is protected for a
  # full second after it goes vacant. Stop just short of that.
  @pre_threshold_ms 900

  @vacant_tenants ["occupied-tenant", "vacant-tenant1", "vacant-tenant2"]
  @disconnected_tenants ["connected-tenant", "disconnected-tenant1", "disconnected-tenant2"]

  describe "metrics cleanup - vacant websockets" do
    test "cleans up metrics for users that have been disconnected" do
      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 1, connected_cluster: 10, limit: 100},
        %{tenant: "occupied-tenant"}
      )

      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 0, connected_cluster: 20, limit: 100},
        %{tenant: "vacant-tenant1"}
      )

      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 0, connected_cluster: 20, limit: 100},
        %{tenant: "vacant-tenant2"}
      )

      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid3 = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(:users, "occupied-tenant", pid1)
      Census.join(:users, "vacant-tenant1", pid2)
      Census.join(:users, "vacant-tenant2", pid3)

      assert exported?("occupied-tenant")
      assert exported?("vacant-tenant1")
      assert exported?("vacant-tenant2")

      start_supervised!(
        {MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 100, vacant_metric_threshold_in_seconds: 1]}
      )

      # Now let's disconnect vacant tenants
      Census.leave(:users, "vacant-tenant1", pid2)
      Census.leave(:users, "vacant-tenant2", pid3)

      # Nothing may be evicted before the 1s threshold. The cleaner runs every 100ms, so that is
      # ~10 runs that each have to decline; the window covers all of them, not just the first two.
      refute_eventually first_missing(@vacant_tenants), timeout: @pre_threshold_ms, interval: @probe_interval_ms

      # Past the threshold the next run evicts the vacant ones and leaves the occupied one.
      assert_eventually(["occupied-tenant"] = still_exported(@vacant_tenants),
        timeout: 3_000,
        interval: @probe_interval_ms
      )
    end

    test "does not clean up metrics if websockets reconnect before threshold" do
      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 1, connected_cluster: 10, limit: 100},
        %{tenant: "reconnect-tenant"}
      )

      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      Census.join(:users, "reconnect-tenant", pid)

      assert exported?("reconnect-tenant")

      start_supervised!(
        {MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 100, vacant_metric_threshold_in_seconds: 1]}
      )

      # Disconnect
      Census.leave(:users, "reconnect-tenant", pid)
      Process.sleep(500)

      # Reconnect before threshold
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(:users, "reconnect-tenant", pid2)

      assert_always exported?("reconnect-tenant"), timeout: 2_200, interval: @probe_interval_ms
    end
  end

  describe "metrics cleanup - disconnected tenants" do
    test "cleans up metrics for tenants that have been unregistered" do
      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 1, connected_cluster: 10, limit: 100},
        %{tenant: "connected-tenant"}
      )

      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 0, connected_cluster: 20, limit: 100},
        %{tenant: "disconnected-tenant1"}
      )

      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 0, connected_cluster: 20, limit: 100},
        %{tenant: "disconnected-tenant2"}
      )

      assert exported?("connected-tenant")
      assert exported?("disconnected-tenant1")
      assert exported?("disconnected-tenant2")

      start_supervised!(
        {MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 100, vacant_metric_threshold_in_seconds: 1]}
      )

      # Simulate tenant registration (connected)
      :telemetry.execute([:syn, Connect, :registered], %{}, %{name: "connected-tenant"})

      # Simulate tenant unregistration (disconnected)
      :telemetry.execute([:syn, Connect, :unregistered], %{}, %{name: "disconnected-tenant1"})
      :telemetry.execute([:syn, Connect, :unregistered], %{}, %{name: "disconnected-tenant2"})

      # Nothing may be evicted before the 1s threshold. The cleaner runs every 100ms, so that is
      # ~10 runs that each have to decline; the window covers all of them, not just the first two.
      refute_eventually first_missing(@disconnected_tenants), timeout: @pre_threshold_ms, interval: @probe_interval_ms

      # Past the threshold the next run evicts the disconnected ones and leaves the connected one.
      assert_eventually(["connected-tenant"] = still_exported(@disconnected_tenants),
        timeout: 3_000,
        interval: @probe_interval_ms
      )
    end

    test "does not clean up metrics if tenant reconnects before threshold" do
      :telemetry.execute(
        [:realtime, :connections],
        %{connected: 1, connected_cluster: 10, limit: 100},
        %{tenant: "reconnect-tenant"}
      )

      assert exported?("reconnect-tenant")

      start_supervised!(
        {MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 100, vacant_metric_threshold_in_seconds: 1]}
      )

      # Simulate tenant unregistration
      :telemetry.execute([:syn, Connect, :unregistered], %{}, %{name: "reconnect-tenant"})
      Process.sleep(500)

      # Re-register before threshold
      :telemetry.execute([:syn, Connect, :registered], %{}, %{name: "reconnect-tenant"})

      assert_always exported?("reconnect-tenant"), timeout: 2_200, interval: @probe_interval_ms
    end
  end

  describe "handle_info/2 unexpected message" do
    test "logs error for unexpected messages" do
      import ExUnit.CaptureLog

      pid =
        start_supervised!(
          {MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 60_000, vacant_metric_threshold_in_seconds: 600]}
        )

      log =
        capture_log(fn ->
          send(pid, :something_unexpected)
          :sys.get_state(pid)
        end)

      assert log =~ "Unexpected message"
      assert log =~ "something_unexpected"
    end
  end

  describe "recently_vacated_tenants/2" do
    test "returns tenants that vacated within the threshold minus the margin" do
      table = :ets.new(:test_recently_vacated, [:set, :public, :named_table])
      now = DateTime.to_unix(DateTime.utc_now(), :second)

      # threshold 600s, margin 60s: only vacancies younger than 540s are returned
      :ets.insert(table, {"just-vacated", now})
      :ets.insert(table, {"vacated-a-while-ago", now - 500})
      :ets.insert(table, {"about-to-be-pruned", now - 580})
      :ets.insert(table, {"past-threshold", now - 700})

      assert Enum.sort(MetricsCleaner.recently_vacated_tenants(table, 600)) == ["just-vacated", "vacated-a-while-ago"]
    end

    test "returns an empty list when the table does not exist" do
      assert MetricsCleaner.recently_vacated_tenants(:does_not_exist, 600) == []
    end

    test "tracks vacancies from the running MetricsCleaner" do
      start_supervised!(
        {MetricsCleaner,
         [
           metrics_cleaner_schedule_timer_in_ms: 60_000,
           vacant_metric_threshold_in_seconds: 600,
           vacant_websockets_table: :test_running_vacant
         ]}
      )

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(:users, "running-tenant", pid)
      Census.leave(:users, "running-tenant", pid)

      assert MetricsCleaner.recently_vacated_tenants(:test_running_vacant, 600) == ["running-tenant"]

      # Getting a websocket back removes the vacancy
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      Census.join(:users, "running-tenant", pid2)

      assert MetricsCleaner.recently_vacated_tenants(:test_running_vacant, 600) == []
    end
  end

  describe "handle_forum_event/4" do
    test "inserts and deletes from ETS table" do
      table = :ets.new(:test_forum, [:set, :public])

      MetricsCleaner.handle_forum_event(
        [:forum, :users, :group, :vacant],
        %{},
        %{group: "test-tenant"},
        table
      )

      assert [{"test-tenant", _timestamp}] = :ets.lookup(table, "test-tenant")

      MetricsCleaner.handle_forum_event(
        [:forum, :users, :group, :occupied],
        %{},
        %{group: "test-tenant"},
        table
      )

      assert [] = :ets.lookup(table, "test-tenant")
    end
  end

  describe "handle_syn_event/4" do
    test "inserts and deletes from ETS table" do
      table = :ets.new(:test_syn, [:set, :public])

      MetricsCleaner.handle_syn_event(
        [:syn, Connect, :unregistered],
        %{},
        %{name: "test-tenant"},
        table
      )

      assert [{"test-tenant", _timestamp}] = :ets.lookup(table, "test-tenant")

      MetricsCleaner.handle_syn_event(
        [:syn, Connect, :registered],
        %{},
        %{name: "test-tenant"},
        table
      )

      assert [] = :ets.lookup(table, "test-tenant")
    end
  end

  defp exported?(tenant), do: tenant in still_exported([tenant])

  # One payload render per probe, not one per tenant, and the *list* is what the assertions wait
  # on: a combined boolean would only ever report `false` on failure, where this names the tenants
  # involved. See `first_missing/1` for the same trick in the other direction.
  defp still_exported(tenants) do
    payload = Realtime.TenantPromEx.get_metrics() |> IO.iodata_to_binary()
    Enum.filter(tenants, &String.contains?(payload, ~s(tenant="#{&1}")))
  end

  defp first_missing(tenants), do: Enum.find(tenants, &(&1 not in still_exported(tenants)))
end
