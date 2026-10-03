defmodule Extensions.PostgresCdcRls.SubscriptionManager do
  @moduledoc """
  Handles subscriptions from tenant's database.
  """
  use GenServer
  use Realtime.Logs

  alias Realtime.Tenants.Rebalancer
  alias Extensions.PostgresCdcRls, as: Rls

  alias Realtime.Database
  alias Realtime.Helpers
  alias Realtime.GenRpc
  alias Realtime.Telemetry

  alias Rls.Subscriptions

  @timeout 15_000
  @max_delete_records 1000
  @check_oids_interval 60_000
  @check_no_users_interval 60_000
  @check_active_pids_interval 120_000
  @stop_after 60_000 * 10
  @statement_timeout :timer.seconds(10)
  @subs_pool_statement_timeout :timer.seconds(5)
  @subs_pool_queue_target :timer.seconds(2)

  defmodule State do
    @moduledoc false
    defstruct [
      :id,
      :publication,
      :subscribers_pids_table,
      :subscribers_nodes_table,
      :conn,
      :delete_queue,
      :no_users_ref,
      no_users_ts: nil,
      oids: %{},
      check_oid_ref: nil,
      check_active_pids_ref: nil,
      check_region_interval: nil
    ]

    @type t :: %__MODULE__{
            id: String.t(),
            publication: String.t(),
            subscribers_pids_table: :ets.tid(),
            subscribers_nodes_table: :ets.tid(),
            conn: Postgrex.conn(),
            oids: map(),
            check_oid_ref: reference() | nil,
            check_active_pids_ref: reference() | nil,
            delete_queue: %{
              ref: reference(),
              queue: :queue.queue()
            },
            no_users_ref: reference(),
            no_users_ts: non_neg_integer() | nil,
            check_region_interval: non_neg_integer
          }
  end

  @spec start_link(GenServer.options()) :: GenServer.on_start()
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  ## Callbacks

  @impl true
  def init(args) do
    %{"id" => id} = args
    Logger.metadata(external_id: id, project: id)
    {:ok, nil, {:continue, {:connect, args}}}
  end

  @impl true
  def handle_continue({:connect, args}, _) do
    %{
      "id" => id,
      "subscribers_pids_table" => subscribers_pids_table,
      "subscribers_nodes_table" => subscribers_nodes_table
    } = args

    %Realtime.Api.Tenant{} = tenant = Realtime.Tenants.Cache.get_tenant_by_external_id(id)
    extension = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)
    extension = Map.merge(extension, %{"subs_pool_size" => Map.get(extension, "subcriber_pool_size", 4)})

    publication = extension["publication"]

    with {:ok, subscription_manager_settings} <- Database.from_settings(extension, "realtime_subscription_manager"),
         {:ok, subscription_manager_pub_settings} <-
           Database.from_settings(extension, "realtime_subscription_manager_pub"),
         {:ok, conn} <-
           Database.connect_db(subscription_manager_settings, after_connect: after_connect(@statement_timeout)),
         {:ok, conn_pub} <-
           Database.connect_db(subscription_manager_pub_settings,
             after_connect: after_connect(@subs_pool_statement_timeout),
             queue_target: @subs_pool_queue_target
           ),
         {:ok, oids} <- Subscriptions.fetch_publication_tables(conn, publication) do
      # The subscribers ETS tables are owned by the WorkerSupervisor, so they survive a
      # SubscriptionManager-only restart. An empty pids table means a cold start (fresh
      # WorkerSupervisor): clear any stale DB rows.
      # A non-empty table means a warm manager restart: the DB + ETS state is
      # still valid, so re-adopt it by rebuilding the monitors (the only thing lost with the
      # previous manager) instead of wiping everyone out.
      case :ets.info(subscribers_pids_table, :size) do
        0 ->
          Subscriptions.delete_all_if_table_exists(conn)

        _ ->
          readopt_monitors(subscribers_pids_table)
      end

      Rls.update_meta(id, self(), conn_pub)

      check_region_interval = Map.get(args, :check_region_interval, rebalance_check_interval_in_ms())
      send_region_check_message(check_region_interval)

      state =
        %State{
          id: id,
          conn: conn,
          publication: publication,
          subscribers_pids_table: subscribers_pids_table,
          subscribers_nodes_table: subscribers_nodes_table,
          oids: oids,
          delete_queue: %{
            ref: check_delete_queue(),
            queue: :queue.new()
          },
          no_users_ref: check_no_users(),
          check_active_pids_ref: check_active_pids(),
          check_region_interval: check_region_interval
        }

      send(self(), :check_oids)
      {:noreply, state}
    else
      {:error, reason} ->
        log_error("SubscriptionManagerConnectionFailed", reason)
        {:stop, {:shutdown, reason}, nil}
    end
  end

  @impl true
  def handle_info({:subscribed, {pid, id}}, state) do
    case :ets.match(state.subscribers_pids_table, {pid, id, :"$1", :_}) do
      [] -> :ets.insert(state.subscribers_pids_table, {pid, id, Process.monitor(pid), node(pid)})
      _ -> :ok
    end

    :ets.insert(state.subscribers_nodes_table, {UUID.string_to_binary!(id), node(pid)})

    {:noreply, %{state | no_users_ts: nil}}
  end

  def handle_info(
        :check_oids,
        %State{check_oid_ref: ref, conn: conn, publication: publication, oids: old_oids} = state
      ) do
    Helpers.cancel_timer(ref)

    oids =
      case Subscriptions.fetch_publication_tables(conn, publication) do
        {:ok, ^old_oids} ->
          old_oids

        {:ok, new_oids} ->
          Logger.warning("Found new oids #{inspect(new_oids, pretty: true)}")

          Subscriptions.delete_all(conn)

          fn {pid, _id, ref, _node}, _acc ->
            Process.demonitor(ref, [:flush])
            send(pid, :postgres_subscribe)
          end
          |> :ets.foldl([], state.subscribers_pids_table)

          :ets.delete_all_objects(state.subscribers_pids_table)
          :ets.delete_all_objects(state.subscribers_nodes_table)

          new_oids

        {:error, reason} ->
          # A fetch error must not be mistaken for a publication change: keep the
          # current oids and subscribers untouched, just reschedule the next check.
          log_error("CheckOidsError", reason)
          old_oids
      end

    {:noreply, %{state | oids: oids, check_oid_ref: check_oids()}}
  end

  def handle_info(
        {:DOWN, _ref, :process, pid, _reason},
        %State{
          subscribers_pids_table: subscribers_pids_table,
          subscribers_nodes_table: subscribers_nodes_table,
          delete_queue: %{queue: q}
        } = state
      ) do
    q1 =
      case :ets.take(subscribers_pids_table, pid) do
        [] ->
          q

        values ->
          for {_pid, id, _ref, _node} <- values, reduce: q do
            acc ->
              bin_id = UUID.string_to_binary!(id)

              :ets.delete(subscribers_nodes_table, bin_id)

              :queue.in(bin_id, acc)
          end
      end

    {:noreply, put_in(state.delete_queue.queue, q1)}
  end

  def handle_info(:check_delete_queue, %State{delete_queue: %{ref: ref, queue: q}} = state) do
    Helpers.cancel_timer(ref)

    q1 =
      if :queue.is_empty(q) do
        q
      else
        {ids, q1} = Helpers.queue_take(q, @max_delete_records)
        Logger.debug("delete sub id #{inspect(ids)}")

        case Subscriptions.delete_multi(state.conn, ids) do
          {:ok, _} ->
            q1

          {:error, reason} ->
            log_error("SubscriptionDeletionFailed", reason)

            q
        end
      end

    ref = if :queue.is_empty(q1), do: check_delete_queue(), else: check_delete_queue(1_000)

    {:noreply, %{state | delete_queue: %{ref: ref, queue: q1}}}
  end

  def handle_info(:check_no_users, %{subscribers_pids_table: tid, no_users_ts: ts} = state) do
    Helpers.cancel_timer(state.no_users_ref)

    subscribers = :ets.info(tid, :size)

    Realtime.Telemetry.execute(
      [:realtime, :subscriptions, :manager, :subscribers],
      %{count: subscribers},
      %{tenant: state.id}
    )

    ts_new =
      case {subscribers, ts != nil && ts + @stop_after < now()} do
        {0, true} ->
          Logger.info("Stopping Postgres Changes streaming for tenant due to no active subscriptions")
          Rls.handle_stop(state.id, 15_000)
          ts

        {0, false} ->
          if ts != nil, do: ts, else: now()

        _ ->
          nil
      end

    {:noreply, %{state | no_users_ts: ts_new, no_users_ref: check_no_users()}}
  end

  def handle_info({:check_region, previous_nodes_set}, state) do
    current_nodes_set = MapSet.new(Node.list())

    case Rebalancer.check(previous_nodes_set, current_nodes_set, state.id) do
      :ok ->
        # Let's check again in the future
        send_region_check_message(state.check_region_interval)
        {:noreply, state}

      {:error, :wrong_region} ->
        Logger.warning("Rebalancing Postgres Changes replication for a closer region")
        Rls.handle_stop(state.id, 15_000)
        {:noreply, state}
    end
  end

  def handle_info(
        :check_active_pids,
        %State{check_active_pids_ref: ref, delete_queue: delete_queue, id: id} = state
      ) do
    Helpers.cancel_timer(ref)

    ids =
      state.subscribers_pids_table
      |> subscribers_by_node()
      |> not_alive_pids_dist()
      |> pop_not_alive_pids(state.subscribers_pids_table, state.subscribers_nodes_table, id)

    new_delete_queue =
      if Enum.empty?(ids) do
        delete_queue
      else
        q =
          Enum.reduce(ids, delete_queue.queue, fn id, acc ->
            if :queue.member(id, acc), do: acc, else: :queue.in(id, acc)
          end)

        Helpers.cancel_timer(delete_queue.ref)
        %{ref: check_delete_queue(1_000), queue: q}
      end

    {:noreply, %{state | check_active_pids_ref: check_active_pids(), delete_queue: new_delete_queue}}
  end

  def handle_info(msg, state) do
    log_error("UnhandledProcessMessage", msg)

    {:noreply, state}
  end

  ## Internal functions

  # Warm restart: re-adopt the subscribers that survived in ETS.
  #
  # The previous manager's monitors died with it, so the new one re-monitors every surviving pid
  # (refreshing the ref stored in ETS, which the :check_oids path uses to demonitor). A pid that
  # died during the downtime makes Process.monitor/1 deliver :DOWN immediately, so the existing
  # :DOWN handler cleans it up — self-healing.
  #
  # We deliberately do not reconcile the DB against ETS here: orphan DB rows are hygiene rather
  # than correctness (the poller falls back to a cluster-wide broadcast on :node_not_found instead
  # of dropping changes), and any DB-vs-ETS diff would scale with the tenant's total subscription
  # count on its own database right at restart. Orphans are cleared by the cold-start / OID-change
  # wipe instead.
  @spec readopt_monitors(:ets.tid()) :: :ok
  defp readopt_monitors(subscribers_pids_table) do
    subscribers_pids_table
    |> :ets.tab2list()
    |> Enum.each(fn {pid, id, old_ref, node} ->
      new_ref = Process.monitor(pid)
      :ets.delete_object(subscribers_pids_table, {pid, id, old_ref, node})
      :ets.insert(subscribers_pids_table, {pid, id, new_ref, node})
    end)
  end

  @spec pop_not_alive_pids([pid()], :ets.tid(), :ets.tid(), binary()) :: [Ecto.UUID.t()]
  def pop_not_alive_pids(pids, subscribers_pids_table, subscribers_nodes_table, tenant_id) do
    Enum.reduce(pids, [], fn pid, acc ->
      case :ets.lookup(subscribers_pids_table, pid) do
        [] ->
          Telemetry.execute(
            [:realtime, :subscriptions, :manager, :dead_pid],
            %{quantity: 1},
            %{tenant: tenant_id, reason: :not_found}
          )

          acc

        results ->
          for {^pid, postgres_id, _ref, _node} <- results do
            Telemetry.execute(
              [:realtime, :subscriptions, :manager, :dead_pid],
              %{quantity: 1},
              %{tenant: tenant_id, reason: :phantom}
            )

            :ets.delete(subscribers_pids_table, pid)
            bin_id = UUID.string_to_binary!(postgres_id)

            :ets.delete(subscribers_nodes_table, bin_id)
            bin_id
          end ++ acc
      end
    end)
  end

  @spec subscribers_by_node(:ets.tid()) :: %{node() => MapSet.t(pid())}
  def subscribers_by_node(tid) do
    fn {pid, _postgres_id, _ref, node}, acc ->
      set = if Map.has_key?(acc, node), do: MapSet.put(acc[node], pid), else: MapSet.new([pid])

      Map.put(acc, node, set)
    end
    |> :ets.foldl(%{}, tid)
  end

  @spec not_alive_pids_dist(%{node() => MapSet.t(pid())}) :: [pid()] | []
  def not_alive_pids_dist(pids) do
    Enum.reduce(pids, [], fn {node, pids}, acc ->
      if node == node() do
        acc ++ not_alive_pids(pids)
      else
        case GenRpc.call(node, __MODULE__, :not_alive_pids, [pids], timeout: 15_000) do
          {:error, :rpc_error, _} = error ->
            log_error("UnableToCheckProcessesOnRemoteNode", error)
            acc

          pids ->
            acc ++ pids
        end
      end
    end)
  end

  @spec not_alive_pids(MapSet.t(pid())) :: [pid()] | []
  def not_alive_pids(pids) do
    Enum.reduce(pids, [], fn pid, acc -> if Process.alive?(pid), do: acc, else: [pid | acc] end)
  end

  defp after_connect(statement_timeout), do: {Postgrex, :query!, ["SET statement_timeout = #{statement_timeout}", []]}

  defp check_oids, do: Process.send_after(self(), :check_oids, @check_oids_interval)

  defp check_active_pids, do: Process.send_after(self(), :check_active_pids, @check_active_pids_interval)

  defp now, do: System.system_time(:millisecond)

  defp check_no_users, do: Process.send_after(self(), :check_no_users, @check_no_users_interval)

  defp check_delete_queue(timeout \\ @timeout),
    do: Process.send_after(self(), :check_delete_queue, timeout)

  defp send_region_check_message(check_region_interval) do
    Process.send_after(self(), {:check_region, MapSet.new(Node.list())}, check_region_interval)
  end

  defp rebalance_check_interval_in_ms, do: Application.fetch_env!(:realtime, :rebalance_check_interval_in_ms)
end
