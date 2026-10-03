defmodule Supavisor.PromEx.Plugins.NetStat do
  @moduledoc """
  Polls system-wide network counters via procfs.
  """

  use PromEx.Plugin

  @event_net_stat [:supavisor, :prom_ex, :osmon, :net_stat]
  @event_sock_stat [:supavisor, :prom_ex, :osmon, :sock_stat]
  @event_snmp_stat [:supavisor, :prom_ex, :osmon, :snmp_stat]
  @prefix [:supavisor, :prom_ex]
  @proc_net_netstat "/proc/net/netstat"
  @proc_net_sockstat "/proc/net/sockstat"
  @proc_net_snmp "/proc/net/snmp"

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      net_stat_metrics(poll_rate),
      sock_stat_metrics(poll_rate),
      snmp_stat_metrics(poll_rate)
    ]
  end

  defp net_stat_metrics(poll_rate) do
    Polling.build(
      :supavisor_osmon_net_stat_events,
      poll_rate,
      {__MODULE__, :execute_net_stat_metrics, []},
      [
        last_value(
          @prefix ++ [:osmon, :net, :listen_drops],
          event_name: @event_net_stat,
          description: "Cumulative number of connections dropped due to a full accept queue.",
          measurement: :listen_drops,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :listen_overflows],
          event_name: @event_net_stat,
          description: "Cumulative number of times the listen backlog of a socket overflowed.",
          measurement: :listen_overflows,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_abort_on_timeout],
          event_name: @event_net_stat,
          description: "Cumulative number of connections aborted due to a retransmit timeout.",
          measurement: :tcp_abort_on_timeout,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_abort_on_close],
          event_name: @event_net_stat,
          description:
            "Cumulative number of connections aborted because the application closed them with unread data pending.",
          measurement: :tcp_abort_on_close,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_abort_on_data],
          event_name: @event_net_stat,
          description:
            "Cumulative number of connections aborted because data arrived on an already-closed socket.",
          measurement: :tcp_abort_on_data,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_abort_on_memory],
          event_name: @event_net_stat,
          description: "Cumulative number of connections aborted due to low socket memory.",
          measurement: :tcp_abort_on_memory,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_abort_on_linger],
          event_name: @event_net_stat,
          description:
            "Cumulative number of connections aborted while in a lingering close state.",
          measurement: :tcp_abort_on_linger,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_syn_retrans],
          event_name: @event_net_stat,
          description: "Cumulative number of retransmitted TCP SYN packets.",
          measurement: :tcp_syn_retrans,
          reporter_options: [prometheus_type: "counter"]
        )
      ]
    )
  end

  def execute_net_stat_metrics(path \\ @proc_net_netstat) do
    case net_stat(path) do
      {:ok, stats} -> execute_metrics(@event_net_stat, stats)
      :error -> :ok
    end
  end

  def execute_sock_stat_metrics(path \\ @proc_net_sockstat) do
    case sock_stat(path) do
      {:ok, stats} -> execute_metrics(@event_sock_stat, stats)
      :error -> :ok
    end
  end

  def execute_snmp_stat_metrics(path \\ @proc_net_snmp) do
    case snmp_stat(path) do
      {:ok, stats} -> execute_metrics(@event_snmp_stat, stats)
      :error -> :ok
    end
  end

  defp execute_metrics(event, metrics) do
    :telemetry.execute(event, metrics, %{})
  end

  @type net_stat_counters :: %{
          listen_drops: non_neg_integer(),
          listen_overflows: non_neg_integer(),
          tcp_abort_on_timeout: non_neg_integer(),
          tcp_abort_on_close: non_neg_integer(),
          tcp_abort_on_data: non_neg_integer(),
          tcp_abort_on_memory: non_neg_integer(),
          tcp_abort_on_linger: non_neg_integer(),
          tcp_syn_retrans: non_neg_integer()
        }

  # sobelow_skip ["Traversal.FileModule"]
  @spec net_stat(Path.t()) :: {:ok, net_stat_counters()} | :error
  def net_stat(path \\ @proc_net_netstat) do
    with {:ok, content} <- File.read(path),
         {:ok, stats} <- parse_net_stat(content) do
      {:ok, stats}
    else
      _ -> :error
    end
  end

  @spec parse_net_stat(String.t()) :: {:ok, net_stat_counters()} | :error
  def parse_net_stat(content) do
    content
    |> String.split("\n", trim: true)
    |> Enum.chunk_every(2)
    |> Enum.find_value(fn
      ["TcpExt: " <> _ = header, values] ->
        keys = header |> String.split() |> tl()
        vals = values |> String.split() |> tl() |> Enum.map(&String.to_integer/1)
        counters = Enum.zip(keys, vals) |> Map.new()

        {:ok,
         %{
           listen_drops: Map.get(counters, "ListenDrops", 0),
           listen_overflows: Map.get(counters, "ListenOverflows", 0),
           tcp_abort_on_timeout: Map.get(counters, "TCPAbortOnTimeout", 0),
           tcp_abort_on_close: Map.get(counters, "TCPAbortOnClose", 0),
           tcp_abort_on_data: Map.get(counters, "TCPAbortOnData", 0),
           tcp_abort_on_memory: Map.get(counters, "TCPAbortOnMemory", 0),
           tcp_abort_on_linger: Map.get(counters, "TCPAbortOnLinger", 0),
           tcp_syn_retrans: Map.get(counters, "TCPSynRetrans", 0)
         }}

      _ ->
        nil
    end) || :error
  end

  defp sock_stat_metrics(poll_rate) do
    Polling.build(
      :supavisor_osmon_sock_stat_events,
      poll_rate,
      {__MODULE__, :execute_sock_stat_metrics, []},
      [
        last_value(
          @prefix ++ [:osmon, :net, :tcp_inuse],
          event_name: @event_sock_stat,
          description: "Number of TCP sockets currently in use.",
          measurement: :tcp_inuse
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_orphan],
          event_name: @event_sock_stat,
          description: "Number of orphaned (unattached to a file descriptor) TCP sockets.",
          measurement: :tcp_orphan
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_time_wait],
          event_name: @event_sock_stat,
          description: "Number of TCP sockets currently in the TIME_WAIT state.",
          measurement: :tcp_time_wait
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_alloc],
          event_name: @event_sock_stat,
          description: "Number of allocated TCP socket structures.",
          measurement: :tcp_alloc
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_mem_pages],
          event_name: @event_sock_stat,
          description: "Number of memory pages consumed by the TCP protocol.",
          measurement: :tcp_mem_pages
        )
      ]
    )
  end

  # sobelow_skip ["Traversal.FileModule"]
  @spec sock_stat(Path.t()) ::
          {:ok,
           %{
             tcp_inuse: non_neg_integer(),
             tcp_orphan: non_neg_integer(),
             tcp_time_wait: non_neg_integer(),
             tcp_alloc: non_neg_integer(),
             tcp_mem_pages: non_neg_integer()
           }}
          | :error
  def sock_stat(path \\ @proc_net_sockstat) do
    with {:ok, content} <- File.read(path),
         {:ok, stats} <- parse_sock_stat(content) do
      {:ok, stats}
    else
      _ -> :error
    end
  end

  @spec parse_sock_stat(String.t()) ::
          {:ok,
           %{
             tcp_inuse: non_neg_integer(),
             tcp_orphan: non_neg_integer(),
             tcp_time_wait: non_neg_integer(),
             tcp_alloc: non_neg_integer(),
             tcp_mem_pages: non_neg_integer()
           }}
          | :error
  def parse_sock_stat(content) do
    content
    |> String.split("\n", trim: true)
    |> Enum.find_value(fn
      "TCP: " <> rest ->
        counters =
          rest
          |> String.split()
          |> Enum.chunk_every(2)
          |> Map.new(fn [k, v] -> {k, String.to_integer(v)} end)

        {:ok,
         %{
           tcp_inuse: Map.get(counters, "inuse", 0),
           tcp_orphan: Map.get(counters, "orphan", 0),
           tcp_time_wait: Map.get(counters, "tw", 0),
           tcp_alloc: Map.get(counters, "alloc", 0),
           tcp_mem_pages: Map.get(counters, "mem", 0)
         }}

      _ ->
        nil
    end) || :error
  end

  defp snmp_stat_metrics(poll_rate) do
    Polling.build(
      :supavisor_osmon_snmp_stat_events,
      poll_rate,
      {__MODULE__, :execute_snmp_stat_metrics, []},
      [
        last_value(
          @prefix ++ [:osmon, :net, :tcp_active_opens],
          event_name: @event_snmp_stat,
          description: "Cumulative number of TCP connections opened actively (outbound).",
          measurement: :tcp_active_opens,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_passive_opens],
          event_name: @event_snmp_stat,
          description: "Cumulative number of TCP connections opened passively (inbound).",
          measurement: :tcp_passive_opens,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_attempt_fails],
          event_name: @event_snmp_stat,
          description: "Cumulative number of TCP connection attempts that failed.",
          measurement: :tcp_attempt_fails,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_estab_resets],
          event_name: @event_snmp_stat,
          description: "Cumulative number of established TCP connections that were reset.",
          measurement: :tcp_estab_resets,
          reporter_options: [prometheus_type: "counter"]
        ),
        last_value(
          @prefix ++ [:osmon, :net, :tcp_in_errs],
          event_name: @event_snmp_stat,
          description: "Cumulative number of inbound TCP segments received in error.",
          measurement: :tcp_in_errs,
          reporter_options: [prometheus_type: "counter"]
        )
      ]
    )
  end

  @type snmp_stat_counters :: %{
          tcp_active_opens: non_neg_integer(),
          tcp_passive_opens: non_neg_integer(),
          tcp_attempt_fails: non_neg_integer(),
          tcp_estab_resets: non_neg_integer(),
          tcp_in_errs: non_neg_integer()
        }

  # sobelow_skip ["Traversal.FileModule"]
  @spec snmp_stat(Path.t()) :: {:ok, snmp_stat_counters()} | :error
  def snmp_stat(path \\ @proc_net_snmp) do
    with {:ok, content} <- File.read(path),
         {:ok, stats} <- parse_snmp_stat(content) do
      {:ok, stats}
    else
      _ -> :error
    end
  end

  @spec parse_snmp_stat(String.t()) :: {:ok, snmp_stat_counters()} | :error
  def parse_snmp_stat(content) do
    content
    |> String.split("\n", trim: true)
    |> Enum.chunk_every(2)
    |> Enum.find_value(fn
      ["Tcp: " <> _ = header, values] ->
        keys = header |> String.split() |> tl()
        vals = values |> String.split() |> tl() |> Enum.map(&String.to_integer/1)
        counters = Enum.zip(keys, vals) |> Map.new()

        {:ok,
         %{
           tcp_active_opens: Map.get(counters, "ActiveOpens", 0),
           tcp_passive_opens: Map.get(counters, "PassiveOpens", 0),
           tcp_attempt_fails: Map.get(counters, "AttemptFails", 0),
           tcp_estab_resets: Map.get(counters, "EstabResets", 0),
           tcp_in_errs: Map.get(counters, "InErrs", 0)
         }}

      _ ->
        nil
    end) || :error
  end
end
