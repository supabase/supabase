defmodule RealtimeWeb.Channels.Payloads.FlexibleBoolean do
  @moduledoc """
  Custom Ecto type that handles boolean values coming as strings.

  Accepts:
  - Boolean values (true/false) - used as-is
  - Strings "true", "True", "TRUE", etc. - cast to true
  - Strings "false", "False", "FALSE", etc. - cast to false
  - Any other value - returns error
  """
  use Ecto.Type

  @impl true
  def type, do: :boolean

  @impl true
  def cast(value) when is_boolean(value), do: {:ok, value}

  def cast(value) when is_binary(value) do
    case String.downcase(value) do
      "true" -> {:ok, true}
      "false" -> {:ok, false}
      _ -> :error
    end
  end

  def cast(_), do: :error

  @impl true
  def load(value), do: {:ok, value}

  @impl true
  def dump(value) when is_boolean(value), do: {:ok, value}
  def dump(_), do: :error
end
