defmodule Realtime.Repo.Migrations.AddFeatureFlagRolloutPercentage do
  use Ecto.Migration

  def change do
    alter table(:feature_flags) do
      add :rollout_percentage, :integer, null: false, default: 100
      add :bucket_key, :string
    end

    create constraint(:feature_flags, :rollout_percentage_must_be_between_0_and_100,
             check: "rollout_percentage >= 0 AND rollout_percentage <= 100"
           )
  end
end
