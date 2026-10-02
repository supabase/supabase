defmodule Realtime.Telemetry do
  @moduledoc """
  Telemetry integration.
  """

  @doc """
  Dispatches Telemetry events.
  """
  @spec execute([atom, ...], map, map) :: :ok
  def execute(event, measurements, metadata \\ %{}) do
    :telemetry.execute(event, measurements, metadata)
  end

  @spec start([atom, ...], map, map) :: integer()
  def start(event, metadata \\ %{}, measurements \\ %{}) do
    start_time = System.monotonic_time()
    measurements = Map.merge(measurements, %{system_time: System.system_time()})

    execute(event ++ [:start], measurements, metadata)

    start_time
  end

  @spec stop([atom, ...], integer(), map, map) :: :ok
  def stop(event, start_time, metadata \\ %{}, measurements \\ %{}) do
    end_time = System.monotonic_time()
    measurements = Map.merge(measurements, %{duration: end_time - start_time})
    execute(event ++ [:stop], measurements, metadata)
  end

  @spec exception([atom, ...], integer(), atom(), any(), list(), map, map) :: :ok
  def exception(event, start_time, kind, reason, stacktrace, metadata \\ %{}, measurements \\ %{}) do
    end_time = System.monotonic_time()
    measurements = Map.merge(measurements, %{duration: end_time - start_time})
    metadata = Map.merge(metadata, %{kind: kind, reason: reason, stacktrace: stacktrace})
    execute(event ++ [:exception], measurements, metadata)
  end
end
