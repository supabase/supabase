defmodule Supavisor.HandlerHelpers do
  @moduledoc false

  require Supavisor.Protocol.Server, as: Server

  @spec sock_send(Supavisor.sock(), iodata()) :: :ok | {:error, term()}
  def sock_send({mod, sock}, data) do
    mod.send(sock, data)
  end

  @spec sock_close(Supavisor.sock() | nil | {any(), nil}) :: :ok | {:error, term()}
  def sock_close(nil), do: :ok
  def sock_close({_, nil}), do: :ok

  def sock_close({mod, sock}), do: mod.close(sock)

  @spec setopts(Supavisor.sock(), term()) :: :ok | {:error, term()}
  def setopts({mod, sock}, opts) do
    mod = if mod == :gen_tcp, do: :inet, else: mod
    mod.setopts(sock, opts)
  end

  @spec try_get_sni(Supavisor.sock()) :: String.t() | nil
  def try_get_sni({:ssl, sock}) do
    case :ssl.connection_information(sock, [:sni_hostname]) do
      {:ok, [sni_hostname: sni]} -> List.to_string(sni)
      _ -> nil
    end
  end

  def try_get_sni(_), do: nil

  @spec parse_user_info(map) ::
          {:cluster | :single, {String.t() | nil, String.t(), String.t() | nil}}
  def parse_user_info(%{"user" => user, "options" => %{"reference" => ref}} = payload) do
    # TODO: parse ref for cluster
    {:single, {user, ref, payload["database"]}}
  end

  def parse_user_info(%{"user" => user} = payload) do
    db_name = payload["database"]

    case :binary.split(user, ".cluster.") do
      [user] ->
        case :binary.matches(user, ".") do
          [] ->
            {:single, {user, nil, db_name}}

          matches ->
            {pos, 1} = List.last(matches)
            <<name::size(pos)-binary, ?., external_id::binary>> = user
            {:single, {name, external_id, db_name}}
        end

      [user, tenant] ->
        {:cluster, {user, tenant, db_name}}
    end
  end

  @doc """
  Takes an allow list of CIDR ranges and filtres them for ranges which contain the address
  to test.

  If the IP address of the socket is not found an empty list is returned.

  ## Examples

    iex> Supavisor.HandlerHelpers.filter_cidrs(["0.0.0.0/0", "::/0"], {127, 0, 0, 1})
    ["0.0.0.0/0"]

    iex> Supavisor.HandlerHelpers.filter_cidrs(["71.209.249.38/32"], {71, 209, 249, 39})
    []

    iex> Supavisor.HandlerHelpers.filter_cidrs(["0.0.0.0/0", "::/0"], {8193, 3512, 34211, 0, 0, 35374, 880, 29492})
    ["::/0"]

    iex> Supavisor.HandlerHelpers.filter_cidrs(["0.0.0.0/0", "::/0"], :error)
    []

  """

  @spec filter_cidrs(list(), :inet.ip_address() | any()) :: list()
  def filter_cidrs(allow_list, addr) when is_list(allow_list) and is_tuple(addr) do
    for range <- allow_list,
        range |> InetCidr.parse_cidr!() |> InetCidr.contains?(addr) do
      range
    end
  end

  def filter_cidrs(allow_list, _addr) when is_list(allow_list) do
    []
  end

  @spec addr_from_sock(Supavisor.sock()) :: {:ok, :inet.ip_address()} | :error
  def addr_from_sock({:gen_tcp, port}) do
    case :inet.peername(port) do
      {:ok, {:local, _}} ->
        :error

      {:ok, {:undefined, _}} ->
        :error

      {:ok, {:unspec, _}} ->
        :error

      {:ok, {addr, _port}} ->
        {:ok, addr}

      {:error, _} ->
        :error
    end
  end

  def addr_from_sock({:ssl, port}) do
    case :ssl.peername(port) do
      {:ok, {addr, _port}} ->
        {:ok, addr}

      {:error, _} ->
        :error
    end
  end
end
