defmodule Supavisor.NodeMembership do
  @moduledoc """
  Holds this node's membership in the scopes used to place new pools.

  Other nodes pick where to start a pool from the `:accepting_pools` and
  `:availability_zone` scopes, and syn drops a member when its process dies.

  This is the last child of the application supervisor, so it is the first to
  be terminated on shutdown. Other nodes stop placing new pools here before
  anything else is torn down. Pools already running keep serving traffic until
  they are drained by their `Supavisor.Terminator`.
  """

  use GenServer

  require Logger

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @impl true
  def init(:ok) do
    availability_zone = Application.get_env(:supavisor, :availability_zone)

    :ok = :syn.join(:accepting_pools, :nodes, self())
    :ok = :syn.join(:availability_zone, availability_zone, self())

    {:ok, nil}
  end

  def terminate(_) do
    Logger.notice("#{inspect(__MODULE__)} terminating")
  end
end
