defmodule Supavisor.ErlSysMon do
  @moduledoc """
  Logs Erlang System Monitor events.

  For better processes identification, they can be labeled using `:proc_lib.set_label/1`.
  If a message contains a pid with a label, the label will be included in the log
  for easier debugging and monitoring.
  """

  use GenServer
  alias Supavisor.Helpers

  require Logger

  def start_link(args) do
    name = args[:name] || __MODULE__
    GenServer.start_link(__MODULE__, args, name: name)
  end

  def init(_args) do
    :erlang.system_monitor(self(), [
      :busy_dist_port,
      :busy_port,
      {:long_gc, 250},
      {:long_schedule, 100},
      {:long_message_queue, {0, 1_000}},
      {:large_heap, Helpers.mb_to_words(25)}
    ])

    {:ok, []}
  end

  def handle_info({:monitor, pid, _type, _meta} = msg, state) when is_pid(pid) do
    log_process_info(msg, pid)
    {:noreply, state}
  end

  def handle_info(msg, state) do
    Logger.warning("#{__MODULE__} message: " <> inspect(msg))
    {:noreply, state}
  end

  defp log_process_info(msg, pid) do
    pid_info =
      pid
      |> Process.info(:dictionary)
      |> case do
        {:dictionary, dict} when is_list(dict) ->
          {List.keyfind(dict, :"$initial_call", 0), List.keyfind(dict, :"$ancestors", 0)}

        other ->
          other
      end

    extra_info =
      Process.info(pid, [:registered_name, :label, :message_queue_len, :total_heap_size])

    Logger.warning(
      "#{__MODULE__} message: " <>
        inspect(msg) <> "|\n process info: #{inspect(pid_info)} #{inspect(extra_info)}"
    )
  rescue
    _ ->
      Logger.warning("#{__MODULE__} message: " <> inspect(msg))
  end
end
