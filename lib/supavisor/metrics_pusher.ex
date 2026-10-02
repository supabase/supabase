defmodule Supavisor.MetricsPusher do
  @moduledoc """
  GenServer that periodically pushes Prometheus metrics to an endpoint.

  Runs once per `:scope` (`:tenant` or `:global`), pushing only the metrics
  belonging to that scope (see `Supavisor.Monitoring.PromEx.get_metrics/1`) so
  tenant-tagged and cluster/node-level metrics can be routed to different
  Prometheus endpoints.

  Only starts if the scope's `url` is configured.
  Pushes metrics every 30 seconds (configurable) to the configured URL endpoint.
  """

  use GenServer

  require Logger

  alias Supavisor.Monitoring.PromEx

  @type scope :: :tenant | :global

  @type t :: %__MODULE__{
          scope: scope(),
          push_ref: reference() | nil,
          interval: pos_integer() | nil,
          req_options: keyword() | nil
        }

  defstruct [:scope, :push_ref, :interval, :req_options]

  @spec start_link(keyword()) :: {:ok, pid()} | :ignore
  def start_link(opts) do
    scope = Keyword.fetch!(opts, :scope)
    name = Keyword.get(opts, :name, __MODULE__)
    url = Keyword.get(opts, :url, Application.get_env(:supavisor, config_key(scope, :url)))

    if is_binary(url) do
      GenServer.start_link(__MODULE__, opts, name: name)
    else
      Logger.warning("MetricsPusher (#{scope}) not started: url must be configured")

      :ignore
    end
  end

  @impl true
  def init(opts) do
    scope = Keyword.fetch!(opts, :scope)

    url = Keyword.get(opts, :url, Application.get_env(:supavisor, config_key(scope, :url)))

    user =
      Keyword.get(
        opts,
        :user,
        Application.get_env(:supavisor, config_key(scope, :user), "supavisor")
      )

    auth = Keyword.get(opts, :auth, Application.get_env(:supavisor, config_key(scope, :auth)))

    interval =
      Keyword.get(
        opts,
        :interval,
        Application.get_env(:supavisor, config_key(scope, :interval_ms), :timer.seconds(30))
      )

    timeout =
      Keyword.get(
        opts,
        :timeout,
        Application.get_env(:supavisor, config_key(scope, :timeout_ms), :timer.seconds(15))
      )

    compress =
      Keyword.get(
        opts,
        :compress,
        Application.get_env(:supavisor, config_key(scope, :compress), true)
      )

    extra_labels =
      Keyword.get(
        opts,
        :extra_labels,
        Application.get_env(:supavisor, config_key(scope, :extra_labels), [])
      )

    params = Enum.map(extra_labels, fn {k, v} -> {:extra_label, "#{k}=#{v}"} end)

    Logger.info(
      "Starting MetricsPusher (scope: #{scope}, url: #{url}, interval: #{interval}ms, compress: #{compress})"
    )

    headers = [{"content-type", "text/plain"}]

    basic_auth = if auth, do: [auth: {:basic, "#{user}:#{auth}"}], else: []

    req_options =
      [
        method: :post,
        url: url,
        headers: headers,
        compress_body: compress,
        receive_timeout: timeout,
        params: params
      ]
      |> Keyword.merge(basic_auth)
      |> Keyword.merge(Application.get_env(:supavisor, config_key(scope, :req_options), []))

    state = %__MODULE__{
      scope: scope,
      push_ref: schedule_push(interval),
      interval: interval,
      req_options: req_options
    }

    {:ok, state}
  end

  @impl true
  def handle_info(:push, state) do
    {exec_time, _} =
      :timer.tc(fn -> push(state.scope, state.req_options) end, :millisecond)

    if exec_time > :timer.seconds(5) do
      Logger.warning("Metrics push took: #{exec_time} ms")
    end

    {:noreply, %{state | push_ref: schedule_push(state.interval)}}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.error("MetricsPusher received unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp schedule_push(delay), do: Process.send_after(self(), :push, delay)

  @spec config_key(scope(), atom()) :: atom()
  defp config_key(:global, :url), do: :metrics_pusher_url
  defp config_key(:global, :user), do: :metrics_pusher_user
  defp config_key(:global, :auth), do: :metrics_pusher_auth
  defp config_key(:global, :interval_ms), do: :metrics_pusher_interval_ms
  defp config_key(:global, :timeout_ms), do: :metrics_pusher_timeout_ms
  defp config_key(:global, :compress), do: :metrics_pusher_compress
  defp config_key(:global, :extra_labels), do: :metrics_pusher_extra_labels
  defp config_key(:global, :req_options), do: :metrics_pusher_req_options

  defp config_key(:tenant, :url), do: :tenant_metrics_pusher_url
  defp config_key(:tenant, :user), do: :tenant_metrics_pusher_user
  defp config_key(:tenant, :auth), do: :tenant_metrics_pusher_auth
  defp config_key(:tenant, :interval_ms), do: :tenant_metrics_pusher_interval_ms
  defp config_key(:tenant, :timeout_ms), do: :tenant_metrics_pusher_timeout_ms
  defp config_key(:tenant, :compress), do: :tenant_metrics_pusher_compress
  defp config_key(:tenant, :extra_labels), do: :tenant_metrics_pusher_extra_labels
  defp config_key(:tenant, :req_options), do: :tenant_metrics_pusher_req_options

  # PromEx.get_metrics/1 is this node's own local export (no cross-node RPC
  # fan-out), filtered down to just this pusher's scope (tenant-tagged series,
  # or everything else). Each node pushing only its own metrics (tagged with
  # its node identity via global_tags) avoids the O(n^2) RPC fan-out that
  # PromEx.get_cluster_metrics/0 would cause if every node in the cluster
  # pushed on its own interval.
  defp push(scope, req_options) do
    task =
      Task.Supervisor.async_nolink(Supavisor.TaskSupervisor, fn ->
        push_metrics(scope, req_options)
      end)

    case Task.yield(task, :timer.minutes(1)) do
      nil ->
        Task.shutdown(task, :brutal_kill)
        Logger.error("MetricsPusher: Task timed out: #{inspect(task)}")

      {:exit, reason} ->
        Logger.error("MetricsPusher: Task exited with reason: #{inspect(reason)}")

      {:ok, _} ->
        :ok
    end
  end

  defp push_metrics(scope, req_options) do
    case send_metrics(req_options, PromEx.get_metrics(scope)) do
      :ok ->
        :ok

      {:error, reason} ->
        Logger.error(
          "MetricsPusher: Failed to push metrics to #{req_options[:url]}: #{inspect(reason)}"
        )

        :ok
    end
  rescue
    error ->
      Logger.error("MetricsPusher: Exception during push: #{inspect(error)}")
      :ok
  end

  defp send_metrics(req_options, metrics) do
    [{:body, metrics} | req_options] |> Req.request() |> handle_response()
  end

  defp handle_response({:ok, %{status: status}}) when status in 200..299, do: :ok

  defp handle_response({:ok, %{status: status} = response}),
    do: {:error, {:http_error, status, response.body}}

  defp handle_response({:error, reason}), do: {:error, reason}
end
