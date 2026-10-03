defmodule Clustered do
  @moduledoc """
  Uses the gist https://gist.github.com/ityonemo/177cbc96f8c8722bfc4d127ff9baec62 to start a node for testing
  """

  import WaitForIt

  alias Realtime.Env

  @port_wait_timeout_ms 5_000
  @port_wait_interval_ms 100

  @gen_rpc_wait_timeout_ms 15_000
  @gen_rpc_poll_start_ms 20
  @gen_rpc_poll_max_ms 200

  @doc """
  Starts a node for testing.

  Can receive an auxiliary module to be evaluated in the node so you are able to setup functions within the test context and outside of the normal code context

  e.g.
  ```
  @aux_mod (quote do
              defmodule Aux do
                def checker(res), do: res
              end
            end)

  Code.eval_quoted(@aux_mod)
  test "clustered call" do
    {:ok, node} = Clustered.start(@aux_mod)
    assert ok = :rpc.call(node, Aux, :checker, [:ok])
  end
  ```

  ## Options

  - `:warm_clients` - Whether to eagerly establish the gen_rpc client pool against the node
    before returning, defaulting to `true`. Set to `false` when the node is intentionally
    unreachable (e.g. a broken gen_rpc port), so warming doesn't leave dead client processes
    that can race with the test's own calls.

  """
  @spec start(any(), keyword()) :: {:ok, node}
  def start(aux_mod \\ nil, opts \\ []) do
    {:ok, pid, node} = start_disconnected(aux_mod, opts)

    :ok = wait_for_gen_rpc(pid)

    true = Node.connect(node)

    if Access.get(opts, :warm_clients, true) do
      max_cast_clients = Application.get_env(:realtime, :max_gen_rpc_clients, 5)
      max_call_clients = Application.get_env(:realtime, :max_gen_rpc_call_clients, 1)

      for key <- 1..max_cast_clients do
        _ = :gen_rpc.call({node, {:cast, key}}, :erlang, :node, [], 5_000)
      end

      for key <- 1..max_call_clients do
        _ = :gen_rpc.call({node, {:call, key}}, :erlang, :node, [], 5_000)
      end
    end

    {:ok, node}
  end

  @doc """
  Similar to `start/2` but the node is not connected automatically
  """
  @spec start_disconnected(any(), keyword()) :: {:ok, :peer.server_ref(), node}
  def start_disconnected(aux_mod \\ nil, opts \\ []) do
    extra_config = Keyword.get(opts, :extra_config, [])
    phoenix_port = Keyword.get(opts, :phoenix_port, TestEnv.peer_http_port())
    name = opts |> Keyword.get(:name, :peer.random_name()) |> TestEnv.peer_name()

    node_name = TestEnv.node_name()

    :ok =
      case :net_kernel.start([node_name]) do
        {:ok, _} ->
          :ok

        {:error, {:already_started, _}} ->
          :ok

        {:error, reason} ->
          raise "Failed to start node: #{inspect(reason)}"
      end

    true = :erlang.set_cookie(:cookie)

    {:ok, pid, node} =
      ExUnit.Callbacks.start_supervised(%{
        id: {:peer, name},
        start:
          {:peer, :start_link,
           [
             %{
               name: name,
               host: ~c"127.0.0.1",
               longnames: true,
               connection: :standard_io
             }
           ]}
      })

    :peer.call(pid, :erlang, :set_cookie, [:cookie])

    :ok = :peer.call(pid, :code, :add_paths, [:code.get_path()])

    # We need to load the app first as it has default app env that we want to override
    :ok = :peer.call(pid, Application, :ensure_loaded, [:gen_rpc])

    for {app_name, _, _} <- Application.loaded_applications(),
        {key, value} <- Application.get_all_env(app_name) do
      :ok = :peer.call(pid, Application, :put_env, [app_name, key, value])
    end

    endpoint = Application.get_env(:realtime, RealtimeWeb.Endpoint)

    :ok =
      :peer.call(pid, Application, :put_env, [
        :realtime,
        RealtimeWeb.Endpoint,
        Keyword.put(endpoint, :http, port: phoenix_port)
      ])

    # Configure gen_rpc swapping port definitons
    gen_rpc_tcp_server_port = Application.fetch_env!(:gen_rpc, :tcp_server_port)
    gen_rpc_tcp_client_port = Application.fetch_env!(:gen_rpc, :tcp_client_port)
    peer_gen_rpc_port = peer_gen_rpc_port(extra_config, gen_rpc_tcp_client_port)

    :ok = :peer.call(pid, Application, :put_env, [:gen_rpc, :tcp_server_port, gen_rpc_tcp_client_port])
    :ok = :peer.call(pid, Application, :put_env, [:gen_rpc, :tcp_client_port, gen_rpc_tcp_server_port])

    # We need to override this value as the current implementation overrides the string with a map leading to errors
    :ok = :peer.call(pid, Application, :put_env, [:realtime, :jwt_claim_validators, "{}"])

    # Override with extra config
    for {app_name, key, value} <- extra_config do
      :ok = :peer.call(pid, Application, :put_env, [app_name, key, value])
    end

    await_port_available!(peer_gen_rpc_port, "gen_rpc", "TEST_PEER_GEN_RPC_PORT_BASE")
    await_port_available!(phoenix_port, "Phoenix", "TEST_PEER_PORT_BASE")

    # :peer.call/4 defaults to a 5s gen_server.call timeout, which starting the full
    # :realtime app (DB pools, endpoint, etc.) on the peer can exceed under CI CPU
    # contention. Give a more generous timeout instead.
    peer_call_timeout = to_timeout(second: 12)

    {:ok, _} = :peer.call(pid, Application, :ensure_all_started, [:gen_rpc], peer_call_timeout)
    {:ok, _} = :peer.call(pid, Application, :ensure_all_started, [:mix], peer_call_timeout)
    :ok = :peer.call(pid, Mix, :env, [Mix.env()])

    Enum.each(
      [:logger, :runtime_tools, :prom_ex, :mix, :os_mon, :realtime],
      fn app -> {:ok, _} = :peer.call(pid, Application, :ensure_all_started, [app], peer_call_timeout) end
    )

    if aux_mod do
      {{:module, _, _, _}, []} = :peer.call(pid, Code, :eval_quoted, [aux_mod])
    end

    {:ok, pid, node}
  end

  defp wait_for_gen_rpc(pid) do
    port = :peer.call(pid, Application, :get_env, [:gen_rpc, :tcp_server_port])

    case port do
      port when is_integer(port) and port > 0 -> wait_for_port({127, 0, 0, 1}, port)
      _ -> raise "gen_rpc tcp_server_port is not configured: #{inspect(port)}"
    end
  end

  # The peer's own gen_rpc server port: extra_config wins, otherwise it inherits the
  # local node's client port (they are swapped above so the two can talk).
  defp peer_gen_rpc_port(extra_config, default) do
    Enum.find_value(extra_config, default, fn
      {:gen_rpc, :tcp_server_port, port} -> port
      _ -> nil
    end)
  end

  # A peer that stopped moments ago may still be releasing its port, hence the retries.
  # Anything still holding it after that is another test run or a dev server, and starting
  # the peer anyway only fails later and less clearly.
  defp await_port_available!(port, label, env_var) do
    available? =
      wait(Env.port_available?(port),
        timeout: @port_wait_timeout_ms,
        interval: @port_wait_interval_ms
      )

    if not available? do
      raise """
      #{label} port #{port} is still in use after #{div(@port_wait_timeout_ms, 1000)}s.
      Another test run or a dev server is bound to it. Set #{env_var} to move this run to a free block.
      """
    end

    :ok
  end

  defp wait_for_port(host, port) do
    case_wait :gen_tcp.connect(host, port, [:binary, active: false], 200),
      timeout: @gen_rpc_wait_timeout_ms,
      interval: WaitForIt.Backoff.exponential(start: @gen_rpc_poll_start_ms, max: @gen_rpc_poll_max_ms) do
      {:ok, socket} ->
        :ok = :gen_tcp.close(socket)
        :ok
    else
      {:error, reason} ->
        raise "gen_rpc tcp server on port #{port} did not start in time. Last error: #{inspect(reason)}"
    end
  end
end
