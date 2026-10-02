defmodule Realtime.Tenants.Connect.Piper do
  @moduledoc """
  Pipes different commands to execute specific actions during the connection process.
  """
  require Logger
  @callback run(any()) :: {:ok, any()} | {:error, any()}

  def run(pipers, init) do
    Enum.reduce_while(pipers, {:ok, init}, fn piper, {:ok, acc} ->
      case :timer.tc(fn -> piper.run(acc) end, :millisecond) do
        {exec_time, {:ok, result}} ->
          Logger.info("#{inspect(piper)} executed in #{exec_time} ms")
          {:cont, {:ok, result}}

        {exec_time, {:error, error}} ->
          Logger.error("#{inspect(piper)} failed in #{exec_time} ms")
          {:halt, {:error, error}}

        _ ->
          raise ArgumentError, "must return {:ok, _} or {:error, _}"
      end
    end)
  end
end
