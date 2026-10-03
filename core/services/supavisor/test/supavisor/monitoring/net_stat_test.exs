defmodule Supavisor.PromEx.Plugins.NetStatTest do
  use Supavisor.E2ECase, async: false

  alias Supavisor.PromEx.Plugins.NetStat

  @moduletag telemetry: true

  @netstat_fixture """
  TcpExt: SyncookiesSent ListenOverflows ListenDrops TCPAbortOnData TCPAbortOnClose TCPAbortOnMemory TCPAbortOnTimeout TCPAbortOnLinger TCPAbortFailed TCPSynRetrans
  TcpExt: 0 42 17 11 22 33 44 55 66 77
  IpExt: InNoRoutes InTruncatedPkts InMcastPkts OutMcastPkts InBcastPkts OutBcastPkts InOctets OutOctets InMcastOctets OutMcastOctets InBcastOctets OutBcastOctets InCsumErrors InNoECTPkts InECT1Pkts InECT0Pkts InCEPkts ReasmOverlaps
  IpExt: 0 0 0 0 0 0 123456789 987654321 0 0 0 0 0 0 0 0 0 0
  """

  @sockstat_fixture """
  sockets: used 1391
  TCP: inuse 32 orphan 0 tw 337 alloc 43 mem 3
  UDP: inuse 12 mem 3
  UDPLITE: inuse 0
  RAW: inuse 0
  FRAG: inuse 0 memory 0
  """

  @snmp_fixture """
  Ip: Forwarding DefaultTTL InReceives InDelivers
  Ip: 1 64 123456 123000
  Tcp: RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens AttemptFails EstabResets CurrEstab InSegs OutSegs RetransSegs InErrs OutRsts InCsumErrors
  Tcp: 1 200 120000 -1 500 300 12 7 42 100000 99000 55 3 20 0
  Udp: InDatagrams NoPorts InErrors OutDatagrams
  Udp: 1000 5 2 900
  """

  describe "polling_metrics/1" do
    test "properly exports metrics" do
      for polling_metric <- NetStat.polling_metrics([]) do
        assert %PromEx.MetricTypes.Polling{metrics: [_ | _]} = polling_metric
        {m, f, a} = polling_metric.measurements_mfa
        assert function_exported?(m, f, length(a))

        for telemetry_metric <- polling_metric.metrics do
          assert Enum.any?(
                   [
                     Telemetry.Metrics.Distribution,
                     Telemetry.Metrics.Counter,
                     Telemetry.Metrics.LastValue,
                     Telemetry.Metrics.Sum
                   ],
                   fn struct -> is_struct(telemetry_metric, struct) end
                 )

          assert telemetry_metric.description
        end
      end
    end

    test "uses poll rate option" do
      for polling_metric <- NetStat.polling_metrics(poll_rate: 1000) do
        assert %{poll_rate: 1000} = polling_metric
      end
    end

    test "reports listen_drops and listen_overflows as counters" do
      metrics =
        NetStat.polling_metrics([])
        |> Enum.flat_map(& &1.metrics)

      for suffix <- [:listen_drops, :listen_overflows] do
        name = [:supavisor, :prom_ex, :osmon, :net, suffix]
        metric = Enum.find(metrics, &(&1.name == name))

        assert metric, "expected a net #{suffix} metric named #{inspect(name)}"
        assert metric.reporter_options[:prometheus_type] == "counter"
      end
    end

    test "reports tcp abort and syn retrans counters" do
      metrics =
        NetStat.polling_metrics([])
        |> Enum.flat_map(& &1.metrics)

      for suffix <- [
            :tcp_abort_on_timeout,
            :tcp_abort_on_close,
            :tcp_abort_on_data,
            :tcp_abort_on_memory,
            :tcp_abort_on_linger,
            :tcp_syn_retrans
          ] do
        name = [:supavisor, :prom_ex, :osmon, :net, suffix]
        metric = Enum.find(metrics, &(&1.name == name))

        assert metric, "expected a net #{suffix} metric named #{inspect(name)}"
        assert metric.reporter_options[:prometheus_type] == "counter"
      end
    end

    test "reports snmp tcp stats as counters" do
      metrics =
        NetStat.polling_metrics([])
        |> Enum.flat_map(& &1.metrics)

      for suffix <- [
            :tcp_active_opens,
            :tcp_passive_opens,
            :tcp_attempt_fails,
            :tcp_estab_resets,
            :tcp_in_errs
          ] do
        name = [:supavisor, :prom_ex, :osmon, :net, suffix]
        metric = Enum.find(metrics, &(&1.name == name))

        assert metric, "expected a net #{suffix} metric named #{inspect(name)}"
        assert metric.reporter_options[:prometheus_type] == "counter"
      end
    end

    test "reports tcp socket stats as gauges" do
      metrics =
        NetStat.polling_metrics([])
        |> Enum.flat_map(& &1.metrics)

      for suffix <- [:tcp_inuse, :tcp_orphan, :tcp_time_wait, :tcp_alloc, :tcp_mem_pages] do
        name = [:supavisor, :prom_ex, :osmon, :net, suffix]
        metric = Enum.find(metrics, &(&1.name == name))

        assert metric, "expected a net #{suffix} metric named #{inspect(name)}"
        refute metric.reporter_options[:prometheus_type] == "counter"
      end
    end
  end

  describe "parse_net_stat/1" do
    test "extracts ListenDrops, ListenOverflows, abort and syn retrans counters" do
      assert {:ok,
              %{
                listen_drops: 17,
                listen_overflows: 42,
                tcp_abort_on_data: 11,
                tcp_abort_on_close: 22,
                tcp_abort_on_memory: 33,
                tcp_abort_on_timeout: 44,
                tcp_abort_on_linger: 55,
                tcp_syn_retrans: 77
              }} = NetStat.parse_net_stat(@netstat_fixture)
    end

    test "defaults missing counters to 0" do
      content = """
      TcpExt: SyncookiesSent
      TcpExt: 0
      """

      assert {:ok,
              %{
                listen_drops: 0,
                listen_overflows: 0,
                tcp_abort_on_data: 0,
                tcp_abort_on_close: 0,
                tcp_abort_on_memory: 0,
                tcp_abort_on_timeout: 0,
                tcp_abort_on_linger: 0,
                tcp_syn_retrans: 0
              }} = NetStat.parse_net_stat(content)
    end

    test "returns error for empty content" do
      assert :error = NetStat.parse_net_stat("")
    end

    test "returns error when TcpExt section is missing" do
      content = """
      IpExt: InNoRoutes InTruncatedPkts
      IpExt: 0 0
      """

      assert :error = NetStat.parse_net_stat(content)
    end
  end

  describe "net_stat/1" do
    @tag :linux
    test "reads real /proc/net/netstat on linux" do
      assert {:ok, %{listen_drops: drops, listen_overflows: overflows}} = NetStat.net_stat()
      assert is_integer(drops)
      assert is_integer(overflows)
    end
  end

  describe "parse_sock_stat/1" do
    test "extracts tcp socket counters" do
      assert {:ok,
              %{
                tcp_inuse: 32,
                tcp_orphan: 0,
                tcp_time_wait: 337,
                tcp_alloc: 43,
                tcp_mem_pages: 3
              }} = NetStat.parse_sock_stat(@sockstat_fixture)
    end

    test "defaults missing counters to 0" do
      content = """
      sockets: used 1391
      TCP: inuse 5
      """

      assert {:ok,
              %{
                tcp_inuse: 5,
                tcp_orphan: 0,
                tcp_time_wait: 0,
                tcp_alloc: 0,
                tcp_mem_pages: 0
              }} = NetStat.parse_sock_stat(content)
    end

    test "returns error for empty content" do
      assert :error = NetStat.parse_sock_stat("")
    end

    test "returns error when TCP section is missing" do
      content = """
      sockets: used 1391
      UDP: inuse 12 mem 3
      """

      assert :error = NetStat.parse_sock_stat(content)
    end
  end

  describe "sock_stat/1" do
    @tag :linux
    test "reads real /proc/net/sockstat on linux" do
      assert {:ok, stats} = NetStat.sock_stat()

      for key <- [:tcp_inuse, :tcp_orphan, :tcp_time_wait, :tcp_alloc, :tcp_mem_pages] do
        assert is_integer(Map.fetch!(stats, key))
      end
    end
  end

  describe "parse_snmp_stat/1" do
    test "extracts ActiveOpens, PassiveOpens, AttemptFails, EstabResets and InErrs" do
      assert {:ok,
              %{
                tcp_active_opens: 500,
                tcp_passive_opens: 300,
                tcp_attempt_fails: 12,
                tcp_estab_resets: 7,
                tcp_in_errs: 3
              }} = NetStat.parse_snmp_stat(@snmp_fixture)
    end

    test "defaults missing counters to 0" do
      content = """
      Tcp: RtoAlgorithm
      Tcp: 1
      """

      assert {:ok,
              %{
                tcp_active_opens: 0,
                tcp_passive_opens: 0,
                tcp_attempt_fails: 0,
                tcp_estab_resets: 0,
                tcp_in_errs: 0
              }} = NetStat.parse_snmp_stat(content)
    end

    test "returns error for empty content" do
      assert :error = NetStat.parse_snmp_stat("")
    end

    test "returns error when Tcp section is missing" do
      content = """
      Ip: Forwarding DefaultTTL
      Ip: 1 64
      """

      assert :error = NetStat.parse_snmp_stat(content)
    end
  end

  describe "snmp_stat/1" do
    @tag :linux
    test "reads real /proc/net/snmp on linux" do
      assert {:ok, stats} = NetStat.snmp_stat()

      for key <- [
            :tcp_active_opens,
            :tcp_passive_opens,
            :tcp_attempt_fails,
            :tcp_estab_resets,
            :tcp_in_errs
          ] do
        assert is_integer(Map.fetch!(stats, key))
      end
    end
  end

  describe "execute_net_stat_metrics/1" do
    test "emits net_stat telemetry event when file exists" do
      path = write_fixture(@netstat_fixture)
      ref = attach_handler([:supavisor, :prom_ex, :osmon, :net_stat])

      assert :ok = NetStat.execute_net_stat_metrics(path)

      assert_receive {^ref, {[:supavisor, :prom_ex, :osmon, :net_stat], measurement, %{}}}
      assert %{listen_drops: 17, listen_overflows: 42, tcp_syn_retrans: 77} = measurement
    end

    test "returns ok and emits nothing when file does not exist" do
      assert :ok = NetStat.execute_net_stat_metrics("/nonexistent/path")
    end
  end

  describe "execute_snmp_stat_metrics/1" do
    test "emits snmp_stat telemetry event when file exists" do
      path = write_fixture(@snmp_fixture)
      ref = attach_handler([:supavisor, :prom_ex, :osmon, :snmp_stat])

      assert :ok = NetStat.execute_snmp_stat_metrics(path)

      assert_receive {^ref, {[:supavisor, :prom_ex, :osmon, :snmp_stat], measurement, %{}}}

      assert %{tcp_active_opens: 500, tcp_passive_opens: 300, tcp_attempt_fails: 12} =
               measurement
    end

    test "returns ok and emits nothing when file does not exist" do
      assert :ok = NetStat.execute_snmp_stat_metrics("/nonexistent/path")
    end
  end

  describe "execute_sock_stat_metrics/1" do
    test "emits sock_stat telemetry event when file exists" do
      path = write_fixture(@sockstat_fixture)
      ref = attach_handler([:supavisor, :prom_ex, :osmon, :sock_stat])

      assert :ok = NetStat.execute_sock_stat_metrics(path)

      assert_receive {^ref, {[:supavisor, :prom_ex, :osmon, :sock_stat], measurement, %{}}}
      assert %{tcp_inuse: 32, tcp_time_wait: 337} = measurement
    end

    test "returns ok and emits nothing when file does not exist" do
      assert :ok = NetStat.execute_sock_stat_metrics("/nonexistent/path")
    end
  end

  defp write_fixture(content) do
    path = Path.join(System.tmp_dir!(), "procfs_fixture_#{:erlang.unique_integer([:positive])}")
    File.write!(path, content)
    on_exit(fn -> File.rm(path) end)
    path
  end

  def handle_event(event_name, measurement, meta, {pid, ref}) do
    send(pid, {ref, {event_name, measurement, meta}})
  end

  defp attach_handler(event) do
    ref = make_ref()

    :telemetry.attach(
      {ref, :test},
      event,
      &__MODULE__.handle_event/4,
      {self(), ref}
    )

    on_exit(fn ->
      :telemetry.detach({ref, :test})
    end)

    ref
  end
end
