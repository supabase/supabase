defmodule Supavisor.Errors.AuthQueryError do
  @moduledoc """
  This error is returned when the auth query fails to retrieve user secrets.
  """

  use Supavisor.Error, [:reason, :details, code: "EAUTHQUERY"]

  @type reason ::
          :no_auth_query
          | :query_failed
          | :user_not_found
          | :wrong_format
          | :unsupported_secret_format
          | :parse_error
          | :md5_not_supported
          | :too_many_iterations
          | :connection_failed
          | :timeout

  @type t() :: %__MODULE__{
          reason: reason(),
          details: String.t() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: :no_auth_query}), do: "no auth_query configured for this tenant"

  def error_message(%{reason: :query_failed, details: details}),
    do: "authentication query failed: #{humanize(details)}"

  def error_message(%{reason: :query_failed}), do: "authentication query failed"
  def error_message(%{reason: :user_not_found}), do: "user not found in the database"
  def error_message(%{reason: :wrong_format}), do: "authentication query returned wrong format"

  def error_message(%{reason: :unsupported_secret_format}),
    do: "unsupported or invalid secret format"

  def error_message(%{reason: :parse_error}), do: "failed to parse SCRAM secret"

  def error_message(%{reason: :md5_not_supported}),
    do: "MD5 secrets are not supported for auth_query, use require_user instead"

  def error_message(%{reason: :too_many_iterations, details: details}),
    do: "SCRAM secret iteration count #{details}"

  def error_message(%{reason: :connection_failed, details: details}),
    do: "auth_query connection failed: #{details}"

  def error_message(%{reason: :connection_failed}),
    do: "auth_query connection failed"

  def error_message(%{reason: :timeout}),
    do: "auth_query secret check timed out"

  defp humanize(%DBConnection.ConnectionError{reason: :queue_timeout}),
    do: "connection to database not available"

  defp humanize(%DBConnection.ConnectionError{message: message}), do: message
  defp humanize(%Postgrex.Error{postgres: %{message: message}}), do: message
  defp humanize(reason), do: inspect(reason)
end
