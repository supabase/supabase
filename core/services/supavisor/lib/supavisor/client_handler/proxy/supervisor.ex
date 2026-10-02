defmodule Supavisor.ClientHandler.Proxy.Supervisor do
  @moduledoc """
  Wrapping supervisor for proxy connections of a single tenant.

  Children:
    1. A DynamicSupervisor (`:max_children` enforces the connection limit),
       registered in `Supavisor.Registry.Tenants` under `{:proxy_dyn_sup, id}`.
    2. A watchdog (significant child) that terminates when the DynamicSupervisor
       is empty for some time, triggering `auto_shutdown: :any_significant` on
       this supervisor.
  """

  use Supervisor

  require Logger
  alias Supavisor.ClientHandler.Proxy.Watchdog

  @registry Supavisor.Registry.Tenants

  @doc """
  Ensures the proxy supervisor tree for the given tenant exists.

  If a DynamicSupervisor is already registered for `id`, returns `:ok`.
  Otherwise, starts a new proxy supervisor under the partitioned DynamicSupervisor.
  """
  @spec ensure_started(Supavisor.id(), pos_integer()) :: :ok
  def ensure_started(id, max_clients) do
    case Registry.lookup(@registry, {:proxy_dyn_sup, id}) do
      [{_, _}] ->
        :ok

      [] ->
        start(id, max_clients)
    end
  end

  defp start(id, max_clients) do
    case DynamicSupervisor.start_child(
           {:via, PartitionSupervisor, {Supavisor.DynamicSupervisor, id}},
           %{
             id: {:proxy_sup, id},
             start: {__MODULE__, :start_link, [[id: id, max_clients: max_clients]]},
             restart: :temporary,
             type: :supervisor
           }
         ) do
      {:ok, _} ->
        :ok

      {:error, {:shutdown, {:failed_to_start_child, _, {:already_started, _}}}} ->
        :ok
    end
  end

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @spec child_spec(keyword()) :: Supervisor.child_spec()
  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
      type: :supervisor,
      restart: :temporary
    }
  end

  @type start_connection_error :: :max_children | :proxy_sup_not_found | :failed_to_start

  @doc """
  Starts a child under the proxy DynamicSupervisor.

  Returns `{:ok, pid}` on success, or one of:
  - `{:error, :max_children}` if the connection limit has been reached
  - `{:error, :proxy_sup_not_found}` if the supervisor is not registered or has shut down
  - `{:error, :failed_to_start}` if the child process failed to start
  """
  @spec start_connection(Supavisor.id(), Supervisor.child_spec()) ::
          {:ok, pid()} | {:error, start_connection_error()}
  def start_connection(id, child_spec) do
    case Registry.lookup(@registry, {:proxy_dyn_sup, id}) do
      [{dyn_sup, _}] ->
        case DynamicSupervisor.start_child(dyn_sup, child_spec) do
          {:ok, pid} ->
            {:ok, pid}

          {:error, :max_children} ->
            {:error, :max_children}

          error ->
            Logger.error([
              "ClientHandler: failed to start proxy DbHandler: ",
              formatted_reason(error)
            ])

            {:error, :failed_to_start}
        end

      [] ->
        {:error, :proxy_sup_not_found}
    end
  end

  defp formatted_reason(:ignore), do: "returned ignore"

  defp formatted_reason({:error, error_reason}) do
    case error_reason do
      {exception, stacktrace} when is_exception(exception) ->
        Exception.format(:error, exception, stacktrace)

      {:bad_return_value, return_value} ->
        ["Bad return value: ", inspect(return_value)]

      value ->
        ["exited with: ", inspect(value)]
    end
  end

  @impl true
  def init(opts) do
    id = Keyword.fetch!(opts, :id)
    max_clients = Keyword.fetch!(opts, :max_clients)
    watchdog_opts = Keyword.get(opts, :watchdog_opts, [])

    children = [
      %{
        id: :connections,
        start:
          {DynamicSupervisor, :start_link,
           [
             [
               strategy: :one_for_one,
               max_children: max_clients,
               name: {:via, Registry, {@registry, {:proxy_dyn_sup, id}}}
             ]
           ]},
        type: :supervisor
      },
      Watchdog.child_spec({id, watchdog_opts})
    ]

    Supervisor.init(children, strategy: :one_for_one, auto_shutdown: :any_significant)
  end
end
