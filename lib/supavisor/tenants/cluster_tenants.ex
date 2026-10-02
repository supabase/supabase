defmodule Supavisor.Tenants.ClusterTenants do
  @moduledoc false

  use Ecto.Schema

  import Ecto.Changeset

  alias Supavisor.Tenants.Cluster
  alias Supavisor.Tenants.Tenant

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @schema_prefix "_supavisor"

  schema "cluster_tenants" do
    field(:type, Ecto.Enum, values: [:write, :read])
    field(:active, :boolean, default: false)
    belongs_to(:cluster, Cluster, foreign_key: :cluster_alias, type: :string)

    belongs_to(:tenant, Tenant,
      type: :string,
      foreign_key: :tenant_external_id,
      references: :external_id
    )

    timestamps()
  end

  @doc false
  def changeset(cluster, attrs) do
    cluster
    |> cast(attrs, [:type, :active, :cluster_alias, :tenant_external_id])
    |> validate_required([:type, :active, :cluster_alias, :tenant_external_id])
    |> unique_constraint([:tenant_external_id])
  end
end
