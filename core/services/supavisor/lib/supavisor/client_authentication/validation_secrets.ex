defmodule Supavisor.ClientAuthentication.ValidationSecrets do
  @moduledoc """
  Wraps the secrets used to validate incoming client authentication.

  Contains both SASL secrets (from the upstream database) and password secrets
  if available.

  Use `from_sasl_secrets/1` and `from_password_secrets/1` to construct instances
  instead of building the struct directly, to ensure `sasl_secrets` is always populated.
  """

  alias Supavisor.Secrets.{PasswordSecrets, SASLSecrets}

  @type t :: %__MODULE__{
          sasl_secrets: SASLSecrets.t(),
          password_secrets: PasswordSecrets.t() | nil
        }

  defstruct [:sasl_secrets, :password_secrets]

  @doc """
  Creates a `ValidationSecrets` from SASL secrets (fetched from upstream via auth_query).
  """
  @spec from_sasl_secrets(SASLSecrets.t()) :: t()
  def from_sasl_secrets(%SASLSecrets{} = sasl_secrets) do
    %__MODULE__{sasl_secrets: sasl_secrets}
  end

  @doc """
  Creates a `ValidationSecrets` from a `PasswordSecrets` struct.

  Derives SASL secrets from the plaintext password so that both SCRAM and
  password authentication work against the same cached entry.
  """
  @spec from_password_secrets(PasswordSecrets.t()) :: t()
  def from_password_secrets(%PasswordSecrets{} = password_secrets) do
    %__MODULE__{
      password_secrets: password_secrets,
      sasl_secrets: sasl_secrets_from_password(password_secrets.user, password_secrets.password)
    }
  end

  # Derives SCRAM-SHA-256 secrets from a plaintext password.
  #
  # Generates a random salt and computes the SCRAM key material. Can be used
  # to perform SCRAM authentication for users that don't have an auth_query
  # enabled, but instead have `require_user: true`.
  @spec sasl_secrets_from_password(String.t(), String.t()) :: SASLSecrets.t()
  defp sasl_secrets_from_password(user, password) do
    iterations = 4096
    salt = :crypto.strong_rand_bytes(16)
    salted_password = :pgo_scram.hi(PgSASLprep.scram_normalize(password), salt, iterations)
    client_key = :pgo_scram.hmac(salted_password, "Client Key")
    stored_key = :pgo_scram.h(client_key)
    server_key = :pgo_scram.hmac(salted_password, "Server Key")

    %SASLSecrets{
      user: user,
      digest: "SCRAM-SHA-256",
      iterations: iterations,
      salt: salt,
      stored_key: stored_key,
      server_key: server_key,
      client_key: client_key
    }
  end
end
