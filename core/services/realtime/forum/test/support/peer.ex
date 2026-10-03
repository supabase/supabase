defmodule Peer do
  @moduledoc """
  Uses the gist https://gist.github.com/ityonemo/177cbc96f8c8722bfc4d127ff9baec62 to start a node for testing
  """

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
  """
  @spec start(Keyword.t()) :: {:ok, :peer.server_ref(), node}
  def start(opts \\ []) do
    {:ok, peer, node} = start_disconnected(opts)

    true = Node.connect(node)

    {:ok, peer, node}
  end

  @doc """
  Similar to `start/2` but the node is not connected automatically
  """
  @spec start_disconnected(Keyword.t()) :: {:ok, :peer.server_ref(), node}
  def start_disconnected(opts \\ []) do
    extra_config = Keyword.get(opts, :extra_config, [])
    name = Keyword.get(opts, :name, :peer.random_name())
    aux_mod = Keyword.get(opts, :aux_mod, nil)
    args = Keyword.get(opts, :args, [])

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
               connection: :standard_io,
               args: args
             }
           ]}
      })

    :peer.call(pid, :erlang, :set_cookie, [:cookie])

    :ok = :peer.call(pid, :code, :add_paths, [:code.get_path()])

    for {app_name, _, _} <- Application.loaded_applications(),
        {key, value} <- Application.get_all_env(app_name) do
      :ok = :peer.call(pid, Application, :put_env, [app_name, key, value])
    end

    # Override with extra config
    for {app_name, key, value} <- extra_config do
      :ok = :peer.call(pid, Application, :put_env, [app_name, key, value])
    end

    {:ok, _} = :peer.call(pid, Application, :ensure_all_started, [:mix])
    :ok = :peer.call(pid, Mix, :env, [Mix.env()])

    Enum.map(
      [:logger, :runtime_tools, :mix, :os_mon, :forum],
      fn app -> {:ok, _} = :peer.call(pid, Application, :ensure_all_started, [app]) end
    )

    if aux_mod do
      {{:module, _, _, _}, []} = :peer.call(pid, Code, :eval_quoted, [aux_mod])
    end

    {:ok, pid, node}
  end
end
