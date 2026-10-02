defmodule RealtimeWeb.RealtimeChannel.Assigns do
  @moduledoc """
  Assigns for RealtimeChannel
  """

  defstruct [
    :tenant,
    :log_level,
    :limits,
    :tenant_topic,
    :pg_sub_ref,
    :pg_change_params,
    :postgres_extension,
    :claims,
    :jwt_secret,
    :jwt_jwks,
    :tenant_token,
    :access_token,
    :postgres_cdc_module,
    :channel_name,
    :headers
  ]

  @type t :: %__MODULE__{
          tenant: String.t(),
          log_level: Logger.level(),
          limits: %{
            max_events_per_second: integer(),
            max_concurrent_users: integer(),
            max_bytes_per_second: integer(),
            max_channels_per_client: integer(),
            max_joins_per_second: integer()
          },
          tenant_topic: String.t(),
          pg_sub_ref: reference() | nil,
          pg_change_params: map(),
          postgres_extension: map(),
          claims: map(),
          jwt_secret: String.t() | nil,
          jwt_jwks: map(),
          tenant_token: String.t(),
          access_token: String.t(),
          channel_name: String.t()
        }
end
