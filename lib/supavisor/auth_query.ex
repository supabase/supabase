defmodule Supavisor.AuthQuery do
  @moduledoc """
  Connects to an upstream PostgreSQL database and runs the auth query
  to fetch user secrets (SCRAM-SHA-256 or MD5).
  """

  alias Supavisor.Errors.AuthQueryError
  alias Supavisor.Helpers
  alias Supavisor.Secrets.{ManagerSecrets, SASLSecrets}
  alias Supavisor.Tenants.Tenant

  @max_scram_iterations 32_768

  @doc """
  Starts and links a Postgrex connection configured for auth-query use.
  """
  @spec start_link(Tenant.t(), ManagerSecrets.t()) ::
          {:ok, pid()} | {:error, AuthQueryError.t()}
  def start_link(%Tenant{} = tenant, %ManagerSecrets{} = manager) do
    ssl_opts = build_ssl_options(tenant)
    ip_version = Helpers.ip_version(tenant.ip_version, tenant.db_host)

    case Postgrex.start_link(
           hostname: tenant.db_host,
           port: tenant.db_port,
           database: tenant.db_database,
           password: manager.db_password,
           username: manager.db_user,
           parameters: [application_name: "Supavisor (auth_query)"],
           ssl: tenant.upstream_ssl,
           socket_options: [ip_version],
           queue_target: 1_000,
           queue_interval: 5_000,
           ssl_opts: ssl_opts
         ) do
      {:ok, pid} ->
        {:ok, pid}

      :ignore ->
        {:error, %AuthQueryError{reason: :connection_failed, details: "connection ignored"}}

      {:error, reason} ->
        {:error, %AuthQueryError{reason: :connection_failed, details: inspect(reason)}}
    end
  end

  @doc """
  Asynchronously stops a Postgrex connection. Spawns a process that attempts
  a normal stop with a 5-second timeout, then force-kills if that fails.
  """
  @spec stop_connection_async(pid()) :: :ok
  def stop_connection_async(conn) do
    Process.unlink(conn)

    spawn(fn ->
      try do
        GenServer.stop(conn, :normal, 5_000)
      catch
        :exit, _ -> Process.exit(conn, :kill)
      end
    end)

    :ok
  end

  @doc """
  Opens a one-off connection, fetches the user secret, and closes the
  connection before returning. Use this when no long-lived connection is
  available.
  """
  @spec connect_and_fetch_user_secret(
          Tenant.t(),
          ManagerSecrets.t(),
          String.t() | nil,
          String.t()
        ) ::
          {:ok, SASLSecrets.t()} | {:error, AuthQueryError.t()}
  def connect_and_fetch_user_secret(
        %Tenant{} = tenant,
        %ManagerSecrets{} = manager,
        auth_query,
        user
      ) do
    case start_link(tenant, manager) do
      {:ok, conn} ->
        result = fetch_user_secret(conn, auth_query, user)
        stop_connection_async(conn)
        result

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Runs the auth query against a connection and parses the result into
  a `SASLSecrets` struct. MD5 secrets are rejected with an error.
  """
  @spec fetch_user_secret(pid(), String.t() | nil, String.t()) ::
          {:ok, SASLSecrets.t()} | {:error, AuthQueryError.t()}
  def fetch_user_secret(_conn, nil, _user) do
    {:error, %AuthQueryError{reason: :no_auth_query}}
  end

  def fetch_user_secret(conn, auth_query, user) when is_binary(auth_query) do
    Postgrex.query!(conn, auth_query, [user])
  catch
    _error, reason ->
      {:error, %AuthQueryError{reason: :query_failed, details: reason}}
  else
    %{columns: [_, _], rows: [[^user, secret]]} ->
      parse_secret(secret, user)

    %{columns: [_, _], rows: []} ->
      {:error, %AuthQueryError{reason: :user_not_found}}

    %{columns: columns} when is_list(columns) ->
      {:error, %AuthQueryError{reason: :wrong_format}}
  end

  @doc """
  Parses a PostgreSQL secret string (from `pg_authid.rolpassword`) into
  a `SASLSecrets` struct. MD5 secrets are rejected with an error.
  """
  @spec parse_secret(String.t(), String.t()) ::
          {:ok, SASLSecrets.t()} | {:error, AuthQueryError.t()}
  def parse_secret("SCRAM-SHA-256" <> _ = secret, user) do
    # <digest>$<iteration>:<salt>$<stored_key>:<server_key>
    with [_, digest, iterations, salt, stored_key, server_key] <-
           Regex.run(~r/^(.+)\$(\d+):(.+)\$(.+):(.+)$/, secret),
         {:ok, iterations} <- validate_iterations(String.to_integer(iterations)),
         {:ok, decoded_stored_key} <- Base.decode64(stored_key),
         {:ok, decoded_server_key} <- Base.decode64(server_key),
         {:ok, decoded_salt} <- Base.decode64(salt) do
      {:ok,
       %SASLSecrets{
         user: user,
         digest: digest,
         iterations: iterations,
         salt: decoded_salt,
         stored_key: decoded_stored_key,
         server_key: decoded_server_key
       }}
    else
      {:error, %AuthQueryError{}} = error -> error
      _ -> {:error, %AuthQueryError{reason: :parse_error}}
    end
  end

  def parse_secret("md5" <> _secret, _user) do
    {:error, %AuthQueryError{reason: :md5_not_supported}}
  end

  def parse_secret(_secret, _user) do
    {:error, %AuthQueryError{reason: :unsupported_secret_format}}
  end

  ## Private

  defp validate_iterations(iterations) when iterations > @max_scram_iterations do
    {:error,
     %AuthQueryError{
       reason: :too_many_iterations,
       details: "#{iterations} exceeds the maximum of #{@max_scram_iterations}"
     }}
  end

  defp validate_iterations(iterations), do: {:ok, iterations}

  defp build_ssl_options(%Tenant{upstream_ssl: true, upstream_verify: :peer} = tenant) do
    sni = tenant.sni_hostname || tenant.db_host

    [
      verify: :verify_peer,
      cacerts: [Helpers.upstream_cert(tenant.upstream_tls_ca)],
      server_name_indication: String.to_charlist(sni),
      customize_hostname_check: [{:match_fun, fn _, _ -> true end}]
    ]
  end

  defp build_ssl_options(_tenant) do
    [verify: :verify_none]
  end
end
