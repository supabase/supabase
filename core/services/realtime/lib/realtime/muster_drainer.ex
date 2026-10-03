defmodule Realtime.MusterDrainer do
  @moduledoc """
  Owns the graceful handoff of this node's Muster **router role** at shutdown.

  It does nothing while alive; the whole job is `terminate/2` calling
  `Forum.Muster.drain/2`. Its child spec derives its `shutdown:` timeout from the
  `:drain_opts` it was given (`timeout_ms + settle_ms` plus slack) and the
  surrounding SIGTERM grace period must exceed that, plus however long the
  Endpoint takes to close its websockets first, or the BEAM is SIGKILLed
  mid-drain.
  """
  use GenServer
  require Logger

  # Forum.Muster.drain/2's own defaults, mirrored so the derived shutdown budget
  # below stays correct when :drain_opts omits either window.
  @default_timeout_ms 5_000
  @default_settle_ms 5_000

  # drain/2's GenServer.call already allows timeout + settle + 1s; add slack on
  # top so the supervisor never brutal-kills terminate/2 mid-handoff.
  @shutdown_slack_ms 2_500

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
      shutdown: Keyword.get_lazy(opts, :shutdown, fn -> shutdown_ms(Keyword.get(opts, :drain_opts, [])) end)
    }
  end

  defp shutdown_ms(drain_opts) do
    timeout = Keyword.get(drain_opts, :timeout_ms, @default_timeout_ms)
    settle = Keyword.get(drain_opts, :settle_ms, @default_settle_ms)

    timeout + settle + 1_000 + @shutdown_slack_ms
  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: Keyword.get(opts, :name, __MODULE__))
  end

  @impl true
  def init(opts) do
    Process.flag(:trap_exit, true)
    scope = Keyword.get(opts, :scope) || Application.fetch_env!(:realtime, :muster_scope)
    drain_opts = Keyword.get(opts, :drain_opts, [])
    {:ok, %{scope: scope, drain_opts: drain_opts}}
  end

  @impl true
  def terminate(_reason, %{scope: scope, drain_opts: drain_opts}) do
    Logger.info("#{__MODULE__}: draining Muster router role for scope #{inspect(scope)}")

    case Forum.Muster.drain(scope, drain_opts) do
      :ok ->
        Logger.info("#{__MODULE__}: Muster drain complete for scope #{inspect(scope)}")

      {:timeout, unacked} ->
        Logger.warning(
          "#{__MODULE__}: Muster drain timed out for scope #{inspect(scope)}; unacked peers: #{inspect(unacked)}"
        )
    end

    :ok
  catch
    kind, reason ->
      # Never let a drain failure stall shutdown: the coordinator may already be
      # gone, or drain may raise. Log and let termination proceed.
      Logger.error(
        "#{__MODULE__}: Muster drain crashed for scope #{inspect(scope)}: " <>
          Exception.format(kind, reason, __STACKTRACE__)
      )

      :ok
  end
end
