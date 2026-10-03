defmodule Supavisor.ConnectionParameters do
  @moduledoc """
  Parameters needed to connect to an upstream PostgreSQL database.

  Built by ClientHandler (proxy mode) or Manager (transaction/session mode),
  then consumed by DbHandler to establish and authenticate the upstream connection.
  """

  alias Supavisor.Secrets.{PasswordSecrets, SASLSecrets}

  @type t :: %__MODULE__{
          host: charlist(),
          port: non_neg_integer(),
          ip_version: :inet | :inet6,
          database: String.t(),
          application_name: String.t(),
          sni_hostname: charlist() | nil,
          upstream_ssl: boolean(),
          upstream_verify: :peer | :none | nil,
          upstream_tls_ca: binary() | nil,
          secrets: PasswordSecrets.t() | SASLSecrets.t() | nil
        }

  @enforce_keys [:host, :port, :ip_version, :database]
  defstruct [
    :host,
    :port,
    :ip_version,
    :database,
    :sni_hostname,
    :upstream_ssl,
    :upstream_verify,
    :upstream_tls_ca,
    application_name: "",
    secrets: nil
  ]
end
