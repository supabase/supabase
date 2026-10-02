defmodule Supavisor.DeadPortSweeper do
  @moduledoc """
  Periodically closes zombie TCP ports: ports for which the socket is closed
  """

  use GenServer
  require Logger

  @interval :timer.hours(1)
  @name __MODULE__

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: @name)
  end

  def sweep do
    GenServer.cast(@name, :sweep)
  end

  @impl true
  def init(_args) do
    schedule_sweep()
    {:ok, %{}}
  end

  @impl true
  def handle_cast(:sweep, state) do
    do_sweep()
    {:noreply, state}
  end

  @impl true
  def handle_info(:sweep, state) do
    do_sweep()
    schedule_sweep()
    {:noreply, state}
  end

  @doc false
  def dead_port?(port) do
    with {:name, ~c"tcp_inet"} <- :erlang.port_info(port, :name),
         {:ok, flags} <- :prim_inet.getstatus(port) do
      :inet.peername(port) == {:error, :enotconn} and :listen not in flags
    else
      _ -> false
    end
  end

  defp do_sweep do
    ports = Enum.filter(:recon.tcp(), &dead_port?/1)

    Logger.notice("Closing #{length(ports)} dead port(s)")

    {time, _} = :timer.tc(fn -> Enum.each(ports, &Port.close/1) end)

    Logger.notice(
      "Closed #{length(ports)} dead port(s) in #{:erlang.convert_time_unit(time, :microsecond, :millisecond)}ms"
    )
  end

  defp schedule_sweep do
    Process.send_after(self(), :sweep, @interval)
  end
end
