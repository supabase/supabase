defmodule Supavisor.Error do
  @moduledoc ~S"""
  Behaviour (and helpers) for errors

  All errors should have a `code`. This is important for documentation purposes, so that
  users can easily find them in the documentation or in the code. Raising these errors is
  supported, but discouraged. Instead, prefer to use `{:error, Supavisor.Error.t()}`.

  This module can be `use`d for a default implementation of the behaviour:

        defmodule Supavisor.MyError do
          use Supavisor.Error, [:helpful_metadata, code: "EMYERROR"]

          def error_message(%{helpful_metadata: m} = err) do
            "something bad happened: #{inspect(m)}"
          end
        end

  The macro will automatically add:

  * `message/1`, which adds the error code to the message returned by
  `error_message/1`. This function will be used when printing the exception.
  This function can't be overriden.
  * `log_message/1`, which by default is equivalent to `message/1`.
  * `log_level/1`, which by default returns `:error`.
  * `postgres_error/1`, which by default wraps `error_message/1` in a fatal postgres
    error with code `"XX000"`.
  """

  @typedoc """
  Any struct whose module implements the behaviour
  """
  @type t() :: struct()

  @doc """
  Log level to use when this error happens
  """
  @callback log_level(error :: t()) :: Logger.level()

  @doc """
  Message to be logged when this error happens

  If `nil`, no message is logged.
  """
  @callback log_message(error :: t()) :: iodata() | nil

  @doc """
  Message to be returned when printing the exception (without error code prefix)
  """
  @callback error_message(error :: t()) :: iodata()

  @doc """
  Postgres protocol error to be sent on wire after this error happens on ClientHandler

  If `nil`, no error is sent
  """
  @callback postgres_error(error :: t()) :: map() | nil

  defmacro __using__(opts) do
    quote generated: true do
      if is_nil(unquote(opts)[:code]) do
        raise ArgumentError, "code is required"
      end

      defexception unquote(opts)

      @behaviour Supavisor.Error

      @impl Exception
      def message(error) do
        IO.iodata_to_binary([?(, error.code, ?), ?\s, error_message(error)])
      end

      @impl Exception
      def exception(fields) do
        struct(__MODULE__, fields)
      end

      @impl Supavisor.Error
      def log_message(error), do: message(error)

      @impl Supavisor.Error
      def postgres_error(error) do
        %{"S" => "FATAL", "C" => "XX000", "M" => message(error)}
      end

      @impl Supavisor.Error
      def log_level(_), do: :error

      defoverridable log_level: 1, log_message: 1, postgres_error: 1
    end
  end

  def protocol_error(level, pg_code, message) do
    %{"S" => level, "C" => pg_code, "M" => message}
  end
end
