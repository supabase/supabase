defmodule RealtimeWeb.Joken.CurrentTime.Mock do
  @moduledoc """

  Mock implementation of Joken current time with time freezing.

  This is a copy of Joken.CurrentTime.Mock.

  """

  use Agent

  def start_link do
    Agent.start_link(
      fn ->
        %{is_frozen: false, frozen_value: nil}
      end,
      name: Joken
    )
  end

  def child_spec(_args) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, []}
    }
  end

  def current_time do
    state = Agent.get(Joken, fn state -> state end)

    if state[:is_frozen] do
      state[:frozen_value]
    else
      :os.system_time(:second)
    end
  end

  def freeze do
    freeze(:os.system_time(:second))
  end

  def freeze(timestamp) do
    Agent.update(Joken, fn _state ->
      %{is_frozen: true, frozen_value: timestamp}
    end)
  end

  def unique_name_per_process do
    binary_pid =
      self()
      |> :erlang.pid_to_list()
      |> :erlang.iolist_to_binary()

    "{__MODULE__}_#{binary_pid}" |> String.to_atom()
  end
end
