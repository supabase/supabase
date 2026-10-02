defmodule Supavisor.Errors.DbHandlerExitedError do
  @moduledoc """
  This error is returned when a database handler process exits unexpectedly
  """

  use Supavisor.Error, [:pid, :reason, code: "EDBHANDLEREXITED"]

  @type t() :: %__MODULE__{
          pid: pid() | nil,
          reason: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: {:shutdown, :db_termination}}) do
    "connection to database closed. Check logs for more information"
  end

  def error_message(_error) do
    "DbHandler exited. Check logs for more information"
  end

  @impl Supavisor.Error
  def postgres_error(%{reason: {:shutdown, :db_termination}}), do: nil
  def postgres_error(error), do: super(error)

  @impl Supavisor.Error
  def log_message(%{pid: pid, reason: reason}) do
    "DbHandler #{inspect(pid)} exited #{inspect(reason)}"
  end
end
