defmodule Supavisor.ClientHandler.AuthMethods.Jit do
  @moduledoc """
  Handles JIT (Just-In-Time) access token authentication.

  When a client connects with `--jit=true` in the startup options and the
  tenant has `use_jit` enabled, this module handles the authentication flow.

  The client sends a JIT access token as the password over an SSL connection.
  The token is validated against the tenant's JIT API provider.
  """

  defmodule Context do
    @moduledoc """
    Holds state for the JIT authentication exchange.
    """

    @type t :: %__MODULE__{
            id: Supavisor.id(),
            tenant: Supavisor.Tenants.Tenant.t(),
            db_user: String.t(),
            # todo: correct type
            peer_ip: term()
          }

    @enforce_keys [:id, :tenant, :db_user, :peer_ip]
    defstruct [:id, :tenant, :db_user, :peer_ip]
  end

  alias Supavisor.Secrets.PasswordSecrets
  alias Supavisor.Errors.{JitRequestFailedError, JitUnauthorizedError}
  alias Supavisor.{Helpers, Protocol.Server}

  require Supavisor

  @spec new_context(map(), Supavisor.id(), term()) :: Context.t()
  def new_context(info, id, peer_ip) do
    Supavisor.id(user: db_user) = id

    %Context{id: id, tenant: info.tenant, db_user: db_user, peer_ip: peer_ip}
  end

  @spec handle_password(Context.t(), binary()) ::
          {:ok, PasswordSecrets.t()} | {:error, Exception.t()}
  def handle_password(context, bin) do
    with {:ok, password} <- decode_password(bin, context) do
      validate_token(password, context)
    end
  end

  defp validate_token(password, ctx) do
    result =
      try do
        Helpers.check_user_has_jit_role(
          ctx.tenant.jit_api_url,
          password,
          ctx.db_user,
          ctx.peer_ip
        )
      rescue
        _ -> {:error, %JitRequestFailedError{user: ctx.db_user, reason: :request_crashed}}
      end

    case result do
      {:ok, true} ->
        {:ok, %PasswordSecrets{user: ctx.db_user, password: password}}

      {:ok, false} ->
        {:error, %JitUnauthorizedError{user: ctx.db_user, reason: :role_not_granted}}

      {:error, :unauthorized_or_forbidden} ->
        {:error, %JitUnauthorizedError{user: ctx.db_user, reason: :unauthorized_or_forbidden}}

      {:error, %JitRequestFailedError{} = err} ->
        {:error, err}

      {:error, _} ->
        {:error, %JitRequestFailedError{user: ctx.db_user, reason: :unexpected_api_error}}
    end
  end

  defp decode_password(bin, _context) do
    case Server.decode_password_message(bin, :password) do
      {:ok, {:cleartext_password, password}, _} ->
        {:ok, IO.iodata_to_binary(password)}

      {:ok, other, _} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "unexpected message during JIT auth: #{inspect(other)}"
         }}

      {:error, error} ->
        {:error,
         %Supavisor.Errors.AuthProtocolError{
           details: "decode error during JIT auth: #{inspect(error)}"
         }}
    end
  end
end
