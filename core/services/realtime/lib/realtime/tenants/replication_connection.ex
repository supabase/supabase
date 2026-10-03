defmodule Realtime.Tenants.ReplicationConnection do
  @moduledoc """
  ReplicationConnection it's the module that provides a way to stream data from a PostgreSQL database using logical replication.
  """
  use Postgrex.ReplicationConnection
  use Realtime.Logs

  import Realtime.Adapters.Postgres.Protocol
  import Realtime.Adapters.Postgres.Decoder

  alias Realtime.Adapters.Postgres.Decoder
  alias Realtime.Adapters.Postgres.Protocol.KeepAlive
  alias Realtime.Adapters.Postgres.Protocol.Write
  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Telemetry
  alias Realtime.Tenants
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection.Watchdog
  alias RealtimeWeb.RealtimeChannel
  alias RealtimeWeb.Socket.UserBroadcast
  alias RealtimeWeb.TenantBroadcaster

  @default_query_timeout :timer.minutes(4)

  @typedoc """
  * `tenant_id` - The tenant this connection replicates for.
  * `opts` - Reserved, defaults to `[]`.
  * `step` - The current step of the replication process.
  * `publication_name` - The name of the publication to create. Defaults to `"supabase_\#{schema}_\#{table}_publication"` if not provided.
  * `replication_slot_name` - The name of the replication slot to create. Defaults to `"supabase_\#{schema}_\#{table}_replication_slot_\#{slot_suffix()}"` if not provided.
  * `output_plugin` - The output plugin to use. Default is `pgoutput`.
  * `proto_version` - The protocol version to use. Default is `2`.
  * `relations` - Cache of decoded relation (table) metadata, keyed by relation id, populated as `Relation` messages stream in.
  * `buffer` - Reserved, defaults to `[]`.
  * `monitored_pid` - The process this connection is linked to; the connection stops when it dies.
  * `latency_committed_at` - Timestamp of the last commit, used to compute broadcast latency.
  * `query_timeout` - Timeout for queries run during the replication setup steps.
  * `pg_version` - Major Postgres version of the tenant database, read on connect.
  """
  @type t :: %__MODULE__{
          tenant_id: String.t(),
          opts: Keyword.t(),
          step:
            :disconnected
            | :check_pg_version
            | :check_replication_slot
            | :create_publication
            | :validate_publication
            | :create_replication_slot
            | :start_replication_slot
            | :streaming,
          publication_name: String.t(),
          replication_slot_name: String.t(),
          output_plugin: String.t(),
          proto_version: integer(),
          relations: map(),
          buffer: list(),
          monitored_pid: pid(),
          latency_committed_at: integer(),
          query_timeout: timeout(),
          pg_version: pos_integer() | nil
        }
  defstruct tenant_id: nil,
            opts: [],
            step: :disconnected,
            publication_name: nil,
            replication_slot_name: nil,
            output_plugin: "pgoutput",
            proto_version: 2,
            relations: %{},
            buffer: [],
            monitored_pid: nil,
            latency_committed_at: nil,
            query_timeout: @default_query_timeout,
            pg_version: nil

  @schema "realtime"
  @table "messages"
  @row_filter "(NOT skip_broadcast)"

  @doc """
  Starts the replication connection for a tenant and monitors a given pid to stop the ReplicationConnection.
  """
  @spec start(Realtime.Api.Tenant.t(), pid(), query_timeout :: timeout) :: {:ok, pid()} | {:error, any()}
  def start(tenant, monitored_pid, query_timeout \\ @default_query_timeout) do
    Logger.info("Starting replication for Broadcast Changes")
    opts = %__MODULE__{tenant_id: tenant.external_id, monitored_pid: monitored_pid, query_timeout: query_timeout}
    supervisor_spec = supervisor_spec(tenant.external_id)

    child_spec = %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
      restart: :temporary,
      type: :worker
    }

    case DynamicSupervisor.start_child(supervisor_spec, child_spec) do
      {:ok, pid} ->
        {:ok, pid}

      {:error, {:already_started, pid}} ->
        {:ok, pid}

      {:error, {:bad_return_from_init, {:stop, error, _}}} ->
        {:error, error}

      {:error, %Postgrex.Error{postgres: %{pg_code: pg_code}}} when pg_code in ~w(53300 53400) ->
        {:error, :max_wal_senders_reached}

      {:error, %DBConnection.ConnectionError{}} ->
        {:error, :replication_connection_timeout}

      error ->
        error
    end
  end

  @spec stop(String.t(), pid()) :: :ok | {:error, any()}
  def stop(tenant_id, pid), do: DynamicSupervisor.terminate_child(supervisor_spec(tenant_id), pid)

  @doc """
  Finds replication connection by tenant_id
  """
  @spec whereis(String.t()) :: pid() | nil
  def whereis(tenant_id) do
    case Registry.lookup(Realtime.Registry.Unique, {__MODULE__, tenant_id}) do
      [{pid, _}] -> pid
      [] -> nil
    end
  end

  def ready?(tenant_id) do
    RealtimeWeb.Endpoint.subscribe(Connect.syn_topic(tenant_id))
    # We do a lookup after subscribing because we could've missed a message while subscribing
    case Connect.replication_status(tenant_id) do
      {:ok, _} ->
        true

      _ ->
        # Wait for up to 5 seconds for the ready event
        receive do
          %{event: "ready", payload: %{replication_conn: conn}} when is_pid(conn) ->
            true
        after
          5_000 -> false
        end
    end
  after
    RealtimeWeb.Endpoint.unsubscribe(Connect.syn_topic(tenant_id))
  end

  @spec health_check(pid(), timeout()) :: :ok | no_return()
  def health_check(pid, timeout), do: Postgrex.ReplicationConnection.call(pid, :health_check, timeout)

  def start_link(%__MODULE__{tenant_id: tenant_id} = attrs) do
    tenant = Cache.get_tenant_by_external_id(tenant_id)

    with {:ok, db_settings} <- Database.from_tenant(tenant, "realtime_broadcast_changes", :stop) do
      connection_opts =
        [
          name: {:via, Registry, {Realtime.Registry.Unique, {__MODULE__, tenant_id}}},
          hostname: db_settings.hostname,
          username: db_settings.username,
          password: db_settings.password,
          database: db_settings.database,
          port: db_settings.port,
          socket_options: db_settings.socket_options,
          ssl: db_settings.ssl,
          sync_connect: true,
          auto_reconnect: false,
          parameters: [application_name: "realtime_replication_connection"]
        ]

      case Postgrex.ReplicationConnection.start_link(__MODULE__, attrs, connection_opts) do
        {:ok, pid} -> {:ok, pid}
        {:error, {:already_started, pid}} -> {:ok, pid}
        {:error, {:bad_return_from_init, {:stop, error}}} -> {:error, error}
        {:error, error} -> {:error, error}
      end
    end
  end

  @impl true
  def init(%__MODULE__{tenant_id: tenant_id, monitored_pid: monitored_pid} = state) do
    Process.flag(:fullsweep_after, 20)
    Logger.metadata(external_id: tenant_id, project: tenant_id)
    Process.monitor(monitored_pid)

    slot_name = replication_slot_name(@schema, @table)

    {:ok, _watchdog_pid} =
      Watchdog.start_link(
        parent_pid: self(),
        tenant_id: tenant_id,
        replication_slot_name: slot_name
      )

    state = %{
      state
      | publication_name: publication_name(@schema, @table),
        replication_slot_name: slot_name
    }

    Logger.info("Initializing connection with the status: #{inspect(state, pretty: true)}")

    {:ok, state}
  end

  @impl true
  def handle_connect(state) do
    # Postgrex.Protocol.connect/1 traps exits due to how DbConnection works
    # But ReplicationConnection does not interact with DbConnection so we don't
    # want to trap exits
    Process.flag(:trap_exit, false)
    replication_slot_name = replication_slot_name(@schema, @table)
    Logger.info("Checking if replication slot #{replication_slot_name} exists")

    query = "SELECT * FROM pg_replication_slots WHERE slot_name = '#{replication_slot_name}'"

    {:query, query, [timeout: state.query_timeout], %{state | step: :check_replication_slot}}
  end

  @impl true
  def handle_result([%Postgrex.Result{num_rows: 1}], %__MODULE__{step: :check_replication_slot} = _state) do
    Logger.info("Replication slot already exists and in use, deferring connection")
    {:disconnect, {:shutdown, :replication_slot_in_use}}
  end

  def handle_result([%Postgrex.Result{num_rows: 0}], %__MODULE__{step: :check_replication_slot} = state) do
    if FeatureFlags.enabled?("broadcast_persistence", state.tenant_id) do
      query = "SELECT current_setting('server_version_num')::int / 10000"
      {:query, query, [timeout: state.query_timeout], %{state | step: :check_pg_version}}
    else
      check_publication_exists(state)
    end
  end

  def handle_result([%Postgrex.Result{rows: [[pg_version]]}], %__MODULE__{step: :check_pg_version} = state) do
    state = %{state | pg_version: String.to_integer(pg_version)}
    check_publication_exists(state)
  end

  def handle_result([%Postgrex.Result{num_rows: 0}], %__MODULE__{step: :create_publication} = state) do
    %__MODULE__{publication_name: publication_name} = state

    Logger.info("Create publication #{publication_name} for table #{@schema}.#{@table}")

    query = create_publication_query(state)
    {:query, query, [timeout: state.query_timeout], %{state | step: :create_replication_slot}}
  end

  def handle_result([%Postgrex.Result{num_rows: 1}], %__MODULE__{step: :create_publication} = state) do
    %__MODULE__{publication_name: publication_name} = state

    Logger.info("Publication #{publication_name} exists, validating contents")

    query = validate_publication_query(state)
    {:query, query, [timeout: state.query_timeout], %{state | step: :validate_publication}}
  end

  def handle_result([%Postgrex.Result{rows: rows}], %__MODULE__{step: :validate_publication} = state) do
    %__MODULE__{publication_name: publication_name} = state

    valid_publication =
      Enum.all?(rows, fn
        [schema, table] -> valid_messages_table?(schema, table)
        [schema, table, expected_options] -> expected_options == "t" and valid_messages_table?(schema, table)
      end)

    if valid_publication and rows != [] do
      {:query, "SELECT 1", [timeout: state.query_timeout], %{state | step: :create_replication_slot}}
    else
      query = "DROP PUBLICATION IF EXISTS #{publication_name}; #{create_publication_query(state)}"

      Logger.warning("Publication #{publication_name} does not match the expected configuration. Recreating...")
      {:query, query, [timeout: state.query_timeout], %{state | step: :create_replication_slot}}
    end
  end

  def handle_result(%Postgrex.Error{postgres: %{message: message}}, %__MODULE__{step: :create_replication_slot}) do
    {:disconnect, "Error creating publication: #{message}"}
  end

  def handle_result(%Postgrex.Error{message: message}, %__MODULE__{step: :create_replication_slot}) do
    {:disconnect, "Error creating publication: #{message}"}
  end

  def handle_result(results, %__MODULE__{step: :create_replication_slot} = state) do
    %__MODULE__{
      output_plugin: output_plugin,
      replication_slot_name: replication_slot_name
    } = state

    case Enum.find(results, &match?(%Postgrex.Error{}, &1)) do
      %Postgrex.Error{} = error ->
        {:disconnect, "Error creating publication: #{error.message}"}

      nil ->
        Logger.info("Create replication slot #{replication_slot_name} using plugin #{output_plugin}")

        query = "CREATE_REPLICATION_SLOT #{replication_slot_name} TEMPORARY LOGICAL #{output_plugin} NOEXPORT_SNAPSHOT"

        {:query, query, [timeout: state.query_timeout], %{state | step: :start_replication_slot}}
    end
  end

  def handle_result(%Postgrex.Error{postgres: %{pg_code: pg_code}}, %__MODULE__{step: :start_replication_slot})
      when pg_code in ~w(53300 53400) do
    {:disconnect, :max_wal_senders_reached}
  end

  def handle_result(%Postgrex.Error{postgres: %{message: message}}, %__MODULE__{step: :start_replication_slot} = _state) do
    {:disconnect, "Error starting replication: #{message}"}
  end

  def handle_result(%Postgrex.Error{message: message}, %__MODULE__{step: :start_replication_slot} = _state) do
    {:disconnect, "Error starting replication: #{message}"}
  end

  def handle_result(results, %__MODULE__{step: :start_replication_slot} = state) do
    error = Enum.find(results, fn res -> match?(%Postgrex.Error{}, res) end)

    if error do
      {:disconnect, "Error starting replication: #{error.message}"}
    else
      %__MODULE__{
        proto_version: proto_version,
        replication_slot_name: replication_slot_name,
        publication_name: publication_name
      } = state

      Logger.info(
        "#{inspect(self())} Starting stream replication for slot #{replication_slot_name} using publication #{publication_name} and protocol version #{proto_version}"
      )

      query =
        "START_REPLICATION SLOT #{replication_slot_name} LOGICAL 0/0 (proto_version '#{proto_version}', publication_names '#{publication_name}', binary 'true')"

      {:stream, query, [], %{state | step: :streaming}}
    end
  end

  def handle_result(%Postgrex.Error{postgres: %{pg_code: pg_code}}, _state) when pg_code in ~w(53300 53400) do
    {:disconnect, :max_wal_senders_reached}
  end

  def handle_result(%Postgrex.Error{postgres: %{message: message}}, _state) do
    {:disconnect, "Error starting replication: #{message}"}
  end

  @impl true
  def handle_data(data, state) when is_keep_alive(data) do
    %KeepAlive{reply: reply, wal_end: wal_end} = parse(data)
    wal_end = wal_end + 1

    message = standby_status(wal_end, wal_end, wal_end, reply)

    {:noreply, message, state}
  end

  def handle_data(data, state) when is_write(data) do
    %Write{message: message} = parse(data)
    message |> decode_message(state.relations) |> then(&handle_message(&1, state))
  end

  def handle_data(e, state) do
    log_error("UnexpectedMessageReceived", e)
    {:noreply, [], state}
  end

  @impl true
  def handle_call(:health_check, from, state) do
    Postgrex.ReplicationConnection.reply(from, :ok)
    {:noreply, state}
  end

  @impl true

  def handle_info({:DOWN, _, :process, _, _}, _), do: {:disconnect, :shutdown}
  def handle_info(_, state), do: {:noreply, state}

  defp handle_message(%Decoder.Messages.Begin{commit_timestamp: commit_timestamp}, state) do
    latency_committed_at = NaiveDateTime.utc_now() |> NaiveDateTime.diff(commit_timestamp, :millisecond)
    {:noreply, %{state | latency_committed_at: latency_committed_at}}
  end

  defp handle_message(%Decoder.Messages.Relation{} = msg, state) do
    %Decoder.Messages.Relation{id: id, namespace: namespace, name: name, columns: columns} = msg
    # Only care about relations with namespace=realtime and name starting with messages
    if namespace == @schema and String.starts_with?(name, @table) do
      %{relations: relations} = state
      relation = %{name: name, columns: columns, namespace: namespace}
      relations = Map.put(relations, id, relation)
      {:noreply, %{state | relations: relations}}
    else
      Logger.warning("Unexpected relation on schema '#{namespace}' and table '#{name}'")
      {:noreply, state}
    end
  rescue
    e ->
      log_error("UnableToBroadcastChanges", e)
      {:noreply, state}
  catch
    e ->
      log_error("UnableToBroadcastChanges", e)
      {:noreply, state}
  end

  defp handle_message(%Decoder.Messages.Insert{} = msg, state) do
    %Decoder.Messages.Insert{relation_id: relation_id, tuple_data: tuple_data} = msg
    %{relations: relations, tenant_id: tenant_id, latency_committed_at: latency_committed_at} = state

    with %{columns: columns} <- Map.get(relations, relation_id),
         to_broadcast = tuple_to_map(tuple_data, columns),
         :ok <- check_should_broadcast(to_broadcast),
         {:ok, inserted_at} <- get_or_error(to_broadcast, "inserted_at", :inserted_at_missing),
         {:ok, event} <- get_or_error(to_broadcast, "event", :event_missing),
         {:ok, id} <- get_or_error(to_broadcast, "id", :id_missing),
         {:ok, topic} <- get_or_error(to_broadcast, "topic", :topic_missing),
         {:ok, private} <- get_or_error(to_broadcast, "private", :private_missing),
         {:ok, encoding, body} <- pick_payload(to_broadcast),
         %Tenant{} = tenant <- Cache.get_tenant_by_external_id(tenant_id),
         :ok <- Tenants.validate_payload_size(tenant, body),
         events_per_second_rate = Tenants.events_per_second_rate(tenant),
         :ok <- check_rate_limit(events_per_second_rate) do
      tenant_topic = Tenants.tenant_topic(tenant, topic, not private)

      broadcast = %UserBroadcast{
        topic: tenant_topic,
        user_event: event,
        user_payload: body,
        user_payload_encoding: encoding,
        metadata: %{"id" => id}
      }

      GenCounter.add(events_per_second_rate.id)

      TenantBroadcaster.pubsub_broadcast(
        tenant.external_id,
        tenant_topic,
        broadcast,
        RealtimeChannel.MessageDispatcher,
        :broadcast
      )

      latency_inserted_at = NaiveDateTime.utc_now(:microsecond) |> NaiveDateTime.diff(inserted_at, :microsecond)

      Telemetry.execute(
        [:realtime, :tenants, :broadcast_from_database],
        %{latency_committed_at: latency_committed_at, latency_inserted_at: latency_inserted_at},
        %{tenant: tenant_id}
      )

      {:noreply, state}
    else
      {:error, :skip_broadcast} ->
        {:noreply, state}

      {:error, error} ->
        log_error("UnableToBroadcastChanges", error)
        {:noreply, state}

      _ ->
        {:noreply, state}
    end
  rescue
    e ->
      log_error("UnableToBroadcastChanges", e)
      {:noreply, state}
  catch
    e ->
      log_error("UnableToBroadcastChanges", e)
      {:noreply, state}
  end

  defp handle_message(_, state), do: {:noreply, state}

  @impl true
  def handle_disconnect(state) do
    Logger.info("Disconnecting broadcast changes handler in the step : #{inspect(state.step)}")
    {:noreply, %{state | step: :disconnected}}
  end

  defp supervisor_spec(tenant_id) do
    {:via, PartitionSupervisor, {__MODULE__.DynamicSupervisor, tenant_id}}
  end

  def publication_name(schema, table) do
    "supabase_#{schema}_#{table}_publication"
  end

  defp row_filter?(%__MODULE__{pg_version: pg_version}),
    do: is_integer(pg_version) and pg_version >= 15

  defp valid_messages_table?(schema, table),
    do: schema == @schema and (table == @table or String.starts_with?(table, "#{@table}_"))

  defp check_publication_exists(%__MODULE__{publication_name: publication_name} = state) do
    Logger.info("Check publication #{publication_name} for table #{@schema}.#{@table} exists")
    query = "SELECT * FROM pg_publication WHERE pubname = '#{publication_name}'"

    {:query, query, [timeout: state.query_timeout], %{state | step: :create_publication}}
  end

  defp create_publication_query(%__MODULE__{publication_name: publication_name} = state) do
    if FeatureFlags.enabled?("broadcast_persistence", state.tenant_id) do
      row_filter = if row_filter?(state), do: " WHERE #{@row_filter}", else: ""

      "CREATE PUBLICATION #{publication_name} FOR TABLE #{@schema}.#{@table}#{row_filter} WITH (publish = 'insert', publish_via_partition_root = true)"
    else
      "CREATE PUBLICATION #{publication_name} FOR TABLE #{@schema}.#{@table}"
    end
  end

  defp validate_publication_query(%__MODULE__{publication_name: publication_name} = state) do
    if FeatureFlags.enabled?("broadcast_persistence", state.tenant_id) do
      row_filter = if row_filter?(state), do: " AND t.rowfilter = '#{@row_filter}'", else: ""

      """
        SELECT t.schemaname,
               t.tablename,
               p.pubinsert AND NOT p.pubupdate AND NOT p.pubdelete AND NOT p.pubtruncate AND p.pubviaroot#{row_filter}
        FROM pg_publication_tables t
        JOIN pg_publication p ON p.pubname = t.pubname
        WHERE t.pubname = '#{publication_name}'
      """
    else
      """
        SELECT schemaname, tablename
        FROM pg_publication_tables
        WHERE pubname = '#{publication_name}'
      """
    end
  end

  def replication_slot_name(schema, table) do
    "supabase_#{schema}_#{table}_replication_slot_#{slot_suffix()}"
  end

  defp slot_suffix, do: Application.get_env(:realtime, :slot_name_suffix)

  defp tuple_to_map(tuple_data, columns) do
    tuple_data
    |> Tuple.to_list()
    |> Enum.zip(columns)
    |> Map.new(fn
      {nil, %{name: name}} -> {name, nil}
      {value, %{name: name, type: "bool"}} -> {name, value}
      {value, %{name: name}} -> {name, value}
    end)
  end

  defp check_rate_limit(events_per_second_rate) do
    case RateCounter.get(events_per_second_rate) do
      {:ok, %{limit: %{triggered: true}}} -> {:error, :too_many_requests}
      _ -> :ok
    end
  end

  defp check_should_broadcast(%{"skip_broadcast" => true}), do: {:error, :skip_broadcast}
  defp check_should_broadcast(_), do: :ok

  defp get_or_error(map, key, error_type) do
    case Map.get(map, key) do
      nil -> {:error, error_type}
      value -> {:ok, value}
    end
  end

  defp pick_payload(%{"binary_payload" => bin}) when is_binary(bin), do: {:ok, :binary, bin}
  defp pick_payload(%{"payload" => json}) when is_binary(json), do: {:ok, :json, json}
  defp pick_payload(_), do: {:error, :payload_missing}
end
