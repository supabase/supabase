defmodule Supavisor.TenantSupervisor do
  @moduledoc false
  use Supervisor

  require Logger
  require Supavisor
  alias Supavisor.Manager
  alias Supavisor.SecretChecker
  alias Supavisor.Terminator

  def start_link(args) do
    meta =
      args.id
      |> Supavisor.get_local_server()
      |> Map.put(:availability_zone, args.availability_zone)

    name = {:via, :syn, {:tenants, args.id, meta}}
    Supervisor.start_link(__MODULE__, args, name: name)
  end

  @impl true
  def init(%{replicas: replicas} = args) do
    Supavisor.id(tenant: tenant, user: user) = args.id

    min_size = if Supavisor.Helpers.no_warm_pool_user?(user), do: 0, else: 1

    pools =
      replicas
      |> Enum.with_index()
      |> Enum.map(fn {e, i} ->
        id = {:pool, e.replica_type, i, args.id}
        name = {:via, Registry, {Supavisor.Registry.Tenants, id, e.replica_type}}

        %{
          id: {:pool, id},
          start:
            {:poolboy, :start_link,
             [pool_spec(name, min_size, e.pool_size), %{id: args.id, pool: name}]},
          restart: :temporary,
          type: :supervisor
        }
      end)

    manager_args = %{id: args.id, sup: self(), log_level: args.log_level}
    secret_checker_args = %{id: args.id}
    cache_args = %{id: args.id, upstream_auth_secrets: args.secrets}
    terminator_args = %{id: args.id, sup: self()}

    children =
      [
        {Supavisor.TenantCache, cache_args},
        {Manager, manager_args},
        {SecretChecker, secret_checker_args}
        | pools
      ] ++ [{Terminator, terminator_args}]

    Registry.register(Supavisor.Registry.TenantSups, tenant, args.id)

    Supervisor.init(children,
      strategy: :one_for_one,
      max_restarts: 10,
      max_seconds: 60
    )
  end

  def child_spec(args) do
    %{
      id: args.id,
      start: {__MODULE__, :start_link, [args]},
      restart: :transient,
      type: :supervisor
    }
  end

  @spec pool_spec(tuple, integer, integer) :: Keyword.t()
  defp pool_spec(name, min_size, pool_size) do
    [
      name: name,
      worker_module: Supavisor.DbHandler,
      size: min_size,
      max_overflow: pool_size,
      strategy: :lifo,
      idle_timeout: :timer.minutes(5)
    ]
  end
end
