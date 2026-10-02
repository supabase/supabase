defmodule Supavisor.Repo.Migrations.AddTenantAllowList do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:allow_list, {:array, :string}, null: false, default: ["0.0.0.0/0", "::/0"])
    end
  end
end
