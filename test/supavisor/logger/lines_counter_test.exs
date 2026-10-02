defmodule Supavisor.Logger.LinesCounterTest do
  use ExUnit.Case, async: false

  @subject Supavisor.Logger.LinesCounter
  @event [:supavisor, :logger, :lines]
  @test_name :lines_counter_test

  setup do
    original_enable = Application.get_env(:supavisor, :logger_burst_limit_enable)
    original_max_count = Application.get_env(:supavisor, :logger_burst_limit_max_count)
    original_window_time = Application.get_env(:supavisor, :logger_burst_limit_window_time)

    Application.put_env(:supavisor, :logger_burst_limit_enable, true)
    Application.put_env(:supavisor, :logger_burst_limit_max_count, 5)
    Application.put_env(:supavisor, :logger_burst_limit_window_time, 60_000)

    on_exit(fn ->
      Application.put_env(:supavisor, :logger_burst_limit_enable, original_enable)
      Application.put_env(:supavisor, :logger_burst_limit_max_count, original_max_count)
      Application.put_env(:supavisor, :logger_burst_limit_window_time, original_window_time)
      :logger.remove_handler_filter(:default, @test_name)
    end)

    pid = start_supervised!({@subject, name: @test_name, install_filter?: false})
    %{ref: ref} = :sys.get_state(pid)

    %{pid: pid, ref: ref}
  end

  defp attach_telemetry(pid) do
    :telemetry.attach(
      "lines-counter-test-#{inspect(pid)}",
      @event,
      fn _event, measurements, _meta, %{test_pid: test_pid} ->
        send(test_pid, {:telemetry, measurements})
      end,
      %{test_pid: self()}
    )
  end

  test "count/2 increments the counter and returns the log event unchanged", %{ref: ref} do
    assert @subject.count(:some_log_event, ref) == :some_log_event
    assert :counters.get(ref, 1) == 1

    @subject.count(:another_log_event, ref)
    assert :counters.get(ref, 1) == 2
  end

  test "tick fires telemetry with the exact count and dropped: 0 when at or below max_count", %{
    pid: pid,
    ref: ref
  } do
    attach_telemetry(pid)

    for _ <- 1..5, do: @subject.count(:log_event, ref)

    send(pid, :tick)

    assert_receive {:telemetry, %{count: 5, dropped: 0}}, 200
  end

  test "tick fires telemetry with the exact count and the excess as dropped, when count exceeds max_count",
       %{pid: pid, ref: ref} do
    attach_telemetry(pid)

    for _ <- 1..8, do: @subject.count(:log_event, ref)

    send(pid, :tick)

    assert_receive {:telemetry, %{count: 8, dropped: 3}}, 200
  end

  test "tick resets the counter, so a subsequent tick with no new counts fires nothing", %{
    pid: pid,
    ref: ref
  } do
    attach_telemetry(pid)

    for _ <- 1..8, do: @subject.count(:log_event, ref)
    send(pid, :tick)
    assert_receive {:telemetry, %{count: 8, dropped: 3}}, 200

    send(pid, :tick)
    refute_receive {:telemetry, _}, 200
  end

  test "tick does not fire telemetry when nothing was counted", %{pid: pid} do
    attach_telemetry(pid)

    send(pid, :tick)

    refute_receive {:telemetry, _}, 200
  end

  # :default doesn't exist during `mix test` — ExUnit's capture_log support
  # (see test_helper.exs, `ExUnit.start(capture_log: ...)`) replaces it with
  # its own handler. So these tests target a throwaway handler they install
  # themselves, via the `:handler_id` opt (production always uses the
  # default, :default).
  describe "real :logger filter installation" do
    setup do
      handler_id = :"#{@test_name}_handler"
      # level: :emergency keeps this handler from ever receiving real ambient
      # log traffic from the rest of the test suite, so counts stay exact.
      :ok = :logger.add_handler(handler_id, :logger_std_h, %{level: :emergency})
      on_exit(fn -> :logger.remove_handler(handler_id) end)
      %{handler_id: handler_id}
    end

    test "installs a filter on the target handler under its own name", %{handler_id: handler_id} do
      start_supervised!(
        {@subject, name: :"#{@test_name}_installed", handler_id: handler_id},
        id: :installed
      )

      {:ok, %{filters: filters}} = :logger.get_handler_config(handler_id)
      assert Keyword.has_key?(filters, :"#{@test_name}_installed")
    end

    test "init/1 is idempotent across a restart under the same filter id (regression: stale filter left behind)",
         %{handler_id: handler_id} do
      name = :"#{@test_name}_restart"
      opts = [handler_id: handler_id, filter_id: name]

      # A second init/1 under the same filter_id simulates exactly what
      # happens when a supervisor restarts this GenServer after a crash: the
      # filter installed by the first init/1 is still registered on the
      # handler (it isn't tied to the crashed process's lifecycle), pointing
      # at that first init's now-orphaned ref.
      assert {:ok, %{ref: ref1}} = @subject.init(opts)
      assert {:ok, %{ref: ref2}} = @subject.init(opts)

      refute ref1 == ref2

      {:ok, %{filters: filters}} = :logger.get_handler_config(handler_id)
      assert {^name, {_fun, ^ref2}} = List.keyfind(filters, name, 0)
    end

    test "logger_burst_limit_enable: false skips installing the filter at all", %{
      handler_id: handler_id
    } do
      Application.put_env(:supavisor, :logger_burst_limit_enable, false)
      name = :"#{@test_name}_disabled"

      start_supervised!({@subject, name: name, handler_id: handler_id}, id: :disabled)

      {:ok, %{filters: filters}} = :logger.get_handler_config(handler_id)
      refute Keyword.has_key?(filters, name)
    end
  end
end
