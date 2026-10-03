defmodule Realtime.Tenants.ReplicationConnection.WatchdogTest do
  use ExUnit.Case, async: true

  use Mimic
  use TestHelpers

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Database
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection.Watchdog

  defmodule FakeReplicationConnection do
    def child_spec(opts) do
      %{id: __MODULE__, start: {__MODULE__, :start_link, [opts]}, type: :worker, restart: :temporary, shutdown: 500}
    end

    def start_link(opts \\ []), do: :gen_statem.start_link(__MODULE__, opts, [])

    def callback_mode, do: :state_functions

    def init(opts) do
      respond_to_health_checks = Keyword.get(opts, :respond_to_health_checks, true)
      delay_ms = Keyword.get(opts, :delay_ms, 0)

      data = %{
        respond_to_health_checks: respond_to_health_checks,
        delay_ms: delay_ms,
        health_check_count: 0
      }

      {:ok, :idle, data}
    end

    def idle({:call, from}, :health_check, %{respond_to_health_checks: true, delay_ms: delay_ms} = data) do
      if delay_ms > 0 do
        Process.sleep(delay_ms)
      end

      :gen_statem.reply(from, :ok)
      {:keep_state, %{data | health_check_count: data.health_check_count + 1}}
    end

    def idle({:call, _from}, :health_check, %{respond_to_health_checks: false} = data) do
      # Don't reply - this will cause a timeout
      {:keep_state, %{data | health_check_count: data.health_check_count + 1}}
    end

    def idle({:call, from}, :get_health_check_count, data) do
      :gen_statem.reply(from, data.health_check_count)
      {:keep_state, data}
    end

    def idle({:call, from}, :set_no_respond, data) do
      :gen_statem.reply(from, :ok)
      {:keep_state, %{data | respond_to_health_checks: false}}
    end

    def get_health_check_count(pid), do: :gen_statem.call(pid, :get_health_check_count)

    def set_no_respond(pid), do: :gen_statem.call(pid, :set_no_respond)
  end

  test "performs periodic health checks successfully" do
    fake_pid = start_link_supervised!(FakeReplicationConnection)

    watchdog_pid =
      start_supervised!(
        {Watchdog, parent_pid: fake_pid, tenant_id: "test-tenant", watchdog_interval: 50, watchdog_timeout: 100}
      )

    # Wait for at least 2 health check cycles and verify health checks were performed.
    assert_eventually FakeReplicationConnection.get_health_check_count(fake_pid) >= 2, timeout: 1_000, interval: 10

    assert Process.alive?(watchdog_pid)
    assert Process.alive?(fake_pid)
  end

  describe "timeout handling" do
    test "stops when health check times out" do
      # Create a fake process that doesn't respond to health checks
      fake_pid = start_supervised!({FakeReplicationConnection, respond_to_health_checks: false})

      logs =
        capture_log(fn ->
          watchdog_pid =
            start_supervised!(
              {Watchdog, parent_pid: fake_pid, tenant_id: "test-tenant", watchdog_interval: 50, watchdog_timeout: 100}
            )

          ref = Process.monitor(watchdog_pid)

          # Wait for the first health check to timeout
          assert_receive {:DOWN, ^ref, :process, ^watchdog_pid, :watchdog_timeout}, 500
          refute Process.alive?(watchdog_pid)
        end)

      assert logs =~ "ReplicationConnectionWatchdogTimeout"
      assert logs =~ "ReplicationConnection is not responding"
    end

    test "stops immediately if health check takes longer than timeout" do
      # Create a fake process with a 200ms delay
      fake_pid = start_supervised!({FakeReplicationConnection, delay_ms: 200})

      logs =
        capture_log(fn ->
          watchdog_pid =
            start_supervised!(
              {Watchdog, parent_pid: fake_pid, tenant_id: "timeout-test", watchdog_interval: 50, watchdog_timeout: 100}
            )

          ref = Process.monitor(watchdog_pid)

          # Should timeout because delay (200ms) > timeout (100ms)
          assert_receive {:DOWN, ^ref, :process, ^watchdog_pid, :watchdog_timeout}, 500
        end)

      assert logs =~ "ReplicationConnectionWatchdogTimeout"
    end
  end

  describe "dynamic behavior changes" do
    test "handles transition from healthy to timeout" do
      # Start with responding, then stop responding
      fake_pid = start_supervised!(FakeReplicationConnection)

      watchdog_pid =
        start_supervised!(
          {Watchdog, parent_pid: fake_pid, tenant_id: "test-tenant", watchdog_interval: 50, watchdog_timeout: 100}
        )

      assert_eventually FakeReplicationConnection.get_health_check_count(fake_pid) >= 1, timeout: 1_000, interval: 10
      assert Process.alive?(watchdog_pid)

      ref = Process.monitor(watchdog_pid)
      # Now make the fake process stop responding
      FakeReplicationConnection.set_no_respond(fake_pid)

      logs =
        capture_log(fn ->
          # Should timeout on next health check
          assert_receive {:DOWN, ^ref, :process, ^watchdog_pid, :watchdog_timeout}, 500
        end)

      assert logs =~ "ReplicationConnectionWatchdogTimeout"
    end
  end

  describe "slot lag monitoring" do
    setup do
      fake_pid = start_link_supervised!(FakeReplicationConnection)
      %{fake_pid: fake_pid}
    end

    test "continues when slot lag is below threshold", %{fake_pid: fake_pid} do
      stub(Connect, :get_status, fn _tenant_id -> {:ok, :fake_conn} end)
      stub(Database, :check_replication_slot, fn _conn, _slot -> :ok end)

      watchdog_pid =
        start_supervised!(
          {Watchdog,
           parent_pid: fake_pid,
           tenant_id: "lag-test",
           watchdog_interval: 50,
           watchdog_timeout: 100,
           replication_slot_name: "test_slot"}
        )

      Mimic.allow(Connect, self(), watchdog_pid)
      Mimic.allow(Database, self(), watchdog_pid)

      assert_always Process.alive?(watchdog_pid), timeout: 120, interval: 10
    end

    test "stops with :slot_lag_too_high when lag exceeds threshold", %{fake_pid: fake_pid} do
      stub(Connect, :get_status, fn _tenant_id -> {:ok, :fake_conn} end)
      stub(Database, :check_replication_slot, fn _conn, _slot -> {:error, :lag_too_high} end)

      logs =
        capture_log(fn ->
          watchdog_pid =
            start_supervised!(
              {Watchdog,
               parent_pid: fake_pid,
               tenant_id: "lag-test",
               watchdog_interval: 50,
               watchdog_timeout: 100,
               replication_slot_name: "test_slot"}
            )

          Mimic.allow(Connect, self(), watchdog_pid)
          Mimic.allow(Database, self(), watchdog_pid)

          ref = Process.monitor(watchdog_pid)
          assert_receive {:DOWN, ^ref, :process, ^watchdog_pid, :slot_lag_too_high}, 500
        end)

      assert logs =~ "ReplicationSlotLagTooHigh"
    end

    test "continues when DB connection is unavailable (graceful degradation)", %{fake_pid: fake_pid} do
      stub(Connect, :get_status, fn _tenant_id -> {:error, :tenant_database_unavailable} end)

      logs =
        capture_log(fn ->
          watchdog_pid =
            start_supervised!(
              {Watchdog,
               parent_pid: fake_pid,
               tenant_id: "lag-test",
               watchdog_interval: 50,
               watchdog_timeout: 100,
               replication_slot_name: "test_slot"}
            )

          Mimic.allow(Connect, self(), watchdog_pid)

          assert_always Process.alive?(watchdog_pid), timeout: 120, interval: 10
        end)

      assert logs =~ "ReplicationSlotCheckSkipped"
    end
  end

  describe "slot liveness monitoring" do
    setup do
      fake_pid = start_link_supervised!(FakeReplicationConnection)
      %{fake_pid: fake_pid}
    end

    for {reason, description} <- [slot_not_found: "no longer exists", slot_inactive: "is inactive"] do
      test "stops with :replication_slot_not_alive when slot #{description}", %{fake_pid: fake_pid} do
        reason = unquote(reason)
        stub(Connect, :get_status, fn _tenant_id -> {:ok, :fake_conn} end)
        stub(Database, :check_replication_slot, fn _conn, _slot -> {:error, reason} end)

        logs =
          capture_log(fn ->
            watchdog_pid =
              start_supervised!(
                {Watchdog,
                 parent_pid: fake_pid,
                 tenant_id: "slot-test",
                 watchdog_interval: 50,
                 watchdog_timeout: 100,
                 replication_slot_name: "test_slot"}
              )

            Mimic.allow(Connect, self(), watchdog_pid)
            Mimic.allow(Database, self(), watchdog_pid)

            ref = Process.monitor(watchdog_pid)
            assert_receive {:DOWN, ^ref, :process, ^watchdog_pid, :replication_slot_not_alive}, 500
          end)

        assert logs =~ "ReplicationSlotNotAlive"
      end
    end

    test "continues when slot is alive and lag is below threshold", %{fake_pid: fake_pid} do
      stub(Connect, :get_status, fn _tenant_id -> {:ok, :fake_conn} end)
      stub(Database, :check_replication_slot, fn _conn, _slot -> :ok end)

      watchdog_pid =
        start_supervised!(
          {Watchdog,
           parent_pid: fake_pid,
           tenant_id: "slot-test",
           watchdog_interval: 50,
           watchdog_timeout: 100,
           replication_slot_name: "test_slot"}
        )

      Mimic.allow(Connect, self(), watchdog_pid)
      Mimic.allow(Database, self(), watchdog_pid)

      assert_always Process.alive?(watchdog_pid), timeout: 120, interval: 10
    end
  end
end
