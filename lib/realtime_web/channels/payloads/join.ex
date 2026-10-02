defmodule RealtimeWeb.Channels.Payloads.Join do
  @moduledoc """
  Payload validation for the phx_join event.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.Config
  alias RealtimeWeb.Channels.Payloads.Broadcast
  alias RealtimeWeb.Channels.Payloads.PostgresChangesOptions
  alias RealtimeWeb.Channels.Payloads.Presence

  embedded_schema do
    embeds_one :config, Config
    field :access_token, :string
    field :user_token, :string
  end

  @type t :: %__MODULE__{}

  def changeset(join, attrs) do
    join
    |> cast(attrs, [:access_token, :user_token], message: &error_message/2)
    |> cast_embed(:config, invalid_message: "unable to parse, expected a map")
  end

  @spec validate(map()) :: {:ok, %__MODULE__{}} | {:error, :invalid_join_payload, map()}
  def validate(params) do
    case changeset(%__MODULE__{}, params) do
      %Ecto.Changeset{valid?: true} = changeset ->
        {:ok, Ecto.Changeset.apply_changes(changeset)}

      %Ecto.Changeset{valid?: false} = changeset ->
        errors = Ecto.Changeset.traverse_errors(changeset, &elem(&1, 0))
        {:error, :invalid_join_payload, errors}
    end
  end

  def presence_enabled?(%__MODULE__{config: %Config{presence: %Presence{enabled: enabled}}}), do: enabled
  def presence_enabled?(_), do: false

  def presence_key(%__MODULE__{config: %Config{presence: %Presence{key: key}}}) when key in [nil, ""], do: UUID.uuid1()
  def presence_key(%__MODULE__{config: %Config{presence: %Presence{key: key}}}), do: key
  def presence_key(_), do: UUID.uuid1()

  def ack_broadcast?(%__MODULE__{config: %Config{broadcast: %Broadcast{ack: ack}}}), do: ack
  def ack_broadcast?(_), do: false

  def self_broadcast?(%__MODULE__{config: %Config{broadcast: %Broadcast{self: self}}}), do: self
  def self_broadcast?(_), do: false

  @doc """
  Whether the client opted in to the replication ready handshake.

  The value is cast by `RealtimeWeb.Channels.Payloads.FlexibleBoolean`.
  """
  @spec replication_ready?(t() | any()) :: boolean()
  def replication_ready?(%__MODULE__{config: %Config{broadcast: %Broadcast{replication_ready: ready}}}), do: ready
  def replication_ready?(_), do: false

  @doc """
  Whether the client asked to join a private channel, which is the channel that runs RLS authorization.

  The value is cast by `RealtimeWeb.Channels.Payloads.FlexibleBoolean`.
  """
  @spec private?(t() | any()) :: boolean()
  def private?(%__MODULE__{config: %Config{private: private}}), do: private
  def private?(_), do: false

  @doc """
  How long the join blocks waiting for the postgres_changes subscription, never above the server
  maximum. `nil` when the join is not waiting.
  """
  def postgres_changes_wait_timeout(%__MODULE__{
        config: %Config{postgres_changes_options: %PostgresChangesOptions{wait: true, timeout: timeout}}
      }),
      do: min(timeout, Application.fetch_env!(:realtime, :postgres_changes_wait_max_timeout))

  def postgres_changes_wait_timeout(_), do: nil

  def error_message(_field, meta) do
    type = Keyword.get(meta, :type)

    if type,
      do: "unable to parse, expected #{format_type(type)}",
      else: "unable to parse"
  end

  defp format_type(RealtimeWeb.Channels.Payloads.FlexibleBoolean), do: :boolean
  defp format_type(type), do: type
end
