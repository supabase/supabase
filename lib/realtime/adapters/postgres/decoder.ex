# This file draws heavily from https://github.com/cainophile/pgoutput_decoder
# License: https://github.com/cainophile/pgoutput_decoder/blob/master/LICENSE

defmodule Realtime.Adapters.Postgres.Decoder do
  @moduledoc """
  Functions for decoding different types of logical replication messages.
  """
  defmodule Messages do
    @moduledoc """
    Different types of logical replication messages from Postgres
    """
    defmodule Begin do
      @moduledoc """
      Struct representing the BEGIN message in PostgreSQL's logical decoding output.

      * `final_lsn` - The LSN of the commit that this transaction ended at.
      * `commit_timestamp` - The timestamp of the commit that this transaction ended at.
      * `xid` - The transaction ID of this transaction.
      """
      defstruct [:final_lsn, :commit_timestamp, :xid]
    end

    defmodule Commit do
      @moduledoc """
      Struct representing the COMMIT message in PostgreSQL's logical decoding output.

      * `flags` - Bitmask of flags associated with this commit.
      * `lsn` - The LSN of the commit.
      * `end_lsn` - The LSN of the next record in the WAL stream.
      * `commit_timestamp` - The timestamp of the commit.
      """
      defstruct [:flags, :lsn, :end_lsn, :commit_timestamp]
    end

    defmodule Origin do
      @moduledoc """
      Struct representing the ORIGIN message in PostgreSQL's logical decoding output.

      * `origin_commit_lsn` - The LSN of the commit in the database that the change originated from.
      * `name` - The name of the origin.
      """
      defstruct [:origin_commit_lsn, :name]
    end

    defmodule Relation do
      @moduledoc """
      Struct representing the RELATION message in PostgreSQL's logical decoding output.

      * `id` - The OID of the relation.
      * `namespace` - The OID of the namespace that the relation belongs to.
      * `name` - The name of the relation.
      * `replica_identity` - The replica identity setting of the relation.
      * `columns` - A list of columns in the relation.
      """
      defstruct [:id, :namespace, :name, :replica_identity, :columns]

      defmodule Column do
        @moduledoc """
        Struct representing a column in a relation.

        * `flags` - Bitmask of flags associated with this column.
        * `name` - The name of the column.
        * `type` - The OID of the data type of the column.
        * `type_modifier` - The type modifier of the column.
        """
        defstruct [:flags, :name, :type, :type_modifier]
      end
    end

    defmodule Insert do
      @moduledoc """
      Struct representing the INSERT message in PostgreSQL's logical decoding output.

      * `relation_id` - The OID of the relation that the tuple was inserted into.
      * `tuple_data` - The data of the inserted tuple.
      """
      defstruct [:relation_id, :tuple_data]
    end

    defmodule Update do
      @moduledoc """
      Struct representing the UPDATE message in PostgreSQL's logical decoding output.

      * `relation_id` - The OID of the relation that the tuple was updated in.
      * `changed_key_tuple_data` - The data of the tuple with the old key values.
      * `old_tuple_data` - The data of the tuple before the update.
      * `tuple_data` - The data of the tuple after the update.
      """
      defstruct [:relation_id, :changed_key_tuple_data, :old_tuple_data, :tuple_data]
    end

    defmodule Delete do
      @moduledoc """
      Struct representing the DELETE message in PostgreSQL's logical decoding output.

      * `relation_id` - The OID of the relation that the tuple was deleted from.
      * `changed_key_tuple_data` - The data of the tuple with the old key values.
      * `old_tuple_data` - The data of the tuple before the delete.
      """
      defstruct [:relation_id, :changed_key_tuple_data, :old_tuple_data]
    end

    defmodule Truncate do
      @moduledoc """
      Struct representing the TRUNCATE message in PostgreSQL's logical decoding output.

      * `number_of_relations` - The number of truncated relations.
      * `options` - Additional options provided when truncating the relations.
      * `truncated_relations` - List of relations that have been truncated.
      """
      defstruct [:number_of_relations, :options, :truncated_relations]
    end

    defmodule Type do
      @moduledoc """
      Struct representing the TYPE message in PostgreSQL's logical decoding output.

      * `id` - The OID of the type.
      * `namespace` - The namespace of the type.
      * `name` - The name of the type.
      """
      defstruct [:id, :namespace, :name]
    end

    defmodule Unsupported do
      @moduledoc """
      Struct representing an unsupported message in PostgreSQL's logical decoding output.

      * `data` - The raw data of the unsupported message.
      """
      defstruct [:data]
    end
  end

  @pg_epoch DateTime.from_iso8601("2000-01-01T00:00:00Z")

  alias Messages.Begin
  alias Messages.Commit
  alias Messages.Origin
  alias Messages.Relation
  alias Messages.Relation.Column
  alias Messages.Insert
  alias Messages.Type
  alias Messages.Unsupported

  alias Realtime.Adapters.Postgres.OidDatabase

  @doc """
  Parses logical replication messages from Postgres
  """
  def decode_message(message, relations) when is_binary(message) do
    decode_message_impl(message, relations)
  end

  defp decode_message_impl(<<"B", lsn::binary-8, timestamp::integer-64, xid::integer-32>>, _relations) do
    %Begin{
      final_lsn: decode_lsn(lsn),
      commit_timestamp: pgtimestamp_to_timestamp(timestamp),
      xid: xid
    }
  end

  defp decode_message_impl(
         <<"C", _flags::binary-1, lsn::binary-8, end_lsn::binary-8, timestamp::integer-64>>,
         _relations
       ) do
    %Commit{
      flags: [],
      lsn: decode_lsn(lsn),
      end_lsn: decode_lsn(end_lsn),
      commit_timestamp: pgtimestamp_to_timestamp(timestamp)
    }
  end

  # TODO: Verify this is correct with real data from Postgres
  defp decode_message_impl(<<"O", lsn::binary-8, name::binary>>, _relations) do
    %Origin{
      origin_commit_lsn: decode_lsn(lsn),
      name: name
    }
  end

  defp decode_message_impl(<<"R", id::integer-32, rest::binary>>, _relations) do
    [
      namespace
      | [name | [<<replica_identity::binary-1, _number_of_columns::integer-16, columns::binary>>]]
    ] = String.split(rest, <<0>>, parts: 3)

    # TODO: Handle case where pg_catalog is blank, we should still return the schema as pg_catalog
    friendly_replica_identity =
      case replica_identity do
        "d" -> :default
        "n" -> :nothing
        "f" -> :all_columns
        "i" -> :index
      end

    %Relation{
      id: id,
      namespace: namespace,
      name: name,
      replica_identity: friendly_replica_identity,
      columns: decode_columns(columns)
    }
  end

  defp decode_message_impl(
         <<"I", relation_id::integer-32, "N", number_of_columns::integer-16, tuple_data::binary>>,
         relations
       ) do
    relation = relations |> get_in([relation_id, :columns])

    if relation do
      {<<>>, decoded_tuple_data} = decode_tuple_data(tuple_data, number_of_columns, relation)

      %Insert{relation_id: relation_id, tuple_data: decoded_tuple_data}
    else
      %Unsupported{}
    end
  end

  defp decode_message_impl(<<"Y", data_type_id::integer-32, namespace_and_name::binary>>, _relations) do
    [namespace, name_with_null] = :binary.split(namespace_and_name, <<0>>)
    name = String.slice(name_with_null, 0..-2//1)

    %Type{
      id: data_type_id,
      namespace: namespace,
      name: name
    }
  end

  defp decode_message_impl(binary, _relations), do: %Unsupported{data: binary}

  defp decode_tuple_data(binary, columns_remaining, relations, accumulator \\ [])

  defp decode_tuple_data(remaining_binary, 0, _relations, accumulator) when is_binary(remaining_binary),
    do: {remaining_binary, accumulator |> Enum.reverse() |> List.to_tuple()}

  defp decode_tuple_data(<<"n", rest::binary>>, columns_remaining, [_ | relations], accumulator),
    do: decode_tuple_data(rest, columns_remaining - 1, relations, [nil | accumulator])

  defp decode_tuple_data(<<"u", rest::binary>>, columns_remaining, [_ | relations], accumulator),
    do: decode_tuple_data(rest, columns_remaining - 1, relations, [:unchanged_toast | accumulator])

  @start_date "2000-01-01T00:00:00Z"
  defp decode_tuple_data(
         <<"b", column_length::integer-32, rest::binary>>,
         columns_remaining,
         [%Column{type: type} | relations],
         accumulator
       ) do
    data = :erlang.binary_part(rest, {0, column_length})
    remainder = :erlang.binary_part(rest, {byte_size(rest), -(byte_size(rest) - column_length)})

    data =
      case type do
        "bool" ->
          data == <<1>>

        "jsonb" ->
          <<1, rest::binary>> = data
          rest

        "timestamp" ->
          <<microseconds::signed-big-64>> = data

          @start_date
          |> NaiveDateTime.from_iso8601!()
          |> NaiveDateTime.add(microseconds, :microsecond)

        "text" ->
          data

        "uuid" ->
          UUID.binary_to_string!(data)

        "bytea" ->
          data
      end

    decode_tuple_data(remainder, columns_remaining - 1, relations, [data | accumulator])
  end

  defp decode_columns(binary, accumulator \\ [])
  defp decode_columns(<<>>, accumulator), do: Enum.reverse(accumulator)

  defp decode_columns(<<flags::integer-8, rest::binary>>, accumulator) do
    [name | [<<data_type_id::integer-32, type_modifier::integer-32, columns::binary>>]] =
      String.split(rest, <<0>>, parts: 2)

    decoded_flags =
      case flags do
        1 -> [:key]
        _ -> []
      end

    decode_columns(columns, [
      %Column{
        name: name,
        flags: decoded_flags,
        type: OidDatabase.name_for_type_id(data_type_id),
        type_modifier: type_modifier
      }
      | accumulator
    ])
  end

  defp pgtimestamp_to_timestamp(microsecond_offset) when is_integer(microsecond_offset) do
    {:ok, epoch, 0} = @pg_epoch

    DateTime.add(epoch, microsecond_offset, :microsecond)
  end

  defp decode_lsn(<<xlog_file::integer-32, xlog_offset::integer-32>>),
    do: {xlog_file, xlog_offset}
end
