defmodule Supavisor.Health do
  @moduledoc """
  Health checking functionality

  Current checks:
  - Acceptable ERPC latencies: fails if a node has high latency to all
  other nodes through :erpc.
  - Database reachable: fails if can't run a simple query in the database.
  """

  require Logger

  @checks [
    acceptable_erpc_latencies: {__MODULE__, :acceptable_erpc_latencies?, [500]},
    database_reachable: {__MODULE__, :database_reachable?, []}
  ]

  @task_supervisor __MODULE__.TaskSupervisor

  @doc """
  The main API for checking the health of a Supavisor node.
  """
  @spec health_check(Keyword.t()) :: :ok | {:error, :failed_checks, [atom()]}
  def health_check(checks \\ @checks) do
    successful_checks =
      @task_supervisor
      |> Task.Supervisor.async_stream_nolink(checks, fn {check, {m, f, a}} ->
        result = apply(m, f, a)
        {check, result}
      end)
      |> Enum.reduce([], fn result, acc ->
        case result do
          {:ok, {check, true}} -> [check | acc]
          {:ok, {_check, false}} -> acc
          {:exit, _} -> acc
        end
      end)

    case Keyword.keys(checks) -- successful_checks do
      [] ->
        :ok

      failed_checks ->
        Logger.critical("Failing health checks: #{inspect(failed_checks)}")
        {:error, :failed_checks, failed_checks}
    end
  end

  @doc false
  @spec acceptable_erpc_latencies?(non_neg_integer()) :: boolean()
  def acceptable_erpc_latencies?(acceptable_erpc_latency) do
    case Node.list() do
      [] ->
        true

      # Results with a single clustered node are too volatile to be considered
      # and can cause false positives. For example, if we have only two nodes
      # (A and B), and B is bad, A would get flagged as unhealthy.
      [_] ->
        true

      nodes ->
        results = :erpc.multicall(nodes, fn -> :ok end, acceptable_erpc_latency)

        # If **any** other node returns replies within the timeout, we are good.
        nodes
        |> Enum.zip(results)
        |> Enum.reduce(false, fn
          {_node, {:ok, _}}, _acc ->
            true

          {node, error}, acc ->
            Logger.warning("Failed :erpc call to #{inspect(node)} with #{inspect(error)}")
            acc
        end)
    end
  end

  @doc false
  @spec database_reachable?() :: boolean()
  def database_reachable? do
    case Supavisor.Repo.query("SELECT 1") do
      {:ok, %Postgrex.Result{rows: [[1]]}} ->
        true

      _ ->
        false
    end
  catch
    _, _ -> false
  end

  @doc false
  def child_spec(_opts) do
    Task.Supervisor.child_spec(name: @task_supervisor)
  end
end
