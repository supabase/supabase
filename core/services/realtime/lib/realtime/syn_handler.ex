defmodule Realtime.SynHandler do
  @moduledoc """
  Custom defined Syn's callbacks
  """
  require Logger
  alias Realtime.Syn.PostgresCdc
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.Endpoint

  @behaviour :syn_event_handler

  @postgres_cdc_scope_prefix PostgresCdc.syn_topic_prefix()

  @impl true
  def on_registry_process_updated(Connect, tenant_id, pid, %{conn: conn} = meta, :normal) when is_pid(conn) do
    # Update that a database connection is ready
    Endpoint.local_broadcast(Connect.syn_topic(tenant_id), "ready", %{
      pid: pid,
      conn: conn,
      replication_conn: meta[:replication_conn]
    })
  end

  def on_registry_process_updated(scope, tenant_id, _pid, meta, _reason) do
    scope = Atom.to_string(scope)

    case scope do
      @postgres_cdc_scope_prefix <> _ ->
        Endpoint.local_broadcast(PostgresCdc.syn_topic(tenant_id), "ready", meta)

      _ ->
        :ok
    end
  end

  @impl true
  def on_process_registered(scope, name, _pid, _meta, _reason) do
    :telemetry.execute([:syn, scope, :registered], %{}, %{name: name})
  end

  @doc """
  A process joined a :syn group (e.g. a node advertising itself into its
  `RegionNodes` region group). Fired on every node once membership propagates.

  We re-emit as telemetry so subscribers (e.g. the region-router ring registry)
  can react to region membership changes at the moment :syn has the metadata,
  rather than on raw `:nodeup` (which fires before the metadata is available).
  """
  @impl true
  def on_process_joined(scope, group_name, _pid, meta, _reason) do
    :telemetry.execute([:syn, scope, :joined], %{}, %{name: group_name, meta: meta})
  end

  @doc "A process left a :syn group. See `on_process_joined/5`."
  @impl true
  def on_process_left(scope, group_name, _pid, meta, _reason) do
    :telemetry.execute([:syn, scope, :left], %{}, %{name: group_name, meta: meta})
  end

  @doc """
  When processes registered with :syn are unregistered, either manually or by stopping, this
  callback is invoked.

  Other processes can subscribe to these events via PubSub to respond to them.

  We want to log conflict resolutions to know when more than one process on the cluster
  was started, and subsequently stopped because :syn handled the conflict.
  """
  @impl true
  def on_process_unregistered(scope, name, pid, _meta, reason) do
    :telemetry.execute([:syn, scope, :unregistered], %{}, %{name: name})

    case Atom.to_string(scope) do
      @postgres_cdc_scope_prefix <> _ ->
        Endpoint.local_broadcast(PostgresCdc.down_topic(name), PostgresCdc.down_event(), %{pid: pid, reason: reason})

      _ ->
        topic = topic(scope)
        Endpoint.local_broadcast(topic <> ":" <> name, topic <> "_down", %{pid: pid, reason: reason})
    end

    if reason == :syn_conflict_resolution,
      do: log("#{scope} terminated due to syn conflict resolution: #{inspect(name)} #{inspect(pid)}")

    :ok
  end

  @doc """
  We try to keep the oldest process. If the time they were registered is exactly the same we use
  their node names to decide.

  The most important part is that both nodes must 100% of the time agree on the decision

  We first send an exit with reason {:shutdown, :syn_conflict_resolution}
  If it times out an exit with reason :kill that can't be trapped
  """
  @impl true
  def resolve_registry_conflict(mod, name, {pid1, _meta1, _time1}, {pid2, _meta2, _time2}) do
    {pid_to_keep, pid_to_stop} = decide(pid1, pid2, name)

    # Is this function running on the node that should stop?
    if node(pid_to_stop) == node() do
      log(
        "Resolving conflict on scope #{inspect(mod)} for name #{inspect(name)} {#{node(pid1)}, #{inspect(pid1)}} vs {#{node(pid2)}, #{inspect(pid2)}}, stop local process: #{inspect(pid_to_stop)}"
      )

      stop(pid_to_stop)
    else
      log(
        "Resolving conflict on scope #{inspect(mod)} for name #{inspect(name)} {#{node(pid1)}, #{inspect(pid1)}} vs {#{node(pid2)}, #{inspect(pid2)}}, remote process will be stopped: #{inspect(pid_to_stop)}"
      )
    end

    pid_to_keep
  end

  defp stop(pid_to_stop) do
    spawn(fn ->
      Process.monitor(pid_to_stop)
      Process.exit(pid_to_stop, {:shutdown, :syn_conflict_resolution})

      receive do
        {:DOWN, _ref, :process, ^pid_to_stop, reason} ->
          log("Successfully stopped #{inspect(pid_to_stop)}. Reason: #{inspect(reason)}")
      after
        5000 ->
          log("Timed out while waiting for process #{inspect(pid_to_stop)} to stop. Sending kill exit signal")
          Process.exit(pid_to_stop, :kill)
      end
    end)
  end

  defp log(message), do: Logger.warning("SynHandler(#{node()}): #{message}")

  # We use node and the name to decide who lives and who dies
  # This way both nodes will always agree on the same outcome
  # regardless of timing issues
  defp decide(pid1, pid2, name) do
    # We hash the name to not always pick one specific node when a conflict happens
    # between these 2 nodes
    hash = :erlang.phash2(name, 2)

    if hash == 1 do
      if node(pid1) < node(pid2) do
        {pid1, pid2}
      else
        {pid2, pid1}
      end
    else
      if node(pid1) < node(pid2) do
        {pid2, pid1}
      else
        {pid1, pid2}
      end
    end
  end

  defp topic(mod) do
    mod
    |> Macro.underscore()
    |> String.split("/")
    |> Enum.take(-1)
    |> hd()
  end
end
