defmodule Extensions.PostgresCdcRls do
  @moduledoc """
  Callbacks for initiating a Postgres connection and creating a Realtime subscription for database changes.
  """

  @behaviour Realtime.PostgresCdc
  use Realtime.Logs

  alias Extensions.PostgresCdcRls, as: Rls
  alias Realtime.GenCounter
  alias Realtime.GenRpc
  alias RealtimeWeb.Endpoint
  alias Rls.Subscriptions

  @impl true
  @spec handle_connect(map()) :: {:ok, {pid(), pid()}} | nil
  def handle_connect(args) do
    case get_manager_conn(args["id"]) do
      {:error, nil} ->
        start_distributed(args)
        nil

      {:error, :wait} ->
        nil

      {:ok, pid, conn} ->
        {:ok, {pid, conn}}
    end
  end

  @impl true
  def handle_after_connect({manager_pid, conn}, settings, params_list, tenant) do
    with {:ok, subscription_list} <- subscription_list(params_list) do
      pool_size = Map.get(settings, "subcriber_pool_size", 4)
      publication = settings["publication"]
      create_subscription(conn, tenant, publication, pool_size, subscription_list, manager_pid, self())
    end
  end

  @database_timeout_reason "Too many database timeouts"

  def create_subscription(conn, tenant, publication, pool_size, subscription_list, manager_pid, caller)
      when node(conn) == node() do
    with_rate_counter(tenant, pool_size, fn rate_counter ->
      case Subscriptions.create(conn, publication, subscription_list, manager_pid, caller) do
        {:error, %DBConnection.ConnectionError{}} ->
          GenCounter.add(rate_counter.id)
          {:error, @database_timeout_reason}

        {:error, {:exit, _}} ->
          GenCounter.add(rate_counter.id)
          {:error, @database_timeout_reason}

        # A `statement_timeout` cancellation or a connection dropped mid-transaction
        {:error, {:database_timeout, _}} ->
          GenCounter.add(rate_counter.id)
          {:error, @database_timeout_reason}

        response ->
          response
      end
    end)
  end

  def create_subscription(conn, tenant, publication, pool_size, subscription_list, manager_pid, caller) do
    with_rate_counter(tenant, pool_size, fn rate_counter ->
      args = [conn, tenant, publication, pool_size, subscription_list, manager_pid, caller]

      case GenRpc.call(node(conn), __MODULE__, :create_subscription, args, timeout: 15_000, tenant_id: tenant) do
        {:error, @database_timeout_reason} ->
          GenCounter.add(rate_counter.id)
          {:error, @database_timeout_reason}

        response ->
          response
      end
    end)
  end

  defp with_rate_counter(tenant, pool_size, fun) do
    with {:ok, %{limit: %{triggered: false}} = rate_counter} <- rate_counter(tenant, pool_size) do
      fun.(rate_counter)
    else
      {:ok, _} ->
        {:error, @database_timeout_reason}

      {:error, reason} ->
        log_error("RateCounterError", reason)
        {:error, @database_timeout_reason}
    end
  end

  defp rate_counter(tenant_id, pool_size) do
    rate_counter_args = Realtime.Tenants.subscription_errors_per_second_rate(tenant_id, pool_size)
    Realtime.RateCounter.get(rate_counter_args)
  rescue
    e -> {:error, e}
  end

  defp subscription_list(params_list) do
    Enum.reduce_while(params_list, {:ok, []}, fn params, {:ok, acc} ->
      case Subscriptions.parse_subscription_params(params[:params]) do
        {:ok, subscription_params} ->
          {:cont, {:ok, [%{id: params.id, claims: params.claims, subscription_params: subscription_params} | acc]}}

        {:error, reason} ->
          {:halt, {:error, {:malformed_subscription_params, reason}}}
      end
    end)
  end

  @impl true
  def handle_subscribe(_, tenant, metadata) do
    Endpoint.subscribe("realtime:postgres:" <> tenant, metadata)
  end

  @impl true
  @doc """
  Stops the Supervision tree for a tenant.

  Expects an `external_id` as the `tenant`.
  """

  @spec handle_stop(String.t(), non_neg_integer()) :: :ok
  def handle_stop(tenant, timeout) when is_binary(tenant) do
    scope = Realtime.Syn.PostgresCdc.scope(tenant)

    case :syn.whereis_name({scope, tenant}) do
      :undefined ->
        Logger.warning("Database supervisor not found for tenant #{tenant}")
        :ok

      pid ->
        DynamicSupervisor.stop(pid, :shutdown, timeout)
    end
  end

  ## Internal functions

  def start_distributed(%{"region" => region, "id" => tenant} = args) do
    platform_region = Realtime.Nodes.platform_region_translator(region)
    launch_node = Realtime.Nodes.launch_node(platform_region, node(), tenant)

    Logger.warning(
      "Starting distributed postgres extension #{inspect(lauch_node: launch_node, region: region, platform_region: platform_region)}"
    )

    case GenRpc.call(launch_node, __MODULE__, :start, [args], timeout: 30_000, tenant_id: tenant) do
      {:ok, _pid} = ok ->
        ok

      {:error, {:already_started, _pid}} = error ->
        Logger.info("Postgres Extension already started on node #{inspect(launch_node)}")
        error

      error ->
        log_error("ErrorStartingPostgresCDC", error)
        error
    end
  end

  @doc """
  Start db poller. Expects an `external_id` as a `tenant`.
  """

  @spec start(map()) :: {:ok, pid} | {:error, :already_started | :reserved}
  def start(%{"id" => tenant} = args) when is_binary(tenant) do
    Logger.debug("Starting #{__MODULE__} extension with args: #{inspect(args, pretty: true)}")

    DynamicSupervisor.start_child(
      {:via, PartitionSupervisor, {Rls.DynamicSupervisor, tenant}},
      %{
        id: tenant,
        start: {Rls.WorkerSupervisor, :start_link, [args]},
        restart: :temporary
      }
    )
  end

  @spec get_manager_conn(String.t()) :: {:error, nil | :wait} | {:ok, pid(), pid()}
  def get_manager_conn(id) do
    scope = Realtime.Syn.PostgresCdc.scope(id)

    case :syn.lookup(scope, id) do
      {_, %{manager: nil, subs_pool: nil}} -> {:error, :wait}
      {_, %{manager: manager, subs_pool: conn}} -> {:ok, manager, conn}
      _ -> {:error, nil}
    end
  end

  @spec supervisor_id(String.t(), String.t()) :: {atom(), String.t(), map()}
  def supervisor_id(tenant, region) do
    scope = Realtime.Syn.PostgresCdc.scope(tenant)
    {scope, tenant, %{region: region, manager: nil, subs_pool: nil}}
  end

  @spec update_meta(String.t(), pid(), pid()) :: {:ok, {pid(), term()}} | {:error, term()}
  def update_meta(tenant, manager_pid, subs_pool) do
    scope = Realtime.Syn.PostgresCdc.scope(tenant)

    :syn.update_registry(scope, tenant, fn pid, meta ->
      if node(pid) == node(manager_pid) do
        %{meta | manager: manager_pid, subs_pool: subs_pool}
      else
        Logger.warning("Node mismatch for tenant #{tenant} #{inspect(node(pid))} #{inspect(node(manager_pid))}")

        meta
      end
    end)
  end
end
