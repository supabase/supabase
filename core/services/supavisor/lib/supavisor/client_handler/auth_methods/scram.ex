defmodule Supavisor.ClientHandler.AuthMethods.SCRAM do
  @moduledoc """
  Handles SCRAM-SHA-256 authentication between the client and Supavisor.

  Implements the server side of the SCRAM exchange as defined in RFC 5802.
  The flow is:

    1. `new_context/2` — builds the initial auth context from tenant info and pool id.
    2. `handle_scram_first/2` — processes the client's first message, fetches validation
       secrets, computes signatures, and returns the server's first message.
    3. `handle_scram_final/2` — processes the client's final message, verifies the SCRAM
       proof, and returns the server's final message along with the resolved upstream secrets.
  """

  defmodule Context do
    @moduledoc """
    Holds state across the SCRAM authentication exchange.

    Fields:
      - `id` — the pool identifier tuple
      - `tenant` — the tenant record
      - `user` — the user record (manager user for auth_query tenants, db user for require_user tenants)
      - `db_user` — the username of the authenticating client
      - `nonce` — the client nonce from the first SCRAM message
      - `channel` — the channel binding value from the first SCRAM message
      - `signatures` — computed client and server signatures (`%{client: binary, server: binary}`)
      - `secret` — the `SASLSecrets` struct used for validation
    """

    @type t :: %__MODULE__{
            id: Supavisor.id(),
            tenant: Supavisor.Tenants.Tenant.t(),
            user: Supavisor.Tenants.User.t(),
            db_user: String.t(),
            nonce: binary() | nil,
            channel: binary() | nil,
            signatures: %{client: binary(), server: binary()} | nil,
            secret: Supavisor.Secrets.SASLSecrets.t() | nil
          }

    defstruct [:id, :tenant, :signatures, :user, :nonce, :channel, :secret, :db_user]
  end

  alias Supavisor.ClientAuthentication
  alias Supavisor.Helpers
  alias Supavisor.Protocol.Server
  alias Supavisor.Secrets.{ManagerSecrets, PasswordSecrets, SASLSecrets}

  require Supavisor

  @doc """
  Creates a new SCRAM auth context from tenant info and pool id.
  """
  @spec new_context(map(), Supavisor.id()) :: Context.t()
  def new_context(info, id) do
    Supavisor.id(user: db_user) = id

    %Context{id: id, tenant: info.tenant, user: info.user, db_user: db_user}
  end

  @doc """
  Processes the client's SCRAM first message.

  Decodes the message, validates the username, fetches validation secrets,
  and computes the SCRAM signatures. Returns the server's first message
  and an updated context with the signatures and secret populated.
  """
  @spec handle_scram_first(Context.t(), binary()) ::
          {:ok, binary(), Context.t()} | {:error, Exception.t()}
  def handle_scram_first(context, bin) do
    with {:ok, {scram_user, nonce, channel}} <- decode_scram_first(bin, context),
         {:ok, %{sasl_secrets: secret}} <-
           ClientAuthentication.fetch_validation_secrets(
             context.id,
             context.tenant,
             context.user
           ) do
      message = Server.exchange_first_message(nonce, secret.salt, secret.iterations)
      server_first_parts = Helpers.parse_server_first(message, nonce)

      signatures =
        Helpers.signatures(
          secret.stored_key,
          secret.server_key,
          server_first_parts,
          nonce,
          scram_user,
          channel
        )

      new_context = %Context{
        context
        | signatures: signatures,
          secret: secret,
          nonce: nonce,
          channel: channel
      }

      {:ok, message, new_context}
    end
  end

  @doc """
  Processes the client's SCRAM final message.

  Verifies the client proof against the stored key. On success, returns the
  server's final message and the resolved `SASLSecrets` (with `client_key` populated).
  """
  @spec handle_scram_final(Context.t(), binary()) ::
          {:ok, iodata(), SASLSecrets.t() | PasswordSecrets.t()} | {:error, Exception.t()}
  def handle_scram_final(%Context{signatures: %{server: server_signature}} = context, bin) do
    with {:ok, {:first_msg_response, %{"p" => p}}} <-
           decode_password_message(:sasl_response, bin, context),
         {:ok, client_key} <- validate_scram_proof(context, p) do
      message = Server.exchange_message(:final, "v=#{Base.encode64(server_signature)}")
      final_secrets = resolve_final_secrets(context, client_key)
      {:ok, message, final_secrets}
    end
  end

  # For require_user tenants, the SCRAM validation used a random salt that the
  # upstream database doesn't know about. Return PasswordSecrets with the plaintext
  # password so DbHandler can derive SCRAM keys from whatever salt Postgres sends.
  defp resolve_final_secrets(%{tenant: %{require_user: true}} = context, _client_key) do
    %PasswordSecrets{user: context.db_user, password: context.user.db_password}
  end

  defp resolve_final_secrets(context, client_key) do
    %{context.secret | client_key: client_key}
  end

  @spec validate_scram_proof(Context.t(), binary()) ::
          {:ok, binary()} | {:error, Exception.t()}
  defp validate_scram_proof(context, client_proof) do
    client_key = :crypto.exor(Base.decode64!(client_proof), context.signatures.client)

    if Helpers.hash(client_key) == context.secret.stored_key do
      {:ok, client_key}
    else
      {:error, wrong_password_error(context)}
    end
  end

  defp wrong_password_error(%{tenant: %{require_user: true}} = context) do
    %Supavisor.Errors.WrongPasswordError{user: context.db_user}
  end

  # The exchange was performed with the cached salt, so the proof can't be checked
  # against refreshed secrets. We can only tell the client that the password changed.
  defp wrong_password_error(context) do
    manager_secrets = ManagerSecrets.from_manager_user(context.user)

    case ClientAuthentication.handle_wrong_password(context.id, context.tenant, manager_secrets) do
      {:changed, _new_secrets} -> %Supavisor.Errors.PasswordChangedError{user: context.db_user}
      :noop -> %Supavisor.Errors.WrongPasswordError{user: context.db_user}
      {:error, _reason} -> %Supavisor.Errors.WrongPasswordError{user: context.db_user}
    end
  end

  @spec decode_scram_first(binary(), Context.t()) ::
          {:ok, {binary(), binary(), binary()}} | {:error, Exception.t()}
  defp decode_scram_first(bin, context) do
    with {:ok, {:scram_sha_256, %{"n" => user, "r" => nonce, "c" => channel}}} <-
           decode_password_message(:sasl_initial_response, bin, context) do
      {:ok, {user, nonce, channel}}
    end
  end

  @spec decode_password_message(:sasl_initial_response | :sasl_response, binary(), Context.t()) ::
          {:ok, term()} | {:error, Exception.t()}
  defp decode_password_message(message_type, bin, _context) do
    case Server.decode_password_message(bin, message_type) do
      {:ok, {_, _} = payload, _} ->
        {:ok, payload}

      {:ok, other, _} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "unexpected message during SCRAM auth: #{inspect(other)}"
         }}

      {:error, error} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "decode error during SCRAM auth: #{inspect(error)}"
         }}
    end
  end
end
