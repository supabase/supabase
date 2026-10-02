defmodule Extensions.PostgresCdcRls.Replications do
  @moduledoc """
  SQL queries that use PostgresCdcRls.ReplicationPoller to create a temporary slot and poll the write-ahead log.
  """

  import Postgrex, only: [query: 3, query: 4]

  @spec prepare_replication(pid(), String.t()) ::
          {:ok, Postgrex.Result.t()} | {:error, Postgrex.Error.t()}
  def prepare_replication(conn, slot_name) do
    query(
      conn,
      "select
        case when not exists (
          select 1
          from pg_replication_slots
          where slot_name = $1
        )
        then (
          select 1 from pg_create_logical_replication_slot(slot_name => $1, plugin => 'wal2json', temporary => true)
        )
        else 1
        end;",
      [slot_name]
    )
  end

  @spec terminate_backend(pid(), String.t()) ::
          {:ok, :terminated} | {:error, :slot_not_found | Postgrex.Error.t()}
  def terminate_backend(conn, slot_name) do
    slots =
      query(conn, "select active_pid from pg_replication_slots where slot_name = $1", [slot_name])

    case slots do
      {:ok, %Postgrex.Result{rows: [[nil]]}} ->
        {:error, :slot_not_found}

      {:ok, %Postgrex.Result{rows: [[backend]]}} ->
        case query(conn, "select pg_terminate_backend($1)", [backend]) do
          {:ok, _resp} -> {:ok, :terminated}
          {:error, erroer} -> {:error, erroer}
        end

      {:ok, %Postgrex.Result{num_rows: 0}} ->
        {:error, :slot_not_found}

      {:error, error} ->
        {:error, error}
    end
  end

  @spec drop_replication_slot(pid(), String.t()) ::
          {:ok, :dropped} | {:error, :slot_not_found | Postgrex.Error.t()}
  def drop_replication_slot(conn, slot_name) do
    case query(
           conn,
           "select pg_drop_replication_slot(slot_name) from pg_replication_slots where slot_name = $1",
           [slot_name]
         ) do
      {:ok, %Postgrex.Result{num_rows: 0}} -> {:error, :slot_not_found}
      {:ok, _} -> {:ok, :dropped}
      {:error, error} -> {:error, error}
    end
  end

  @spec get_pg_stat_activity_diff(pid(), integer()) ::
          {:ok, integer()} | {:error, Postgrex.Error.t()}
  def get_pg_stat_activity_diff(conn, db_pid) do
    query =
      query(
        conn,
        "select
         extract(
          epoch from (now() - state_change)
         )::int as diff
         from pg_stat_activity where application_name = 'realtime_rls' and pid = $1",
        [db_pid]
      )

    case query do
      {:ok, %{rows: [[diff]]}} -> {:ok, diff}
      {:ok, _} -> {:error, :pid_not_found}
      {:error, error} -> {:error, error}
    end
  end

  @doc """
  Reports whether a COMMIT can wait for a synchronous standby.
  """
  @spec synchronous_standby(pid()) :: {:ok, boolean()} | {:error, Postgrex.Error.t()}
  def synchronous_standby(conn) do
    case query(conn, "SELECT current_setting('synchronous_standby_names') <> ''", []) do
      {:ok, %Postgrex.Result{rows: [[synchronous_standby]]}} -> {:ok, synchronous_standby}
      {:error, error} -> {:error, error}
    end
  end

  @doc """
  Drains the slot and authorizes each change.

  ## Options

    * `:slot_name` (required, `t:String.t/0`) - the replication slot to drain
    * `:publication` (required, `t:String.t/0`) - the publication to decode
    * `:max_changes` (required, `t:pos_integer/0`) - most changes to take in one poll
    * `:max_record_bytes` (required, `t:pos_integer/0`) - records above this are truncated
    * `:synchronous_standby` (optional, `t:boolean/0`) - whether a COMMIT can wait for a
      synchronous standby, see `synchronous_standby/1`. Defaults to `false`.

  """
  @spec list_changes(pid(), keyword()) :: {:ok, Postgrex.Result.t()} | {:error, Postgrex.Error.t()}
  def list_changes(conn, opts) do
    opts =
      Keyword.validate!(opts, [:slot_name, :publication, :max_changes, :max_record_bytes, synchronous_standby: false])

    publication = Keyword.fetch!(opts, :publication)
    slot_name = Keyword.fetch!(opts, :slot_name)
    max_changes = Keyword.fetch!(opts, :max_changes)
    max_record_bytes = Keyword.fetch!(opts, :max_record_bytes)

    function =
      if Keyword.fetch!(opts, :synchronous_standby),
        do: "realtime.list_changes_sync",
        else: "realtime.list_changes"

    query(
      conn,
      """
      SELECT wal->>'type' as type,
             wal->>'schema' as schema,
             wal->>'table' as table,
             COALESCE(wal->>'columns', '[]') as columns,
             COALESCE(wal->>'record', '{}') as record,
             COALESCE(wal->>'old_record', '{}') as old_record,
             wal->>'commit_timestamp' as commit_timestamp,
             subscription_ids,
             errors,
             slot_changes_count
      FROM #{function}($1, $2, $3, $4)
      """,
      [publication, slot_name, max_changes, max_record_bytes],
      cache_statement: String.replace(function, ".", "_")
    )
  end
end
