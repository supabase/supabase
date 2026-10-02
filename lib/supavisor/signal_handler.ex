defmodule Supavisor.SignalHandler do
  @moduledoc """
  Supavisor.SignalHandler is a module that provides a custom signal handling behavior
  for the Supavisor application. It implements the :gen_event behavior and intercepts
  system signals, such as SIGTERM, to manage application state during shutdown.
  """

  @behaviour :gen_event
  require Logger

  @impl true
  def init(_) do
    Logger.info("#{__MODULE__} is being initialized...")
    {:ok, %{}}
  end

  @impl true
  def handle_event(signal, state) do
    Logger.warning("#{__MODULE__}: #{inspect(signal)} received")

    :erl_signal_handler.handle_event(signal, state)
  end

  @impl true
  defdelegate handle_info(info, state), to: :erl_signal_handler

  @impl true
  defdelegate handle_call(request, state), to: :erl_signal_handler
end
