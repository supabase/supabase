defmodule Supavisor.Tenants.User do
  @moduledoc false
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @schema_prefix "_supavisor"

  schema "users" do
    field(:db_user_alias, :string)
    field(:db_user, :string)
    field(:db_password, Supavisor.Encrypted.Binary, source: :db_pass_encrypted, redact: true)
    field(:is_manager, :boolean, default: false)
    field(:mode_type, Ecto.Enum, values: [:transaction, :session])
    field(:pool_size, :integer)
    field(:pool_checkout_timeout, :integer, default: 60_000)
    field(:max_clients, :integer)
    belongs_to(:tenant, Supavisor.Tenants.Tenant, foreign_key: :tenant_external_id, type: :string)
    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    attrs =
      if attrs["db_user_alias"] do
        attrs
      else
        Map.put(attrs, "db_user_alias", attrs["db_user"])
      end

    user
    |> cast(attrs, [
      :db_user_alias,
      :db_user,
      :db_password,
      :pool_size,
      :mode_type,
      :is_manager,
      :pool_checkout_timeout,
      :max_clients
    ])
    |> validate_required([
      :db_user_alias,
      :db_user,
      :db_password,
      :pool_size,
      :mode_type
    ])
  end

  @doc """
  Changeset for updating only user credentials (db_user and db_password).
  """
  def credentials_changeset(user, attrs) do
    changeset =
      user
      |> cast(attrs, [:db_user, :db_password])
      |> validate_required([:db_user, :db_password])

    Enum.reduce([:db_user, :db_password], changeset, fn required_field, changeset ->
      cond do
        attrs[required_field] ->
          changeset

        attrs[Atom.to_string(required_field)] ->
          changeset

        true ->
          add_error(changeset, required_field, "can't be blank")
      end
    end)
  end
end
