defmodule Extensions.PostgresCdcRls.WorkerSupervisor do
  @moduledoc false
  use Supervisor

  alias Extensions.PostgresCdcRls
  alias PostgresCdcRls.ReplicationPoller
  alias PostgresCdcRls.SubscriptionManager
  alias Realtime.Tenants.Cache
  alias Realtime.PostgresCdc.Exception

  def start_link(args) do
    name = PostgresCdcRls.supervisor_id(args["id"], args["region"])
    Supervisor.start_link(__MODULE__, args, name: {:via, :syn, name})
  end

  @impl true
  def init(%{"id" => tenant} = args) when is_binary(tenant) do
    Logger.metadata(external_id: tenant, project: tenant)
    unless Cache.get_tenant_by_external_id(tenant), do: raise(Exception)

    subscribers_pids_table = :ets.new(__MODULE__, [:public, :bag])
    subscribers_nodes_table = :ets.new(__MODULE__, [:public, :set])

    tid_args =
      Map.merge(args, %{
        "subscribers_pids_table" => subscribers_pids_table,
        "subscribers_nodes_table" => subscribers_nodes_table
      })

    children = [
      %{
        id: ReplicationPoller,
        start: {ReplicationPoller, :start_link, [tid_args]},
        restart: :transient,
        significant: true
      },
      %{
        id: SubscriptionManager,
        start: {SubscriptionManager, :start_link, [tid_args]},
        restart: :transient,
        significant: true
      }
    ]

    Supervisor.init(children,
      strategy: :one_for_one,
      auto_shutdown: :any_significant,
      max_restarts: 10,
      max_seconds: 60
    )
  end
end
