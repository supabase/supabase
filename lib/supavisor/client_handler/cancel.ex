defmodule Supavisor.ClientHandler.Cancel do
  @moduledoc """
  Helpers for dealing with query canceling.

  From the docs:

  > To issue a cancel request, the frontend opens a new connection to the server and sends a CancelRequest message,
  > rather than the StartupMessage message that would ordinarily be sent across a new connection. The server
  > will process this request and then close the connection. For security reasons, no direct reply is made to the
  > cancel request message.

  Cancel requests are sent through Phoenix PubSub. ClientHandlers listen to their key and other client
  handlers may send cancel requests on it.
  """

  require Logger
  alias Phoenix.PubSub
  alias Supavisor.HandlerHelpers
  require Supavisor.Protocol.Server, as: Server

  @doc """
  Called upon receiving cancel requests, broadcasts to relevant client handler
  """
  @spec send_cancel_query(non_neg_integer, non_neg_integer, term) :: :ok | {:errr, term}
  def send_cancel_query(pid, key, msg \\ :cancel_query) do
    PubSub.broadcast(
      Supavisor.PubSub,
      "cancel_req:#{pid}_#{key}",
      msg
    )
  end

  @doc """
  Called by ClientHandlers when starting a connection
  """
  @spec listen_cancel_query(non_neg_integer, non_neg_integer) :: :ok | {:errr, term}
  def listen_cancel_query(pid, key) do
    PubSub.subscribe(Supavisor.PubSub, "cancel_req:#{pid}_#{key}")
  end

  @doc """
  If there's an ongoing query, forward the message to cancel it to the checked out connection

  Called by the client handler when receiving a cancel requests
  """
  def maybe_forward_cancel_to_db(:busy, data) do
    key = {data.tenant, data.db_connection}
    Logger.debug("ClientHandler: Cancel query for #{inspect(key)}")
    {_pool, db_pid, _db_sock} = data.db_connection

    case db_pid_meta(key) do
      [{^db_pid, meta}] ->
        msg = Server.cancel_message(meta.pid, meta.key)
        opts = [:binary, {:packet, :raw}, {:active, true}, meta.ip_version]
        {:ok, sock} = :gen_tcp.connect(meta.host, meta.port, opts)
        sock = {:gen_tcp, sock}
        :ok = HandlerHelpers.sock_send(sock, msg)
        :ok = HandlerHelpers.sock_close(sock)

      error ->
        Logger.error(
          "ClientHandler: Received cancel but no proc was found #{inspect(key)} #{inspect(error)}"
        )
    end
  end

  def maybe_forward_cancel_to_db(_state, _data) do
    :ok
  end

  defp db_pid_meta({_, {_, pid, _}} = _key) do
    rkey = Supavisor.Registry.PoolPids

    pid
    |> node()
    |> :erpc.call(Registry, :lookup, [rkey, pid], 15_000)
  end
end
