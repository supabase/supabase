defmodule Cluster.Strategy.Postgres do
  @moduledoc """
  A libcluster strategy that uses Postgres LISTEN/NOTIFY to determine the cluster topology.

  This strategy operates by having all nodes in the cluster listen for and send notifications to a shared Postgres channel.

  When a node comes online, it begins to broadcast its name in a "heartbeat" message to the channel. All other nodes that receive this message attempt to connect to it.

  This strategy does not check connectivity between nodes and does not disconnect them

  ## Options

  * `url` - The url of the database server (required)
  * `heartbeat_interval` - The interval at which to send heartbeat messages in milliseconds (optional; default: 5_000)
  * `channel_name` - The name of the channel to which nodes will listen and notify (optional; default: "cluster)
  """
  use GenServer

  @vsn "1.1.49"

  alias Cluster.Logger
  alias Cluster.Strategy
  alias Postgrex

  def start_link(args), do: GenServer.start_link(__MODULE__, args)

  def init([state]) do
    if !state.config[:url] do
      raise ArgumentError, "Missing required option :url"
    end

    opts =
      Ecto.Repo.Supervisor.parse_url(state.config[:url])
      |> Keyword.put_new(:parameters, application_name: "cluster_node_#{node()}")
      |> Keyword.put_new(:auto_reconnect, true)
      |> Keyword.put_new(:ssl_opts, verify: :verify_none)
      |> Keyword.put_new(:socket_options, state.config[:socket_options] || [])

    new_config =
      state.config
      |> Keyword.put_new(:heartbeat_interval, 5_000)
      |> Keyword.put_new(:channel_name, "cluster")
      |> Keyword.delete(:url)

    meta = %{
      opts: fn -> opts end,
      conn: nil,
      conn_notif: nil,
      heartbeat_ref: make_ref()
    }

    {:ok, %{state | config: new_config, meta: meta}, {:continue, :connect}}
  end

  def handle_continue(:connect, state) do
    with {:ok, conn} <- Postgrex.start_link(state.meta.opts.()),
         {:ok, conn_notif} <- Postgrex.Notifications.start_link(state.meta.opts.()),
         {_, _} <- Postgrex.Notifications.listen(conn_notif, state.config[:channel_name]) do
      Logger.info(state.topology, "Connected to Postgres database")

      meta = %{
        state.meta
        | conn: conn,
          conn_notif: conn_notif,
          heartbeat_ref: heartbeat(0)
      }

      {:noreply, put_in(state.meta, meta)}
    else
      reason ->
        Logger.error(state.topology, "Failed to connect to Postgres: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  def handle_info(:heartbeat, state) do
    Process.cancel_timer(state.meta.heartbeat_ref)
    Postgrex.query(state.meta.conn, "NOTIFY #{state.config[:channel_name]}, '#{node()}'", [])
    ref = heartbeat(state.config[:heartbeat_interval])
    {:noreply, put_in(state.meta.heartbeat_ref, ref)}
  end

  def handle_info({:notification, _, _, channel, msg}, state) do
    disterl = state.config[:channel_name]

    case channel do
      ^disterl -> handle_channels(:disterl, msg, state)
      other -> Logger.error(state.topology, "Unknown channel: #{other}")
    end

    {:noreply, state}
  end

  def handle_info(msg, state) do
    Logger.error(state.topology, "Undefined message #{inspect(msg, pretty: true)}")
    {:noreply, state}
  end

  def code_change(_, state, _), do: {:ok, state}

  ### Internal functions
  @spec heartbeat(non_neg_integer()) :: reference()
  defp heartbeat(interval) when interval >= 0 do
    Process.send_after(self(), :heartbeat, interval)
  end

  # sobelow_skip ["DOS.StringToAtom"]
  @spec handle_channels(:disterl, String.t(), map()) :: any()
  def handle_channels(:disterl, msg, state) do
    node = String.to_atom(msg)

    if node != node() do
      topology = state.topology
      Logger.debug(topology, "Trying to connect to node: #{node}")

      case Strategy.connect_nodes(topology, state.connect, state.list_nodes, [node]) do
        :ok ->
          Logger.debug(topology, "Connected to node: #{node}")

        {:error, _} ->
          Logger.error(topology, "Failed to connect to node: #{node}")
      end
    end
  end
end
