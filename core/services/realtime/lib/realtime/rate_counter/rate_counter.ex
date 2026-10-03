defmodule Realtime.RateCounter do
  @moduledoc """
  Start a RateCounter for any Erlang term.

  These rate counters use the GenCounter module.
  Start your RateCounter here and increment it with a `GenCounter.add/1` call, for example.

  Average is calculated as the average number of events per second
  """

  use GenServer

  require Logger

  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Telemetry

  defmodule Args do
    @moduledoc false
    @type t :: %__MODULE__{id: term(), opts: keyword}
    defstruct id: nil, opts: []
  end

  @idle_shutdown :timer.minutes(5)
  @tick :timer.seconds(1)
  @max_bucket_len 60
  @cache __MODULE__
  @app_name Mix.Project.config()[:app]

  defstruct id: nil,
            avg: 0.0,
            sum: 0,
            bucket: [],
            max_bucket_len: @max_bucket_len,
            tick: @tick,
            tick_ref: nil,
            idle_shutdown: @idle_shutdown,
            idle_shutdown_ref: nil,
            limit: %{log: false},
            telemetry: %{emit: false}

  @type t :: %__MODULE__{
          id: term(),
          avg: float(),
          sum: non_neg_integer(),
          bucket: list(),
          max_bucket_len: integer(),
          tick: integer(),
          tick_ref: reference() | nil,
          idle_shutdown: integer() | :infinity,
          idle_shutdown_ref: reference() | nil,
          limit:
            %{log: false}
            | %{
                log: true,
                value: integer(),
                measurement: :sum | :avg,
                triggered: boolean(),
                log_fn: (-> term())
              },
          telemetry:
            %{emit: false}
            | %{
                emit: true,
                event_name: :telemetry.event_name(),
                measurements: :telemetry.event_measurements(),
                metadata: :telemetry.event_metadata()
              }
        }

  @spec start_link([keyword()]) :: {:ok, pid()} | {:error, {:already_started, pid()}}
  def start_link(args) do
    id = Keyword.get(args, :id)
    if !id, do: raise("Supply an identifier to start a counter!")

    GenServer.start_link(__MODULE__, args,
      name: {:via, Registry, {Realtime.Registry.Unique, {__MODULE__, :rate_counter, id}}}
    )
  end

  @doc """
  Starts a new RateCounter under a DynamicSupervisor
  """

  @spec new(Args.t(), keyword) :: DynamicSupervisor.on_start_child()
  def new(%Args{id: id} = args, opts \\ []) do
    opts = [id: id] ++ Keyword.merge(args.opts, opts)

    DynamicSupervisor.start_child(RateCounter.DynamicSupervisor, %{
      id: id,
      start: {__MODULE__, :start_link, [opts]},
      restart: :transient
    })
  end

  @doc "Publish an update to the RateCounter with the given id"
  @spec publish_update(term()) :: :ok
  def publish_update(id), do: Phoenix.PubSub.broadcast(Realtime.PubSub, update_topic(id), :update)

  @doc """
  Gets the state of the RateCounter.

  Automatically starts the RateCounter if it does not exist or if it
  has stopped due to idleness.
  """
  @spec get(term() | Args.t()) :: {:ok, t} | {:error, term()}
  def get(%Args{id: id} = args) do
    case do_get(id) do
      {:ok, state} ->
        {:ok, state}

      {:error, :not_found} ->
        case new(args) do
          {:ok, _} -> do_get(id)
          {:error, {:already_started, _}} -> do_get(id)
          {:error, reason} -> {:error, reason}
        end
    end
  end

  @doc """
  Gets the state of the RateCounter without starting it.

  Returns `{:error, :not_found}` if the RateCounter is not running.
  """
  @spec find(term()) :: {:ok, t} | {:error, :not_found}
  def find(id), do: do_get(id)

  defp do_get(id) do
    case Cachex.get(@cache, id) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, state} -> {:ok, state}
    end
  end

  defp update_topic(id), do: "rate_counter:#{inspect(id)}"

  @impl true
  def init(args) do
    id = Keyword.fetch!(args, :id)
    telem_opts = Keyword.get(args, :telemetry)
    every = Keyword.get(args, :tick, @tick)
    max_bucket_len = Keyword.get(args, :max_bucket_len, @max_bucket_len)
    idle_shutdown_ms = Keyword.get(args, :idle_shutdown, @idle_shutdown)
    limit_opts = Keyword.get(args, :limit)

    Logger.info("Starting #{__MODULE__} for: #{inspect(id)}")

    # Always reset the counter in case the counter had already accumulated without
    # a RateCounter running to calculate avg and buckets
    GenCounter.reset(id)

    :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, update_topic(id))

    telemetry =
      if telem_opts do
        Logger.metadata(telem_opts.metadata)

        %{
          emit: true,
          event_name: [@app_name] ++ [:rate_counter] ++ telem_opts.event_name,
          measurements: Map.merge(%{sum: 0}, telem_opts.measurements),
          metadata: Map.merge(%{id: id}, telem_opts.metadata)
        }
      else
        %{emit: false}
      end

    limit =
      if limit_opts do
        %{
          log: true,
          value: Keyword.fetch!(limit_opts, :value),
          measurement: Keyword.fetch!(limit_opts, :measurement),
          log_fn: Keyword.fetch!(limit_opts, :log_fn),
          triggered: false
        }
      else
        %{log: false}
      end

    ticker = tick(0)

    idle_shutdown_ref =
      if idle_shutdown_ms != :infinity, do: shutdown_after(idle_shutdown_ms), else: nil

    state = %__MODULE__{
      id: id,
      tick: every,
      tick_ref: ticker,
      max_bucket_len: max_bucket_len,
      idle_shutdown: idle_shutdown_ms,
      idle_shutdown_ref: idle_shutdown_ref,
      telemetry: telemetry,
      limit: limit
    }

    Cachex.put!(@cache, id, state)

    {:ok, state}
  end

  @impl true
  def handle_info(:tick, state) do
    Process.cancel_timer(state.tick_ref)
    count = GenCounter.reset(state.id)

    if state.telemetry.emit and count > 0,
      do:
        Telemetry.execute(
          state.telemetry.event_name,
          %{state.telemetry.measurements | sum: count},
          state.telemetry.metadata
        )

    bucket = [count | state.bucket] |> Enum.take(state.max_bucket_len)
    bucket_len = Enum.count(bucket)

    sum = Enum.sum(bucket)

    avg = sum / bucket_len / (state.tick / 1_000)

    state = %{state | bucket: bucket, sum: sum, avg: avg}

    state = maybe_trigger_limit(state)
    tick(state.tick)

    Cachex.put!(@cache, state.id, state)

    {:noreply, state}
  end

  def handle_info(:idle_shutdown, state) do
    if Enum.all?(state.bucket, &(&1 == 0)) do
      shutdown(state)
    else
      Process.cancel_timer(state.idle_shutdown_ref)
      idle_shutdown_ref = shutdown_after(state.idle_shutdown)
      {:noreply, %{state | idle_shutdown_ref: idle_shutdown_ref}}
    end
  end

  def handle_info(:update, state) do
    # When we get an update message we shutdown so that this RateCounter
    # can be restarted with new parameters
    shutdown(state)
  end

  def handle_info(_, state), do: {:noreply, state}

  defp shutdown(state) do
    GenCounter.delete(state.id)
    # We are expiring in the near future instead of deleting so that
    # The process dies before the cache information disappears
    # If we were using Cachex.delete instead then the following rare scenario would be possible:
    # * RateCounter.get/2 is called;
    # * Cache was deleted but the process has not stopped yet;
    # * RateCounter.get/2 will then try to start a new RateCounter but the supervisor will return :already_started;
    # * Process finally stops;
    # * The cache is still empty because no new process was started causing an error

    Cachex.expire(@cache, state.id, :timer.seconds(1))
    {:stop, :normal, state}
  end

  defp maybe_trigger_limit(%{limit: %{log: false}} = state), do: state

  defp maybe_trigger_limit(%{limit: %{triggered: true, measurement: measurement}} = state) do
    # Limit has been triggered, but we need to check if it is still above the limit
    if Map.fetch!(state, measurement) < state.limit.value do
      %{state | limit: %{state.limit | triggered: false}}
    else
      # Limit is still above the threshold, so we keep the state as is
      state
    end
  end

  defp maybe_trigger_limit(%{limit: %{measurement: measurement}} = state) do
    if Map.fetch!(state, measurement) >= state.limit.value do
      state.limit.log_fn.()

      %{state | limit: %{state.limit | triggered: true}}
    else
      state
    end
  end

  defp tick(every) do
    Process.send_after(self(), :tick, every)
  end

  defp shutdown_after(ms) do
    Process.send_after(self(), :idle_shutdown, ms)
  end
end
