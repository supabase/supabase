defmodule Realtime.Extensions do
  @moduledoc """
  This module provides functions to get extension settings.
  """
  def db_settings(type) do
    db_settings =
      Application.get_env(:realtime, :extensions)
      |> Enum.reduce(nil, fn
        {_, %{key: ^type, db_settings: db_settings}}, _ -> db_settings
        _, acc -> acc
      end)

    if db_settings do
      %{
        default: apply(db_settings, :default, []),
        required: apply(db_settings, :required, [])
      }
    else
      %{default: %{}, required: []}
    end
  end
end
