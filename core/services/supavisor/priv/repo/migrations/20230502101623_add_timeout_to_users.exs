defmodule Supavisor.Repo.Migrations.AddTimeoutToUsers do
  use Ecto.Migration

  def up do
    alter table("users", prefix: "_supavisor") do
      add(:pool_checkout_timeout, :integer, default: 60_000, null: false)
    end
  end

  def down do
    alter table("users", prefix: "_supavisor") do
      remove(:pool_checkout_timeout)
    end
  end
end
