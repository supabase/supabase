defmodule Supavisor.CircuitBreaker.Janitor do
  @moduledoc """
  Periodically cleans up stale entries from the circuit breaker ETS table.
  """

  use GenServer
  require Logger

  @cleanup_interval :timer.minutes(5)

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    schedule_cleanup()
    {:ok, %{}}
  end

  @impl true
  def handle_info(:cleanup, state) do
    Supavisor.CircuitBreaker.cleanup_stale_entries()
    schedule_cleanup()
    {:noreply, state}
  end

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, @cleanup_interval)
  end
end
