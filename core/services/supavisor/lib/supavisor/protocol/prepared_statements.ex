defmodule Supavisor.Protocol.PreparedStatements do
  @moduledoc """
  Handles PostgreSQL prepared statement transformations and name translation.

  This module manages client-side to server-side prepared statement name mapping,
  enabling prepared statement pooling across multiple client connections.

  ## Message processing

  Processes PostgreSQL frontend extended query protocol messages *Parse (P)*, *Bind (B)*,
  *Close (C)*, and *Describe (D)*.

  Translates client-side prepared statement names to unique server-side names. This allows
  multiple clients to use the same prepared statement names (like "stmt1") without conflicts,
  as each gets mapped to a unique server-side name generated from the statement's hash
  (like "sv_9d8sad98sahzlxkc...").

  Parse statements are cached in storage. When a `Bind` or named statement `Describe` message
  is processed, the module retrieves and attaches the corresponding `Parse` message, providing
  the DbHandler with all necessary information to prepare the statement when needed.

  ## Limits and Safety

  Enforces several limits to prevent resource exhaustion:
  - **Client statement count limit**: Maximum number of prepared statements per client connection.
    Exceeding this limit returns an error to the client.
  - **Client memory usage limit**: Maximum memory allocated for storing prepared statements per
    client connection. Exceeding this limit returns an error to the client.
  - **Backend statement count limit**: Maximum number of prepared statements per backend connection.
    When exceeded, existing prepared statements are automatically closed to make room for new ones.
  """

  alias Supavisor.Protocol.PreparedStatements.PreparedStatement
  alias Supavisor.Protocol.PreparedStatements.Storage

  @type statement_name() :: String.t()
  @type pkt() :: binary()

  @type handled_pkt() ::
          {:parse_pkt, statement_name(), pkt()}
          | {:bind_pkt, statement_name(), bind_pkt :: pkt(), parse_pkt :: pkt()}
          | {:close_pkt, statement_name(), pkt()}
          | {:describe_pkt, statement_name(), describe_pkt :: pkt(), parse_pkt :: pkt()}
          | pkt()

  @backend_limit 200

  @doc """
  Initializes a new prepared statement storage.
  """
  @spec init_storage() :: Storage.t()
  def init_storage, do: Storage.new()

  @doc """
  Upper limit of prepared statements from the client
  """
  @spec client_limit() :: pos_integer()
  def client_limit, do: Storage.statement_limit()

  @doc """
  Upper limit of prepared statements backend-side.

  Should rotate prepared statements to avoid surpassing it.
  """
  @spec backend_limit() :: pos_integer()
  def backend_limit, do: @backend_limit

  @doc """
  Upper limit of prepared statements memory from the client in bytes
  """
  @spec client_memory_limit_bytes() :: pos_integer()
  def client_memory_limit_bytes, do: Storage.memory_limit_bytes()

  @doc """
  Receives a statement name and returns a close packet for it
  """
  @spec build_close_pkt(statement_name) :: pkt()
  def build_close_pkt(statement_name) do
    len = byte_size(statement_name)
    <<?C, len + 6::32, ?S, statement_name::binary, 0>>
  end

  @doc """
  Handles a Parse (P) message for prepared statements.
  """
  @spec handle_parse_message(Storage.t(), non_neg_integer(), binary()) ::
          {:ok, Storage.t(), pkt() | handled_pkt()} | {:error, atom()} | {:error, atom(), term()}
  def handle_parse_message(client_statements, len, payload) do
    case extract_null_terminated_string(payload) do
      # Unnamed prepared statements are passed through unchanged
      {"", _} ->
        {:ok, client_statements, <<?P, len::32, payload::binary>>}

      {client_side_name, remaining} ->
        server_side_name = gen_server_side_name(payload)
        new_len = len + (byte_size(server_side_name) - byte_size(client_side_name))
        new_bin = <<?P, new_len::32, server_side_name::binary, 0, remaining::binary>>

        prepared_statement = %PreparedStatement{
          name: server_side_name,
          parse_pkt: new_bin
        }

        with {:ok, new_client_statements} <-
               Storage.put(client_statements, client_side_name, prepared_statement) do
          {:ok, new_client_statements, {:parse_pkt, server_side_name, new_bin}}
        end
    end
  end

  @doc """
  Handles a Bind (B) message for prepared statements.
  """
  @spec handle_bind_message(Storage.t(), non_neg_integer(), binary()) ::
          {:ok, Storage.t(), pkt() | handled_pkt()}
          | {:error, Supavisor.Errors.PreparedStatementNotFoundError.t()}
  def handle_bind_message(client_statements, len, payload) do
    {_portal_name, after_portal} = extract_null_terminated_string(payload)

    case extract_null_terminated_string(after_portal) do
      {"", _} ->
        {:ok, client_statements, <<?B, len::32, payload::binary>>}

      {client_side_name, packet_after_client_name} ->
        case Storage.get(client_statements, client_side_name) do
          %PreparedStatement{name: server_side_name, parse_pkt: parse_pkt} ->
            new_len = len + (byte_size(server_side_name) - byte_size(client_side_name))

            new_bin =
              <<?B, new_len::32, 0, server_side_name::binary, 0,
                packet_after_client_name::binary>>

            {:ok, client_statements, {:bind_pkt, server_side_name, new_bin, parse_pkt}}

          nil ->
            {:error, %Supavisor.Errors.PreparedStatementNotFoundError{name: client_side_name}}
        end
    end
  end

  @doc """
  Handles a Close (C) message for prepared statements.
  """
  @spec handle_close_message(Storage.t(), non_neg_integer(), binary()) ::
          {:ok, Storage.t(), pkt() | handled_pkt()}
  def handle_close_message(client_statements, len, payload) do
    <<type, rest::binary>> = payload
    {name, _} = extract_null_terminated_string(rest)

    case type do
      ?S ->
        # Close statement - apply prepared statement name translation
        {prepared_statement, new_client_statements} = Storage.pop(client_statements, name)

        server_side_name =
          case prepared_statement do
            %PreparedStatement{name: server_name} -> server_name
            nil -> "supavisor_none"
          end

        new_len = len + (byte_size(server_side_name) - byte_size(name))
        new_bin = <<?C, new_len::32, ?S, server_side_name::binary, 0>>
        {:ok, new_client_statements, {:close_pkt, server_side_name, new_bin}}

      _ ->
        {:ok, client_statements, <<?C, len::32, payload::binary>>}
    end
  end

  @doc """
  Handles a Describe (D) message for prepared statements.
  """
  @spec handle_describe_message(Storage.t(), non_neg_integer(), binary()) ::
          {:ok, Storage.t(), pkt() | handled_pkt()}
          | {:error, Supavisor.Errors.PreparedStatementNotFoundError.t()}
  def handle_describe_message(client_statements, len, payload) do
    <<type, rest::binary>> = payload
    {name, _} = extract_null_terminated_string(rest)

    case {type, name} do
      {?P, _} ->
        {:ok, client_statements, <<?D, len::32, payload::binary>>}

      {_, ""} ->
        {:ok, client_statements, <<?D, len::32, payload::binary>>}

      {?S, _} ->
        case Storage.get(client_statements, name) do
          %PreparedStatement{name: server_name, parse_pkt: parse_pkt} ->
            new_len = len + (byte_size(server_name) - byte_size(name))
            new_bin = <<?D, new_len::32, ?S, server_name::binary, 0>>
            {:ok, client_statements, {:describe_pkt, server_name, new_bin, parse_pkt}}

          nil ->
            {:error, %Supavisor.Errors.PreparedStatementNotFoundError{name: name}}
        end
    end
  end

  defp extract_null_terminated_string(binary) do
    case :binary.split(binary, <<0>>) do
      [string, rest] -> {string, rest}
      [string] -> {string, <<>>}
    end
  end

  defp gen_server_side_name(binary) do
    hash =
      :crypto.hash(:sha256, binary)
      |> Base.encode64(padding: false)

    "sv_#{hash}"
  end
end
