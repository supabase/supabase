defmodule Realtime.LogFilterTest do
  use ExUnit.Case, async: true

  use TestHelpers

  import ExUnit.CaptureLog

  alias Realtime.LogFilter

  defmodule ExitPlug do
    @behaviour Plug

    @impl true
    def init(opts), do: opts

    @impl true
    def call(%{request_path: "/kill-request"} = conn, _opts) do
      Process.exit(self(), :kill)
      conn
    end

    def call(%{request_path: "/exit-request"} = conn, _opts) do
      Process.exit(self(), :some_error)
      conn
    end

    def call(%{request_path: "/ok"} = conn, _opts), do: Plug.Conn.send_resp(conn, 200, "ok")
  end

  defmodule IdleProtocol do
    @behaviour :ranch_protocol

    @impl true
    def start_link(ref, _transport, _opts), do: {:ok, :proc_lib.spawn_link(__MODULE__, :init, [ref])}

    def init(ref) do
      {:ok, _socket} = :ranch.handshake(ref)
      receive do: (:stop -> :ok)
    end
  end

  describe "filter/2 - gen_statem crash reports" do
    test "stops DBConnection.ConnectionError crashes" do
      event = gen_statem_event(%DBConnection.ConnectionError{message: "tcp connect: connection refused"})
      assert :stop = LogFilter.filter(event, [])
    end

    test "passes through gen_statem crashes for other reasons" do
      event = gen_statem_event(:some_other_reason)
      assert ^event = LogFilter.filter(event, [])
    end

    test "passes through non-gen_statem reports" do
      event = %{msg: {:report, %{label: {:supervisor, :child_terminated}}}, meta: %{}}
      assert ^event = LogFilter.filter(event, [])
    end
  end

  describe "filter/2 - DBConnection.Connection log calls" do
    test "stops messages from DBConnection.Connection" do
      event = db_connection_log_event("Postgrex.Protocol failed to connect: connection refused")
      assert :stop = LogFilter.filter(event, [])
    end

    test "passes through messages from other modules" do
      event = %{msg: {:string, "some log"}, meta: %{mfa: {SomeOtherModule, :some_fun, 1}}}
      assert ^event = LogFilter.filter(event, [])
    end

    test "passes through messages with no mfa metadata" do
      event = %{msg: {:string, "some log"}, meta: %{}}
      assert ^event = LogFilter.filter(event, [])
    end
  end

  describe "killed ranch listener" do
    setup do
      LogFilter.setup()
      :ok
    end

    test "stops the ranch connection report when the connection process is killed" do
      {ref, port} = start_ranch_listener()
      log = capture_log(fn -> kill_ranch_conn(ref, port, :kill) end)
      refute log =~ "Ranch listener"
    end

    test "passes through the ranch connection report when the connection process exits for another reason" do
      {ref, port} = start_ranch_listener()
      log = capture_log(fn -> kill_ranch_conn(ref, port, :some_error) end)

      assert log =~ "had connection process started with"
      assert log =~ ":some_error"
    end
  end

  describe "killed cowboy listener" do
    setup do
      LogFilter.setup()
      %{port: start_cowboy_listener()}
    end

    test "stops the cowboy stream report when the request process is killed", %{port: port} do
      log = capture_log(fn -> request(port, "/kill-request") end)
      refute log =~ "Ranch listener"
    end

    test "passes through the cowboy stream report when the request process exits for another reason", %{port: port} do
      log = capture_log(fn -> request(port, "/exit-request") end)
      assert log =~ "had its request process"
      assert log =~ ":some_error"
    end
  end

  describe "setup/0" do
    test "installs the primary filter" do
      LogFilter.setup()
      %{filters: filters} = :logger.get_primary_config()
      assert List.keymember?(filters, :connection_noise, 0)
    end

    test "is idempotent when called multiple times" do
      LogFilter.setup()
      assert :ok = LogFilter.setup()
    end
  end

  defp start_ranch_listener do
    ref = :"log_filter_ranch_#{System.unique_integer([:positive])}"
    {:ok, _} = :ranch.start_listener(ref, :ranch_tcp, %{socket_opts: [port: 0]}, IdleProtocol, [])
    on_exit(fn -> :ranch.stop_listener(ref) end)
    {ref, :ranch.get_port(ref)}
  end

  defp start_cowboy_listener do
    ref = :"log_filter_cowboy_#{System.unique_integer([:positive])}"
    {:ok, _} = Plug.Cowboy.http(ExitPlug, [], ref: ref, port: 0)
    on_exit(fn -> Plug.Cowboy.shutdown(ref) end)
    :ranch.get_port(ref)
  end

  defp connect(port) do
    {:ok, socket} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false], 1000)
    socket
  end

  defp kill_ranch_conn(ref, port, reason) do
    connect(port)
    assert_eventually :ranch.procs(ref, :connections) != [], interval: 10
    Enum.each(:ranch.procs(ref, :connections), &Process.exit(&1, reason))
    assert_eventually :ranch.procs(ref, :connections) == [], interval: 10
    Logger.flush()
  end

  defp request(port, path) do
    socket = connect(port)

    :ok = :gen_tcp.send(socket, get(path))
    {:ok, _dead_stream_response} = :gen_tcp.recv(socket, 0, 1000)

    :ok = :gen_tcp.send(socket, get("/ok"))
    {:ok, _live_stream_response} = :gen_tcp.recv(socket, 0, 1000)

    :gen_tcp.close(socket)
    Logger.flush()
  end

  defp get(path), do: "GET #{path} HTTP/1.1\r\nHost: localhost\r\n\r\n"

  defp gen_statem_event(reason) do
    %{
      msg: {:report, %{label: {:gen_statem, :terminate}, name: self(), reason: {:error, reason, []}}},
      meta: %{pid: self(), time: System.system_time()}
    }
  end

  defp db_connection_log_event(message) do
    %{
      msg: {:string, message},
      meta: %{mfa: {DBConnection.Connection, :handle_event, 4}, pid: self()}
    }
  end
end
