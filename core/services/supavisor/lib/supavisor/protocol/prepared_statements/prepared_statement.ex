defmodule Supavisor.Protocol.PreparedStatements.PreparedStatement do
  @moduledoc """
  Represents a prepared statement
  """

  defstruct [:parse_pkt, :name]

  @type t() :: %__MODULE__{
          parse_pkt: binary(),
          name: String.t()
        }

  @spec size(t() | nil) :: non_neg_integer()
  def size(%{parse_pkt: parse_pkt}) do
    byte_size(parse_pkt)
  end

  def size(nil) do
    0
  end
end
