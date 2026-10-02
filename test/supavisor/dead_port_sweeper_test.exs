defmodule Supavisor.DeadPortSweeperTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog

  alias Supavisor.DeadPortSweeper

  describe "dead_port?/1" do
    test "is true for a socket whose peer is gone but the port is still open" do
      server = make_dead_port()

      assert DeadPortSweeper.dead_port?(server)
    end

    test "is false for a healthy connected socket" do
      {client, server} = sockpair()

      refute DeadPortSweeper.dead_port?(client)
      refute DeadPortSweeper.dead_port?(server)
    end

    test "is false for a listening socket" do
      {:ok, listen} = :gen_tcp.listen(0, mode: :binary, active: false)

      refute DeadPortSweeper.dead_port?(listen)
    end

    test "is false for a non-tcp port" do
      port = Port.open({:spawn, "cat"}, [:binary])

      refute DeadPortSweeper.dead_port?(port)
    end
  end

  describe "sweep/0" do
    test "closes dead ports and logs how many were closed" do
      dead = make_dead_port()
      {client, server} = sockpair()

      log =
        capture_log(fn ->
          DeadPortSweeper.sweep()
          wait_until_closed(dead)
        end)

      assert log =~ "Closing 1 dead port(s)"
      assert log =~ ~r/Closed 1 dead port\(s\) in \d+ms/
      refute Port.info(dead)

      assert Port.info(client)
      assert Port.info(server)
    end

    test "logs zero when there is nothing to sweep" do
      log =
        capture_log(fn ->
          DeadPortSweeper.sweep()
          Process.sleep(50)
        end)

      assert log =~ "Closing 0 dead port(s)"
      assert log =~ ~r/Closed 0 dead port\(s\) in \d+ms/
    end
  end

  # Reproduces the documented Erlang behaviour this sweeper works around: a TCP
  # socket configured with send_timeout + send_timeout_close closes its
  # underlying connection on a send timeout, but the port itself is left
  # open, so :inet.peername/1 reports :enotconn forever after.
  defp make_dead_port do
    {:ok, listen} =
      :gen_tcp.listen(0,
        mode: :binary,
        active: false,
        send_timeout: 100,
        send_timeout_close: true
      )

    {:ok, {address, port}} = :inet.sockname(listen)
    this = self()
    ref = make_ref()

    spawn(fn ->
      {:ok, server} = :gen_tcp.accept(listen)
      :gen_tcp.controlling_process(server, this)
      send(this, {ref, server})
    end)

    {:ok, _client} = :gen_tcp.connect(address, port, mode: :binary, active: false)
    assert_receive {^ref, server}

    # The client never reads, so the server's send buffer fills and the
    # configured send_timeout fires, killing the connection underneath the
    # still-open server port.
    flood_until_dead(server)

    server
  end

  defp flood_until_dead(server, attempts \\ 200)

  defp flood_until_dead(_server, 0) do
    flunk("gave up waiting for the send-timeout bug to leave the port dead")
  end

  defp flood_until_dead(server, attempts) do
    chunk = :crypto.strong_rand_bytes(65_536)

    case :gen_tcp.send(server, chunk) do
      :ok -> flood_until_dead(server, attempts - 1)
      {:error, _reason} -> :ok
    end
  end

  defp wait_until_closed(port, attempts \\ 50)

  defp wait_until_closed(_port, 0), do: flunk("port was not closed by the sweep")

  defp wait_until_closed(port, attempts) do
    if Port.info(port) do
      Process.sleep(20)
      wait_until_closed(port, attempts - 1)
    else
      :ok
    end
  end

  defp sockpair do
    {:ok, listen} = :gen_tcp.listen(0, mode: :binary, active: false)
    {:ok, {address, port}} = :inet.sockname(listen)
    this = self()
    ref = make_ref()

    spawn(fn ->
      {:ok, server} = :gen_tcp.accept(listen)
      :gen_tcp.controlling_process(server, this)
      send(this, {ref, server})
    end)

    {:ok, client} = :gen_tcp.connect(address, port, mode: :binary, active: false)
    assert_receive {^ref, server}

    {client, server}
  end
end
