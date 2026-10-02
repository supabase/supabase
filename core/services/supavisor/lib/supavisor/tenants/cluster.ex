defmodule Supavisor.Tenants.Cluster do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset
  alias Supavisor.Tenants.ClusterTenants

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @schema_prefix "_supavisor"

  schema "clusters" do
    field(:active, :boolean, default: false)
    field(:alias, :string)

    has_many(:cluster_tenants, ClusterTenants,
      foreign_key: :cluster_alias,
      references: :alias,
      on_delete: :delete_all,
      on_replace: :delete
    )

    timestamps()
  end

  @doc false
  def changeset(cluster, attrs) do
    cluster
    |> cast(attrs, [:active, :alias])
    |> validate_required([:active, :alias])
    |> unique_constraint([:alias])
    |> cast_assoc(:cluster_tenants, with: &ClusterTenants.changeset/2)
  end
end
