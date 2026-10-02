# Based on https://github.com/rkallos/peep/blob/708546ed069aebdf78ac1f581130332bd2e8b5b1/test/prometheus_test.exs
defmodule Realtime.Monitoring.PrometheusTest do
  use ExUnit.Case, async: true

  alias Realtime.Monitoring.Prometheus
  alias Telemetry.Metrics

  defmodule StorageCounter do
    @moduledoc false
    use Agent

    def start() do
      Agent.start(fn -> 0 end, name: __MODULE__)
    end

    def fresh_id() do
      Agent.get_and_update(__MODULE__, fn i -> {:"#{i}", i + 1} end)
    end
  end

  # Test struct that doesn't implement String.Chars
  defmodule TestError do
    defstruct [:reason, :code]
  end

  setup_all do
    StorageCounter.start()
    :ok
  end

  @impls [:default, {Realtime.Monitoring.Peep.Partitioned, 4}, :striped]

  for impl <- @impls do
    test "#{inspect(impl)} - counter formatting" do
      counter = Metrics.counter("prometheus.test.counter", description: "a counter")
      name = StorageCounter.fresh_id()

      opts = [
        name: name,
        metrics: [counter],
        storage: unquote(impl)
      ]

      {:ok, _pid} = Peep.start_link(opts)

      Peep.insert_metric(name, counter, 1, %{foo: :bar, baz: "quux"})

      expected = [
        "# HELP prometheus_test_counter a counter",
        "# TYPE prometheus_test_counter counter",
        ~s(prometheus_test_counter{baz="quux",foo="bar"} 1)
      ]

      assert export(name) == lines_to_string(expected)
    end

    describe "#{inspect(impl)} - sum" do
      test "sum formatting" do
        name = StorageCounter.fresh_id()
        sum = Metrics.sum("prometheus.test.sum", description: "a sum")

        opts = [
          name: name,
          metrics: [sum],
          storage: unquote(impl)
        ]

        {:ok, _pid} = Peep.start_link(opts)

        Peep.insert_metric(name, sum, 5, %{foo: :bar, baz: "quux"})
        Peep.insert_metric(name, sum, 3, %{foo: :bar, baz: "quux"})

        expected = [
          "# HELP prometheus_test_sum a sum",
          "# TYPE prometheus_test_sum counter",
          ~s(prometheus_test_sum{baz="quux",foo="bar"} 8)
        ]

        assert export(name) == lines_to_string(expected)
      end

      test "custom type" do
        name = StorageCounter.fresh_id()

        sum =
          Metrics.sum("prometheus.test.sum",
            description: "a sum",
            reporter_options: [prometheus_type: "gauge"]
          )

        opts = [
          name: name,
          metrics: [sum],
          storage: unquote(impl)
        ]

        {:ok, _pid} = Peep.start_link(opts)

        Peep.insert_metric(name, sum, 5, %{foo: :bar, baz: "quux"})
        Peep.insert_metric(name, sum, 3, %{foo: :bar, baz: "quux"})

        expected = [
          "# HELP prometheus_test_sum a sum",
          "# TYPE prometheus_test_sum gauge",
          ~s(prometheus_test_sum{baz="quux",foo="bar"} 8)
        ]

        assert export(name) == lines_to_string(expected)
      end
    end

    describe "#{inspect(impl)} - last_value" do
      test "formatting" do
        name = StorageCounter.fresh_id()
        last_value = Metrics.last_value("prometheus.test.gauge", description: "a last_value")

        opts = [
          name: name,
          metrics: [last_value],
          storage: unquote(impl)
        ]

        {:ok, _pid} = Peep.start_link(opts)

        Peep.insert_metric(name, last_value, 5, %{blee: :bloo, flee: "floo"})

        expected = [
          "# HELP prometheus_test_gauge a last_value",
          "# TYPE prometheus_test_gauge gauge",
          ~s(prometheus_test_gauge{blee="bloo",flee="floo"} 5)
        ]

        assert export(name) == lines_to_string(expected)
      end

      test "custom type" do
        name = StorageCounter.fresh_id()

        last_value =
          Metrics.last_value("prometheus.test.gauge",
            description: "a last_value",
            reporter_options: [prometheus_type: :sum]
          )

        opts = [
          name: name,
          metrics: [last_value],
          storage: unquote(impl)
        ]

        {:ok, _pid} = Peep.start_link(opts)

        Peep.insert_metric(name, last_value, 5, %{blee: :bloo, flee: "floo"})

        expected = [
          "# HELP prometheus_test_gauge a last_value",
          "# TYPE prometheus_test_gauge sum",
          ~s(prometheus_test_gauge{blee="bloo",flee="floo"} 5)
        ]

        assert export(name) == lines_to_string(expected)
      end
    end

    test "#{inspect(impl)} - dist formatting" do
      name = StorageCounter.fresh_id()

      dist =
        Metrics.distribution("prometheus.test.distribution",
          description: "a distribution",
          reporter_options: [max_value: 1000]
        )

      opts = [
        name: name,
        metrics: [dist],
        storage: unquote(impl)
      ]

      {:ok, _pid} = Peep.start_link(opts)

      expected = []
      assert export(name) == lines_to_string(expected)

      Peep.insert_metric(name, dist, 1, %{glee: :gloo})

      expected = [
        "# HELP prometheus_test_distribution a distribution",
        "# TYPE prometheus_test_distribution histogram",
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.222222"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.493827"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.825789"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="2.23152"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="2.727413"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="3.333505"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="4.074283"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="4.97968"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="6.086275"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="7.438781"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="9.091843"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="11.112253"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="13.581642"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="16.599785"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="20.288626"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="24.79721"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="30.307701"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="37.042745"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="45.274466"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="55.335459"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="67.632227"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="82.661611"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="101.030858"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="123.48216"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="150.92264"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="184.461004"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="225.452339"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="275.552858"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="336.786827"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="411.628344"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="503.101309"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="614.9016"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="751.5464"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="918.556711"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1122.680424"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="+Inf"} 1),
        ~s(prometheus_test_distribution_sum{glee="gloo"} 1),
        ~s(prometheus_test_distribution_count{glee="gloo"} 1)
      ]

      assert export(name) == lines_to_string(expected)

      for i <- 2..2000 do
        Peep.insert_metric(name, dist, i, %{glee: :gloo})
      end

      expected = [
        "# HELP prometheus_test_distribution a distribution",
        "# TYPE prometheus_test_distribution histogram",
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.222222"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.493827"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.825789"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="2.23152"} 2),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="2.727413"} 2),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="3.333505"} 3),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="4.074283"} 4),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="4.97968"} 4),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="6.086275"} 6),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="7.438781"} 7),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="9.091843"} 9),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="11.112253"} 11),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="13.581642"} 13),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="16.599785"} 16),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="20.288626"} 20),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="24.79721"} 24),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="30.307701"} 30),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="37.042745"} 37),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="45.274466"} 45),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="55.335459"} 55),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="67.632227"} 67),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="82.661611"} 82),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="101.030858"} 101),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="123.48216"} 123),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="150.92264"} 150),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="184.461004"} 184),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="225.452339"} 225),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="275.552858"} 275),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="336.786827"} 336),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="411.628344"} 411),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="503.101309"} 503),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="614.9016"} 614),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="751.5464"} 751),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="918.556711"} 918),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1122.680424"} 1122),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="+Inf"} 2000),
        ~s(prometheus_test_distribution_sum{glee="gloo"} 2001000),
        ~s(prometheus_test_distribution_count{glee="gloo"} 2000)
      ]

      assert export(name) == lines_to_string(expected)
    end

    test "#{inspect(impl)} - dist formatting pow10" do
      name = StorageCounter.fresh_id()

      dist =
        Metrics.distribution("prometheus.test.distribution",
          description: "a distribution",
          reporter_options: [
            max_value: 1000,
            peep_bucket_calculator: Peep.Buckets.PowersOfTen
          ]
        )

      opts = [
        name: name,
        metrics: [dist],
        storage: unquote(impl)
      ]

      {:ok, _pid} = Peep.start_link(opts)

      expected = []
      assert export(name) == lines_to_string(expected)

      Peep.insert_metric(name, dist, 1, %{glee: :gloo})

      expected = [
        "# HELP prometheus_test_distribution a distribution",
        "# TYPE prometheus_test_distribution histogram",
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="10.0"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="100.0"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e3"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e4"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e5"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e6"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e7"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e8"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e9"} 1),
        ~s(prometheus_test_distribution_bucket{glee="gloo",le="+Inf"} 1),
        ~s(prometheus_test_distribution_sum{glee="gloo"} 1),
        ~s(prometheus_test_distribution_count{glee="gloo"} 1)
      ]

      assert export(name) == lines_to_string(expected)

      f = fn ->
        for i <- 1..2000 do
          Peep.insert_metric(name, dist, i, %{glee: :gloo})
        end
      end

      1..20 |> Enum.map(fn _ -> Task.async(f) end) |> Task.await_many()

      expected =
        [
          "# HELP prometheus_test_distribution a distribution",
          "# TYPE prometheus_test_distribution histogram",
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="10.0"} 181),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="100.0"} 1981),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e3"} 19981),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e4"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e5"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e6"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e7"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e8"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="1.0e9"} 40001),
          ~s(prometheus_test_distribution_bucket{glee="gloo",le="+Inf"} 40001),
          ~s(prometheus_test_distribution_sum{glee="gloo"} 40020001),
          ~s(prometheus_test_distribution_count{glee="gloo"} 40001)
        ]

      assert export(name) == lines_to_string(expected)
    end

    test "#{inspect(impl)} - regression: label escaping" do
      name = StorageCounter.fresh_id()

      counter =
        Metrics.counter(
          "prometheus.test.counter",
          description: "a counter"
        )

      opts = [
        name: name,
        metrics: [counter],
        storage: unquote(impl)
      ]

      {:ok, _pid} = Peep.start_link(opts)

      Peep.insert_metric(name, counter, 1, %{atom: "\"string\""})
      Peep.insert_metric(name, counter, 1, %{"\"string\"" => :atom})
      Peep.insert_metric(name, counter, 1, %{"\"string\"" => "\"string\""})
      Peep.insert_metric(name, counter, 1, %{"string" => "string\n"})

      expected = [
        "# HELP prometheus_test_counter a counter",
        "# TYPE prometheus_test_counter counter",
        ~s(prometheus_test_counter{atom="\\\"string\\\""} 1),
        ~s(prometheus_test_counter{\"string\"="atom"} 1),
        ~s(prometheus_test_counter{\"string\"="\\\"string\\\""} 1),
        ~s(prometheus_test_counter{string="string\\n"} 1)
      ]

      assert export(name) == lines_to_string(expected)
    end

    test "#{inspect(impl)} - regression: handle structs without String.Chars" do
      name = StorageCounter.fresh_id()

      counter =
        Metrics.counter(
          "prometheus.test.counter",
          description: "a counter"
        )

      opts = [
        name: name,
        metrics: [counter],
        storage: unquote(impl)
      ]

      {:ok, _pid} = Peep.start_link(opts)

      # Create a struct that doesn't implement String.Chars
      error_struct = %TestError{reason: :tcp_closed, code: 1001}

      Peep.insert_metric(name, counter, 1, %{error: error_struct})

      result = export(name)

      # Should not crash and should contain the inspected struct representation
      assert result =~ "prometheus_test_counter"
      assert result =~ "TestError"
      assert result =~ "tcp_closed"
    end
  end

  defp export(name) do
    Peep.get_all_metrics(name)
    |> Prometheus.export()
    |> IO.iodata_to_binary()
  end

  defp lines_to_string(lines) do
    lines
    |> Enum.map(&[&1, ?\n])
    |> Enum.concat(["# EOF\n"])
    |> IO.iodata_to_binary()
  end
end
