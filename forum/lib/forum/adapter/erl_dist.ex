defmodule Forum.Adapter.ErlDist do
  @moduledoc false

  import Kernel, except: [send: 2]

  @behaviour Forum.Adapter

  @impl true
  def register(scope) do
    if Process.whereis(Forum.Supervisor.name(scope)) == nil do
      Process.register(self(), Forum.Supervisor.name(scope))
    end

    :ok
  end

  @impl true
  def broadcast(scope, message) do
    name = Forum.Supervisor.name(scope)
    Enum.each(Node.list(), fn node -> :erlang.send({name, node}, message, [:noconnect]) end)
  end

  @impl true
  def broadcast(scope, nodes, message) do
    name = Forum.Supervisor.name(scope)
    Enum.each(nodes, fn node -> :erlang.send({name, node}, message, [:noconnect]) end)
  end

  @impl true
  def send(scope, node, message) do
    :erlang.send({Forum.Supervisor.name(scope), node}, message, [:noconnect])
  end

  @impl true
  def call(_scope, node, module, function, args, timeout) do
    :erpc.call(node, module, function, args, timeout)
  catch
    :error, {:erpc, reason} -> {:error, reason}
    :exit, reason -> {:error, reason}
    kind, reason -> {:error, {kind, reason}}
  end
end
