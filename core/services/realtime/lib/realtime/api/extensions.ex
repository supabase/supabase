defmodule Realtime.Api.Extensions do
  @moduledoc """
  Schema for Realtime Extension settings.
  """

  use Ecto.Schema
  import Ecto.Changeset

  alias Realtime.Crypto

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @derive {Jason.Encoder, only: [:type, :inserted_at, :updated_at, :settings]}

  schema "extensions" do
    field(:type, :string)
    field(:settings, :map)
    belongs_to(:tenant, Realtime.Api.Tenant, foreign_key: :tenant_external_id, type: :string)
    timestamps()
  end

  def changeset(extension, attrs) do
    {new_attrs, required_settings} =
      case attrs["type"] do
        nil ->
          {attrs, []}

        type ->
          %{default: default, required: required} = Realtime.Extensions.db_settings(type)

          {
            %{attrs | "settings" => Map.merge(default, attrs["settings"])},
            required
          }
      end

    extension
    |> cast(new_attrs, [:type, :tenant_external_id, :settings])
    |> validate_required([:type, :settings])
    |> unique_constraint([:tenant_external_id, :type])
    |> validate_required_settings(required_settings)
    |> encrypt_settings(required_settings)
  end

  def encrypt_settings(changeset, fields) do
    update_change(changeset, :settings, fn settings ->
      Enum.reduce(fields, settings, fn
        {field, _, true}, acc ->
          if is_nil(acc[field]), do: acc, else: Map.put(acc, field, Crypto.encrypt!(acc[field]))

        _, acc ->
          acc
      end)
    end)
  end

  def validate_required_settings(changeset, required) do
    validate_change(changeset, :settings, fn
      _, value ->
        Enum.reduce(required, [], fn {field, checker, _}, acc ->
          case value[field] do
            nil ->
              [{:settings, "#{field} can't be blank"} | acc]

            data ->
              if checker.(data) do
                acc
              else
                [{:settings, "#{field} is invalid"} | acc]
              end
          end
        end)
    end)
  end
end
