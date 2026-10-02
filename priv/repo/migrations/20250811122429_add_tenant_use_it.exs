defmodule Supavisor.Repo.Migrations.AddJitConfig do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:use_jit, :boolean, default: false)
      add(:jit_api_url, :string)
    end
  end
end
