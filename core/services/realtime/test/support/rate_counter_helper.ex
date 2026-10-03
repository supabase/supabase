defmodule RateCounterHelper do
  alias Realtime.RateCounter

  import WaitForIt

  @spec new!(RateCounter.Args.t()) :: pid()
  def new!(args) do
    {:ok, _} = RateCounter.new(args)
    [{pid, _}] = Registry.lookup(Realtime.Registry.Unique, {RateCounter, :rate_counter, args.id})
    await_initial_tick(pid)
    pid
  end

  defp await_initial_tick(pid) do
    match_wait! %RateCounter{bucket: [_ | _]}, :sys.get_state(pid), timeout: 5_000, interval: 10
  end

  @spec stop(term()) :: :ok
  def stop(tenant_id) do
    keys =
      Registry.select(Realtime.Registry.Unique, [
        {{{:"$1", :_, {:_, :_, :"$2"}}, :"$3", :_}, [{:==, :"$1", RateCounter}, {:==, :"$2", tenant_id}], [:"$_"]}
      ])

    Enum.each(keys, fn {{_, _, key}, {pid, _}} ->
      if Process.alive?(pid), do: GenServer.stop(pid)
      Realtime.GenCounter.delete(key)
      Cachex.del!(RateCounter, key)
    end)

    :ok
  end

  @spec tick!(RateCounter.Args.t()) :: RateCounter.t()
  def tick!(args) do
    [{pid, _}] = Registry.lookup(Realtime.Registry.Unique, {RateCounter, :rate_counter, args.id})
    send(pid, :tick)
    {:ok, :sys.get_state(pid)}
  end

  def tick_tenant_rate_counters!(tenant_id) do
    keys =
      Registry.select(Realtime.Registry.Unique, [
        {{{:"$1", :_, {:_, :_, :"$2"}}, :"$3", :_}, [{:==, :"$1", RateCounter}, {:==, :"$2", tenant_id}], [:"$_"]}
      ])

    Enum.each(keys, fn {{_, _, _key}, {pid, _}} ->
      send(pid, :tick)
      # do a get_state to wait for the tick to be processed
      :sys.get_state(pid)
    end)

    :ok
  end
end
