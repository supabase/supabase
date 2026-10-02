defmodule Supavisor.Tenants do
  @moduledoc """
  The Tenants context.
  """

  import Ecto.Query, warn: false
  alias Supavisor.Repo

  alias Supavisor.CircuitBreaker
  alias Supavisor.Errors.MultipleTenantUsersError
  alias Supavisor.Errors.NoTenantIdentifierError
  alias Supavisor.Errors.TenantOrUserNotFoundError
  alias Supavisor.Errors.TenantBannedError
  alias Supavisor.Secrets.ManagerSecrets
  alias Supavisor.Tenants.Cluster
  alias Supavisor.Tenants.ClusterTenants
  alias Supavisor.Tenants.Tenant
  alias Supavisor.Tenants.User

  require Logger

  @doc """
  Returns the list of tenants.

  ## Examples

      iex> list_tenants()
      [%Tenant{}, ...]

  """
  def list_tenants do
    Repo.all(Tenant) |> Repo.preload([:users])
  end

  @doc """
  Gets a single tenant.

  Raises `Ecto.NoResultsError` if the Tenant does not exist.

  ## Examples

      iex> get_tenant!(123)
      %Tenant{}

      iex> get_tenant!(456)
      ** (Ecto.NoResultsError)

  """
  def get_tenant!(id), do: Repo.get!(Tenant, id)

  @doc """
  Gets a single tenant by external_id.

  ## Examples

      iex> get_tenant_by_external_id!("123")
      %Tenant{}

      iex> get_tenant!(456)
      nil
  """
  @spec get_tenant_by_external_id(String.t()) :: Tenant.t() | nil
  def get_tenant_by_external_id(external_id) do
    Tenant |> Repo.get_by(external_id: external_id) |> Repo.preload(:users)
  end

  @spec get_cluster_by_alias(String.t()) :: Cluster.t() | nil
  def get_cluster_by_alias(alias) do
    Cluster |> Repo.get_by(alias: alias) |> Repo.preload(:cluster_tenants)
  end

  @spec get_tenant_cache(String.t() | nil, String.t() | nil) :: Tenant.t() | nil
  def get_tenant_cache(external_id, sni_hostname) do
    cache_key = {:tenant_cache, external_id, sni_hostname}

    case Cachex.fetch(Supavisor.Cache, cache_key, fn _key ->
           {:commit, {:cached, get_tenant(external_id, sni_hostname)}, ttl: :timer.hours(24)}
         end) do
      {:ok, {:cached, value}} -> value
      {:commit, {:cached, value}, _} -> value
    end
  end

  @spec get_tenant(String.t() | nil, String.t() | nil) :: Tenant.t() | nil
  def get_tenant(nil, sni_hostname) when sni_hostname != nil do
    Tenant |> Repo.get_by(sni_hostname: sni_hostname)
  end

  def get_tenant(external_id, _) when external_id != nil do
    Tenant |> Repo.get_by(external_id: external_id)
  end

  def get_tenant(_, _), do: nil

  @spec get_user_cache(:single | :cluster, String.t(), String.t() | nil, String.t() | nil) ::
          {:ok, map()}
          | {:error,
             NoTenantIdentifierError.t()
             | TenantOrUserNotFoundError.t()
             | MultipleTenantUsersError.t()}
  def get_user_cache(type, user, external_id, sni_hostname) do
    cache_key = {:user_cache, type, user, external_id, sni_hostname}

    case Cachex.fetch(Supavisor.Cache, cache_key, fn _key ->
           {:commit, {:cached, get_user(type, user, external_id, sni_hostname)},
            ttl: :timer.hours(24)}
         end) do
      {_, {:cached, value}} -> value
      {_, {:cached, value}, _} -> value
    end
  end

  @spec get_user(atom(), String.t(), String.t() | nil, String.t() | nil) ::
          {:ok, map()}
          | {:error,
             NoTenantIdentifierError.t()
             | TenantOrUserNotFoundError.t()
             | MultipleTenantUsersError.t()}
  def get_user(_, _, nil, nil) do
    {:error, %NoTenantIdentifierError{}}
  end

  def get_user(:cluster, user, external_id, sni_hostname) do
    query =
      from(ct in ClusterTenants,
        where: ct.cluster_alias == ^external_id and ct.active == true,
        limit: 1
      )

    case Repo.all(query) do
      [%ClusterTenants{} = ct] ->
        get_user(:single, user, ct.tenant_external_id, sni_hostname)

      [_ | _] ->
        multiple_users_error(:cluster, user, external_id, sni_hostname)

      _ ->
        not_found_error(:cluster, user, external_id, sni_hostname)
    end
  end

  def get_user(:single, user, external_id, sni_hostname) do
    query = build_user_query(user, external_id, sni_hostname)

    case Repo.all(query) do
      [{%User{}, %Tenant{}}] = [{user, tenant}] ->
        {:ok, %{user: user, tenant: tenant}}

      [_ | _] ->
        multiple_users_error(:single, user, external_id, sni_hostname)

      _ ->
        not_found_error(:single, user, external_id, sni_hostname)
    end
  end

  defp not_found_error(_type, _user, nil, _sni_hostname) do
    {:error, %NoTenantIdentifierError{}}
  end

  defp not_found_error(type, user, external_id, _sni_hostname) do
    {:error,
     %TenantOrUserNotFoundError{
       type: type,
       user: user,
       tenant_or_alias: external_id
     }}
  end

  defp multiple_users_error(type, user, external_id, sni_hostname) do
    {:error,
     %MultipleTenantUsersError{
       type: type,
       user: user,
       tenant_or_alias: external_id || sni_hostname
     }}
  end

  @spec get_manager_user(String.t()) :: User.t() | nil
  def get_manager_user(external_id) do
    from(u in User,
      where: u.tenant_external_id == ^external_id and u.is_manager == true
    )
    |> Repo.one()
  end

  @spec get_manager_user_cache(String.t()) :: ManagerSecrets.t() | nil
  def get_manager_user_cache(external_id, ttl \\ :timer.hours(24)) do
    ttl = if is_nil(ttl), do: :timer.hours(24), else: ttl
    cache_key = {:manager_user_cache, external_id}

    case Cachex.fetch(Supavisor.Cache, cache_key, fn _key ->
           {:commit, {:cached, get_manager_user(external_id)}, ttl: ttl}
         end) do
      {_, {:cached, nil}} ->
        nil

      {_, {:cached, nil}, _} ->
        nil

      {_, {:cached, user}} ->
        %ManagerSecrets{
          db_user: user.db_user,
          db_password: user.db_password
        }

      {_, {:cached, user}, _} ->
        %ManagerSecrets{
          db_user: user.db_user,
          db_password: user.db_password
        }
    end
  end

  def get_pool_config(external_id, user) do
    from(t in Tenant,
      left_join: u in User,
      on: u.tenant_external_id == t.external_id and u.db_user == ^user,
      where: t.external_id == ^external_id,
      preload: [users: u]
    )
    |> Repo.all()
  end

  def get_pool_config_cache(external_id, user, ttl \\ :timer.hours(24)) do
    ttl = if is_nil(ttl), do: :timer.hours(24), else: ttl
    cache_key = {:pool_config_cache, external_id, user}

    case Cachex.fetch(Supavisor.Cache, cache_key, fn _key ->
           {:commit, {:cached, get_pool_config(external_id, user)}, ttl: ttl}
         end) do
      {_, {:cached, value}} -> value
      {_, {:cached, value}, _} -> value
    end
  end

  @spec get_cluster_config(String.t(), String.t()) :: [ClusterTenants.t()] | {:error, any()}
  def get_cluster_config(external_id, user) do
    case Repo.all(from(ct in ClusterTenants, where: ct.cluster_alias == ^external_id)) do
      [%{cluster_alias: cluster_alias, active: true} | _] ->
        user = from(u in User, where: u.db_user == ^user)
        tenant = from(t in Tenant, preload: [users: ^user])

        from(ct in ClusterTenants,
          where: ct.cluster_alias == ^cluster_alias and ct.active == true,
          preload: [tenant: ^tenant]
        )
        |> Repo.all()
        |> Enum.reduce_while({nil, []}, &process_cluster/2)
        |> case do
          {:error, _} = error -> error
          {_require_user, clusters} -> clusters
        end

      _ ->
        {:error, :not_found}
    end
  end

  defp process_cluster(cluster, {type, acc}) do
    type = if is_nil(type), do: cluster.tenant.require_user, else: type

    case cluster.tenant.users do
      [_user] when type == cluster.tenant.require_user -> {:cont, {type, [cluster | acc]}}
      [_user] -> {:halt, {:error, {:config, :different_users, cluster.tenant.external_id}}}
      _ -> {:halt, {:error, {:config, :multiple_users, cluster.tenant.external_id}}}
    end
  end

  @doc """
  Creates a tenant.

  ## Examples

      iex> create_tenant(%{field: value})
      {:ok, %Tenant{}}

      iex> create_tenant(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_tenant(attrs \\ %{}) do
    %Tenant{}
    |> Tenant.changeset(attrs)
    |> Repo.insert()
    |> with_cache_invalidation(operation: "create")
  end

  @doc """
  Updates a tenant.

  ## Examples

      iex> update_tenant(tenant, %{field: new_value})
      {:ok, %Tenant{}}

      iex> update_tenant(tenant, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_tenant(%Tenant{} = tenant, attrs) do
    tenant
    |> Tenant.changeset(attrs)
    |> Repo.update()
    |> with_cache_invalidation(operation: "update", terminate_pools: true)
  end

  @doc """
  Toggles the ban status of a tenant.

  When banning a tenant, the `ban_reason` field is required. When unbanning, it is ignored.

  ## Examples

      iex> toggle_tenant_ban("external_id", %{banned: true, ban_reason: "violation"})
      {:ok, %Tenant{}}

      iex> toggle_tenant_ban("external_id", %{banned: false})
      {:ok, %Tenant{}}
  """
  @spec toggle_tenant_ban(String.t(), map()) ::
          {:ok, Tenant.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def toggle_tenant_ban(external_id, %{"banned" => banned?} = params) do
    case get_tenant_by_external_id(external_id) do
      nil ->
        {:error, :not_found}

      tenant when banned? in [true, "true"] ->
        tenant
        |> Tenant.ban_changeset(params)
        |> Repo.update()
        |> with_cache_invalidation(
          operation: "ban",
          terminate_pools: true,
          terminate_error: %TenantBannedError{ban_reason: params["ban_reason"]}
        )

      tenant when banned? in [false, "false"] ->
        tenant
        |> Tenant.unban_changeset(params)
        |> Repo.update()
        |> with_cache_invalidation(operation: "unban")
    end
  end

  def update_tenant_ps(external_id, new_ps) do
    from(t in Tenant, where: t.external_id == ^external_id)
    |> Repo.one()
    |> Tenant.changeset(%{default_parameter_status: new_ps})
    |> Repo.update()
  end

  @doc """
  Deletes a tenant.

  ## Examples

      iex> delete_tenant(tenant)
      {:ok, %Tenant{}}

      iex> delete_tenant(tenant)
      {:error, %Ecto.Changeset{}}

  """
  def delete_tenant(%Tenant{} = tenant) do
    tenant
    |> Repo.delete()
    |> with_cache_invalidation(operation: "delete")
  end

  @spec delete_tenant_by_external_id(String.t()) :: boolean()
  def delete_tenant_by_external_id(id) do
    from(t in Tenant, where: t.external_id == ^id)
    |> Repo.delete_all()
    |> case do
      {num, _} when num > 0 ->
        cleanup_result = Supavisor.del_all_cache_dist(id)
        Logger.info("Delete cache dist on delete #{id}: #{inspect(cleanup_result)}")
        true

      _ ->
        false
    end
  end

  defp with_cache_invalidation(result, opts) do
    case result do
      {:ok, %Tenant{external_id: external_id}} ->
        operation = Keyword.get(opts, :operation, "operation")

        cleanup_result = Supavisor.del_all_cache_dist(external_id)

        Logger.info(
          "Delete cache dist on #{operation} #{external_id}: #{inspect(cleanup_result)}"
        )

        if opts[:terminate_pools] do
          terminate_result = Supavisor.terminate_global(external_id, opts[:terminate_error])

          Logger.warning(
            "Terminate pools on #{operation} #{external_id}: #{inspect(terminate_result)}"
          )
        end

      _ ->
        :ok
    end

    result
  end

  @spec delete_cluster_by_alias(String.t()) :: boolean()
  def delete_cluster_by_alias(id) do
    from(t in Cluster, where: t.alias == ^id)
    |> Repo.delete_all()
    |> case do
      {num, _} when num > 0 ->
        true

      _ ->
        false
    end
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking tenant changes.

  ## Examples

      iex> change_tenant(tenant)
      %Ecto.Changeset{data: %Tenant{}}

  """
  def change_tenant(%Tenant{} = tenant, attrs \\ %{}) do
    Tenant.changeset(tenant, attrs)
  end

  alias Supavisor.Tenants.User

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Updates the manager user credentials for a tenant.

  This function also updates the secret checker credentials globally and clears the cache.

  ## Examples

      iex> update_manager_user_credentials(tenant, %{"db_user" => "new_user", "db_password" => "new_pass"})
      {:ok, %User{}}

      iex> update_manager_user_credentials(tenant, %{})
      {:error, :no_manager_user}

  """
  def update_manager_user_credentials(%Tenant{} = tenant, attrs) do
    tenant = Repo.preload(tenant, :users)

    case Enum.find(tenant.users, & &1.is_manager) do
      nil ->
        {:error, :no_manager_user}

      manager_user ->
        case manager_user
             |> User.credentials_changeset(attrs)
             |> Repo.update() do
          {:ok, updated_user} ->
            Logger.info(
              "Updating auth credentials for tenant #{tenant.external_id}, user #{updated_user.db_user}"
            )

            checker_result =
              Supavisor.update_secret_checker_credentials_global(
                tenant.external_id,
                updated_user.db_user,
                updated_user.db_password
              )

            Logger.info(
              "Update SecretChecker credentials #{tenant.external_id}: #{inspect(checker_result)}"
            )

            # Clear cache after SecretCheckers are updated to avoid race condition
            cleanup_result = Supavisor.del_all_cache_dist(tenant.external_id)
            Logger.info("Delete cache dist #{tenant.external_id}: #{inspect(cleanup_result)}")

            :ok

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Deletes a user.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  @spec build_user_query(String.t(), String.t() | nil, String.t() | nil) ::
          Ecto.Queryable.t()
  defp build_user_query(user, external_id, sni_hostname) do
    from(u in User,
      join: t in Tenant,
      on: u.tenant_external_id == t.external_id,
      where:
        u.db_user == ^user or
          (t.require_user == false and u.is_manager == true),
      select: {u, t}
    )
    |> where(^with_tenant(external_id, sni_hostname))
  end

  defp with_tenant(nil, sni_hostname) do
    dynamic([_, t], t.sni_hostname == ^sni_hostname)
  end

  defp with_tenant(external_id, _) do
    dynamic([_, t], t.external_id == ^external_id)
  end

  alias Supavisor.Tenants.Cluster

  @doc """
  Returns the list of clusters.

  ## Examples

      iex> list_clusters()
      [%Cluster{}, ...]

  """
  def list_clusters do
    Repo.all(Cluster)
  end

  @doc """
  Gets a single cluster.

  Raises `Ecto.NoResultsError` if the Cluster does not exist.

  ## Examples

      iex> get_cluster!(123)
      %Cluster{}

      iex> get_cluster!(456)
      ** (Ecto.NoResultsError)

  """
  def get_cluster!(id), do: Repo.get!(Cluster, id)

  @spec get_cluster_with_rel(String.t()) :: {:ok, Cluster.t()} | {:error, any()}
  def get_cluster_with_rel(id) do
    case Repo.get(Cluster, id) do
      nil ->
        {:error, :not_found}

      cluster ->
        {:ok, Repo.preload(cluster, :cluster_tenants)}
    end
  end

  @doc """
  Creates a cluster.

  ## Examples

      iex> create_cluster(%{field: value})
      {:ok, %Cluster{}}

      iex> create_cluster(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_cluster(attrs \\ %{}) do
    %Cluster{}
    |> Cluster.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a cluster.

  ## Examples

      iex> update_cluster(cluster, %{field: new_value})
      {:ok, %Cluster{}}

      iex> update_cluster(cluster, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_cluster(%Cluster{} = cluster, attrs) do
    cluster
    |> Cluster.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a cluster.

  ## Examples

      iex> delete_cluster(cluster)
      {:ok, %Cluster{}}

      iex> delete_cluster(cluster)
      {:error, %Ecto.Changeset{}}

  """
  def delete_cluster(%Cluster{} = cluster) do
    Repo.delete(cluster)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking cluster changes.

  ## Examples

      iex> change_cluster(cluster)
      %Ecto.Changeset{data: %Cluster{}}

  """
  def change_cluster(%Cluster{} = cluster, attrs \\ %{}) do
    Cluster.changeset(cluster, attrs)
  end

  alias Supavisor.Tenants.ClusterTenants

  @doc """
  Returns the list of cluster_tenants.

  ## Examples

      iex> list_cluster_tenants()
      [%ClusterTenants{}, ...]

  """
  def list_cluster_tenants do
    Repo.all(ClusterTenants)
  end

  @doc """
  Gets a single cluster_tenants.

  Raises `Ecto.NoResultsError` if the Cluster tenants does not exist.

  ## Examples

      iex> get_cluster_tenants!(123)
      %ClusterTenants{}

      iex> get_cluster_tenants!(456)
      ** (Ecto.NoResultsError)

  """
  def get_cluster_tenants!(id), do: Repo.get!(ClusterTenants, id)

  @doc """
  Creates a cluster_tenants.

  ## Examples

      iex> create_cluster_tenants(%{field: value})
      {:ok, %ClusterTenants{}}

      iex> create_cluster_tenants(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_cluster_tenants(attrs \\ %{}) do
    %ClusterTenants{}
    |> ClusterTenants.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a cluster_tenants.

  ## Examples

      iex> update_cluster_tenants(cluster_tenants, %{field: new_value})
      {:ok, %ClusterTenants{}}

      iex> update_cluster_tenants(cluster_tenants, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_cluster_tenants(%ClusterTenants{} = cluster_tenants, attrs) do
    cluster_tenants
    |> ClusterTenants.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a cluster_tenants.

  ## Examples

      iex> delete_cluster_tenants(cluster_tenants)
      {:ok, %ClusterTenants{}}

      iex> delete_cluster_tenants(cluster_tenants)
      {:error, %Ecto.Changeset{}}

  """
  def delete_cluster_tenants(%ClusterTenants{} = cluster_tenants) do
    Repo.delete(cluster_tenants)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking cluster_tenants changes.

  ## Examples

      iex> change_cluster_tenants(cluster_tenants)
      %Ecto.Changeset{data: %ClusterTenants{}}

  """
  def change_cluster_tenants(%ClusterTenants{} = cluster_tenants, attrs \\ %{}) do
    ClusterTenants.changeset(cluster_tenants, attrs)
  end

  @doc """
  Returns a list of network bans for a given tenant.

  ## Examples

      iex> list_network_bans("tenant_external_id")
      {:ok, [%{banned_address: "192.168.1.100", banned_until: 1620000000}, ...]}
  """
  @spec list_network_bans(String.t()) ::
          {:ok,
           [%{required(:banned_address) => String.t(), required(:banned_until) => integer()}]}
          | {:error, :tenant_not_found}
  def list_network_bans(external_id) when is_binary(external_id) do
    if get_tenant_by_external_id(external_id) do
      {external_id, :_}
      |> CircuitBreaker.opened(:auth_error)
      |> Enum.map(fn {{_tenant, ip}, blocked_until} ->
        %{banned_address: ip, banned_until: blocked_until}
      end)
      |> then(&{:ok, &1})
    else
      {:error, :tenant_not_found}
    end
  end

  @doc """
  Clears tenant's network bans for specific IP addresses.

  Returns the remaining active bans after clearing.

  ## Examples

      iex> clear_network_bans("tenant_external_id", ["192.168.1.100", "10.0.0.1"])
      {:ok, [%{banned_address: "10.0.0.1", banned_until: 1620000000}]}
  """
  @spec clear_network_bans(String.t(), [String.t()]) ::
          {:ok,
           [%{required(:banned_address) => String.t(), required(:banned_until) => integer()}]}
          | {:error, :tenant_not_found}
  def clear_network_bans(external_id, ip_addresses)
      when is_binary(external_id) and is_list(ip_addresses) do
    if get_tenant_by_external_id(external_id) do
      Enum.each(ip_addresses, &CircuitBreaker.clear({external_id, &1}, :auth_error))
      list_network_bans(external_id)
    else
      {:error, :tenant_not_found}
    end
  end
end
