defmodule RealtimeWeb.Channels.Payloads.PostgresChangesOptions do
  @moduledoc """
  Validate postgres_changes_options field of the join payload.

  * `wait` - hold the join reply until the postgres_changes subscription is established.
  * `timeout` - how long to hold it for. The server clamps this to
    `:postgres_changes_wait_max_timeout`, so a client asking for more waits less; when the wait
    runs out the join is rejected with `PostgresChangesSubscribeTimeout` naming the timeout that
    was actually applied.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.FlexibleBoolean
  alias RealtimeWeb.Channels.Payloads.Join

  @default_timeout :timer.seconds(15)

  embedded_schema do
    field :wait, FlexibleBoolean, default: false
    field :timeout, :integer, default: @default_timeout
  end

  def changeset(postgres_changes_options, attrs) do
    postgres_changes_options
    |> cast(attrs, [:wait, :timeout], message: &Join.error_message/2)
    |> validate_number(:timeout, greater_than: 0)
  end
end
