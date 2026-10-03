defmodule Realtime.Tenants.Migrations do
  @moduledoc """
  Manage Tenant's database migrations.
  """

  use GenServer, restart: :transient
  use Realtime.Logs

  alias Realtime.Database
  alias Realtime.Registry.Unique
  alias Realtime.Repo
  alias Realtime.Api.Tenant
  alias Realtime.Api
  alias Realtime.Nodes
  alias Realtime.GenRpc
  alias Realtime.Telemetry

  alias Realtime.Tenants.Migrations

  @migrations [
    {20_211_116_024_918, Migrations.CreateRealtimeSubscriptionTable},
    {20_211_116_045_059, Migrations.CreateRealtimeCheckFiltersTrigger},
    {20_211_116_050_929, Migrations.CreateRealtimeQuoteWal2jsonFunction},
    {20_211_116_051_442, Migrations.CreateRealtimeCheckEqualityOpFunction},
    {20_211_116_212_300, Migrations.CreateRealtimeBuildPreparedStatementSqlFunction},
    {20_211_116_213_355, Migrations.CreateRealtimeCastFunction},
    {20_211_116_213_934, Migrations.CreateRealtimeIsVisibleThroughFiltersFunction},
    {20_211_116_214_523, Migrations.CreateRealtimeApplyRlsFunction},
    {20_211_122_062_447, Migrations.GrantRealtimeUsageToAuthenticatedRole},
    {20_211_124_070_109, Migrations.EnableRealtimeApplyRlsFunctionPostgrest9Compatibility},
    {20_211_202_204_204, Migrations.UpdateRealtimeSubscriptionCheckFiltersFunctionSecurity},
    {20_211_202_204_605, Migrations.UpdateRealtimeBuildPreparedStatementSqlFunctionForCompatibilityWithAllTypes},
    {20_211_210_212_804, Migrations.EnableGenericSubscriptionClaims},
    {20_211_228_014_915, Migrations.AddWalPayloadOnErrorsInApplyRlsFunction},
    {20_220_107_221_237, Migrations.UpdateChangeTimestampToIso8601ZuluFormat},
    {20_220_228_202_821, Migrations.UpdateSubscriptionCheckFiltersFunctionDynamicTableName},
    {20_220_312_004_840, Migrations.UpdateApplyRlsFunctionToApplyIso8601},
    {20_220_603_231_003, Migrations.AddQuotedRegtypesSupport},
    {20_220_603_232_444, Migrations.AddOutputForDataLessThanEqual64BytesWhenPayloadTooLarge},
    {20_220_615_214_548, Migrations.AddQuotedRegtypesBackwardCompatibilitySupport},
    {20_220_712_093_339, Migrations.RecreateRealtimeBuildPreparedStatementSqlFunction},
    {20_220_908_172_859, Migrations.NullPassesFiltersRecreateIsVisibleThroughFilters},
    {20_220_916_233_421, Migrations.UpdateApplyRlsFunctionToPassThroughDeleteEventsOnFilter},
    {20_230_119_133_233, Migrations.MillisecondPrecisionForWalrus},
    {20_230_128_025_114, Migrations.AddInOpToFilters},
    {20_230_128_025_212, Migrations.EnableFilteringOnDeleteRecord},
    {20_230_227_211_149, Migrations.UpdateSubscriptionCheckFiltersForInFilterNonTextTypes},
    {20_230_228_184_745, Migrations.ConvertCommitTimestampToUtc},
    {20_230_308_225_145, Migrations.OutputFullRecordWhenUnchangedToast},
    {20_230_328_144_023, Migrations.CreateListChangesFunction},
    {20_231_018_144_023, Migrations.CreateChannels},
    {20_231_204_144_023, Migrations.SetRequiredGrants},
    {20_231_204_144_024, Migrations.CreateRlsHelperFunctions},
    {20_231_204_144_025, Migrations.EnableChannelsRls},
    {20_240_108_234_812, Migrations.AddChannelsColumnForWriteCheck},
    {20_240_109_165_339, Migrations.AddUpdateGrantToChannels},
    {20_240_227_174_441, Migrations.AddBroadcastsPoliciesTable},
    {20_240_311_171_622, Migrations.AddInsertAndDeleteGrantToChannels},
    {20_240_321_100_241, Migrations.AddPresencesPoliciesTable},
    {20_240_401_105_812, Migrations.CreateRealtimeAdminAndMoveOwnership},
    {20_240_418_121_054, Migrations.RemoveCheckColumns},
    {20_240_523_004_032, Migrations.RedefineAuthorizationTables},
    {20_240_618_124_746, Migrations.FixWalrusRoleHandling},
    {20_240_801_235_015, Migrations.UnloggedMessagesTable},
    {20_240_805_133_720, Migrations.LoggedMessagesTable},
    {20_240_827_160_934, Migrations.FilterDeletePostgresChanges},
    {20_240_919_163_303, Migrations.AddPayloadToMessages},
    {20_240_919_163_305, Migrations.ChangeMessagesIdType},
    {20_241_019_105_805, Migrations.UuidAutoGeneration},
    {20_241_030_150_047, Migrations.MessagesPartitioning},
    {20_241_108_114_728, Migrations.MessagesUsingUuid},
    {20_241_121_104_152, Migrations.FixSendFunction},
    {20_241_130_184_212, Migrations.RecreateEntityIndexUsingBtree},
    {20_241_220_035_512, Migrations.FixSendFunctionPartitionCreation},
    {20_241_220_123_912, Migrations.RealtimeSendHandleExceptionsRemovePartitionCreation},
    {20_241_224_161_212, Migrations.RealtimeSendSetsConfig},
    {20_250_107_150_512, Migrations.RealtimeSubscriptionUnlogged},
    {20_250_110_162_412, Migrations.RealtimeSubscriptionLogged},
    {20_250_123_174_212, Migrations.RemoveUnusedPublications},
    {20_250_128_220_012, Migrations.RealtimeSendSetsTopicConfig},
    {20_250_506_224_012, Migrations.SubscriptionIndexBridgingDisabled},
    {20_250_523_164_012, Migrations.RunSubscriptionIndexBridgingDisabled},
    {20_250_714_121_412, Migrations.BroadcastSendErrorLogging},
    {20_250_905_041_441, Migrations.CreateMessagesReplayIndex},
    {20_251_103_001_201, Migrations.BroadcastSendIncludePayloadId},
    {20_251_120_212_548, Migrations.AddActionToSubscriptions},
    {20_251_120_215_549, Migrations.FilterActionPostgresChanges},
    {20_260_218_120_000, Migrations.FixByteaDoubleEncodingInCast},
    {20_260_326_120_000, Migrations.ListChangesWithSlotCount},
    {20_260_514_120_000, Migrations.AddBinaryPayloadToMessages},
    {20_260_527_120_000, Migrations.AddSelectColumnsToSubscriptions},
    {20_260_528_120_000, Migrations.Wal2jsonEscapeSpecialChars},
    {20_260_603_120_000, Migrations.AddSendBinaryFunction},
    {20_260_605_120_000, Migrations.RenameBroadcastSendWarning},
    {20_260_606_110_000, Migrations.SubscriptionCheckFiltersUsePgAttribute},
    {20_260_616_120_000, Migrations.AddPostgrestFilterOps},
    {20_260_624_120_000, Migrations.RevertPostgrestFilterOps},
    {20_260_626_120_000, Migrations.ReAddPostgrestFilterOps},
    {20_260_706_120_000, Migrations.GrantCheckEqualityOp5Arg},
    {20_260_707_120_000, Migrations.RestrictRealtimeSchema},
    {20_260_709_120_000, Migrations.FixApplyRlsFilterRoleLeak},
    {20_260_714_120_000, Migrations.AddBroadcastPersistence},
    {20_260_827_120_000, Migrations.EmptySelectColumnsReturnPrimaryKeys},
    {20_260_914_120_000, Migrations.DelegateMessagesGrantsToPostgres},
    {20_260_916_120_000, Migrations.AllowPostgresToDelegateRealtimeSchemaUsage},
    {20_260_922_120_000, Migrations.RevokeRealtimeSchemaGrantOptionFromRealtimeAdmin},
    {20_260_925_120_000, Migrations.RestoreMessagesBaseGrants},
    {20_260_928_120_000, Migrations.AddListChangesSync}
  ]

  defstruct [:tenant_external_id, :settings, migrations_ran: 0]

  @type t :: %__MODULE__{
          tenant_external_id: binary(),
          settings: map()
        }

  @doc """
  Checks if migrations for a given tenant need to run.
  """
  @spec run_migrations?(Tenant.t() | integer()) :: boolean()
  def run_migrations?(%Tenant{} = tenant) do
    tenant.migrations_ran < Enum.count(migrations())
  end

  def run_migrations?(migrations_ran) when is_integer(migrations_ran),
    do: migrations_ran < Enum.count(migrations())

  @doc """
  Run migrations for the given tenant, blocking until they complete.
  """
  @spec run_migrations(Tenant.t()) :: :ok | :noop | {:error, any()}
  def run_migrations(%Tenant{} = tenant) do
    if run_migrations?(tenant) do
      {node, attrs} = migration_target(tenant)
      GenRpc.call(node, __MODULE__, :start_migration, [attrs], tenant_id: tenant.external_id, timeout: 50_000)
    else
      :noop
    end
  end

  @doc """
  Triggers migrations for the given tenant without blocking the caller.
  """
  @spec run_migrations_async(Tenant.t()) :: :ok | :noop
  def run_migrations_async(%Tenant{} = tenant) do
    if run_migrations?(tenant) do
      {node, attrs} = migration_target(tenant)
      GenRpc.cast(node, __MODULE__, :start_migration, [attrs])
    else
      :noop
    end
  end

  defp migration_target(%Tenant{} = tenant) do
    %{extensions: [%{settings: settings} | _]} = tenant

    attrs = %__MODULE__{
      tenant_external_id: tenant.external_id,
      settings: settings,
      migrations_ran: tenant.migrations_ran
    }

    node =
      case Nodes.get_node_for_tenant(tenant) do
        {:ok, node, _} -> node
        {:error, _} -> node()
      end

    {node, attrs}
  end

  def start_migration(attrs) do
    supervisor =
      {:via, PartitionSupervisor, {Realtime.Tenants.Migrations.DynamicSupervisor, attrs.tenant_external_id}}

    spec = {__MODULE__, attrs}

    case DynamicSupervisor.start_child(supervisor, spec) do
      :ignore -> :ok
      error -> error
    end
  end

  def start_link(%__MODULE__{tenant_external_id: tenant_external_id} = attrs) do
    name = {:via, Registry, {Unique, {__MODULE__, :host, tenant_external_id}}}
    GenServer.start_link(__MODULE__, attrs, name: name)
  end

  def init(%__MODULE__{tenant_external_id: tenant_external_id, settings: settings, migrations_ran: migrations_ran}) do
    Logger.metadata(external_id: tenant_external_id, project: tenant_external_id)

    case migrate(tenant_external_id, settings, migrations_ran) do
      {:ok, applied_count} ->
        Task.Supervisor.async_nolink(__MODULE__.TaskSupervisor, Api, :update_migrations_ran, [
          tenant_external_id,
          applied_count
        ])

        :ignore

      {:error, error} ->
        {:stop, error}
    end
  end

  defp migrate(tenant_external_id, settings, migrations_ran) do
    platform_region = Map.get(settings, "region")

    with {:ok, settings} <- Database.from_settings(settings, "realtime_migrations", :stop) do
      [
        hostname: settings.hostname,
        port: settings.port,
        database: settings.database,
        password: settings.password,
        username: settings.username,
        pool_size: settings.pool_size,
        backoff_type: settings.backoff_type,
        socket_options: settings.socket_options,
        parameters: [application_name: settings.application_name],
        after_connect: after_connect(),
        ssl: settings.ssl
      ]
      |> Repo.with_dynamic_repo(fn repo ->
        event = [:realtime, :tenants, :migrations]
        metadata = %{external_id: tenant_external_id, hostname: settings.hostname, platform_region: platform_region}
        start_time = Telemetry.start(event, metadata)

        try do
          {applied_count, migrations_executed, source} =
            if __MODULE__.load_db_dump?(migrations_ran, repo) do
              case load_db_dump(repo) do
                {:ok, applied_count} -> {applied_count, applied_count, :dump}
                {:error, _} -> run_pending_migrations(repo)
              end
            else
              run_pending_migrations(repo)
            end

          metadata =
            metadata
            |> Map.put(:migrations_executed, migrations_executed)
            |> Map.put(:source, source)

          Telemetry.stop(event, start_time, metadata)
          {:ok, applied_count}
        rescue
          error ->
            metadata = Map.put(metadata, :error_code, error_code(error))

            Telemetry.exception(
              event,
              start_time,
              :error,
              error,
              __STACKTRACE__,
              metadata
            )

            {:error, error}
        end
      end)
    end
  end

  defp error_code(%Postgrex.Error{postgres: %{code: code}}), do: code
  defp error_code(%DBConnection.ConnectionError{}), do: :connection_error
  defp error_code(_), do: :other

  @dump_timeout 30_000

  defp load_db_dump(repo) do
    with {:ok, _} <- do_load_dump(repo) do
      {:ok, Enum.count(migrations())}
    else
      {:error, reason} = e ->
        log_error("TenantMigrationsDumpSkipped", reason)
        e
    end
  end

  defp run_pending_migrations(repo) do
    opts = [all: true, prefix: "realtime", dynamic_repo: repo]
    result = Ecto.Migrator.run(Repo, migrations(), :up, opts)
    {Enum.count(migrations()), length(result), :migrator}
  end

  # Best-effort checking to find if it should load the DB dump or fallback to sequential migrations.
  # `migrations_ran` can be stale on DB restore or cluster migration operations,
  # so it needs to also query `realtime.schema_migrations` to make sure.
  @doc false
  def load_db_dump?(0 = _migrations_ran, repo) do
    Application.get_env(:realtime, :load_tenant_db_dump, true) and schema_migrations_empty?(repo)
  end

  def load_db_dump?(_migrations_ran, _repo), do: false

  @doc false
  def schema_migrations_empty?(repo) do
    case Repo.query("SELECT count(*)::int FROM realtime.schema_migrations", [], dynamic_repo: repo) do
      {:ok, %{rows: [[0]]}} ->
        true

      {:ok, %{rows: [[_count]]}} ->
        false

      {:error, %Postgrex.Error{postgres: %{code: :undefined_table}}} ->
        true

      {:error, error} ->
        log_warning("TenantMigrationsRanCheckFailed", error)
        false
    end
  end

  defp do_load_dump(repo) do
    with {:ok, major} <- fetch_pg_major(repo),
         {:ok, path} <- dump_path(major),
         {:ok, sql} <- File.read(path) do
      Repo.query(sql, [], dynamic_repo: repo, query_type: :text, timeout: @dump_timeout)
    end
  end

  defp fetch_pg_major(repo) do
    query = """
    SELECT current_setting('server_version_num'), EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'orioledb')
    """

    case Repo.query(query, [], dynamic_repo: repo, timeout: @dump_timeout) do
      {:ok, %{rows: [[_version_num, true]]}} -> {:error, :orioledb_not_supported}
      {:ok, %{rows: [[version_num, false]]}} -> {:ok, version_num |> String.to_integer() |> div(10_000)}
      {:error, reason} -> {:error, reason}
    end
  end

  defp dump_path(major) do
    path = Application.app_dir(:realtime, "priv/repo/tenant_db_dump_#{major}.sql")
    if File.exists?(path), do: {:ok, path}, else: {:error, {:dump_not_found, major}}
  end

  @doc """
  Returns the migrations to run.
  """
  @spec migrations() :: [{pos_integer(), module()}]
  def migrations, do: @migrations

  @doc """
  `after_connect` for the connection these migrations run on.

  They build SQL dynamically, which Multigres' gateway refuses to forward;
  `unsafe_connection` lets it through. A no-op on plain Postgres.
  """
  @spec after_connect() :: {module(), atom(), [term()]}
  def after_connect, do: {Postgrex, :query!, ["SET multigres.unsafe_connection = on", []]}
end
