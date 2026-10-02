defmodule Supavisor.Helpers do
  @moduledoc false
  require Logger

  @spec check_creds_get_ver(map) :: {:ok, String.t() | nil} | {:error, String.t()}

  def check_creds_get_ver(%{"require_user" => false} = params) do
    cond do
      length(params["users"]) != 1 ->
        {:error, "Can't use 'require_user' and 'auth_query' with multiple users"}

      !hd(params["users"])["is_manager"] ->
        {:error, "Can't use 'require_user' and 'auth_query' with non-manager user"}

      true ->
        do_check_creds_get_ver(params)
    end
  end

  def check_creds_get_ver(%{"users" => _} = params) do
    do_check_creds_get_ver(params)
  end

  def check_creds_get_ver(_), do: {:ok, nil}

  def do_check_creds_get_ver(params) do
    upstream_verify =
      if params["upstream_verify"] == "peer", do: :peer, else: nil

    Enum.reduce_while(params["users"], {nil, nil}, fn user, _ ->
      upstream_ssl = !!params["upstream_ssl"]

      ssl_opts =
        if upstream_ssl and upstream_verify == :peer do
          [
            verify: :verify_peer,
            cacerts: [upstream_cert(params["upstream_tls_ca"])],
            server_name_indication: String.to_charlist(params["db_host"]),
            customize_hostname_check: [{:match_fun, fn _, _ -> true end}]
          ]
        else
          [verify: :verify_none]
        end

      {:ok, conn} =
        Postgrex.start_link(
          hostname: params["db_host"],
          port: params["db_port"],
          database: params["db_database"],
          password: user["db_password"],
          username: user["db_user"],
          parameters: [application_name: "Supavisor (auth_query)"],
          ssl: upstream_ssl,
          socket_options: [ip_version(params["ip_version"], params["db_host"])],
          queue_target: 1_000,
          queue_interval: 5_000,
          ssl_opts: ssl_opts
        )

      check =
        Postgrex.query(conn, "select version()", [])
        |> case do
          {:ok, %{rows: [[version]]}} ->
            if params["require_user"] do
              {:cont, {:ok, version}}
            else
              case Supavisor.AuthQuery.fetch_user_secret(
                     conn,
                     params["auth_query"],
                     user["db_user"]
                   ) do
                {:ok, _} ->
                  {:halt, {:ok, version}}

                {:error, reason} ->
                  {:halt, {:error, reason}}
              end
            end

          {:error, reason} ->
            {:halt, {:error, "Can't connect the user #{user["db_user"]}: #{inspect(reason)}"}}
        end

      Supavisor.AuthQuery.stop_connection_async(conn)
      check
    end)
    |> case do
      {:ok, version} ->
        parse_pg_version(version)

      other ->
        other
    end
  end

  ## Internal functions

  @doc """
  Parses a PostgreSQL version string and returns the version number and platform.

  ## Examples

      iex> Supavisor.Helpers.parse_pg_version("PostgreSQL 14.6 (Debian 14.6-1.pgdg110+1) some string")
      {:ok, "14.6 (Debian 14.6-1.pgdg110+1)"}

      iex> Supavisor.Helpers.parse_pg_version("PostgreSQL 15.1 on aarch64-unknown-linux-gnu, compiled by gcc (Ubuntu 10.3.0-1ubuntu1~20.04) 10.3.0, 64-bit")
      {:ok, "15.1"}

      iex> Supavisor.Helpers.parse_pg_version("PostgreSQL on x86_64-pc-linux-gnu")
      {:error, "Can't parse version in PostgreSQL on x86_64-pc-linux-gnu"}
  """
  def parse_pg_version(version) do
    case Regex.run(~r/PostgreSQL\s(\d+\.\d+)(?:\s\(([^)]+)\))?.*/, version) do
      [_, version, platform] ->
        {:ok, "#{version} (#{platform})"}

      [_, version] ->
        {:ok, version}

      _ ->
        {:error, "Can't parse version in #{version}"}
    end
  end

  @doc """
  Returns the IP version for a given host.

  ## Examples

      iex> Supavisor.Helpers.ip_version(:v4, "example.com")
      :inet
      iex> Supavisor.Helpers.ip_version(:v6, "example.com")
      :inet6
      iex> Supavisor.Helpers.ip_version(nil, "example.com")
      :inet
  """
  @spec ip_version(any(), String.t()) :: :inet | :inet6
  def ip_version(:v4, _), do: :inet
  def ip_version(:v6, _), do: :inet6

  def ip_version(_, host) do
    detect_ip_version(host)
  end

  @doc """
  Detects the IP version for a given host.

  ## Examples

      iex> Supavisor.Helpers.detect_ip_version("example.com")
      :inet
      iex> Supavisor.Helpers.detect_ip_version("ipv6.example.com")
      :inet6
  """
  @spec detect_ip_version(String.t()) :: :inet | :inet6
  def detect_ip_version(host) when is_binary(host) do
    charlist = String.to_charlist(host)

    case :inet.parse_address(charlist) do
      {:ok, ip} when tuple_size(ip) == 4 ->
        :inet

      {:ok, _ip} ->
        :inet6

      {:error, _} ->
        case :inet.gethostbyname(charlist) do
          {:ok, _} -> :inet
          _ -> :inet6
        end
    end
  end

  @spec cert_to_bin(binary()) :: {:ok, binary()} | {:error, atom()}
  def cert_to_bin(cert) do
    case :public_key.pem_decode(cert) do
      [] ->
        {:error, :cant_decode_certificate}

      pem_entries ->
        cert = for {:Certificate, cert, :not_encrypted} <- pem_entries, do: cert

        case cert do
          [cert] -> {:ok, cert}
          _ -> {:error, :invalid_certificate}
        end
    end
  end

  @spec upstream_cert(binary() | nil) :: binary() | nil
  def upstream_cert(default) do
    Application.get_env(:supavisor, :global_upstream_ca) || default
  end

  @spec downstream_cert() :: Path.t() | nil
  def downstream_cert do
    Application.get_env(:supavisor, :global_downstream_cert)
  end

  @spec downstream_key() :: Path.t() | nil
  def downstream_key do
    Application.get_env(:supavisor, :global_downstream_key)
  end

  @spec downstream_ec_cert() :: Path.t() | nil
  def downstream_ec_cert do
    Application.get_env(:supavisor, :global_downstream_ec_cert)
  end

  @spec downstream_ec_key() :: Path.t() | nil
  def downstream_ec_key do
    Application.get_env(:supavisor, :global_downstream_ec_key)
  end

  @spec downstream_certs_keys() :: [map()]
  def downstream_certs_keys do
    for {cert, key} <- [
          {downstream_ec_cert(), downstream_ec_key()},
          {downstream_cert(), downstream_key()}
        ],
        cert != nil and key != nil do
      %{certfile: cert, keyfile: key}
    end
  end

  @doc """
  Builds the SCRAM client-final message and returns `{client_final, server_signature, derived_secrets}`.

  When called with `PasswordSecrets`, the expensive PBKDF2 derivation runs once and the
  resulting `SASLSecrets` are returned as the third element so the caller can cache them
  for future connections. When called with already-derived `SASLSecrets`, the third element
  is `nil` (nothing new to cache).
  """
  @spec get_client_final(map(), map(), binary(), binary(), binary()) ::
          {iolist(), binary(), Supavisor.Secrets.SASLSecrets.t() | nil}
  def get_client_final(
        %Supavisor.Secrets.PasswordSecrets{} = secrets,
        srv_first,
        client_nonce,
        user_name,
        channel
      ) do
    channel_binding = "c=#{channel}"
    nonce = ["r=", srv_first.nonce]

    salt = srv_first.salt
    i = srv_first.i

    salted_password =
      :pgo_scram.hi(PgSASLprep.scram_normalize(IO.iodata_to_binary(secrets.password)), salt, i)

    client_key = :pgo_scram.hmac(salted_password, "Client Key")
    stored_key = :pgo_scram.h(client_key)
    client_first_bare = [<<"n=">>, user_name, <<",r=">>, client_nonce]
    server_first = srv_first.raw
    client_final_without_proof = [channel_binding, ",", nonce]
    auth_message = [client_first_bare, ",", server_first, ",", client_final_without_proof]
    client_signature = :pgo_scram.hmac(stored_key, auth_message)
    client_proof = :pgo_scram.bin_xor(client_key, client_signature)

    server_key = :pgo_scram.hmac(salted_password, "Server Key")
    server_signature = :pgo_scram.hmac(server_key, auth_message)

    derived_secrets = %Supavisor.Secrets.SASLSecrets{
      user: secrets.user,
      client_key: client_key,
      server_key: server_key,
      stored_key: stored_key,
      digest: "sha-256",
      iterations: i,
      salt: salt
    }

    {[client_final_without_proof, ",p=", Base.encode64(client_proof)], server_signature,
     derived_secrets}
  end

  def get_client_final(
        %Supavisor.Secrets.SASLSecrets{} = secrets,
        srv_first,
        client_nonce,
        user_name,
        channel
      ) do
    channel_binding = "c=#{channel}"
    nonce = ["r=", srv_first.nonce]

    client_first_bare = [<<"n=">>, user_name, <<",r=">>, client_nonce]
    server_first = srv_first.raw
    client_final_without_proof = [channel_binding, ",", nonce]
    auth_message = [client_first_bare, ",", server_first, ",", client_final_without_proof]
    client_signature = :pgo_scram.hmac(secrets.stored_key, auth_message)
    client_proof = :pgo_scram.bin_xor(secrets.client_key, client_signature)

    server_signature = :pgo_scram.hmac(secrets.server_key, auth_message)

    {[client_final_without_proof, ",p=", Base.encode64(client_proof)], server_signature, nil}
  end

  def verify_password_against_scram(
        password,
        %Supavisor.Secrets.SASLSecrets{} = secrets
      ) do
    salted_password =
      :pgo_scram.hi(
        PgSASLprep.scram_normalize(IO.iodata_to_binary(password)),
        secrets.salt,
        secrets.iterations
      )

    client_key = :pgo_scram.hmac(salted_password, "Client Key")
    stored_key = :pgo_scram.h(client_key)
    stored_key == secrets.stored_key
  end

  def signatures(stored_key, server_key, srv_first, client_nonce, user_name, channel) do
    channel_binding = "c=#{channel}"
    nonce = ["r=", srv_first.nonce]
    client_first_bare = [<<"n=">>, user_name, <<",r=">>, client_nonce]
    server_first = srv_first.raw
    client_final_without_proof = [channel_binding, ",", nonce]
    auth_message = [client_first_bare, ",", server_first, ",", client_final_without_proof]

    %{
      client: :pgo_scram.hmac(stored_key, auth_message),
      server: :pgo_scram.hmac(server_key, auth_message)
    }
  end

  def hash(bin) do
    :crypto.hash(:sha256, bin)
  end

  @spec parse_server_first(binary(), binary()) :: map()
  def parse_server_first(message, nonce) do
    :pgo_scram.parse_server_first(message, nonce) |> Map.new()
  end

  @spec md5([String.t()]) :: String.t()
  def md5(strings) do
    strings
    |> :erlang.md5()
    |> Base.encode16(case: :lower)
  end

  @spec rpc(Node.t(), module(), atom(), [any()], non_neg_integer()) :: {:error, any()} | any()
  def rpc(node, module, function, args, timeout \\ 15_000) do
    :erpc.call(node, module, function, args, timeout)
  catch
    kind, reason -> {:error, {:badrpc, {kind, reason}}}
  else
    {:EXIT, _} = badrpc -> {:error, {:badrpc, badrpc}}
    result -> result
  end

  @spec parse_integer_list(String.t()) :: [integer()]
  def parse_integer_list(numbers) when is_binary(numbers) do
    numbers
    |> String.split(",", trim: true)
    |> Enum.map(&String.to_integer/1)
  end

  @doc """
  Sets the maximum heap size for the current process. The `max_heap_size` parameter is in megabytes.
  """
  @spec set_max_heap_size(pos_integer()) :: map()
  def set_max_heap_size(max_heap_size) do
    max_heap_words = div(max_heap_size * 1024 * 1024, :erlang.system_info(:wordsize))
    Process.flag(:max_heap_size, %{size: max_heap_words})
  end

  @doc """
  Sets the minimum heap size for the current process. The `min_heap_size` parameter is in megabytes.

  Returns the previous value for the `min_heap_size`.
  """
  @spec set_min_heap_size(pos_integer()) :: pos_integer()
  def set_min_heap_size(min_heap_size_mb)
      when is_integer(min_heap_size_mb) and min_heap_size_mb > 0 do
    min_heap_size_words = mb_to_words(min_heap_size_mb)
    Process.flag(:min_heap_size, min_heap_size_words)
  end

  @spec set_log_level(atom()) :: :ok | nil
  def set_log_level(level) when level in [:debug, :info, :notice, :warning, :error] do
    Logger.notice("Setting log level to #{inspect(level)}")
    Logger.put_process_level(self(), level)
  end

  def set_log_level(_), do: nil

  @spec peer_ip(:gen_tcp.socket()) :: String.t()
  def peer_ip(socket) do
    peername_fn =
      if match?({:sslsocket, _, _}, socket), do: &:ssl.peername/1, else: &:inet.peername/1

    case peername_fn.(socket) do
      {:ok, {ip, _port}} -> List.to_string(:inet.ntoa(ip))
      _ -> "undefined"
    end
  end

  # This is the value of `NAMEDATALEN` set when compiling PostgreSQL. By default
  # we use default Postgres value of `64`
  @max_length Application.compile_env(:supabase, :namedatalen, 64) - 1

  @spec validate_name(String.t()) :: boolean()
  def validate_name(name) do
    byte_size(name) in 1..@max_length and String.printable?(name)
  end

  @doc """
  Converts megabytes to Erlang words.

  ## Examples

      iex> Supavisor.Helpers.mb_to_words(1)
      131_072

      iex> Supavisor.Helpers.mb_to_words(1.5)
      196_608
  """
  @spec mb_to_words(number()) :: pos_integer()
  def mb_to_words(mb), do: round(mb * 1_048_576 / :erlang.system_info(:wordsize))

  @spec get_env_bool(String.t(), boolean()) :: boolean()
  def get_env_bool(env_var, default) do
    case System.get_env(env_var) do
      nil ->
        default

      value when value in ["true", "1"] ->
        true

      value when value in ["false", "0"] ->
        false

      value ->
        raise "Invalid boolean value for #{env_var}: #{inspect(value)}. Expected: true, false, 1, or 0"
    end
  end

  @doc """
  Parses a comma-separated `k1=v1,k2=v2` env var into a list of `{k, v}` tuples.
  """
  @spec parse_extra_labels(String.t()) :: [{String.t(), String.t()}]
  def parse_extra_labels(env_var) do
    case System.get_env(env_var, "") do
      "" ->
        []

      labels ->
        labels
        |> String.split(",")
        |> Enum.map(fn pair ->
          [k, v] = String.split(pair, "=", parts: 2)
          {k, v}
        end)
    end
  end

  def no_warm_pool_user?(user) do
    no_warm_pool_users = Application.get_env(:supavisor, :no_warm_pool_users, [])
    user in no_warm_pool_users
  end

  @doc """
  Makes an HTTPS GET request to `url` with a Bearer `token`
  and checks if the given `role` is present in the returned `user_roles` list.

  Returns:
    - `{:ok, true}` if role is present
    - `{:ok, false}` if role is absent
    - `{:error, :unauthorized}` for 401
    - `{:error, :forbidden}` for 403
    - `{:error, {:unexpected_status, status}}` for other HTTP codes
  """
  def check_user_has_jit_role(url, token, role \\ "postgres", rhost, opts \\ []) do
    opts =
      Keyword.merge(opts,
        headers: [
          authorization: "Bearer #{token}",
          "content-type": "application/json"
        ]
      )

    body =
      %{
        rhost: rhost,
        role: role
      }
      |> Jason.encode!()

    case Req.post(url, opts |> Keyword.put(:body, body)) do
      {:ok, %Req.Response{status: 200, body: %{"user_role" => %{"role" => urole}}}} ->
        {:ok, urole == role}

      {:ok, %Req.Response{status: 200, body: body}} ->
        {:error, {:invalid_response_format, body}}

      {:ok, %Req.Response{status: status}} when status in [401, 403] ->
        {:error, :unauthorized_or_forbidden}

      {:ok, %Req.Response{status: status}} ->
        {:error, {:unexpected_status, status}}

      {:error, exception} ->
        {:error, {:request_failed, Exception.message(exception)}}
    end
  end
end
