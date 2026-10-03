defmodule SupavisorWeb.WsProxy do
  @moduledoc """
  The `Supavisor.WsProxy` module implements a WebSocket proxy for managing
  TCP connections between clients and a Postgres database.
  """

  require Logger
  alias Supavisor.Protocol.Server
  @behaviour Plug

  def call(conn, state) do
    Logger.debug("WsProxy is: #{inspect(self())}")
    Plug.Conn.upgrade_adapter(conn, :websocket, {__MODULE__, state, %{compress: false}})
  end

  def init(_) do
    %{socket: nil, acc: nil, status: :startup}
  end

  def websocket_handle(
        {:binary, <<len::32, startup_pkt::binary-size(len - 4), rest::binary>>},
        %{status: :startup} = state
      ) do
    {:ok, socket} = connect_local()
    :ok = :gen_tcp.send(socket, [<<len::32>>, startup_pkt])

    {:ok, %{state | acc: rest, socket: socket}}
  end

  def websocket_handle({:binary, bin}, %{socket: socket} = state) do
    :ok = :gen_tcp.send(socket, bin)
    {:ok, state}
  end

  def websocket_info({:tcp, _, bin}, %{status: :startup} = state) do
    if String.ends_with?(bin, Server.ready_for_query()) do
      acc = filter_pass_pkt(state.acc)
      :ok = :gen_tcp.send(state.socket, acc)
      {[{:binary, bin}], %{state | acc: nil, status: :idle}}
    else
      {[{:binary, bin}], state}
    end
  end

  def websocket_info({:tcp, _, bin}, %{status: :idle} = state) do
    {[{:binary, bin}], state}
  end

  def websocket_info({:tcp_closed, socket}, %{socket: socket}) do
    {:stop, :normal}
  end

  def websocket_info(msg, state) do
    Logger.error("Undefined websocket_info msg: #{inspect(msg, pretty: true)}")
    {:ok, state}
  end

  @spec filter_pass_pkt(binary()) :: binary()
  def filter_pass_pkt(<<?p, len::32, _::binary-size(len - 4), rest::binary>>) do
    rest
  end

  def filter_pass_pkt(bin), do: bin

  @spec connect_local() :: {:ok, port()} | {:error, term()}
  defp connect_local do
    proxy_port = Application.fetch_env!(:supavisor, :proxy_port_transaction)
    :gen_tcp.connect(~c"localhost", proxy_port, [:binary, packet: :raw, active: true])
  end
end
