defmodule SupavisorWeb.PoolJSON do
  require Supavisor

  @doc """
  Renders the pools being moved by `Supavisor.rebalance/1`.
  """
  def rebalance(%{result: result}) do
    moves =
      for {node, {:ok, moves}} <- result, {id, target} <- moves do
        Supavisor.id(tenant: tenant, user: user, mode: mode, db: db) = id

        %{
          tenant: tenant,
          user: user,
          mode: mode,
          database: db,
          from_node: node,
          to_node: target
        }
      end

    errors = for {node, {:error, reason}} <- result, into: %{}, do: {node, inspect(reason)}

    %{moves: moves, errors: errors}
  end
end
