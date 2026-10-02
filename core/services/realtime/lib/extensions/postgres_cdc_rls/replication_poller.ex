defmodule Extensions.PostgresCdcRls.ReplicationPoller do
  @moduledoc """
  Polls the write-ahead log via a temporary logical replication slot, applies row
  level security policies for each subscriber, and broadcasts records to the
  `MessageDispatcher`.

  ## Lifecycle

  On start the poller connects to the tenant's database and fetches the
  publication's tables via `Subscriptions.fetch_publication_tables/2`. Only if
  the publication has tables does it call `Replications.prepare_replication/2`
  to create the temporary slot and kick off the poll loop; if the publication is
  empty it stays idle without creating a slot (an unconsumed slot would retain
  WAL) and waits for tables to appear.

  ## Poll loop

  Each `:poll` calls `Replications.list_changes/2`, which drains the slot and
  fans changes out to subscriber nodes. Reschedule cadence depends on activity:

    * rows processed → poll again immediately
    * raw slot changes present but nothing for subscribers → poll after `poll_interval_ms` (+ jitter)
    * fully idle → back off to `poll_interval_ms * @idle_multiplier`.

  When the publication is empty, `:poll` is a no-op — there are no tables to
  decode, so the slot is not advanced.

  ## Synchronous standby

  Where a COMMIT can wait for a synchronous standby, a change can be decoded before
  its row is visible. The setting rarely changes, so the poller checks
  `Replications.synchronous_standby/1` only when it prepares the slot, and passes
  it to `Replications.list_changes/2`. On OrioleDB a transaction that writes only
  OrioleDB tables cannot be deferred, so there the poll reads as it does without a
  standby and logs `SyncStandbyUnsupported`.

  ## Reacting to publication changes

  Every `@check_oids_interval` ms the poller re-fetches the publication's oids:

    * tables appear (empty → non-empty): re-run `prepare_replication/1` to
      recreate the slot if it was dropped, then resume polling.
    * tables vanish (non-empty → empty): cancel pending polls and drop the
      replication slot via `Replications.drop_replication_slot/2`. If the drop
      fails for any reason other than `:slot_not_found`, the poller stops with
      `{:shutdown, :drop_replication_slot_failed}`; because the slot is
      temporary, Postgres releases it automatically when the DB connection
      ends.

  This mirrors `SubscriptionManager`'s own `:check_oids` loop, which manages
  subscriptions when the publication's tables change.
  """

  use GenServer
  use Realtime.Logs

  @idle_multiplier 5
  @max_retries 6
  @check_oids_interval 60_000

  # Column order returned by realtime.list_changes/4
  # See Replications.list_changes/2 and the SQL function in 20260326120000_list_changes_with_slot_count.ex
  # generate_record/1 below pattern-matches positionally on this order; the runtime
  # check in handle_list_changes_result/4 fails loudly if the SQL ever changes.
  @expected_columns ~w(type schema table columns record old_record commit_timestamp subscription_ids errors slot_changes_count)

  import Realtime.Helpers

  alias DBConnection.Backoff

  alias Extensions.PostgresCdcRls.MessageDispatcher
  alias Extensions.PostgresCdcRls.Replications
  alias Extensions.PostgresCdcRls.Subscriptions

  alias Realtime.Adapters.Changes.DeletedRecord
  alias Realtime.Adapters.Changes.NewRecord
  alias Realtime.Adapters.Changes.UpdatedRecord
  alias Realtime.Database
  alias Realtime.RateCounter
  alias Realtime.Tenants

  alias RealtimeWeb.TenantBroadcaster

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  @impl true
  def init(args) do
    Process.flag(:fullsweep_after, 20)
    tenant_id = args["id"]
    Logger.metadata(external_id: tenant_id, project: tenant_id)

    %Realtime.Api.Tenant{} = tenant = Tenants.Cache.get_tenant_by_external_id(tenant_id)
    rate_counter_args = Tenants.db_events_per_second_rate(tenant)
    extension = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)

    RateCounter.new(rate_counter_args)

    start_time = Realtime.Telemetry.start([:realtime, :replication, :poller], %{tenant: tenant_id})

    state = %{
      backoff: Backoff.new(backoff_min: 100, backoff_max: 5_000, backoff_type: :rand_exp),
      max_changes: extension["poll_max_changes"],
      max_record_bytes: extension["poll_max_record_bytes"],
      poll_interval_ms: extension["poll_interval_ms"],
      poll_ref: nil,
      publication: extension["publication"],
      synchronous_standby: false,
      retry_ref: nil,
      retry_count: 0,
      slot_name: extension["slot_name"] <> slot_name_suffix(),
      tenant_id: tenant_id,
      rate_counter_args: rate_counter_args,
      subscribers_nodes_table: args["subscribers_nodes_table"],
      start_time: start_time,
      oids: %{},
      check_oid_ref: nil
    }

    {:ok, _} = Registry.register(__MODULE__.Registry, tenant_id, %{})
    {:ok, state, {:continue, {:connect, tenant}}}
  end

  @impl true
  def terminate(reason, %{start_time: start_time, tenant_id: tenant_id}) do
    if reason in [:normal, :shutdown] or match?({:shutdown, _}, reason) do
      Realtime.Telemetry.stop([:realtime, :replication, :poller], start_time, %{tenant: tenant_id, reason: reason})
    else
      Realtime.Telemetry.exception([:realtime, :replication, :poller], start_time, :exit, reason, [], %{
        tenant: tenant_id
      })
    end
  end

  def terminate(_reason, _state), do: :ok

  @impl true
  def handle_continue({:connect, tenant}, state) do
    with {:ok, realtime_rls_settings} <- Database.from_tenant(tenant, "realtime_rls"),
         {:ok, conn} <- Database.connect_db(realtime_rls_settings) do
      {:noreply, Map.put(state, :conn, conn), {:continue, :prepare}}
    else
      {:error, reason} ->
        log_error("ReplicationPollerConnectionFailed", reason)
        {:stop, {:shutdown, reason}, state}
    end
  end

  def handle_continue(:prepare, state) do
    prepare_replication(state)
  end

  @impl true
  def handle_info(:poll, %{oids: oids, poll_ref: poll_ref} = state) when map_size(oids) == 0 do
    cancel_timer(poll_ref)
    {:noreply, %{state | poll_ref: nil}}
  end

  def handle_info(
        :poll,
        %{
          backoff: backoff,
          poll_interval_ms: poll_interval_ms,
          poll_ref: poll_ref,
          publication: publication,
          synchronous_standby: synchronous_standby,
          retry_ref: retry_ref,
          retry_count: retry_count,
          slot_name: slot_name,
          max_record_bytes: max_record_bytes,
          max_changes: max_changes,
          conn: conn,
          tenant_id: tenant_id,
          subscribers_nodes_table: subscribers_nodes_table,
          rate_counter_args: rate_counter_args
        } = state
      ) do
    cancel_timer(poll_ref)
    cancel_timer(retry_ref)

    args = [
      conn,
      [
        slot_name: slot_name,
        publication: publication,
        max_changes: max_changes,
        max_record_bytes: max_record_bytes,
        synchronous_standby: synchronous_standby
      ]
    ]

    {time, list_changes} = :timer.tc(Replications, :list_changes, args)
    record_list_changes_telemetry(time, tenant_id)

    case handle_list_changes_result(list_changes, subscribers_nodes_table, tenant_id, rate_counter_args) do
      {:ok, {processed_count, slot_changes_count}} ->
        backoff = Backoff.reset(backoff)

        pool_ref =
          cond do
            processed_count > 0 ->
              send(self(), :poll)
              nil

            slot_changes_count > 0 ->
              jitter = Enum.random(50..100)
              Process.send_after(self(), :poll, poll_interval_ms + jitter)

            true ->
              Process.send_after(self(), :poll, poll_interval_ms * @idle_multiplier)
          end

        {:noreply, %{state | backoff: backoff, poll_ref: pool_ref, retry_count: 0}}

      {:error, %Postgrex.Error{postgres: %{code: :object_in_use, message: msg}} = slot_error} ->
        log_error("ReplicationSlotBeingUsed", msg)
        [_, db_pid] = Regex.run(~r/PID\s(\d*)$/, msg)
        db_pid = String.to_integer(db_pid)

        Realtime.Telemetry.execute([:realtime, :replication, :poller, :query, :exception], %{}, %{
          tenant: tenant_id,
          reason: :object_in_use
        })

        case Replications.get_pg_stat_activity_diff(conn, db_pid) do
          {:ok, diff} ->
            Logger.warning("Database PID #{db_pid} found in pg_stat_activity with state_change diff of #{diff}")

          {:error, reason} ->
            log_error("PgStatActivityQueryFailed", reason)
        end

        if retry_count > 3 do
          case Replications.terminate_backend(conn, slot_name) do
            {:ok, :terminated} -> Logger.warning("Replication slot in use - terminating")
            {:error, :slot_not_found} -> Logger.warning("Replication slot not found")
            {:error, error} -> Logger.warning("Error terminating backend: #{inspect(error)}")
          end
        end

        retry_or_stop(state, slot_error)

      {:error, reason} ->
        log_error("PoolingReplicationError", reason)

        Realtime.Telemetry.execute([:realtime, :replication, :poller, :query, :exception], %{}, %{
          tenant: tenant_id,
          reason: reason
        })

        retry_or_stop(state, reason)
    end
  end

  @impl true
  def handle_info(:retry, %{retry_ref: retry_ref} = state) do
    cancel_timer(retry_ref)
    prepare_replication(state)
  end

  def handle_info(:check_oids, %{conn: conn, publication: publication} = state) do
    case Subscriptions.fetch_publication_tables(conn, publication) do
      {:ok, new_oids} ->
        check_oids(new_oids, state)

      {:error, reason} ->
        log_error("CheckOidsError", reason)
        cancel_timer(state.check_oid_ref)
        {:noreply, %{state | check_oid_ref: schedule_check_oids()}}
    end
  end

  defp check_oids(new_oids, %{conn: conn, oids: old_oids} = state) do
    case {map_size(old_oids), map_size(new_oids)} do
      {0, n} when n > 0 ->
        Logger.info("ReplicationPoller's publication went from 0 to #{n} tables, starting replication")
        # prepare_replication/1 cancels check_oid_ref and reschedules it on success.
        prepare_replication(%{state | oids: new_oids})

      {n, 0} when n > 0 ->
        Logger.info("ReplicationPoller's publication went from #{n} to 0 tables, stopping replication")
        cancel_timer(state.poll_ref)
        # Cancel any pending :retry too: a retry left over from a prior
        # list_changes/5 error would otherwise fire after the slot is dropped and
        # re-run prepare_replication/1, recreating work (and possibly the slot).
        cancel_timer(state.retry_ref)

        case Replications.drop_replication_slot(conn, state.slot_name) do
          {:error, reason} when reason != :slot_not_found ->
            # The slot is a temporary logical replication slot tied to this connection,
            # so stopping the process releases it without leaking WAL.
            log_error("DropReplicationSlotFailed", reason)
            {:stop, {:shutdown, :drop_replication_slot_failed}, state}

          _ ->
            cancel_timer(state.check_oid_ref)

            {:noreply,
             %{
               state
               | oids: new_oids,
                 poll_ref: nil,
                 retry_ref: nil,
                 retry_count: 0,
                 check_oid_ref: schedule_check_oids()
             }}
        end

      _ ->
        cancel_timer(state.check_oid_ref)
        {:noreply, %{state | oids: new_oids, check_oid_ref: schedule_check_oids()}}
    end
  end

  def slot_name_suffix do
    case Application.get_env(:realtime, :slot_name_suffix) do
      nil -> ""
      slot_name_suffix -> "_" <> slot_name_suffix
    end
  end

  defp convert_errors([_ | _] = errors), do: errors

  defp convert_errors(_), do: nil

  defp prepare_replication(
         %{
           conn: conn,
           slot_name: slot_name,
           tenant_id: tenant_id,
           publication: publication,
           check_oid_ref: check_oid_ref
         } = state
       ) do
    # Always fetch fresh publication information. An empty publication fails the
    # map_size guard and falls through to the idle branch in `else`.
    with {:ok, oids} when map_size(oids) > 0 <- Subscriptions.fetch_publication_tables(conn, publication),
         {:ok, _} <- Replications.prepare_replication(conn, slot_name),
         {:ok, synchronous_standby} <- Replications.synchronous_standby(conn),
         {:ok, orioledb} <- Database.orioledb(conn) do
      send(self(), :poll)

      cancel_timer(check_oid_ref)
      # A successful prepare ends the failure streak: drop any pending retry and
      # reset the backoff/retry_count so the next :poll error starts fresh rather
      # than inheriting an inflated backoff or prematurely hitting @max_retries.
      cancel_timer(state.retry_ref)

      {:noreply,
       %{
         state
         | synchronous_standby: supported_standby(synchronous_standby, orioledb),
           oids: oids,
           check_oid_ref: schedule_check_oids(),
           retry_ref: nil,
           retry_count: 0,
           backoff: Backoff.reset(state.backoff)
       }}
    else
      {:ok, oids} ->
        # Empty publication: don't create a slot (it would retain WAL with nothing
        # to consume it). Wait for :check_oids to observe tables appearing.
        cancel_timer(check_oid_ref)
        {:noreply, %{state | oids: oids, check_oid_ref: schedule_check_oids()}}

      {:error, error} ->
        log_error("PoolingReplicationPreparationError", error)

        Realtime.Telemetry.execute([:realtime, :replication, :poller, :prepare, :exception], %{}, %{
          tenant: tenant_id,
          reason: error
        })

        retry_or_stop(state, error)
    end
  end

  # Schedules another :retry with exponential backoff, or stops the poller once
  # @max_retries consecutive failures have been reached. Stopping with a
  # :shutdown reason means the :transient child is NOT restarted (same as the
  # DB-connection-failure path), so the tenant's CDC workers wind down cleanly.
  defp retry_or_stop(%{retry_count: retry_count} = state, reason) when retry_count >= @max_retries do
    log_error("ReplicationPollerMaxRetriesReached", reason)
    {:stop, {:shutdown, :max_retries_reached}, state}
  end

  defp retry_or_stop(%{backoff: backoff, retry_count: retry_count} = state, _reason) do
    {timeout, backoff} = Backoff.backoff(backoff)
    retry_ref = Process.send_after(self(), :retry, timeout)
    {:noreply, %{state | backoff: backoff, retry_ref: retry_ref, retry_count: retry_count + 1}}
  end

  defp schedule_check_oids, do: Process.send_after(self(), :check_oids, @check_oids_interval)

  defp supported_standby(true = _synchronous_standby, true = _orioledb) do
    log_warning(
      "SyncStandbyUnsupported",
      "Commits wait for a synchronous standby, but OrioleDB transactions cannot be deferred until they are visible"
    )

    false
  end

  defp supported_standby(synchronous_standby, _orioledb), do: synchronous_standby

  defp record_list_changes_telemetry(time, tenant_id) do
    Realtime.Telemetry.execute(
      [:realtime, :replication, :poller, :query, :stop],
      %{duration: time},
      %{tenant: tenant_id}
    )
  end

  defp handle_list_changes_result(
         {:ok,
          %Postgrex.Result{
            columns: columns,
            rows: [_ | _] = rows
          }},
         subscribers_nodes_table,
         tenant_id,
         rate_counter_args
       ) do
    expected_columns = @expected_columns
    ^expected_columns = columns

    # The DB function always returns at least one row (sentinel row with wal=null).
    # All rows carry the same slot_changes_count in the last column.
    slot_changes_count = rows |> List.first() |> List.last()

    # The sentinel only appears when there are no real rows (see list_changes SQL).
    # So either all rows are real, or the sole row is the sentinel — check once.
    real_rows =
      case rows do
        [[nil | _] | _] -> []
        _ -> rows
      end

    case RateCounter.get(rate_counter_args) do
      {:ok, %{limit: %{triggered: true}}} ->
        if real_rows != [] do
          Realtime.Telemetry.execute(
            [:realtime, :replication, :poller, :changes, :skip],
            %{count: length(real_rows)},
            %{tenant: tenant_id, reason: :rate_limited}
          )
        end

        :ok

      _ ->
        topic = "realtime:postgres:" <> tenant_id

        for row <- real_rows,
            change <- row |> generate_record() |> List.wrap() do
          Realtime.GenCounter.add(rate_counter_args.id, MapSet.size(change.subscription_ids))

          payload = Jason.encode!(change)

          case collect_subscription_nodes(subscribers_nodes_table, change.subscription_ids) do
            {:ok, nodes} ->
              for {node, subscription_ids} <- nodes do
                TenantBroadcaster.pubsub_direct_broadcast(
                  node,
                  tenant_id,
                  topic,
                  # Send only the subscription IDs relevant to this node
                  {change.type, payload, MapSet.new(subscription_ids)},
                  MessageDispatcher,
                  :postgres_changes
                )
              end

            {:error, :node_not_found} ->
              TenantBroadcaster.pubsub_broadcast(
                tenant_id,
                topic,
                {change.type, payload, change.subscription_ids},
                MessageDispatcher,
                :postgres_changes
              )
          end
        end
    end

    {:ok, {length(real_rows), slot_changes_count}}
  end

  defp handle_list_changes_result({:ok, _}, _, _, _), do: {:ok, {0, 0}}
  defp handle_list_changes_result({:error, reason}, _, _, _), do: {:error, reason}

  defp collect_subscription_nodes(subscribers_nodes_table, subscription_ids) do
    Enum.reduce_while(subscription_ids, {:ok, %{}}, fn subscription_id, {:ok, acc} ->
      case :ets.lookup_element(subscribers_nodes_table, subscription_id, 2, :not_found) do
        :not_found ->
          {:halt, {:error, :node_not_found}}

        node ->
          updated_acc =
            Map.update(acc, node, [subscription_id], fn existing_ids -> [subscription_id | existing_ids] end)

          {:cont, {:ok, updated_acc}}
      end
    end)
  rescue
    _ -> {:error, :node_not_found}
  end

  def generate_record([
        "INSERT" = type,
        schema,
        table,
        columns,
        record,
        _old_record,
        commit_timestamp,
        subscription_ids,
        errors,
        _slot_changes_count
      ])
      when is_list(subscription_ids) do
    %NewRecord{
      columns: Jason.Fragment.new(columns),
      commit_timestamp: commit_timestamp,
      errors: convert_errors(errors),
      schema: schema,
      table: table,
      type: type,
      subscription_ids: MapSet.new(subscription_ids),
      record: Jason.Fragment.new(record)
    }
  end

  def generate_record([
        "UPDATE" = type,
        schema,
        table,
        columns,
        record,
        old_record,
        commit_timestamp,
        subscription_ids,
        errors,
        _slot_changes_count
      ])
      when is_list(subscription_ids) do
    %UpdatedRecord{
      columns: Jason.Fragment.new(columns),
      commit_timestamp: commit_timestamp,
      errors: convert_errors(errors),
      schema: schema,
      table: table,
      type: type,
      subscription_ids: MapSet.new(subscription_ids),
      old_record: Jason.Fragment.new(old_record),
      record: Jason.Fragment.new(record)
    }
  end

  def generate_record([
        "DELETE" = type,
        schema,
        table,
        columns,
        _record,
        old_record,
        commit_timestamp,
        subscription_ids,
        errors,
        _slot_changes_count
      ])
      when is_list(subscription_ids) do
    %DeletedRecord{
      columns: Jason.Fragment.new(columns),
      commit_timestamp: commit_timestamp,
      errors: convert_errors(errors),
      schema: schema,
      table: table,
      type: type,
      subscription_ids: MapSet.new(subscription_ids),
      old_record: Jason.Fragment.new(old_record)
    }
  end

  def generate_record(_), do: nil
end
