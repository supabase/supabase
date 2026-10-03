defmodule SupavisorWeb.MetricsController do
  @moduledoc """
  Handles requests for Prometheus metrics
  from all nodes in the cluster.
  """

  use SupavisorWeb, :controller
  require Logger
  alias Supavisor.Monitoring.PromEx
  alias Supavisor.Helpers

  @spec index(Plug.Conn.t(), any()) :: Plug.Conn.t()
  def index(conn, _) do
    :proc_lib.set_label(:metrics_handler)
    maybe_tune_index_proc()

    cluster_metrics = PromEx.get_cluster_metrics()

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, cluster_metrics)
  end

  def tenant(conn, %{"external_id" => ext_id}) do
    :proc_lib.set_label({:metrics_handler, ext_id})

    cluster_metrics = PromEx.get_cluster_tenant_metrics(ext_id)

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, [cluster_metrics, "\n"])
  end

  defp maybe_tune_index_proc() do
    with mhs when is_integer(mhs) and mhs > 0 <-
           Application.get_env(:supavisor, __MODULE__)[:index_min_heap_size_mb] do
      :erlang.process_flag(:min_heap_size, Helpers.mb_to_words(mhs))
    end

    with fsa when is_integer(fsa) and fsa >= 0 <-
           Application.get_env(:supavisor, __MODULE__)[:index_fullsweep_after] do
      :erlang.process_flag(:fullsweep_after, fsa)
    end
  end

  @doc """
  Configures /index connection process' min_heap_size and fullsweep_after

  This is useful for testing and tuning the performance of the /index endpoint.
  The changes can be restored to default with
  `SupavisorWeb.MetricsController.configure_tune_index_proc(nil, nil)`.

  ## Rationale:
  We know, we're about to process large amount of data, so to skip some of
  heap growth ceremony we set the min_heap_size to ~100mb (default).

  Limit GC work by disabling generational GC by setting fullsweep_after to 0 (default);
  that could become less conservative with values like 2, 10 or 20.
  """
  def configure_tune_index_proc(min_heap_size_mb \\ 100, fullsweep_after \\ 0) do
    Application.put_env(:supavisor, __MODULE__,
      index_min_heap_size_mb: min_heap_size_mb,
      index_fullsweep_after: fullsweep_after
    )

    Logger.warning(
      "MetricsController configured for /index processes with min_heap_size: #{min_heap_size_mb}mb, fullsweep_after: #{fullsweep_after}"
    )
  end
end
