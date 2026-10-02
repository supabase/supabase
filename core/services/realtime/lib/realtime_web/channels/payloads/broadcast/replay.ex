defmodule RealtimeWeb.Channels.Payloads.Broadcast.Replay do
  @moduledoc """
  Validate broadcast replay field of the join payload.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.Join

  embedded_schema do
    field :limit, :integer, default: 25
    field :since, :integer, default: 0
  end

  @typedoc """
  * `limit` - How many messages to replay, counting back from the most recent.
  * `since` - Only replay messages inserted after this Unix timestamp in milliseconds.
  """
  @type t :: %__MODULE__{limit: non_neg_integer(), since: non_neg_integer()}

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(broadcast, attrs) do
    cast(broadcast, attrs, [:limit, :since], message: &Join.error_message/2)
  end
end
