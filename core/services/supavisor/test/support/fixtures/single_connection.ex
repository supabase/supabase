defmodule SingleConnection do
  @moduledoc false

  alias Postgrex, as: P

  @behaviour P.SimpleConnection

  def query(pid, query) do
    case P.SimpleConnection.call(pid, {:query, query}) do
      [%P.Result{} = result] -> {:ok, result}
      other -> {:error, other}
    end
  catch
    :exit, {%Postgrex.Error{} = error, _} -> {:error, error}
  end

  def child_spec(conf) do
    %{
      id: {__MODULE__, System.unique_integer()},
      start: {__MODULE__, :connect, [conf]},
      restart: :temporary
    }
  end

  def connect(conf) do
    P.SimpleConnection.start_link(__MODULE__, [], conf)
  end

  @impl true
  def init(_args) do
    {:ok, %{from: nil}}
  end

  @impl true
  def handle_call({:query, query}, from, state) do
    {:query, query, %{state | from: from}}
  end

  def handle_result(results, state) when is_list(results) do
    P.SimpleConnection.reply(state.from, results)
    {:noreply, state}
  end

  @impl true
  def handle_result(%Postgrex.Error{} = error, state) do
    P.SimpleConnection.reply(state.from, error)
    {:noreply, state}
  end

  @impl true
  def notify(_, _, _), do: :ok
end
