defmodule Supavisor.SecretChecker do
  @moduledoc false

  use GenServer
  require Logger
  require Supavisor

  alias Supavisor.AuthQuery
  alias Supavisor.ClientAuthentication
  alias Supavisor.ClientAuthentication.ValidationSecrets
  alias Supavisor.Errors.AuthQueryError

  @interval :timer.seconds(15)

  def start_link(args) do
    name = {:via, Registry, {Supavisor.Registry.Tenants, {:secret_checker, args.id}}}
    GenServer.start_link(__MODULE__, args, name: name)
  end

  @spec get_secrets(Supavisor.id()) ::
          {:ok, ValidationSecrets.t(), :changed | :noop}
          | {:error, :not_started}
          | {:error, :no_auth_config}
          | {:error, Supavisor.Errors.AuthQueryError.t()}
  def get_secrets(id) do
    erpc_call_node(id, __MODULE__, :do_get_secrets, [id])
  end

  @doc false
  def do_get_secrets(id) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:secret_checker, id}) do
      [] ->
        {:error, :not_started}

      [{pid, _}] ->
        try do
          GenServer.call(pid, :get_secrets, 1_000)
        catch
          :exit, {:timeout, _} ->
            {:error, %AuthQueryError{reason: :timeout}}

          :exit, reason ->
            Logger.error("SecretChecker: get_secrets call exited: #{inspect(reason)}")
            {:error, :not_started}
        end
    end
  end

  @spec update_credentials(Supavisor.id(), String.t(), String.t()) ::
          :ok | {:error, :not_started}
  def update_credentials(id, new_user, password) do
    erpc_call_node(id, __MODULE__, :do_update_credentials, [id, new_user, password])
  end

  @doc false
  def do_update_credentials(id, new_user, password) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:secret_checker, id}) do
      [] ->
        {:error, :not_started}

      [{pid, _}] ->
        GenServer.call(pid, {:update_credentials, new_user, password})
    end
  end

  def init(args) do
    Logger.debug("SecretChecker: Starting secret checker")
    Supavisor.id(tenant: tenant_external_id, user: pool_user) = args.id

    tenant = Supavisor.Tenants.get_tenant_cache(tenant_external_id, nil)
    manager_secrets = Supavisor.Tenants.get_manager_user_cache(tenant_external_id)

    state = %{
      tenant: tenant_external_id,
      tenant_record: tenant,
      manager_secrets: manager_secrets,
      user: pool_user,
      ttl: :timer.hours(24),
      conn: nil,
      check_ref: check()
    }

    Logger.metadata(project: tenant_external_id, user: pool_user)
    {:ok, state, {:continue, :init_conn}}
  end

  def handle_continue(:init_conn, %{manager_secrets: nil} = state) do
    # No manager user (require_user: true tenant), skip connection setup
    {:noreply, state}
  end

  def handle_continue(:init_conn, state) do
    {:ok, conn} = AuthQuery.start_link(state.tenant_record, state.manager_secrets)
    {:noreply, %{state | conn: conn}}
  end

  def handle_info(:check, %{manager_secrets: nil} = state) do
    {:noreply, %{state | check_ref: check()}}
  end

  def handle_info(:check, state) do
    with {:ok, _secrets, :changed} <- check_secrets(state.user, state) do
      Logger.info("Secrets changed or not present, updating cache")
    end

    {:noreply, %{state | check_ref: check()}}
  end

  def handle_info(msg, state) do
    Logger.error("Unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  def terminate(_reason, state) do
    if state.conn, do: AuthQuery.stop_connection_async(state.conn)
  end

  def check(interval \\ @interval),
    do: Process.send_after(self(), :check, interval + jitter())

  def check_secrets(user, %{tenant_record: tenant, conn: conn} = state) do
    case AuthQuery.fetch_user_secret(conn, tenant.auth_query, user) do
      {:ok, sasl_secrets} ->
        validation_secrets = ValidationSecrets.from_sasl_secrets(sasl_secrets)

        cache =
          ClientAuthentication.refresh_if_changed(state.tenant, state.user, validation_secrets)

        {:ok, validation_secrets, cache}

      other ->
        Logger.error("Failed to get secret: #{inspect(other)}")
        other
    end
  end

  def handle_call(:get_secrets, _from, %{manager_secrets: nil} = state) do
    {:reply, {:error, :no_auth_config}, state}
  end

  def handle_call(:get_secrets, _from, state) do
    {:reply, check_secrets(state.user, state), state}
  end

  def handle_call({:update_credentials, new_user, password}, _from, state) do
    alias Supavisor.Secrets.ManagerSecrets

    Logger.info("SecretChecker: changing auth_query user to #{new_user}")

    new_manager = %ManagerSecrets{db_user: new_user, db_password: password}
    {:ok, new_conn} = AuthQuery.start_link(state.tenant_record, new_manager)

    AuthQuery.stop_connection_async(state.conn)

    Logger.info("SecretChecker: Successfully changed auth_query user")
    {:reply, :ok, %{state | manager_secrets: new_manager, conn: new_conn}}
  end

  defp jitter, do: :rand.uniform(div(@interval, 10))

  defp erpc_call_node(id, mod, fun, args) do
    case Supavisor.get_global_sup(id) do
      nil ->
        {:error, :not_started}

      pid ->
        try do
          :erpc.call(node(pid), mod, fun, args)
        catch
          :exit, reason ->
            Logger.error("SecretChecker: erpc call exited: #{inspect(reason)}")
            {:error, :not_started}
        end
    end
  end
end
