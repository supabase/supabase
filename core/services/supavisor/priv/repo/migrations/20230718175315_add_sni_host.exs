defmodule Supavisor.Repo.Migrations.AddSniHost do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:sni_hostname, :string, null: true)
    end
  end
end
