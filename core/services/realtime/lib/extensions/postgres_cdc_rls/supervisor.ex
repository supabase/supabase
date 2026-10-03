defmodule Extensions.PostgresCdcRls.Supervisor do
  @moduledoc """
  Supervisor to spin up the Postgres CDC RLS tree.
  """
  use Supervisor

  alias Extensions.PostgresCdcRls

  @spec start_link :: :ignore | {:error, any} | {:ok, pid}
  def start_link do
    Supervisor.start_link(__MODULE__, [], name: __MODULE__)
  end

  @impl true
  def init(_args) do
    load_migrations_modules()

    :syn.add_node_to_scopes(Realtime.Syn.PostgresCdc.scopes())

    children = [
      {
        PartitionSupervisor,
        partitions: 20, child_spec: DynamicSupervisor, strategy: :one_for_one, name: PostgresCdcRls.DynamicSupervisor
      }
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp load_migrations_modules do
    {:ok, modules} = :application.get_key(:realtime, :modules)

    modules
    |> Enum.filter(&String.starts_with?(to_string(&1), "Elixir.Realtime.Tenants.Migrations"))
    |> Enum.each(&Code.ensure_loaded!/1)
  end
end
