defmodule Realtime.Repo.Migrations.ChangeLimitsDefaults do
  use Ecto.Migration

  def change do
    alter table("tenants") do
      modify(:max_events_per_second, :integer,
        null: false,
        default: 100,
        from: {:integer, null: false, default: 100}
      )

      modify(:max_concurrent_users, :integer,
        null: false,
        default: 200,
        from: {:integer, null: false, default: 200}
      )
    end
  end
end
