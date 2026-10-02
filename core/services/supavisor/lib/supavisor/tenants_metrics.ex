defmodule Supavisor.TenantsMetrics do
  @moduledoc false
  use GenServer, restart: :transient
  require Logger
  require Supavisor

  alias Supavisor.Monitoring.PromEx

  @check_timeout 10_000

  def start_link(args) do
    GenServer.start_link(__MODULE__, args,
      name: __MODULE__,
      spawn_opt: [
        priority: :low
      ]
    )
  end

  ## Callbacks

  @impl true
  def init(_args) do
    send(self(), :check_metrics)
    {:ok, %{check_ref: make_ref(), pools: MapSet.new()}}
  end

  @impl true
  def handle_info(:check_metrics, state) do
    Process.cancel_timer(state.check_ref)

    active_pools = PromEx.do_cache_tenants_metrics() |> MapSet.new()

    MapSet.difference(state.pools, active_pools)
    |> Enum.each(fn Supavisor.id(tenant: tenant) = pool ->
      Logger.debug("Removing cached metrics for #{Supavisor.inspect_id(pool)}")
      Cachex.del(Supavisor.Cache, {:metrics, tenant})
    end)

    {:noreply, %{state | check_ref: check_metrics(), pools: active_pools}}
  end

  ## Internal functions

  defp check_metrics do
    Process.send_after(
      self(),
      :check_metrics,
      @check_timeout
    )
  end
end
