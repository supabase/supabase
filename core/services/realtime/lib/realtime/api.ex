defmodule Realtime.Api do
  @moduledoc """
  The Api context.
  """
  require Logger

  import Ecto.Query

  alias Ecto.Changeset
  alias Extensions.PostgresCdcRls
  alias Realtime.Api.Extensions
  alias Realtime.Api.FeatureFlag
  alias Realtime.Api.Tenant
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.GenRpc
  alias Realtime.Nodes
  alias Realtime.RateCounter
  alias Realtime.Repo
  alias Realtime.Repo.Replica
  alias Realtime.Tenants
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.UserSocket

  defguard requires_disconnect(changeset)
           when changeset.valid? == true and
                  (is_map_key(changeset.changes, :jwt_secret) or
                     is_map_key(changeset.changes, :jwt_jwks) or
                     is_map_key(changeset.changes, :private_only) or
                     is_map_key(changeset.changes, :suspend))

  defguard requires_restarting_db_connection(changeset)
           when changeset.valid? == true and
                  (is_map_key(changeset.changes, :extensions) or
                     is_map_key(changeset.changes, :jwt_secret) or
                     is_map_key(changeset.changes, :jwt_jwks) or
                     is_map_key(changeset.changes, :suspend))

  @doc """
  Returns the list of tenants.

  ## Examples

      iex> list_tenants()
      [%Tenant{}, ...]

  """
  def list_tenants do
    repo_replica = Replica.replica()

    Tenant
    |> repo_replica.all()
    |> repo_replica.preload(:extensions)
  end

  @doc """
  Returns list of tenants with filter options:
  * order_by
  * search external id
  * limit
  * ordering (desc / asc)
  """
  def list_tenants(opts) when is_list(opts) do
    repo_replica = Replica.replica()

    field = Keyword.get(opts, :order_by, "inserted_at") |> String.to_atom()
    external_id = Keyword.get(opts, :search)
    limit = Keyword.get(opts, :limit, 50)
    order = Keyword.get(opts, :order, "desc") |> String.to_atom()

    query =
      Tenant
      |> order_by({^order, ^field})
      |> limit(^limit)

    ilike = "#{external_id}%"

    query = if external_id, do: query |> where([t], ilike(t.external_id, ^ilike)), else: query

    query
    |> repo_replica.all()
    |> repo_replica.preload(:extensions)
  end

  @doc """
  Gets a single tenant.

  Raises `Ecto.NoResultsError` if the Tenant does not exist.

  ## Examples

      iex> _by_host!(123) do

      end

      %Tenant{}

      iex> get_tenant!(456)
      ** (Ecto.NoResultsError)

  """
  def get_tenant!(id), do: Replica.replica().get!(Tenant, id)

  @doc """
  Creates a tenant.

  ## Examples

      iex> create_tenant(%{field: value})
      {:ok, %Tenant{}}

      iex> create_tenant(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_tenant(attrs) do
    Logger.debug("create_tenant #{inspect(attrs, pretty: true)}")
    tenant_id = Map.get(attrs, :external_id) || Map.get(attrs, "external_id")

    if master_region?() do
      %Tenant{}
      |> Tenant.changeset(attrs)
      |> Repo.insert()
      |> case do
        {:ok, tenant} ->
          Cache.global_cache_update(tenant)
          {:ok, tenant}

        error ->
          error
      end
    else
      call(:create_tenant, [attrs], tenant_id: tenant_id)
    end
  end

  @doc """
  Updates a tenant.
  """
  @spec update_tenant_by_external_id(binary(), map()) :: {:ok, Tenant.t()} | {:error, term()}
  def update_tenant_by_external_id(tenant_id, attrs) when is_binary(tenant_id) do
    if master_region?() do
      tenant_id
      |> get_tenant_by_external_id(use_replica?: false)
      |> update_tenant(attrs)
    else
      call(:update_tenant_by_external_id, [tenant_id, attrs], tenant_id: tenant_id)
    end
  end

  defp update_tenant(%Tenant{} = tenant, attrs) do
    changeset = Tenant.changeset(tenant, attrs)
    updated = Repo.update(changeset)

    case updated do
      {:ok, tenant} ->
        maybe_update_cache(tenant, changeset)
        maybe_trigger_disconnect(changeset)
        maybe_restart_db_connection(changeset)
        maybe_restart_rate_counters(changeset)
        Logger.debug("Tenant updated: #{inspect(tenant, pretty: true)}")

      {:error, error} ->
        Logger.error("Failed to update tenant: #{inspect(error, pretty: true)}")
    end

    updated
  end

  @spec delete_tenant_by_external_id(String.t()) :: boolean()
  def delete_tenant_by_external_id(id) do
    if master_region?() do
      query = from(t in Tenant, where: t.external_id == ^id)
      {num, _} = Repo.delete_all(query)
      num > 0
    else
      call(:delete_tenant_by_external_id, [id], tenant_id: id)
    end
  end

  @spec get_tenant_by_external_id(String.t(), Keyword.t()) :: Tenant.t() | nil
  def get_tenant_by_external_id(external_id, opts \\ []) do
    opts = Keyword.validate!(opts, use_replica?: true)
    use_replica? = Keyword.fetch!(opts, :use_replica?)

    cond do
      use_replica? ->
        Replica.replica().get_by(Tenant, external_id: external_id) |> Replica.replica().preload(:extensions)

      !use_replica? and master_region?() ->
        Repo.get_by(Tenant, external_id: external_id) |> Repo.preload(:extensions)

      true ->
        call(:get_tenant_by_external_id, [external_id, opts], tenant_id: external_id)
    end
  end

  @doc """
  Returns the subset of the given external ids that have a tenant row in this cluster.

  Always reads the primary so a tenant that was just created is never reported as absent.
  """
  @spec list_existing_external_ids([String.t()]) :: [String.t()] | {:error, term()}
  def list_existing_external_ids([]), do: []

  def list_existing_external_ids(external_ids) when is_list(external_ids) do
    if master_region?() do
      Tenant
      |> where([t], t.external_id in ^external_ids)
      |> select([t], t.external_id)
      |> Repo.all()
    else
      call(:list_existing_external_ids, [external_ids])
    end
  end

  @spec list_feature_flags() :: [FeatureFlag.t()]
  def list_feature_flags do
    Replica.replica().all(from f in FeatureFlag, order_by: [asc: f.name])
  end

  @spec get_feature_flag(String.t()) :: FeatureFlag.t() | nil
  def get_feature_flag(name) when is_binary(name),
    do: Replica.replica().get_by(FeatureFlag, name: name)

  @spec upsert_feature_flag(map()) :: {:ok, FeatureFlag.t()} | {:error, Ecto.Changeset.t()}
  def upsert_feature_flag(attrs) do
    if master_region?() do
      %FeatureFlag{}
      |> FeatureFlag.changeset(attrs)
      |> Repo.insert(
        on_conflict: {:replace, [:enabled, :rollout_percentage, :bucket_key, :updated_at]},
        conflict_target: :name,
        returning: true
      )
      |> tap(fn
        {:ok, flag} -> FeatureFlags.Cache.global_update_cache(flag)
        _ -> :ok
      end)
    else
      call(:upsert_feature_flag, [attrs])
    end
  end

  @spec delete_feature_flag(FeatureFlag.t()) :: {:ok, FeatureFlag.t()} | {:error, Ecto.Changeset.t()}
  def delete_feature_flag(%FeatureFlag{} = flag) do
    if master_region?() do
      flag
      |> Repo.delete()
      |> tap(fn
        {:ok, deleted} -> FeatureFlags.Cache.global_invalidate_cache(deleted)
        _ -> :ok
      end)
    else
      call(:delete_feature_flag, [flag])
    end
  end

  defp list_extensions(type) do
    query = from(e in Extensions, where: e.type == ^type, select: struct(e, [:id, :settings]))
    replica = Replica.replica()
    replica.all(query)
  end

  def rename_settings_field(from, to) do
    if master_region?() do
      for extension <- list_extensions("postgres_cdc_rls") do
        {value, settings} = Map.pop(extension.settings, from)
        new_settings = Map.put(settings, to, value)

        extension
        |> Changeset.cast(%{settings: new_settings}, [:settings])
        |> Repo.update()
      end
    else
      call(:rename_settings_field, [from, to])
    end
  end

  @doc """
  Updates the migrations_ran field for a tenant.
  """
  @spec update_migrations_ran(binary(), integer()) :: {:ok, Tenant.t()} | {:error, term()}
  def update_migrations_ran(external_id, count) do
    if master_region?() do
      update_and_cache_tenant(external_id, &Tenant.changeset(&1, %{migrations_ran: count}))
    else
      call(:update_migrations_ran, [external_id, count], tenant_id: external_id)
    end
  end

  @doc """
  Replaces a tenant's jwt_secret ciphertext in place, only if it still holds `expected`.

  The backfill reads the tenant, re-encrypts asynchronously and writes back, so a rotation landing
  in that window would otherwise be reverted to a re-encrypted copy of the old secret. Compare-and-set
  makes the stale write a no-op instead.

  Bypasses `update_tenant/2`'s disconnect/db-restart/rate-counter side effects: the plaintext
  secret hasn't changed, only its ciphertext.
  """
  @spec reencrypt_tenant_jwt_secret(binary(), binary(), binary()) :: {:ok, Tenant.t()} | {:error, term()}
  def reencrypt_tenant_jwt_secret(external_id, expected, jwt_secret) do
    if master_region?() do
      query = from(t in Tenant, where: t.external_id == ^external_id)

      with {:ok, _} <-
             compare_and_set(query, [jwt_secret: expected], [jwt_secret: jwt_secret],
               changed: :jwt_secret_changed,
               missing: :tenant_not_found
             ),
           do: reload_and_cache_tenant(external_id)
    else
      call(:reencrypt_tenant_jwt_secret, [external_id, expected, jwt_secret], tenant_id: external_id)
    end
  end

  @doc """
  Replaces an extension's settings in place with a re-encrypted copy, only if they still hold
  `expected`. Compare-and-set for the same reason as `reencrypt_tenant_jwt_secret/3`.
  """
  @spec reencrypt_extension_settings(binary(), binary(), map(), map()) ::
          {:ok, Ecto.Schema.t()} | {:error, term()}
  def reencrypt_extension_settings(tenant_id, extension_id, expected, settings) do
    if master_region?() do
      query = from(e in Extensions, where: e.id == ^extension_id and e.tenant_external_id == ^tenant_id)

      compare_and_set(query, [settings: expected], [settings: settings],
        changed: :settings_changed,
        missing: :extension_not_found
      )
    else
      call(:reencrypt_extension_settings, [tenant_id, extension_id, expected, settings], tenant_id: tenant_id)
    end
  end

  @doc """
  Records when a tenant finished moving to GCM encryption. A null gcm_migrated_at means the tenant
  still has values on the legacy cipher.
  """
  @spec update_tenant_gcm_migrated_at(binary()) :: {:ok, Tenant.t()} | {:error, term()}
  def update_tenant_gcm_migrated_at(external_id) do
    if master_region?() do
      now = DateTime.utc_now()

      update_and_cache_tenant(external_id, &Tenant.gcm_migrated_at_changeset(&1, %{gcm_migrated_at: now}))
    else
      call(:update_tenant_gcm_migrated_at, [external_id], tenant_id: external_id)
    end
  end

  @spec preload_counters(nil | Realtime.Api.Tenant.t(), any()) :: nil | Realtime.Api.Tenant.t()
  def preload_counters(nil), do: nil

  def preload_counters(%Tenant{} = tenant) do
    rate = Tenants.requests_per_second_rate(tenant)

    preload_counters(tenant, rate)
  end

  def preload_counters(nil, _rate), do: nil

  def preload_counters(%Tenant{} = tenant, counters_rate) do
    current = GenCounter.get(counters_rate.id)
    {:ok, %RateCounter{avg: avg}} = RateCounter.get(counters_rate)

    tenant
    |> Map.put(:events_per_second_rolling, avg)
    |> Map.put(:events_per_second_now, current)
  end

  @field_to_rate_counter_key %{
    max_events_per_second: [
      &Tenants.events_per_second_key/1,
      &Tenants.db_events_per_second_key/1
    ],
    max_joins_per_second: [
      &Tenants.joins_per_second_key/1
    ],
    max_presence_events_per_second: [
      &Tenants.presence_events_per_second_key/1
    ],
    extensions: [
      &Tenants.connect_errors_per_second_key/1,
      &Tenants.subscription_errors_per_second_key/1,
      &Tenants.authorization_errors_per_second_key/1
    ]
  }

  defp maybe_restart_rate_counters(changeset) do
    tenant_id = Changeset.fetch_field!(changeset, :external_id)

    Enum.each(@field_to_rate_counter_key, fn {field, key_fns} ->
      if Changeset.changed?(changeset, field) do
        Enum.each(key_fns, fn key_fn ->
          tenant_id
          |> key_fn.()
          |> RateCounter.publish_update()
        end)
      end
    end)
  end

  defp maybe_update_cache(tenant, %Changeset{changes: changes, valid?: true}) when changes != %{} do
    Tenants.Cache.global_cache_update(tenant)
  end

  defp maybe_update_cache(_tenant, _changeset), do: :ok

  defp maybe_trigger_disconnect(%Changeset{data: %{external_id: external_id}} = changeset)
       when requires_disconnect(changeset) do
    UserSocket.disconnect(external_id)
  end

  defp maybe_trigger_disconnect(_changeset), do: nil

  defp maybe_restart_db_connection(%Changeset{data: %{external_id: external_id}} = changeset)
       when requires_restarting_db_connection(changeset) do
    Connect.shutdown(external_id)

    try do
      PostgresCdcRls.handle_stop(external_id, 5_000)
    catch
      kind, reason ->
        Logger.warning("Failed to stop CDC processes for tenant #{external_id}: #{inspect(kind)} #{inspect(reason)}")

        :ok
    end
  end

  defp maybe_restart_db_connection(_changeset), do: nil

  # Applies `changes` only while the row still holds `expected`, so a write racing with the caller's
  # read is dropped instead of clobbered. `{0, _}` is ambiguous - lost the race or the row is gone -
  # so `errors[:changed]` / `errors[:missing]` tell the caller which one it was.
  defp compare_and_set(query, expected, changes, errors) do
    query
    |> where(^expected)
    |> select([row], row)
    |> Repo.update_all(set: changes)
    |> case do
      {1, [row]} -> {:ok, row}
      {0, _} -> if Repo.exists?(query), do: {:error, errors[:changed]}, else: {:error, errors[:missing]}
    end
  end

  # Single-field tenant updates that only need the cache refreshed: no disconnect, db restart or rate
  # counter side effects, unlike `update_tenant/2`.
  defp update_and_cache_tenant(external_id, changeset_fun) do
    with %Tenant{} = tenant <- get_tenant_by_external_id(external_id, use_replica?: false),
         {:ok, updated} <- tenant |> changeset_fun.() |> Repo.update() do
      Cache.global_cache_update(updated)
      {:ok, updated}
    else
      nil -> {:error, :tenant_not_found}
      {:error, _} = error -> error
    end
  end

  # Cached tenants carry their extensions, so the fresh copy has to come from a full read rather than
  # from the writing query itself.
  defp reload_and_cache_tenant(external_id) do
    case get_tenant_by_external_id(external_id, use_replica?: false) do
      nil ->
        {:error, :tenant_not_found}

      %Tenant{} = tenant ->
        Cache.global_cache_update(tenant)
        {:ok, tenant}
    end
  end

  defp master_region? do
    region = Nodes.region()
    master_region = Application.get_env(:realtime, :master_region) || region
    region == master_region
  end

  defp call(operation, args, opts \\ []) do
    master_region = Application.get_env(:realtime, :master_region)

    with {:ok, master_node} <- Nodes.node_from_region(master_region, self()),
         {:ok, result} <- wrapped_call(master_node, operation, args, opts) do
      result
    end
  end

  defp wrapped_call(master_node, operation, args, opts) do
    case GenRpc.call(master_node, __MODULE__, operation, args, opts) do
      {:error, :rpc_error, reason} -> {:error, reason}
      {:error, reason} -> {:error, reason}
      result -> {:ok, result}
    end
  end
end
