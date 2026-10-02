defmodule Realtime.Repo.Migrations.AddPrivateOnlyFlagColumnToTenant do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add(:private_only, :boolean, default: false, null: false)
    end
  end
end
