defmodule Realtime.GenRpc do
  @moduledoc """
  RPC module for Realtime using :gen_rpc

  Two separate connection pools are maintained per remote node:

  - Cast pool: used by `cast/5`, `abcast/4`, `multicast/4`. Size controlled by
    `MAX_GEN_RPC_CLIENTS` env var (default 5). Client tags: `{:cast, 1..N}`.

  - Call pool: used by `call/5`, `multicall/4`. Size controlled by
    `MAX_GEN_RPC_CALL_CLIENTS` env var (default 1). Client tags: `{:call, 1..M}`.
  """
  use Realtime.Logs
  alias Realtime.Telemetry

  @type result :: any | {:error, :rpc_error, reason :: any}

  @doc """
  Broadcasts the message `msg` asynchronously to the registered process `name` on the specified `nodes`.

  Options:

  - `:key` - Optional key to consistently select the same gen_rpc clients to guarantee message order between nodes
  """
  @spec abcast([node], atom, any, keyword()) :: :ok
  def abcast(nodes, name, msg, opts) when is_list(nodes) and is_atom(name) and is_list(opts) do
    key = Keyword.get(opts, :key, nil)

    {local, remote} = Enum.split_with(nodes, &(&1 == node()))

    if local != [], do: send({name, node()}, msg)

    remote
    |> cast_rpc_nodes(key)
    |> :gen_rpc.abcast(name, msg)

    :ok
  end

  @doc """
  Fire and forget apply(mod, func, args) on one node

  Options:

  - `:key` - Optional key to consistently select the same gen_rpc client to guarantee some message order between nodes
  """
  @spec cast(node, module, atom, list(any), keyword()) :: :ok
  def cast(node, mod, func, args, opts \\ [])

  # Local
  def cast(node, mod, func, args, _opts) when node == node() do
    :erpc.cast(node, mod, func, args)
    :ok
  end

  def cast(node, mod, func, args, opts)
      when is_atom(node) and is_atom(mod) and is_atom(func) and is_list(args) and is_list(opts) do
    key = Keyword.get(opts, :key, nil)

    # Ensure this node is part of the connected nodes
    if node in Node.list() do
      node_key = cast_rpc_node(node, key)

      :gen_rpc.cast(node_key, mod, func, args)
    end

    :ok
  end

  @doc """
  Fire and forget apply(mod, func, args) on all nodes

  Options:

  - `:key` - Optional key to consistently select the same gen_rpc clients to guarantee message order between nodes
  """
  @spec multicast(module, atom, list(any), keyword()) :: :ok
  def multicast(mod, func, args, opts \\ []) when is_atom(mod) and is_atom(func) and is_list(args) and is_list(opts) do
    key = Keyword.get(opts, :key, nil)

    nodes = cast_rpc_nodes(Node.list(), key)

    # Use erpc for the local node because :gen_rpc tries to connect with the local node
    :ok = :erpc.cast(Node.self(), mod, func, args)
    :gen_rpc.eval_everywhere(nodes, mod, func, args)
    :ok
  end

  @doc """
  Calls node to apply(mod, func, args)

  Options:

  - `:key` - Optional key to consistently select the same gen_rpc clients to guarantee message order between nodes
  - `:tenant_id` - Tenant ID for logging, defaults to nil
  - `:timeout` - timeout in milliseconds for the RPC call, defaults to 5000ms
  """
  @spec call(node, module, atom, list(any), keyword()) :: result
  def call(node, mod, func, args, opts)
      when is_atom(node) and is_atom(mod) and is_atom(func) and is_list(args) and is_list(opts) do
    if node == node() or node in Node.list() do
      do_call(node, mod, func, args, opts)
    else
      tenant_id = Keyword.get(opts, :tenant_id)

      log_error(
        "ErrorOnRpcCall",
        %{target: node, mod: mod, func: func, error: :badnode},
        project: tenant_id,
        external_id: tenant_id
      )

      {:error, :rpc_error, :badnode}
    end
  end

  defp do_call(node, mod, func, args, opts) do
    timeout = Keyword.get(opts, :timeout, default_rpc_timeout())
    tenant_id = Keyword.get(opts, :tenant_id)
    key = Keyword.get(opts, :key, nil)

    node_key = call_rpc_node(node, key)
    {latency, response} = :timer.tc(fn -> :gen_rpc.call(node_key, mod, func, args, timeout) end)

    case response do
      {:badrpc, reason} ->
        reason = unwrap_reason(reason)

        log_error(
          "ErrorOnRpcCall",
          %{target: node, mod: mod, func: func, error: reason},
          project: tenant_id,
          external_id: tenant_id
        )

        telemetry_failure(node, latency)

        {:error, :rpc_error, reason}

      {:error, _} ->
        telemetry_failure(node, latency)
        response

      _ ->
        telemetry_success(node, latency)
        response
    end
  end

  # Not using :gen_rpc.multicall here because we can't see the actual results on errors
  @doc """
  Evaluates apply(mod, func, args) on all nodes

  Options:

  - `:timeout` - timeout for the RPC call, defaults to 5000ms
  - `:tenant_id` - tenant ID for telemetry and logging, defaults to nil
  - `:key` - Optional key to consistently select the same gen_rpc clients to guarantee message order between nodes
  """
  @spec multicall(module, atom, list(any), keyword()) :: [{node, result}]
  def multicall(mod, func, args, opts \\ []) when is_atom(mod) and is_atom(func) and is_list(args) and is_list(opts) do
    timeout = Keyword.get(opts, :timeout, default_rpc_timeout())
    tenant_id = Keyword.get(opts, :tenant_id)
    key = Keyword.get(opts, :key, nil)

    nodes = call_rpc_nodes([node() | Node.list()], key)
    # Latency here is the amount of time that it takes for this node to gather the result.
    # If one node takes a while to reply the remaining calls will have at least the latency reported by this node
    # Example:
    # Node A, B and C receive the calls in this order
    # Node A takes 500ms to return on nb_yield
    # Node B and C will report at least 500ms to return regardless how long it took for them to actually reply back
    results =
      nodes
      |> Enum.map(&{&1, :erlang.monotonic_time(), async_call(&1, mod, func, args)})
      |> Enum.map(fn {{node, _key}, start_time, ref} ->
        result =
          case nb_yield(node, ref, timeout) do
            :timeout -> {:error, :rpc_error, :timeout}
            {:value, {:badrpc, reason}} -> {:error, :rpc_error, unwrap_reason(reason)}
            {:value, result} -> result
          end

        end_time = :erlang.monotonic_time()
        latency = :erlang.convert_time_unit(end_time - start_time, :native, :microsecond)
        {node, latency, result}
      end)

    Enum.map(results, fn
      {node, latency, {:error, :rpc_error, reason} = result} ->
        log_error(
          "ErrorOnRpcCall",
          %{target: node, mod: mod, func: func, error: reason},
          project: tenant_id,
          external_id: tenant_id
        )

        telemetry_failure(node, latency)
        {node, result}

      {node, latency, {:ok, _} = result} ->
        telemetry_success(node, latency)
        {node, result}

      {node, latency, result} ->
        telemetry_failure(node, latency)
        {node, result}
    end)
  end

  @doc """
  Tells gen_rpc which port to dial `node` on, by asking that node over Erlang distribution.

  Only `config/runtime.exs` in dev wires this in, as
  `config :gen_rpc, client_config_per_node: {:external, __MODULE__}`: several nodes on one machine
  cannot share a port, so each takes a free one. Everywhere else every node listens on the same
  port and gen_rpc's own default answers for them.

  gen_rpc calls this once per node while opening a client connection (`gen_rpc_client.erl:252`),
  and expects `{driver, port}` or `{:error, reason}`.
  """
  @spec get_config(node) :: {:tcp | :ssl, :inet.port_number()} | {:error, term()}
  def get_config(node) do
    driver = Application.get_env(:gen_rpc, :default_client_driver, :tcp)
    key = if driver == :ssl, do: :ssl_server_port, else: :tcp_server_port

    case :erpc.call(node, :application, :get_env, [:gen_rpc, key], to_timeout(second: 5)) do
      {:ok, port} when is_integer(port) -> {driver, port}
      other -> {:error, {:no_gen_rpc_port, node, other}}
    end
  end

  defp telemetry_success(node, latency) do
    Telemetry.execute(
      [:realtime, :rpc],
      %{latency: latency},
      %{origin_node: node(), target_node: node, success: true, mechanism: :gen_rpc}
    )
  end

  defp telemetry_failure(node, latency) do
    Telemetry.execute(
      [:realtime, :rpc],
      %{latency: latency},
      %{origin_node: node(), target_node: node, success: false, mechanism: :gen_rpc}
    )
  end

  defp max_cast_clients, do: Application.fetch_env!(:realtime, :max_gen_rpc_clients)
  defp max_call_clients, do: Application.fetch_env!(:realtime, :max_gen_rpc_call_clients)

  defp cast_rpc_nodes(nodes, key), do: Enum.map(nodes, &cast_rpc_node(&1, key))
  defp call_rpc_nodes(nodes, key), do: Enum.map(nodes, &call_rpc_node(&1, key))

  defp cast_rpc_node(node, nil), do: {node, {:cast, :rand.uniform(max_cast_clients())}}
  defp cast_rpc_node(node, key), do: {node, {:cast, :erlang.phash2(key, max_cast_clients()) + 1}}

  defp call_rpc_node(node, nil), do: {node, {:call, :rand.uniform(max_call_clients())}}
  defp call_rpc_node(node, key), do: {node, {:call, :erlang.phash2(key, max_call_clients()) + 1}}

  defp unwrap_reason({:unknown_error, {{:badrpc, reason}, _}}), do: reason
  defp unwrap_reason(reason), do: reason

  defp default_rpc_timeout, do: Application.get_env(:realtime, :rpc_timeout, 5_000)

  # Here we run the async_call on all nodes using gen_rpc except the local node
  # This is because gen_rpc does not have a bypass for local node on multicall
  # For the local node we use rpc instead
  defp async_call({node, _}, mod, func, args) when node == node(), do: :rpc.async_call(node, mod, func, args)
  defp async_call(node, mod, func, args), do: :gen_rpc.async_call(node, mod, func, args)

  defp nb_yield(node, ref, timeout) when node == node(), do: :rpc.nb_yield(ref, timeout)
  defp nb_yield(_node, ref, timeout), do: :gen_rpc.nb_yield(ref, timeout)
end
