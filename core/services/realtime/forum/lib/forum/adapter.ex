defmodule Forum.Adapter do
  @moduledoc """
  Behaviour module for Forum messaging adapters.
  """

  @doc "Register the current process to receive messages for the given scope"
  @callback register(scope :: atom) :: :ok

  @doc "Broadcast a message to all nodes in the given scope"
  @callback broadcast(scope :: atom, message :: term) :: any

  @doc "Broadcast a message to specific nodes in the given scope"
  @callback broadcast(scope :: atom, [node], message :: term) :: any

  @doc "Send a message to a specific node in the given scope"
  @callback send(scope :: atom, node, message :: term) :: any

  @doc """
  Synchronously invoke a function on a remote node and return its result.

  This is a generic RPC primitive: the adapter has no opinion about what
  the remote callee does. Caller specifies the `module`, `function`, and
  `args` to invoke; the adapter is responsible only for transport (e.g.
  `:erpc.call`, `:gen_rpc.call`, or any other RPC mechanism).

  On success, returns whatever the remote function returned. On transport
  failure (`:noconnection`, `:timeout`, remote process exit, etc.) the
  adapter must catch the exception and return `{:error, reason}` so callers
  can decide policy (retry, surface to user, crash the local scope).
  """
  @callback call(
              scope :: atom,
              node :: node,
              module :: module,
              function :: atom,
              args :: [term],
              timeout :: timeout
            ) :: term | {:error, term}
end
