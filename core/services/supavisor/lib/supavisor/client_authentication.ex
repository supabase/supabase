defmodule Supavisor.ClientAuthentication do
  @moduledoc """
  Manages client authentication secrets: fetching, caching, and refreshing.

  ## Cache Bypass

  Certain users can be configured to bypass validation secret caching via the
  `CACHE_BYPASS_USERS` environment variable (comma-separated list of usernames).

  For bypass users, validation secrets are never cached (always fetched fresh from
  the database). Useful for users with temporary passwords or frequently changing
  credentials.
  """

  require Logger
  require Supavisor

  alias Supavisor.AuthQuery
  alias Supavisor.ClientAuthentication.{RefreshLimiter, ValidationSecrets}
  alias Supavisor.Secrets.{ManagerSecrets, PasswordSecrets}
  alias Supavisor.UpstreamAuthentication

  @default_secrets_ttl :timer.hours(24)

  ## Public API — fetching and refreshing

  @doc """
  Fetches validation secrets.

  If the tenant has `require_user: true`, the secrets from the user record are used.
  If the tenant has `require_user: false`, the secrets are fetched from the auth query.

  Uses the cache when possible. If there's no cache entry, `Cachex.fetch` avoids
  parallelization/excessive work.
  """
  @spec fetch_validation_secrets(
          Supavisor.id(),
          Supavisor.Tenants.Tenant.t(),
          Supavisor.Tenants.User.t()
        ) ::
          {:ok, ValidationSecrets.t()}
          | {:error, Supavisor.Errors.CircuitBreakerError.t()}
          | {:error, Supavisor.Errors.AuthQueryError.t()}
          | {:error, :no_auth_config}
  def fetch_validation_secrets(id, %{require_user: true} = tenant, user) do
    # Even though this is pure computation, we cache for memoization. Computing the
    # SASL secrets from the password can be CPU expensive.
    cache_fetch_validation_secrets(tenant.external_id, user.db_user, fn ->
      Logger.metadata(project: tenant.external_id, user: Supavisor.id(id, :user))

      secrets =
        ValidationSecrets.from_password_secrets(%PasswordSecrets{
          user: user.db_user,
          password: user.db_password
        })

      {:commit, secrets, ttl: @default_secrets_ttl}
    end)
  end

  def fetch_validation_secrets(id, tenant, manager_user) do
    db_user = Supavisor.id(id, :user)

    manager_secrets = %ManagerSecrets{
      db_user: manager_user.db_user,
      db_password: manager_user.db_password
    }

    cache_fetch_validation_secrets(tenant.external_id, db_user, fn ->
      Logger.metadata(project: tenant.external_id, user: Supavisor.id(id, :user))

      case fetch_secrets_from_database(id, tenant, manager_secrets) do
        {:ok, secrets, _cache} -> {:commit, secrets, ttl: @default_secrets_ttl}
        {:error, _} = error -> {:ignore, error}
      end
    end)
  end

  @doc """
  Handles wrong passwords.

  Checks if validation secrets have changed and updates them if necessary. If they
  changed, also invalidates upstream auth secrets and returns the new secrets. Returns
  `:noop` if the secrets are unchanged, or `{:error, reason}` if they couldn't be checked
  (e.g. `{:error, :rate_limited}`).

  Shouldn't be used for `require_user = true` tenants.
  """
  @spec handle_wrong_password(Supavisor.id(), Supavisor.Tenants.Tenant.t(), ManagerSecrets.t()) ::
          {:changed, ValidationSecrets.t()} | :noop | {:error, term()}
  def handle_wrong_password(id, tenant, %ManagerSecrets{} = manager_secrets) do
    with :ok <- RefreshLimiter.check(id),
         {:ok, new_secrets, :changed} <- fetch_secrets_from_database(id, tenant, manager_secrets) do
      Logger.warning(
        "ClientHandler: Validation secrets changed, cache updated, deleting upstream auth"
      )

      true = UpstreamAuthentication.delete_upstream_auth_secrets(id)
      {:changed, new_secrets}
    else
      {:error, :rate_limited} = error ->
        Logger.warning("ClientHandler: Cache refresh rate-limited, skipping secret check")
        error

      {:error, reason} = error ->
        Logger.error("ClientHandler: Auth secrets check error: #{inspect(reason)}")
        error

      {:ok, _secrets, :noop} ->
        :noop
    end
  end

  @doc """
  Stores new validation secrets if they differ from the currently cached ones.

  Returns `:changed` if the cache was updated, `:noop` if unchanged.
  """
  @spec refresh_if_changed(String.t(), String.t(), ValidationSecrets.t()) :: :changed | :noop
  def refresh_if_changed(tenant_external_id, db_user, %ValidationSecrets{} = new_secrets) do
    case get_validation_secrets(tenant_external_id, db_user) do
      {:ok, current_secrets} ->
        if sasl_secrets_changed?(current_secrets, new_secrets) do
          invalidate_global(tenant_external_id, db_user)
          put_validation_secrets(tenant_external_id, db_user, new_secrets)
          :changed
        else
          :noop
        end

      {:error, :not_found} ->
        invalidate_global(tenant_external_id, db_user)
        put_validation_secrets(tenant_external_id, db_user, new_secrets)
        :changed
    end
  end

  ## Cache operations

  @doc false
  def get_validation_secrets(tenant_external_id, db_user) do
    case Cachex.get(Supavisor.Cache, {:secrets_for_validation, tenant_external_id, db_user}) do
      {:ok, %ValidationSecrets{} = secrets} ->
        {:ok, secrets}

      _other ->
        {:error, :not_found}
    end
  end

  @doc false
  def put_validation_secrets(tenant_external_id, db_user, %ValidationSecrets{} = secrets) do
    if should_bypass_cache?(db_user) do
      :ok
    else
      # Strip client_key from sasl_secrets before caching
      cleaned =
        if secrets.sasl_secrets do
          %{secrets | sasl_secrets: %{secrets.sasl_secrets | client_key: nil}}
        else
          secrets
        end

      validation_key = {:secrets_for_validation, tenant_external_id, db_user}

      Cachex.put(Supavisor.Cache, validation_key, cleaned, ttl: @default_secrets_ttl)
    end
  end

  @doc """
  Invalidates cached secrets for a tenant/user on the local node.
  """
  @spec invalidate_local(String.t(), String.t()) :: :ok
  def invalidate_local(tenant_external_id, db_user) do
    Cachex.del(Supavisor.Cache, {:secrets_for_validation, tenant_external_id, db_user})
    Cachex.del(Supavisor.Cache, {:secrets_check, tenant_external_id, db_user})
    :ok
  end

  @doc """
  Invalidates cached secrets for a tenant/user across the cluster.
  """
  @spec invalidate_global(String.t(), String.t()) :: :ok
  def invalidate_global(tenant_external_id, db_user) do
    :erpc.multicall([Node.self() | Node.list()], __MODULE__, :invalidate_local, [
      tenant_external_id,
      db_user
    ])

    :ok
  end

  ## Private

  @doc false
  def cache_fetch_validation_secrets(tenant_external_id, db_user, cachex_fetch_fn) do
    if should_bypass_cache?(db_user) do
      case cachex_fetch_fn.() do
        {:commit, secrets, _opts} -> {:ok, secrets}
        {:ignore, resp} -> resp
      end
    else
      cache_key = {:secrets_for_validation, tenant_external_id, db_user}

      case Cachex.fetch(Supavisor.Cache, cache_key, cachex_fetch_fn) do
        {:ok, value} -> {:ok, value}
        {:commit, value, _opts} -> {:ok, value}
        {:ignore, resp} -> resp
        {:error, _} = error -> error
      end
    end
  end

  # TODO: this is a thin wrapper over fetch_from_secret_checker_or_auth_query
  # We should either remove it or make that more explicit
  defp fetch_secrets_from_database(id, tenant, manager_secrets) do
    with :ok <- Supavisor.CircuitBreaker.check(tenant.external_id, :get_secrets),
         {:ok, secrets, cache} <-
           fetch_from_secret_checker_or_auth_query(id, tenant, manager_secrets) do
      {:ok, secrets, cache}
    else
      {:error, %Supavisor.Errors.CircuitBreakerError{}} = error ->
        error

      {:error, _} = error ->
        Supavisor.CircuitBreaker.record_failure(tenant.external_id, :get_secrets)
        error
    end
  end

  # Both paths store the fetched secrets in the cache, and return whether they changed it.
  defp fetch_from_secret_checker_or_auth_query(id, tenant, manager_secrets) do
    case Supavisor.SecretChecker.get_secrets(id) do
      {:ok, _secrets, _cache} = ok ->
        ok

      {:error, :not_started} ->
        Logger.info("SecretChecker not started, using a one-off auth_query connection")

        case AuthQuery.connect_and_fetch_user_secret(
               tenant,
               manager_secrets,
               tenant.auth_query,
               Supavisor.id(id, :user)
             ) do
          {:ok, sasl_secrets} ->
            secrets = ValidationSecrets.from_sasl_secrets(sasl_secrets)
            cache = refresh_if_changed(tenant.external_id, Supavisor.id(id, :user), secrets)
            {:ok, secrets, cache}

          {:error, _} = error ->
            error
        end

      {:error, _} = error ->
        error
    end
  end

  # Notice that this is only valid for pg_shadow sourced SASL secrets, since the salt will change
  # if we have locally generated password.
  defp sasl_secrets_changed?(%ValidationSecrets{sasl_secrets: current}, %ValidationSecrets{
         sasl_secrets: new
       }) do
    %{current | client_key: nil} != %{new | client_key: nil}
  end

  defp should_bypass_cache?(user) do
    bypass_users = Application.get_env(:supavisor, :cache_bypass_users, [])
    user in bypass_users
  end
end
