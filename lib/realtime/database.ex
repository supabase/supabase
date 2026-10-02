defmodule Realtime.Database do
  @moduledoc """
  Handles tenant database operations
  """
  use Realtime.Logs

  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.PostgresCdc
  alias Realtime.Rpc
  alias Realtime.Telemetry

  defstruct [
    :hostname,
    :port,
    :database,
    :username,
    :password,
    :pool_size,
    :queue_target,
    :application_name,
    :max_restarts,
    :socket_options,
    ssl: true,
    backoff_type: :rand_exp
  ]

  @type t :: %__MODULE__{
          hostname: binary(),
          database: binary(),
          username: binary(),
          password: binary(),
          port: non_neg_integer(),
          pool_size: non_neg_integer(),
          queue_target: non_neg_integer(),
          application_name: binary(),
          max_restarts: non_neg_integer() | nil,
          ssl: boolean(),
          socket_options: list(),
          backoff_type: :stop | :exp | :rand | :rand_exp
        }

  @cdc "postgres_cdc_rls"
  @doc """
  Creates a database connection struct from the given tenant.
  """
  @spec from_tenant(Tenant.t(), binary(), :stop | :exp | :rand | :rand_exp) :: {:ok, t()} | {:error, :nxdomain}
  def from_tenant(%Tenant{} = tenant, application_name, backoff \\ :rand_exp) do
    tenant
    |> then(&Realtime.PostgresCdc.filter_settings(@cdc, &1.extensions))
    |> then(&from_settings(&1, application_name, backoff))
  end

  @encrypted_keys ~w(db_host db_port db_name db_user db_password)

  @doc """
  Decrypts the credential fields in a tenant's stored settings.
  """
  @spec decrypt_settings(map()) :: map()
  def decrypt_settings(settings) do
    decrypted_settings =
      settings
      |> Map.take(@encrypted_keys)
      |> Map.new(fn {k, v} -> {k, Crypto.decrypt!(v)} end)

    Map.merge(settings, decrypted_settings)
  end

  @doc """
  Creates a database connection struct from a tenant's stored settings.
  """
  @spec from_settings(map(), binary(), :stop | :exp | :rand | :rand_exp) :: {:ok, t()} | {:error, :nxdomain}
  def from_settings(settings, application_name, backoff \\ :rand_exp) do
    settings
    |> decrypt_settings()
    |> from_plaintext_settings(application_name, backoff)
  end

  @doc """
  Same as `from_settings/3`, for settings whose credentials are already plaintext.
  """
  @spec from_plaintext_settings(map(), binary(), :stop | :exp | :rand | :rand_exp) ::
          {:ok, t()} | {:error, :nxdomain}
  def from_plaintext_settings(settings, application_name, backoff \\ :rand_exp) do
    pool = pool_size_by_application_name(application_name, settings)

    with {:ok, addrtype} <- detect_ip_version(settings["db_host"]) do
      ssl = if default_ssl_param(settings), do: [verify: :verify_none], else: false

      {:ok,
       %__MODULE__{
         hostname: settings["db_host"],
         port: String.to_integer(settings["db_port"]),
         database: settings["db_name"],
         username: settings["db_user"],
         password: settings["db_password"],
         pool_size: pool,
         queue_target: settings["db_queue_target"] || 5_000,
         application_name: application_name,
         backoff_type: backoff,
         socket_options: [addrtype],
         ssl: ssl
       }}
    end
  end

  @available_connection_factor 0.95

  @doc """
  Checks if the Tenant CDC extension information is properly configured and that we're able to query against the tenant database.

  Connectivity and readiness are validated with a short-lived probe pool of a
  single connection using `backoff_type: :stop` and `max_restarts: 0`, so we get
  instant feedback when the database is unreachable. Once validated, the probe is
  torn down and the durable pool that Connect keeps around is started with
  `backoff_type: :rand_exp`, so a momentary blip reconnects instead of crashing the pool.

  `connection_listeners` is forwarded to the durable pool (see DBConnection's
  `:connection_listeners`) so the caller receives `{:connected, pid, tag}` /
  `{:disconnected, pid, tag}` messages as the pool's connections come and go. The
  probe never carries listeners.
  """
  @spec check_tenant_connection(Tenant.t() | nil, [pid()] | {[pid()], term()}) ::
          {:error, atom()} | {:ok, pid(), non_neg_integer()}
  def check_tenant_connection(tenant, connection_listeners \\ [])
  def check_tenant_connection(nil, _connection_listeners), do: {:error, :tenant_not_found}

  def check_tenant_connection(tenant, connection_listeners) do
    tenant
    |> then(&PostgresCdc.filter_settings(@cdc, &1.extensions))
    |> then(fn settings ->
      required_pool = tenant_pool_requirements(settings)

      with {:ok, probe_settings} <- from_settings(settings, "realtime_connect_probe", :stop),
           {:ok, probe_conn} <- connect_db(%{probe_settings | max_restarts: 0}),
           {:ok, [available_connections, migrations_ran]} <- query_connection_info(probe_conn),
           GenServer.stop(probe_conn),
           {:ok, settings} <- from_settings(settings, "realtime_connect", :rand_exp) do
        requirement = ceil(required_pool * @available_connection_factor)

        if requirement < available_connections do
          connect_durable_pool(settings, migrations_ran, connection_listeners)
        else
          msg = "Only #{available_connections} available connections. At least #{requirement} connections are required."
          log_error("DatabaseLackOfConnections", msg)
          {:error, :tenant_db_too_many_connections}
        end
      else
        {:error, e} ->
          log_error("UnableToConnectToTenantDatabase", e)
          {:error, e}
      end
    end)
  end

  # Starts the durable pool Connect holds onto. `:rand_exp` backoff lets each
  # connection ride out momentary blips by reconnecting on its own.
  defp connect_durable_pool(settings, migrations_ran, connection_listeners) do
    case connect_db(settings, connection_listeners: connection_listeners) do
      {:ok, conn} ->
        {:ok, conn, migrations_ran}

      {:error, e} ->
        log_error("UnableToConnectToTenantDatabase", e)
        {:error, e}
    end
  end

  @migrations_table_exists_query """
  SELECT to_regclass('realtime.schema_migrations') IS NOT NULL
  """

  @migrations_count_query """
  SELECT count(*)::int FROM realtime.schema_migrations
  """

  # Client backends are the only ones holding a max_connections slot
  @connections_query """
  SELECT GREATEST(current_setting('max_connections')::int - count(*), 0)::int
  FROM pg_stat_activity
  WHERE backend_type = 'client backend'
    AND application_name NOT IN ('realtime_connect', 'realtime_connect_probe')
  """

  defp query_connection_info(conn) do
    %{rows: [[available_connections]]} = Postgrex.query!(conn, @connections_query, [])
    %{rows: [[table_exists]]} = Postgrex.query!(conn, @migrations_table_exists_query, [])

    %{rows: [[migrations_ran]]} =
      if table_exists, do: Postgrex.query!(conn, @migrations_count_query, []), else: %{rows: [[0]]}

    {:ok, [available_connections, migrations_ran]}
  rescue
    e ->
      GenServer.stop(conn)
      {:error, e}
  end

  @slot_check_query """
  SELECT
    active,
    CASE
      WHEN current_setting('max_slot_wal_keep_size') = '-1' THEN false
      ELSE COALESCE(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn), 0) >
        (pg_size_bytes(current_setting('max_slot_wal_keep_size')) / 2)
    END
  FROM pg_replication_slots
  WHERE slot_name = $1
  """

  @doc """
  Checks the health of a replication slot in a single query.

  It verifies that the slot exists, that its WAL lag does not exceed 50% of
  max_slot_wal_keep_size, and that it is actively being consumed. The lag check is a no-op
  when max_slot_wal_keep_size is disabled with -1, as there is no per-slot threshold to
  enforce.

  Errors are reported from most to least severe: an excessive WAL lag (a disk risk that
  applies whether or not the slot is active) takes precedence over the slot merely being
  inactive.

  Returns:
    * `:ok` - the slot exists, is active, and is within safe WAL bounds
    * `{:error, :slot_not_found}` - the slot no longer exists
    * `{:error, :lag_too_high}` - the slot is consuming more than 50% of the per-slot WAL limit
    * `{:error, :slot_inactive}` - the slot exists and is within WAL bounds but is not being consumed
    * `{:error, reason}` - the check itself failed
  """
  @spec check_replication_slot(pid(), String.t()) ::
          :ok | {:error, :slot_not_found | :slot_inactive | :lag_too_high | any()}
  def check_replication_slot(conn, slot_name) do
    case Postgrex.query(conn, @slot_check_query, [slot_name]) do
      {:ok, %{rows: []}} -> {:error, :slot_not_found}
      {:ok, %{rows: [[_active, true]]}} -> {:error, :lag_too_high}
      {:ok, %{rows: [[false, false]]}} -> {:error, :slot_inactive}
      {:ok, %{rows: [[true, false]]}} -> :ok
      {:error, _} = err -> err
    end
  end

  @doc """
  Reports whether the database has the OrioleDB extension.
  """
  @spec orioledb(pid()) :: {:ok, boolean()} | {:error, any()}
  def orioledb(conn) do
    case Postgrex.query(conn, "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'orioledb')", []) do
      {:ok, %Postgrex.Result{rows: [[orioledb]]}} -> {:ok, orioledb}
      {:error, _} = err -> err
    end
  end

  @doc """
  Connects to the database using the given settings.
  """
  @spec connect(Tenant.t(), binary(), :stop | :exp | :rand | :rand_exp) ::
          {:ok, pid()} | {:error, any()}
  def connect(tenant, application_name, backoff \\ :stop) do
    with {:ok, settings} <- from_tenant(tenant, application_name, backoff) do
      connect_db(settings)
    end
  end

  @doc """
  If the param `ssl_enforced` is not set, it defaults to true.
  """
  @spec default_ssl_param(map) :: boolean
  def default_ssl_param(%{"ssl_enforced" => ssl_enforced}) when is_boolean(ssl_enforced),
    do: ssl_enforced

  def default_ssl_param(_), do: true

  @doc """
  Runs database transaction in local node or against a target node withing a Postgrex transaction
  """
  @spec transaction(pid | DBConnection.t(), fun(), keyword(), keyword()) :: {:ok, any()} | {:error, any()}
  def transaction(db_conn, func, opts \\ [], metadata \\ [])

  def transaction(%DBConnection{} = db_conn, func, opts, metadata),
    do: transaction_catched(db_conn, func, opts, metadata)

  def transaction(db_conn, func, opts, metadata) when node() == node(db_conn),
    do: transaction_catched(db_conn, func, opts, metadata)

  def transaction(db_conn, func, opts, metadata) do
    metadata = Keyword.put(metadata, :target, node(db_conn))
    args = [db_conn, func, opts, metadata]

    case Rpc.enhanced_call(node(db_conn), __MODULE__, :transaction, args, metadata) do
      {:ok, value} -> {:ok, value}
      {:error, :rpc_error, error} -> {:error, error}
      {:error, error} -> {:error, error}
    end
  end

  defp transaction_catched(db_conn, func, opts, metadata) do
    telemetry = Keyword.get(opts, :telemetry, nil)

    if telemetry do
      tenant_id = Keyword.get(opts, :tenant_id, nil)
      {latency, value} = :timer.tc(Postgrex, :transaction, [db_conn, func, opts], :millisecond)
      Telemetry.execute(telemetry, %{latency: latency}, %{tenant: tenant_id})
      value
    else
      Postgrex.transaction(db_conn, func, opts)
    end
  rescue
    e ->
      log_error("ErrorExecutingTransaction", e, metadata)
      {:error, e}
  catch
    :exit, reason ->
      log_error("ErrorExecutingTransaction", reason, metadata)
      {:error, {:exit, reason}}
  end

  @spec connect_db(__MODULE__.t(), keyword()) :: {:ok, pid()} | {:error, any()}
  def connect_db(%__MODULE__{} = settings, extra_opts \\ []) do
    %__MODULE__{
      hostname: hostname,
      port: port,
      database: database,
      username: username,
      password: password,
      pool_size: pool_size,
      queue_target: queue_target,
      application_name: application_name,
      backoff_type: backoff_type,
      max_restarts: max_restarts,
      socket_options: socket_options,
      ssl: ssl
    } = settings

    metadata = Logger.metadata()

    [
      hostname: hostname,
      port: port,
      database: database,
      username: username,
      password: password,
      pool_size: pool_size,
      queue_target: queue_target,
      parameters: [application_name: application_name],
      socket_options: socket_options,
      backoff_type: backoff_type,
      ssl: ssl,
      configure: fn args ->
        metadata
        |> Keyword.put(:application_name, application_name)
        |> Logger.metadata()

        args
      end
    ]
    |> then(fn opts ->
      if max_restarts, do: Keyword.put(opts, :max_restarts, max_restarts), else: opts
    end)
    |> Keyword.merge(extra_opts)
    |> Postgrex.start_link()
  end

  @doc """
  Returns the pool size for a given application name. Override pool size if provided.

  `realtime_rls` and `realtime_broadcast_changes` will be handled as a special scenario as it will need to be hardcoded as 1 otherwise replication slots will be tried to be reused leading to errors
  `realtime_migrations` will be handled as a special scenario as it requires 2 connections.
  """
  @spec pool_size_by_application_name(binary(), map() | nil) :: non_neg_integer()
  def pool_size_by_application_name(application_name, settings) do
    case application_name do
      "realtime_subscription_manager" -> 1
      "realtime_subscription_manager_pub" -> settings["subs_pool_size"] || 1
      "realtime_connect" -> settings["db_pool"] || 1
      "realtime_connect_probe" -> 1
      "realtime_health_check" -> 1
      "realtime_janitor" -> 1
      "realtime_migrations" -> 2
      "realtime_broadcast_changes" -> 1
      "realtime_rls" -> 1
      "realtime_replication_slot_teardown" -> 1
      _ -> 1
    end
  end

  @doc """
  Gets the external id from a host connection string found in the conn.
  """
  @spec get_external_id(String.t()) :: {:ok, String.t()} | {:error, atom()}
  def get_external_id(host) when is_binary(host) do
    case String.split(host, ".", parts: 2) do
      [id] -> {:ok, id}
      [id, _] -> {:ok, id}
    end
  end

  @doc """
  Detects the IP version for a given host.
  """
  @spec detect_ip_version(String.t()) :: {:ok, :inet | :inet6} | {:error, :nxdomain}
  def detect_ip_version(host) when is_binary(host) do
    host = String.to_charlist(host)

    if match?({:ok, _}, :inet6_tcp.getaddr(host)) do
      {:ok, :inet6}
    else
      case :inet.gethostbyname(host) do
        {:ok, _} ->
          log_warning("DatabaseIpVersionIsIpv4", "Tenant database host #{host} resolved to an IPv4 address")
          {:ok, :inet}

        _ ->
          {:error, :nxdomain}
      end
    end
  end

  @doc """
  Terminates all replication slots with the name containing 'realtime' in the tenant database.
  """
  @spec replication_slot_teardown(Tenant.t()) :: :ok
  def replication_slot_teardown(tenant) do
    {:ok, conn} = connect(tenant, "realtime_replication_slot_teardown")

    query =
      "select slot_name from pg_replication_slots where slot_name like '%realtime%'"

    with {:ok, %{rows: rows}} <- Postgrex.query(conn, query, []) do
      rows
      |> List.flatten()
      |> Enum.reject(&is_nil/1)
      |> Enum.each(&replication_slot_teardown(conn, &1))
    end

    GenServer.stop(conn)
    :ok
  end

  @doc """
  Terminates replication slot with a given name in the tenant database.
  """
  @spec replication_slot_teardown(pid() | Tenant.t(), String.t()) :: :ok
  def replication_slot_teardown(%Tenant{} = tenant, slot_name) do
    {:ok, conn} = connect(tenant, "realtime_replication_slot_teardown")
    replication_slot_teardown(conn, slot_name)
    :ok
  end

  def replication_slot_teardown(conn, slot_name) do
    Postgrex.query(
      conn,
      "select active_pid, pg_terminate_backend(active_pid), pg_drop_replication_slot(slot_name) from pg_replication_slots where slot_name = $1",
      [slot_name]
    )

    Postgrex.query(conn, "select pg_drop_replication_slot($1)", [slot_name])
    :ok
  end

  @doc """
  Transforms database settings into keyword list to be used by Postgrex.
  ## Examples

  iex> Database.opts(%Database{hostname: "localhost", port: 5432, database: "realtime", username: "postgres", password: "postgres", application_name: "test", backoff_type: :stop, pool_size: 10, queue_target: 10_000, socket_options: [:inet], ssl: true}) |> Enum.sort()
  [
    application_name: "test",
    backoff_type: :stop,
    database: "realtime",
    hostname: "localhost",
    max_restarts: nil,
    password: "postgres",
    pool_size: 10,
    port: 5432,
    queue_target: 10000,
    socket_options: [:inet],
    ssl: true,
    username: "postgres"
  ]
  """

  @spec opts(__MODULE__.t()) :: keyword()
  def opts(%__MODULE__{} = settings) do
    settings
    |> Map.from_struct()
    |> Map.to_list()
    |> Keyword.new()
  end

  defp tenant_pool_requirements(settings) do
    application_names = [
      "realtime_subscription_manager",
      "realtime_subscription_manager_pub",
      "realtime_health_check",
      "realtime_janitor",
      "realtime_migrations",
      "realtime_broadcast_changes",
      "realtime_rls",
      "realtime_replication_slot_teardown",
      "realtime_connect"
    ]

    Enum.reduce(application_names, 0, fn application_name, acc ->
      acc + pool_size_by_application_name(application_name, settings)
    end)
  end
end
