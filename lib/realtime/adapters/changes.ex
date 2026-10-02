# This file draws heavily from https://github.com/cainophile/cainophile
# License: https://github.com/cainophile/cainophile/blob/master/LICENSE

require Protocol

defmodule Realtime.Adapters.Changes do
  @moduledoc """
  This module provides structures of CDC changes.
  """
  defmodule Transaction do
    @moduledoc false
    defstruct [:changes, :commit_timestamp]
  end

  defmodule NewRecord do
    @moduledoc false
    @derive {Jason.Encoder, except: [:subscription_ids]}
    defstruct [
      :columns,
      :commit_timestamp,
      :errors,
      :schema,
      :table,
      :record,
      :subscription_ids,
      :type
    ]
  end

  defmodule UpdatedRecord do
    @moduledoc false
    @derive {Jason.Encoder, except: [:subscription_ids]}
    defstruct [
      :columns,
      :commit_timestamp,
      :errors,
      :schema,
      :table,
      :old_record,
      :record,
      :subscription_ids,
      :type
    ]
  end

  defmodule DeletedRecord do
    @moduledoc false
    @derive {Jason.Encoder, except: [:subscription_ids]}
    defstruct [
      :columns,
      :commit_timestamp,
      :errors,
      :schema,
      :table,
      :old_record,
      :subscription_ids,
      :type
    ]
  end

  defmodule TruncatedRelation do
    @moduledoc false
    defstruct [:type, :schema, :table, :commit_timestamp]
  end
end

Protocol.derive(Jason.Encoder, Realtime.Adapters.Changes.Transaction)
Protocol.derive(Jason.Encoder, Realtime.Adapters.Changes.TruncatedRelation)
Protocol.derive(Jason.Encoder, Realtime.Adapters.Postgres.Decoder.Messages.Relation.Column)
