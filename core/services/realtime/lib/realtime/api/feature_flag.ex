defmodule Realtime.Api.FeatureFlag do
  @moduledoc """
  Ecto schema for a global feature flag.

  Flags have a name (unique), a boolean enabled state, and a rollout
  percentage (0-100, default 100) used to gradually enable the flag for a
  subset of tenants. `enabled: false` always means off for everyone; when
  `enabled: true`, `rollout_percentage` controls what fraction of tenants get
  the flag when they have no explicit override. Per-tenant overrides are
  stored separately on the `Realtime.Api.Tenant` schema as a JSONB map, not as
  associations on this record.

  `bucket_key` controls which tenants fall into the rollout percentage: it is
  hashed together with the tenant id to pick a bucket. It defaults to the
  flag's own `name`, so different flags get decorrelated (independent) rollout
  cohorts by default. Set the same `bucket_key` on two flags to make them
  intentionally share the same cohort.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "feature_flags" do
    field :name, :string
    field :enabled, :boolean, default: false
    field :rollout_percentage, :integer, default: 100
    field :bucket_key, :string
    timestamps()
  end

  def changeset(flag, attrs) do
    flag
    |> cast(attrs, [:name, :enabled, :rollout_percentage, :bucket_key])
    |> validate_required([:name])
    |> validate_number(:rollout_percentage, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> unique_constraint(:name)
  end
end
