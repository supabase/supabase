defmodule Supavisor.Errors.AuthSecretsError do
  @moduledoc """
  This error is returned when authentication secrets retrieval fails
  """

  use Supavisor.Error, [:reason, code: "EAUTHSECRETS"]

  @type t() :: %__MODULE__{
          reason: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: reason}) do
    "failed to retrieve authentication secrets: #{inspect(reason)}"
  end
end
