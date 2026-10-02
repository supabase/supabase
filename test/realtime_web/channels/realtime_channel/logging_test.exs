defmodule RealtimeWeb.RealtimeChannel.LoggingTest do
  # async: false due to changes in Logger levels and shared Cachex state
  use Realtime.DataCase, async: false
  import ExUnit.CaptureLog
  alias RealtimeWeb.RealtimeChannel.Logging

  def handle_telemetry(event, measures, metadata, pid: pid), do: send(pid, {event, measures, metadata})

  setup do
    :telemetry.attach(__MODULE__, [:realtime, :channel, :error], &__MODULE__.handle_telemetry/4, pid: self())
    level = Logger.level()
    Logger.configure(level: :info)
    tenant = tenant_fixture()
    Cachex.clear(Realtime.LogThrottle)

    on_exit(fn ->
      :telemetry.detach(__MODULE__)
      Logger.configure(level: level)
    end)

    %{tenant: tenant}
  end

  describe "log_error/3" do
    test "logs error message with JWT claims in metadata", %{tenant: tenant} do
      sub = random_string()
      exp = System.system_time(:second) + 1000
      iss = "https://#{random_string()}.com"
      token = generate_jwt_token(tenant, %{sub: sub, exp: exp, iss: iss})
      socket = %{assigns: %{log_level: :error, tenant: tenant.external_id, access_token: token}}

      log =
        capture_log(fn ->
          {:error, %{reason: "TestError: test error"}} = Logging.log_error(socket, "TestError", "test error")
        end)

      assert log =~ "TestError: test error"
      assert log =~ "sub=#{sub}"
      assert log =~ "exp=#{exp}"
      assert log =~ "iss=#{iss}"
      assert log =~ "error_code=TestError"
    end
  end

  describe "log_warning/3" do
    test "logs warning message with JWT claims in metadata", %{tenant: tenant} do
      sub = random_string()
      exp = System.system_time(:second) + 1000
      iss = "https://#{random_string()}.com"
      token = generate_jwt_token(tenant, %{sub: sub, exp: exp, iss: iss})
      socket = %{assigns: %{log_level: :warning, tenant: tenant.external_id, access_token: token}}

      log =
        capture_log(fn ->
          {:error, %{reason: "TestWarning: test warning"}} = Logging.log_warning(socket, "TestWarning", "test warning")
        end)

      assert log =~ "TestWarning: test warning"
      assert log =~ "sub=#{sub}"
      assert log =~ "exp=#{exp}"
      assert log =~ "iss=#{iss}"
      assert log =~ "error_code=TestWarning"
    end
  end

  describe "maybe_log_error/4" do
    test "logs error message when log_level is less or equal to error" do
      log_levels = [:debug, :info, :warning, :error]

      for log_level <- log_levels do
        socket = %{assigns: %{log_level: log_level, tenant: random_string(), access_token: "test_token"}}

        log =
          capture_log(fn ->
            assert Logging.maybe_log_error(socket, "TestCode", "test message") ==
                     {:error, %{reason: "TestCode: test message"}}
          end)

        assert log =~ "TestCode: test message"
        assert log =~ "error_code=TestCode"

        assert capture_log(fn ->
                 assert Logging.maybe_log_error(socket, "TestCode", %{a: "b"}) ==
                          {:error, %{reason: "TestCode: %{a: \"b\"}"}}
               end) =~ "TestCode: %{a: \"b\"}"
      end
    end

    test "does not log error message when log_level is higher than error" do
      socket = %{assigns: %{log_level: :critical, tenant: random_string(), access_token: "test_token"}}

      assert capture_log(fn ->
               assert Logging.maybe_log_error(socket, "TestCode", "test message") ==
                        {:error, %{reason: "TestCode: test message"}}
             end) == ""
    end

    test "also returns {:error, %{reason: msg}} when log_level is error" do
      socket = %{assigns: %{log_level: :error, tenant: random_string(), access_token: "test_token"}}

      assert Logging.maybe_log_error(socket, "TestCode", "test message") ==
               {:error, %{reason: "TestCode: test message"}}
    end
  end

  describe "maybe_log_warning/4" do
    test "logs warning message when log_level is less or equal to warning" do
      log_levels = [:debug, :info, :warning]

      for log_level <- log_levels do
        socket = %{assigns: %{log_level: log_level, tenant: random_string(), access_token: "test_token"}}

        log =
          capture_log(fn ->
            assert Logging.maybe_log_warning(socket, "TestCode", "test message") ==
                     {:error, %{reason: "TestCode: test message"}}
          end)

        assert log =~ "TestCode: test message"
        assert log =~ "error_code=TestCode"

        assert capture_log(fn ->
                 assert Logging.maybe_log_warning(socket, "TestCode", %{a: "b"}) ==
                          {:error, %{reason: "TestCode: %{a: \"b\"}"}}
               end) =~ "TestCode: %{a: \"b\"}"
      end
    end

    test "does not log error message when log_level is higher than warning" do
      socket = %{assigns: %{log_level: :error, tenant: random_string(), access_token: "test_token"}}

      assert capture_log(fn ->
               assert Logging.maybe_log_warning(socket, "TestCode", "test message") ==
                        {:error, %{reason: "TestCode: test message"}}
             end) == ""
    end

    test "also returns {:error, %{reason: msg}} when log_level is warning" do
      socket = %{assigns: %{log_level: :warning, tenant: random_string(), access_token: "test_token"}}

      assert Logging.maybe_log_warning(socket, "TestCode", "test message") ==
               {:error, %{reason: "TestCode: test message"}}
    end
  end

  describe "maybe_log_info/3" do
    test "logs error message when log_level is less or equal to info" do
      log_levels = [:debug, :info]

      for log_level <- log_levels do
        socket = %{assigns: %{log_level: log_level, tenant: random_string(), access_token: "test_token"}}

        assert capture_log(fn -> :ok = Logging.maybe_log_info(socket, "test message") end) =~ "test message"
        assert capture_log(fn -> :ok = Logging.maybe_log_info(socket, %{a: "b"}) end) =~ "%{a: \"b\"}"
      end
    end

    test "does not log error message when log_level is higher than info" do
      socket = %{assigns: %{log_level: :warning, tenant: random_string(), access_token: "test_token"}}
      assert capture_log(fn -> :ok = Logging.maybe_log_info(socket, "test message") end) == ""
    end
  end

  test "emits telemetry for  errors with tenant metadata" do
    tenant_id = random_string()
    socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}
    error = "TestError"

    assert Logging.maybe_log_error(socket, error, "test error") == {:error, %{reason: "#{error}: test error"}}
    assert_receive {[:realtime, :channel, :error], %{count: 1}, %{code: ^error, tenant: ^tenant_id}}

    assert Logging.maybe_log_warning(socket, error, "test error") == {:error, %{reason: "#{error}: test error"}}
    refute_receive {[:realtime, :channel, :error], %{count: 1}, %{code: ^error, tenant: ^tenant_id}}

    assert Logging.maybe_log_info(socket, "test error") == :ok
    refute_receive {[:realtime, :channel, :error], %{count: 1}, %{code: ^error, tenant: ^tenant_id}}
  end

  test "logs include JWT claims in metadata", %{tenant: tenant} do
    sub = random_string()
    exp = System.system_time(:second) + 1000
    iss = "https://#{random_string()}.com"
    token = generate_jwt_token(tenant, %{sub: sub, exp: exp, iss: iss})
    socket = %{assigns: %{log_level: :error, tenant: tenant.external_id, access_token: token}}
    log = capture_log(fn -> Logging.maybe_log_error(socket, "TestError", "test error") end)
    assert log =~ "sub=#{sub}"
    assert log =~ "exp=#{exp}"
    assert log =~ "iss=#{iss}"
  end

  test "logs include project metadata" do
    tenant_id = random_string()
    socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}

    log = capture_log(fn -> Logging.maybe_log_error(socket, "TestError", "test error") end)
    assert log =~ tenant_id
  end

  describe "throttle option" do
    test "logs exactly max_count times within the window but always emits telemetry" do
      tenant_id = random_string()
      socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}

      logs =
        capture_log(fn ->
          for _ <- 1..5 do
            Logging.maybe_log_error(socket, "ThrottleCode", "msg", throttle: {3, :timer.seconds(60)})
          end
        end)

      assert logs |> String.split("ThrottleCode: msg") |> length() == 4

      for _ <- 1..5 do
        assert_receive {[:realtime, :channel, :error], %{count: 1}, %{code: "ThrottleCode", tenant: ^tenant_id}}
      end
    end

    test "still returns {:error, reason} even when throttled" do
      tenant_id = random_string()
      socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}

      for _ <- 1..5 do
        assert Logging.maybe_log_error(socket, "ThrottleCode", "msg", throttle: {2, :timer.seconds(60)}) ==
                 {:error, %{reason: "ThrottleCode: msg"}}
      end
    end

    test "resets after the window expires" do
      tenant_id = random_string()
      socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}

      logs_before =
        capture_log(fn ->
          for _ <- 1..3, do: Logging.maybe_log_error(socket, "WindowCode", "msg", throttle: {2, 200})
        end)

      assert logs_before |> String.split("WindowCode: msg") |> length() == 3

      Process.sleep(400)

      logs_after =
        capture_log(fn ->
          for _ <- 1..3, do: Logging.maybe_log_error(socket, "WindowCode", "msg", throttle: {2, 200})
        end)

      assert logs_after |> String.split("WindowCode: msg") |> length() == 3
    end

    test "different tenant+code pairs have independent counters" do
      socket_a = %{assigns: %{log_level: :error, tenant: random_string(), access_token: "t"}}
      socket_b = %{assigns: %{log_level: :error, tenant: random_string(), access_token: "t"}}

      logs =
        capture_log(fn ->
          for _ <- 1..3 do
            Logging.maybe_log_error(socket_a, "CodeA", "msg", throttle: {2, :timer.seconds(60)})
            Logging.maybe_log_error(socket_b, "CodeB", "msg", throttle: {2, :timer.seconds(60)})
          end
        end)

      assert logs |> String.split("CodeA: msg") |> length() == 3
      assert logs |> String.split("CodeB: msg") |> length() == 3
    end

    test "callers do not exceed max_count" do
      tenant_id = random_string()
      socket = %{assigns: %{log_level: :error, tenant: tenant_id, access_token: "test_token"}}

      logs =
        capture_log(fn ->
          for _ <- 1..20 do
            Logging.maybe_log_error(socket, "ConcurrentCode", "msg", throttle: {5, :timer.seconds(60)})
          end
        end)

      assert logs |> String.split("ConcurrentCode: msg") |> length() == 6
    end
  end
end
