defmodule Realtime.Repo.Migrations.RenamePollIntervalToPollIntervalMs do
  use Ecto.Migration
  import Realtime.Api, only: [rename_settings_field: 2]

  def up do
    rename_settings_field("poll_interval", "poll_interval_ms")
  end

  def down do
    rename_settings_field("poll_interval_ms", "poll_interval")
  end
end
