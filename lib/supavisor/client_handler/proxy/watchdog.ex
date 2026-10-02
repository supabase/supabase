defmodule Supavisor.ClientHandler.Proxy.Watchdog do
  @moduledoc """
  Watchdog process for proxy connection supervisors.

  Sibling of the proxy DynamicSupervisor under `ProxySupervisor`. Periodically
  checks if the DynamicSupervisor has no children. Requires two consecutive
  empty checks before terminating.
  """

  use GenServer

  require Logger

  @registry Supavisor.Registry.Tenants
  @default_check_interval :timer.seconds(30)
  @default_jitter :timer.seconds(5)

  @doc """
  Returns a child spec for the watchdog, marked as significant and temporary.
  """
  @spec child_spec({Supavisor.id(), keyword()}) :: Supervisor.child_spec()
  def child_spec({id, opts}) do
    %{
      id: :watchdog,
      start: {__MODULE__, :start_link, [id, opts]},
      significant: true,
      restart: :temporary
    }
  end

  @doc """
  Triggers an immediate check. Returns `:alive` if the watchdog stays up,
  or `:stopping` if it decided to shut down.
  """
  @spec check_now(pid) :: :alive | :stopping
  def check_now(pid) do
    GenServer.call(pid, :check)
  end

  @doc """
  Starts the watchdog process.
  """
  @spec start_link(Supavisor.id(), keyword()) :: GenServer.on_start()
  def start_link(id, opts \\ []) do
    GenServer.start_link(__MODULE__, {id, opts})
  end

  @impl true
  def init({id, opts}) do
    interval = Keyword.get(opts, :check_interval, @default_check_interval)
    jitter = Keyword.get(opts, :jitter, @default_jitter)
    schedule_check(interval, jitter)
    {:ok, %{id: id, empty_checks: 0, check_interval: interval, jitter: jitter}}
  end

  @impl true
  def handle_call(:check, _from, state) do
    case check_children(state) do
      {:stop, new_state} -> {:stop, :normal, :stopping, new_state}
      {:alive, new_state} -> {:reply, :alive, new_state}
    end
  end

  @impl true
  def handle_info(:check, state) do
    case check_children(state) do
      {:stop, new_state} -> {:stop, :normal, new_state}
      {:alive, new_state} -> {:noreply, new_state}
    end
  end

  defp check_children(
         %{id: id, empty_checks: empty_checks, check_interval: interval, jitter: jitter} = state
       ) do
    with [{dyn_sup, _}] <- Registry.lookup(@registry, {:proxy_dyn_sup, id}),
         %{active: 0} <- DynamicSupervisor.count_children(dyn_sup) do
      if empty_checks >= 1 do
        Logger.debug(
          "ProxySupervisorWatchdog: shutting down empty proxy supervisor for #{Supavisor.inspect_id(id)}"
        )

        {:stop, state}
      else
        schedule_check(interval, jitter)
        {:alive, %{state | empty_checks: empty_checks + 1}}
      end
    else
      _ ->
        schedule_check(interval, jitter)
        {:alive, %{state | empty_checks: 0}}
    end
  end

  defp schedule_check(interval, 0), do: Process.send_after(self(), :check, interval)

  defp schedule_check(interval, jitter) do
    Process.send_after(self(), :check, interval + :rand.uniform(jitter))
  end
end
