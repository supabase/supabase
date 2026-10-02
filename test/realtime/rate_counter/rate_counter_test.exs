defmodule Realtime.RateCounterTest do
  use Realtime.DataCase, async: true

  require Logger

  alias Realtime.RateCounter
  alias Realtime.RateCounter.Args
  alias Realtime.GenCounter

  import ExUnit.CaptureLog

  describe "new/2" do
    test "starts a new rate counter without telemetry" do
      id = {:domain, :metric, Ecto.UUID.generate()}
      args = %Args{id: id, opts: []}
      assert {:ok, pid} = RateCounter.new(args)

      assert %Realtime.RateCounter{
               id: ^id,
               avg: +0.0,
               bucket: _,
               max_bucket_len: 60,
               tick: 1000,
               tick_ref: _,
               idle_shutdown: 300_000,
               idle_shutdown_ref: _,
               telemetry: %{emit: false},
               limit: %{log: false}
             } = :sys.get_state(pid)
    end

    test "starts a new rate counter with telemetry" do
      :telemetry.detach(__MODULE__)

      :telemetry.attach(
        __MODULE__,
        [:realtime, :rate_counter, :custom, :new_event],
        &__MODULE__.handle_telemetry/4,
        pid: self()
      )

      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 10,
          telemetry: %{
            event_name: [:custom, :new_event],
            measurements: %{limit: 123},
            metadata: %{tenant: "abc"}
          }
        ]
      }

      assert {:ok, pid} = RateCounter.new(args)

      assert %Realtime.RateCounter{
               id: ^id,
               avg: +0.0,
               bucket: _,
               max_bucket_len: 60,
               tick: 10,
               tick_ref: _,
               idle_shutdown: 300_000,
               idle_shutdown_ref: _,
               telemetry: %{
                 emit: true,
                 event_name: [:realtime, :rate_counter, :custom, :new_event],
                 measurements: %{sum: 0, limit: 123},
                 metadata: %{id: ^id, tenant: "abc"}
               }
             } = :sys.get_state(pid)

      GenCounter.add(args.id, 10)

      assert_receive {
        [:realtime, :rate_counter, :custom, :new_event],
        %{sum: 10, limit: 123},
        %{id: ^id, tenant: "abc"}
      }
    end

    test "raise error when limit is specified without measurement" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 100,
          max_bucket_len: 10,
          limit: [
            value: 10,
            log_fn: fn ->
              Logger.error("ErrorMessage: Reason", external_id: "tenant123", project: "tenant123")
            end
          ]
        ]
      }

      assert {:error, {%KeyError{key: :measurement, term: _}, _}} = RateCounter.new(args)
    end

    test "raise error when limit is specified without value" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 100,
          max_bucket_len: 10,
          limit: [
            measurement: :avg,
            log_fn: fn ->
              Logger.error("ErrorMessage: Reason", external_id: "tenant123", project: "tenant123")
            end
          ]
        ]
      }

      assert {:error, {%KeyError{key: :value, term: _}, _}} = RateCounter.new(args)
    end

    test "raise error when limit is specified without log_fn" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 100,
          max_bucket_len: 10,
          limit: [
            measurement: :avg,
            value: 100
          ]
        ]
      }

      assert {:error, {%KeyError{key: :log_fn, term: _}, _}} = RateCounter.new(args)
    end

    test "starts a new rate counter with avg limit to log" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 100,
          max_bucket_len: 10,
          limit: [
            value: 10,
            measurement: :avg,
            log_fn: fn ->
              Logger.error("ErrorMessage: Reason", external_id: "tenant123", project: "tenant123")
            end
          ]
        ]
      }

      assert {:ok, pid} = RateCounter.new(args)

      assert %RateCounter{
               id: ^id,
               avg: +0.0,
               bucket: _,
               max_bucket_len: 10,
               telemetry: %{emit: false},
               limit: %{
                 log: true,
                 value: 10,
                 triggered: false
               }
             } = :sys.get_state(pid)

      log =
        capture_log(fn ->
          GenCounter.add(args.id, 6)
          Process.sleep(300)
        end)

      assert {:ok, %RateCounter{limit: %{triggered: true}}} = RateCounter.get(args)
      assert log =~ "project=tenant123 external_id=tenant123 [error] ErrorMessage: Reason"

      # Only one log message should be emitted
      # Splitting by the error message returns the error message and the rest of the log only
      assert length(String.split(log, "ErrorMessage: Reason")) == 2

      # The limit clears itself on a later tick.
      assert_eventually({:ok, %RateCounter{limit: %{triggered: false}}} = RateCounter.get(args),
        timeout: 1_000,
        interval: 20
      )
    end

    test "starts a new rate counter with sum limit to log" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 100,
          max_bucket_len: 5,
          limit: [
            value: 49,
            measurement: :sum,
            log_fn: fn ->
              Logger.error("ErrorMessage: Reason", external_id: "tenant123", project: "tenant123")
            end
          ]
        ]
      }

      assert {:ok, pid} = RateCounter.new(args)

      assert %RateCounter{
               id: ^id,
               avg: +0.0,
               sum: 0,
               bucket: _,
               max_bucket_len: 5,
               telemetry: %{emit: false},
               limit: %{
                 log: true,
                 value: 49,
                 measurement: :sum,
                 triggered: false
               }
             } = :sys.get_state(pid)

      log =
        capture_log(fn ->
          GenCounter.add(args.id, 100)
          Process.sleep(120)
        end)

      assert {:ok, %RateCounter{sum: sum, limit: %{triggered: true}}} = RateCounter.get(args)
      assert sum > 49
      assert log =~ "project=tenant123 external_id=tenant123 [error] ErrorMessage: Reason"

      # Only one log message should be emitted
      # Splitting by the error message returns the error message and the rest of the log only
      assert length(String.split(log, "ErrorMessage: Reason")) == 2

      # The bucket drains and the limit clears on later ticks.
      assert_eventually({:ok, %RateCounter{sum: 0, limit: %{triggered: false}}} = RateCounter.get(args),
        timeout: 2_000,
        interval: 20
      )
    end

    test "reset counter if GenCounter already had something" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      GenCounter.add(args.id, 100)
      assert {:ok, _} = RateCounter.new(args)
      assert GenCounter.get(args.id) == 0
    end

    test "rate counters are unique for an Erlang term" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, pid} = RateCounter.new(args)

      assert {:error, {:already_started, ^pid}} = RateCounter.new(args)
    end

    test "rate counters shut themselves down when no activity occurs on the GenCounter" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, pid} = RateCounter.new(args, idle_shutdown: 100)

      Process.monitor(pid)
      assert_receive {:DOWN, _ref, :process, ^pid, :normal}, 200
      # Cache has not expired yet
      assert {:ok, %RateCounter{}} = Cachex.get(RateCounter, args.id)
      # ...and is evicted once its TTL elapses.
      assert_eventually {:ok, nil} = Cachex.get(RateCounter, args.id), timeout: 5_000, interval: 100

      # Ok new RateCounter automatically started now
      assert {:ok, %RateCounter{}} = RateCounter.get(args)

      [{new_pid, _}] = Registry.lookup(Realtime.Registry.Unique, {RateCounter, :rate_counter, args.id})
      assert new_pid != pid
    end

    test "rate counters reset GenCounter to zero after one tick and average the bucket" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, _pid} = RateCounter.new(args, tick: 5)
      assert GenCounter.add(args.id) == 1
      Process.sleep(10)

      assert {:ok,
              %RateCounter{
                avg: avg,
                bucket: bucket,
                id: _id,
                idle_shutdown: _,
                idle_shutdown_ref: _ref,
                max_bucket_len: 60,
                tick: 5,
                tick_ref: _ref2
              }} = RateCounter.get(args)

      assert 1 in bucket
      assert avg > 0.0

      assert GenCounter.get(args.id) == 0
    end
  end

  describe "avg normalization" do
    test "avg represents events per second regardless of tick interval" do
      # 1-second tick: add 10 events → avg should be ~10 events/second
      id_1s = {:domain, :metric, Ecto.UUID.generate()}
      args_1s = %Args{id: id_1s, opts: [tick: 1_000, max_bucket_len: 1]}
      RateCounterHelper.new!(args_1s)

      GenCounter.add(id_1s, 10)
      {:ok, state_1s} = RateCounterHelper.tick!(args_1s)
      assert_in_delta state_1s.avg, 10.0, 0.01

      # 5-second tick: add 50 events (= 10 per second) → avg should also be ~10 events/second
      id_5s = {:domain, :metric, Ecto.UUID.generate()}
      args_5s = %Args{id: id_5s, opts: [tick: 5_000, max_bucket_len: 1]}
      RateCounterHelper.new!(args_5s)

      GenCounter.add(id_5s, 50)
      {:ok, state_5s} = RateCounterHelper.tick!(args_5s)
      assert_in_delta state_5s.avg, 10.0, 0.01
    end

    test "avg limit triggers and unsets correctly with a non-1-second tick" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      args = %Args{
        id: id,
        opts: [
          tick: 5_000,
          max_bucket_len: 1,
          limit: [
            value: 10,
            measurement: :avg,
            log_fn: fn ->
              Logger.warning("RateLimitReached", external_id: "tenant123", project: "tenant123")
            end
          ]
        ]
      }

      RateCounterHelper.new!(args)

      # 60 events over a 5-second tick = 12 events/second, above the 10/s limit
      log =
        capture_log(fn ->
          GenCounter.add(id, 60)
          RateCounterHelper.tick!(args)
        end)

      assert {:ok, %RateCounter{avg: avg, limit: %{triggered: true}}} = RateCounter.get(args)
      assert_in_delta avg, 12.0, 0.01
      assert log =~ "RateLimitReached"

      # 40 events over a 5-second tick = 8 events/second, below the 10/s limit
      GenCounter.add(id, 40)
      RateCounterHelper.tick!(args)
      assert {:ok, %RateCounter{avg: avg, limit: %{triggered: false}}} = RateCounter.get(args)
      assert_in_delta avg, 8.0, 0.01
    end
  end

  describe "publish_update/1" do
    test "cause shutdown with update message from update topic" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, pid} = RateCounter.new(args)

      Process.monitor(pid)
      RateCounter.publish_update(args.id)

      assert_receive {:DOWN, _ref, :process, ^pid, :normal}
    end
  end

  describe "get/1" do
    test "gets the state of a rate counter" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, _} = RateCounter.new(args)

      assert {:ok, %RateCounter{}} = RateCounter.get(args)
    end

    test "creates counter if not started yet" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}

      assert {:ok, %RateCounter{}} = RateCounter.get(args)
    end
  end

  describe "find/1" do
    test "gets the state of a running rate counter" do
      args = %Args{id: {:domain, :metric, Ecto.UUID.generate()}}
      {:ok, _} = RateCounter.new(args)

      assert {:ok, %RateCounter{id: id}} = RateCounter.find(args.id)
      assert id == args.id
    end

    test "does not start a rate counter" do
      id = {:domain, :metric, Ecto.UUID.generate()}

      assert RateCounter.find(id) == {:error, :not_found}
      assert RateCounter.find(id) == {:error, :not_found}
    end
  end

  def handle_telemetry(event, measures, metadata, pid: pid), do: send(pid, {event, measures, metadata})
end
