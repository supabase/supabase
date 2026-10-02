defmodule TenantConnection do
  @moduledoc """
  Boilerplate code to handle Realtime.Tenants.Connect during tests
  """
  alias Realtime.Api.Message
  alias Realtime.Database
  alias Realtime.Tenants.Repo
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.Endpoint

  # Can't use `opts \\ [mode: :savepoint]` because OrioleDB logical decoding drops
  # INSERTs made inside a SAVEPOINT (Postgrex `mode: :savepoint`)
  # See https://github.com/orioledb/orioledb/issues/936
  def create_message(attrs, conn, opts \\ []) do
    message = Message.changeset(%Message{}, attrs)

    {:ok, result} =
      Database.transaction(conn, fn transaction_conn ->
        with {:ok, %Message{} = message} <- Repo.insert(transaction_conn, message, Message, opts) do
          message
        end
      end)

    case result do
      %Ecto.Changeset{valid?: false} = error -> {:error, error}
      {:error, error} -> {:error, error}
      result -> {:ok, result}
    end
  end

  def ensure_connect_down(tenant_id) do
    # Using syn and not a normal Process.monitor because we want to ensure
    # that the process is down AND that the registry has been updated accordingly
    Endpoint.subscribe("connect:#{tenant_id}")

    if Connect.whereis(tenant_id) do
      Connect.shutdown(tenant_id)

      receive do
        %{event: "connect_down"} -> :ok
      after
        5000 ->
          if Connect.whereis(tenant_id) do
            raise "Connect process for tenant #{tenant_id} did not shut down in time"
          end
      end
    end
  after
    Endpoint.unsubscribe("connect:#{tenant_id}")
  end
end
