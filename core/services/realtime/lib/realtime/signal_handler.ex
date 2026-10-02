defmodule Realtime.SignalHandler do
  @moduledoc false
  @behaviour :gen_event
  require Logger

  @spec shutdown_in_progress? :: :ok | {:error, :shutdown_in_progress}
  def shutdown_in_progress? do
    case !!Application.get_env(:realtime, :shutdown_in_progress) do
      true -> {:error, :shutdown_in_progress}
      false -> :ok
    end
  end

  @impl true
  def init({%{handler_mod: _} = args, :ok}) do
    {:ok, args}
  end

  @impl true
  def handle_event(signal, %{handler_mod: handler_mod} = state) do
    Logger.error("#{__MODULE__}: #{inspect(signal)} received")

    if signal == :sigterm do
      Application.put_env(:realtime, :shutdown_in_progress, true)
    end

    handler_mod.handle_event(signal, state)
  end

  @impl true
  defdelegate handle_info(info, state), to: :erl_signal_handler

  @impl true
  defdelegate handle_call(request, state), to: :erl_signal_handler
end
