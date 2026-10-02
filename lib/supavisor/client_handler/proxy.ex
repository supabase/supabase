defmodule Supavisor.ClientHandler.Proxy do
  @moduledoc """
  Handles proxy connection logic for ClientHandler.
  """

  require Logger
  require Supavisor

  alias Supavisor.ClientHandler.Proxy.Supervisor, as: ProxySupervisor

  alias Supavisor.Errors.{
    MaxConnectionsError,
    FailedToStartProxyConnectionError,
    ProxySupervisorUnavailableError
  }

  @max_sup_retries 3

  @type start_error ::
          MaxConnectionsError.t()
          | FailedToStartProxyConnectionError.t()
          | ProxySupervisorUnavailableError.t()

  @doc """
  Starts a proxy DbHandler for the given tenant.

  Ensures the proxy supervisor tree exists, then starts a DbHandler under it.

  Retries up to #{@max_sup_retries} times when the supervisor disappears between
  lookup and use (race with watchdog shutdown).

  Returns `{:ok, db_pid}` on success, or one of the errors defined in `start_error()`.
  """
  @spec start_proxy_connection(
          Supavisor.id(),
          pos_integer(),
          Supavisor.ConnectionParameters.t(),
          map(),
          map(),
          keyword()
        ) ::
          {:ok, pid()} | {:error, start_error()}
  def start_proxy_connection(
        id,
        max_clients,
        connection_params,
        tenant_feature_flags,
        pool_ranch,
        client_opts
      ) do
    child_spec =
      Supavisor.DbHandler.child_spec(
        build_db_handler_args(
          id,
          connection_params,
          tenant_feature_flags,
          pool_ranch,
          client_opts
        )
      )

    do_start_proxy_connection(id, max_clients, child_spec, @max_sup_retries)
  end

  # This function is public for test purposes, so we can test the logic
  # with mock processes, not DbHandlers
  @doc false
  @spec do_start_proxy_connection(
          Supavisor.id(),
          max_clients :: pos_integer(),
          Supervisor.child_spec(),
          attempts_remaining :: non_neg_integer()
        ) ::
          {:ok, pid()} | {:error, start_error()}
  def do_start_proxy_connection(_id, _max_clients, _child_spec, 0) do
    {:error, %ProxySupervisorUnavailableError{}}
  end

  def do_start_proxy_connection(id, max_clients, child_spec, retries) do
    with :ok <- ProxySupervisor.ensure_started(id, max_clients),
         {:ok, pid} <- ProxySupervisor.start_connection(id, child_spec) do
      {:ok, pid}
    else
      {:error, :max_children} ->
        {:error, MaxConnectionsError.new(:proxy, max_clients)}

      {:error, :proxy_sup_not_found} ->
        do_start_proxy_connection(id, max_clients, child_spec, retries - 1)

      {:error, :failed_to_start} ->
        {:error, %FailedToStartProxyConnectionError{}}
    end
  catch
    :exit, _reason ->
      do_start_proxy_connection(id, max_clients, child_spec, retries - 1)
  end

  @spec build_db_handler_args(
          Supavisor.id(),
          Supavisor.ConnectionParameters.t(),
          map(),
          map(),
          keyword()
        ) :: map()
  defp build_db_handler_args(
         Supavisor.id(tenant: tenant, user: user) = id,
         connection_params,
         tenant_feature_flags,
         pool_ranch,
         client_opts
       ) do
    proxy_connection_params = %{
      connection_params
      | port: pool_ranch.port,
        host: to_charlist(pool_ranch.host),
        ip_version: :inet,
        upstream_ssl: false,
        upstream_tls_ca: nil,
        upstream_verify: nil
    }

    %{
      id: id,
      connection_params: proxy_connection_params,
      user: user,
      tenant: tenant,
      tenant_feature_flags: tenant_feature_flags,
      replica_type: :write,
      mode: :proxy,
      proxy: true,
      log_level: nil,
      client_tls: Keyword.fetch!(client_opts, :client_ssl),
      client_jit: Keyword.fetch!(client_opts, :client_jit),
      client_ip: Keyword.get(client_opts, :client_ip)
    }
  end
end
