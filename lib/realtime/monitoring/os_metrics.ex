defmodule Realtime.OsMetrics do
  @moduledoc """
  This module provides functions to get CPU and RAM usage.
  """

  @spec ram_usage() :: float()
  def ram_usage do
    mem = :memsup.get_system_memory_data()
    free_mem = if Mix.env() in [:dev, :test], do: mem[:free_memory], else: mem[:available_memory]
    100 - free_mem / mem[:total_memory] * 100
  end

  @spec cpu_la() :: %{avg1: float(), avg5: float(), avg15: float()}
  def cpu_la do
    %{
      avg1: :cpu_sup.avg1() / 256,
      avg5: :cpu_sup.avg5() / 256,
      avg15: :cpu_sup.avg15() / 256
    }
  end

  @spec cpu_util() :: float() | {:error, term()}
  def cpu_util do
    :cpu_sup.util()
  end
end
