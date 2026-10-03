defmodule Supavisor.ClientHandler.AuthMethods.Password do
  @moduledoc """
  Handles cleartext password authentication between the client and Supavisor.

  The client sends a plaintext password over an SSL connection. Depending on the
  tenant configuration:

    - `require_user: true` — the password is validated against the user's password
      stored in Supavisor's own database.
    - `require_user: false` — the password is validated against SCRAM secrets fetched
      from the upstream database via auth_query.

  The flow is:

    1. `new_context/2` — builds the initial auth context from tenant info and pool id.
    2. `handle_password/2` — parses the client's password message, validates it, and
       returns the resolved upstream secrets.
  """

  defmodule Context do
    @moduledoc """
    Holds state for the cleartext password authentication exchange.

    Fields:
      - `id` — the pool identifier tuple
      - `tenant` — the tenant record
      - `user` — the user record from Supavisor's database
      - `db_user` — the username of the authenticating client
    """

    @type t :: %__MODULE__{
            id: Supavisor.id(),
            tenant: Supavisor.Tenants.Tenant.t(),
            user: Supavisor.Tenants.User.t(),
            db_user: String.t()
          }

    defstruct [:id, :tenant, :user, :db_user]
  end

  alias Supavisor.ClientAuthentication
  alias Supavisor.Protocol.Server
  alias Supavisor.Secrets.{ManagerSecrets, PasswordSecrets}

  require Supavisor

  @doc """
  Creates a new auth context from tenant info and pool id.
  """
  @spec new_context(map(), Supavisor.id()) :: Context.t()
  def new_context(info, id) do
    Supavisor.id(user: db_user) = id

    %Context{id: id, tenant: info.tenant, user: info.user, db_user: db_user}
  end

  @doc """
  Processes the client's cleartext password message.

  When `require_user` is true, validates the password against the user's
  password stored in Supavisor's own database and returns `PasswordSecrets`.

  When `require_user` is false, fetches SCRAM validation secrets via auth_query,
  and verifies the password against the stored key.
  """
  @spec handle_password(Context.t(), binary()) ::
          {:ok, PasswordSecrets.t()} | {:error, Exception.t()}
  def handle_password(context, bin) do
    with {:ok, password} <- decode_password(bin, context),
         :ok <- validate_password(password, context) do
      {:ok, %PasswordSecrets{user: context.db_user, password: password}}
    end
  end

  defp validate_password(password, %{tenant: %{require_user: true}} = context) do
    if Plug.Crypto.secure_compare(password, context.user.db_password) do
      :ok
    else
      {:error, %Supavisor.Errors.WrongPasswordError{user: context.db_user}}
    end
  end

  # The cached secrets may be stale if the password was changed upstream. Since we
  # have the cleartext password, we can check it against the refreshed secrets.
  defp validate_password(password, ctx) do
    with {:ok, secrets} <-
           ClientAuthentication.fetch_validation_secrets(ctx.id, ctx.tenant, ctx.user) do
      cond do
        password_matches?(password, secrets) -> :ok
        password_matches_refreshed?(password, ctx) -> :ok
        true -> {:error, %Supavisor.Errors.WrongPasswordError{user: ctx.db_user}}
      end
    end
  end

  defp password_matches_refreshed?(password, ctx) do
    manager_secrets = ManagerSecrets.from_manager_user(ctx.user)

    case ClientAuthentication.handle_wrong_password(ctx.id, ctx.tenant, manager_secrets) do
      {:changed, new_secrets} -> password_matches?(password, new_secrets)
      :noop -> false
      {:error, _reason} -> false
    end
  end

  defp password_matches?(password, %{
         password_secrets: password_secrets,
         sasl_secrets: sasl_secrets
       }) do
    if password_secrets && Plug.Crypto.secure_compare(password, password_secrets.password) do
      true
    else
      salted_password =
        :pgo_scram.hi(
          PgSASLprep.scram_normalize(password),
          sasl_secrets.salt,
          sasl_secrets.iterations
        )

      client_key = :pgo_scram.hmac(salted_password, "Client Key")
      :pgo_scram.h(client_key) == sasl_secrets.stored_key
    end
  end

  @spec decode_password(binary(), Context.t()) ::
          {:ok, binary()} | {:error, Exception.t()}
  defp decode_password(bin, _context) do
    case Server.decode_password_message(bin, :password) do
      {:ok, {:cleartext_password, password}, _} ->
        {:ok, IO.iodata_to_binary(password)}

      {:ok, other, _} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "unexpected message during password auth: #{inspect(other)}"
         }}

      {:error, error} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "decode error during password auth: #{inspect(error)}"
         }}
    end
  end
end
