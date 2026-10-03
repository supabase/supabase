defmodule Extensions.PostgresCdcRls.Subscriptions do
  @moduledoc """
  This module consolidates subscriptions handling
  """
  use Realtime.Logs

  import Postgrex, only: [transaction: 3, query: 3, query: 4, rollback: 2]

  @type conn() :: Postgrex.conn()
  # A filter written to realtime.subscription.filters: column, operator, value, and a `negate`
  # flag (the `not.` prefix).
  @type filter :: {column :: binary, op :: binary, value :: binary, negate :: boolean}
  @type subscription_params ::
          {action_filter :: binary, schema :: binary, table :: binary, [filter], selected_columns :: [binary] | nil}
  @type subscription_list :: [
          %{id: binary, claims: map, subscription_params: subscription_params}
        ]

  # All supported filter operators.
  @filter_types ["eq", "neq", "lt", "lte", "gt", "gte", "in", "like", "ilike", "is", "match", "imatch", "isdistinct"]

  # The subscribe path nests three timeouts, each strictly inside the next:
  #
  #   statement_timeout (5s, Postgres) < transaction deadline (10s, here) < RPC (15s)
  @transaction_timeout 10_000

  @spec create(conn(), String.t(), subscription_list, pid(), pid()) ::
          {:ok, Postgrex.Result.t()}
          | {:error,
             Exception.t()
             | {:exit, term}
             | {:database_timeout, Exception.t()}
             | {:subscription_insert_failed, String.t()}}

  def create(conn, publication, subscription_list, manager, caller) do
    transaction(
      conn,
      fn conn ->
        Enum.map(subscription_list, fn %{id: id, claims: claims, subscription_params: params} ->
          case query(conn, publication, id, claims, params) do
            {:ok, %{num_rows: num} = result} when num > 0 ->
              send(manager, {:subscribed, {caller, id}})
              result

            {:ok, _} ->
              msg =
                "Unable to subscribe to changes with given parameters. Please check Realtime is enabled for the given connect parameters: [#{params_to_log(params)}]"

              rollback(conn, {:subscription_insert_failed, msg})

            {:error, exception} ->
              if database_timeout?(exception) do
                rollback(conn, {:database_timeout, exception})
              else
                msg =
                  "Unable to subscribe to changes with given parameters. An exception happened so please check your connect parameters: [#{params_to_log(params)}]. Exception: #{Exception.message(exception)}"

                rollback(conn, {:subscription_insert_failed, msg})
              end
          end
        end)
      end,
      timeout: @transaction_timeout
    )
  rescue
    e in DBConnection.ConnectionError -> {:error, e}
  catch
    :exit, reason -> {:error, {:exit, reason}}
  end

  # A statement cancelled by `statement_timeout` (57014), or a connection torn down under us by
  # DBConnection's deadline, means the database is slow
  defp database_timeout?(%DBConnection.ConnectionError{}), do: true
  defp database_timeout?(%Postgrex.Error{postgres: %{code: :query_canceled}}), do: true
  defp database_timeout?(_), do: false

  defp query(conn, publication, id, claims, subscription_params) do
    sql = "with sub_tables as (
        select
        rr.entity
        from
        pg_publication_tables pub,
        lateral (
        select
        format('%I.%I', pub.schemaname, pub.tablename)::regclass entity
        ) rr
        where
        pub.pubname = $1
        and pub.schemaname like (case $2 when '*' then '%' else $2 end) escape ''
        and pub.tablename like (case $3 when '*' then '%' else $3 end) escape ''
     )
     insert into realtime.subscription as x(
        subscription_id,
        entity,
        filters,
        claims,
        action_filter,
        selected_columns
      )
      select
        $4::text::uuid,
        sub_tables.entity,
        -- Build the realtime.user_defined_filter[] server-side from primitive type arrays
        -- instead of binding a list of composite tuples. Postgrex caches the composite type's
        -- field count per connection at bootstrap and never refreshes it, so a long-lived
        -- connection whose cache predates an ALTER TYPE on user_defined_filter would otherwise
        -- encode against a stale arity and crash with :badarg. Constructing the rows here keeps
        -- the arity resolved by the server's current catalog.
        (
          select coalesce(
            array_agg(row(c, o::realtime.equality_op, v, n)::realtime.user_defined_filter),
            '{}'::realtime.user_defined_filter[]
          )
          from unnest($6::text[], $7::text[], $8::text[], $9::boolean[]) as f(c, o, v, n)
        ),
        $5,
        $10,
        $11
      from
        sub_tables
        on conflict
        -- coalesce needed: NULL != NULL in unique constraints; NULL selected_columns means all columns
        (subscription_id, entity, filters, action_filter, coalesce(selected_columns, '{}'))
        do update set
        claims = excluded.claims,
        created_at = now()
      returning
         id"

    {action_filter, schema, table, filters, selected_columns} = subscription_params
    columns = Enum.map(filters, &elem(&1, 0))
    ops = Enum.map(filters, &elem(&1, 1))
    values = Enum.map(filters, &elem(&1, 2))
    negates = Enum.map(filters, &elem(&1, 3))

    query(
      conn,
      sql,
      [
        publication,
        schema,
        table,
        id,
        claims,
        columns,
        ops,
        values,
        negates,
        action_filter,
        selected_columns
      ],
      cache_statement: "realtime_subscription_insert"
    )
  end

  defp params_to_log({action_filter, schema, table, filters, selected_columns}) do
    [event: action_filter, schema: schema, table: table, filters: filters, select: selected_columns]
    |> Enum.map_join(", ", fn {k, v} -> "#{k}: #{to_log(v)}" end)
  end

  @spec delete(conn(), String.t()) :: :ok | {:ok, Postgrex.Result.t()} | {:error, any()}
  def delete(conn, id) do
    Logger.debug("Delete subscription")
    sql = "delete from realtime.subscription where subscription_id = $1"

    case query(conn, sql, [id]) do
      {:error, %Postgrex.Error{postgres: %{code: :undefined_table}}} ->
        :ok

      {:error, reason} ->
        log_error("SubscriptionDeletionFailed", reason)
        {:error, reason}

      result ->
        result
    end
  catch
    :exit, reason ->
      log_error("SubscriptionDeletionFailed", {:exit, reason})
      {:error, {:exit, reason}}
  end

  @spec delete_all(conn()) :: :ok
  def delete_all(conn) do
    Logger.debug("Delete all subscriptions")

    case query(conn, "delete from realtime.subscription;", []) do
      {:ok, _} -> :ok
      {:error, %Postgrex.Error{postgres: %{code: :undefined_table}}} -> :ok
      {:error, reason} -> log_error("SubscriptionDeletionFailed", reason)
    end
  catch
    :exit, reason -> log_error("SubscriptionDeletionFailed", {:exit, reason})
  end

  @spec delete_multi(conn(), [Ecto.UUID.t()]) ::
          {:ok, Postgrex.Result.t()} | {:error, Exception.t()}
  def delete_multi(conn, ids) do
    Logger.debug("Delete multi ids subscriptions")
    sql = "delete from realtime.subscription where subscription_id = ANY($1::uuid[])"
    query(conn, sql, [ids])
  end

  @spec delete_all_if_table_exists(conn()) :: :ok
  def delete_all_if_table_exists(conn) do
    case query(
           conn,
           "do $$
        begin
          if exists (
            select 1
            from pg_tables
            where schemaname = 'realtime'
              and tablename  = 'subscription'
          )
          then
            delete from realtime.subscription;
          end if;
      end $$",
           []
         ) do
      {:ok, _} -> :ok
      {:error, reason} -> log_error("SubscriptionCleanupFailed", reason)
    end
  catch
    :exit, reason -> log_error("SubscriptionCleanupFailed", {:exit, reason})
  end

  @spec fetch_publication_tables(conn(), String.t()) ::
          {:ok,
           %{
             {<<_::1>>} => [integer()],
             {String.t()} => [integer()],
             {String.t(), String.t()} => [integer()]
           }
           | %{}}
          | {:error, term()}
  def fetch_publication_tables(conn, publication) do
    sql = "select
    schemaname, tablename, format('%I.%I', schemaname, tablename)::regclass as oid
    from pg_publication_tables where pubname = $1"

    case query(conn, sql, [publication]) do
      {:ok, %{columns: ["schemaname", "tablename", "oid"], rows: rows}} ->
        oids =
          rows
          |> Enum.reduce(%{}, fn [schema, table, oid], acc ->
            Map.put(acc, {schema, table}, [oid])
            |> Map.update({schema}, [oid], &[oid | &1])
            |> Map.update({"*"}, [oid], &[oid | &1])
          end)
          |> Map.new(fn {k, v} -> {k, Enum.sort(v)} end)

        {:ok, oids}

      {:error, reason} ->
        {:error, reason}

      other ->
        {:error, {:unexpected_result, other}}
    end
  catch
    :exit, reason ->
      {:error, {:exit, reason}}
  end

  @doc """
  Parses subscription filter parameters into something we can pass into our `create_subscription` query.

  Supported operators: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `like`, `ilike`, `is`,
  `match`, `imatch`, `isdistinct`. Any operator can be negated with the `not.` prefix
  (e.g. `id=not.eq.5`).

  Multiple filters can be combined with commas and are applied as AND conditions:
  `"col1=eq.val,col2=gt.5"` means `col1 = val AND col2 > 5`.

  ## Examples

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "subject=eq.hey"})
      {:ok, {"*", "public", "messages", [{"subject", "eq", "hey", false}], nil}}

  `in` filter:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "subject=in.(hidee,ho)"})
      {:ok, {"*", "public", "messages", [{"subject", "in", "{hidee,ho}", false}], nil}}

  negation with the `not.` prefix:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "subject=not.like.hey%"})
      {:ok, {"*", "public", "messages", [{"subject", "like", "hey%", true}], nil}}

  AND composition — multiple filters separated by commas:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "id=gt.0,id=lt.100"})
      {:ok, {"*", "public", "messages", [{"id", "gt", "0", false}, {"id", "lt", "100", false}], nil}}

  empty or whitespace-only filter string is treated as no filter:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => ""})
      {:ok, {"*", "public", "messages", [], nil}}

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "   "})
      {:ok, {"*", "public", "messages", [], nil}}

  no filter:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages"})
      {:ok, {"*", "public", "messages", [], nil}}

  only schema:

      iex> parse_subscription_params(%{"schema" => "public"})
      {:ok, {"*", "public", "*", [], nil}}

  only table:

      iex> parse_subscription_params(%{"table" => "messages"})
      {:ok, {"*", "public", "messages", [], nil}}

  An unsupported operator will respond with an error tuple:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "subject=foo.hey"})
      {:error, ~s(Error parsing `filter` params: ["foo", "hey"])}

  Catch `undefined` filters:

      iex> parse_subscription_params(%{"schema" => "public", "table" => "messages", "filter" => "undefined"})
      {:error, ~s(Error parsing `filter` params: ["undefined"])}

  Catch `missing params`:

      iex> parse_subscription_params(%{})
      {:error, ~s(No subscription params provided. Please provide at least a `schema` or `table` to subscribe to: %{})}

  """

  @spec parse_subscription_params(map()) :: {:ok, subscription_params} | {:error, binary()}
  def parse_subscription_params(params) do
    action_filter = action_filter(params)

    with {:ok, selected_columns} <- parse_select(params) do
      case params do
        %{"schema" => schema, "table" => table, "filter" => filter}
        when is_binary(schema) and is_binary(table) and is_binary(filter) ->
          case parse_filters(filter) do
            {:ok, filters} -> ok_params(action_filter, schema, table, filters, selected_columns)
            {:error, reason} -> {:error, "Error parsing `filter` params: #{reason}"}
          end

        %{"schema" => schema, "table" => table}
        when is_binary(schema) and is_binary(table) and not is_map_key(params, "filter") ->
          ok_params(action_filter, schema, table, [], selected_columns)

        %{"schema" => schema}
        when is_binary(schema) and not is_map_key(params, "table") and
               not is_map_key(params, "filter") ->
          ok_params(action_filter, schema, "*", [], selected_columns)

        %{"table" => table}
        when is_binary(table) and not is_map_key(params, "schema") and
               not is_map_key(params, "filter") ->
          ok_params(action_filter, "public", table, [], selected_columns)

        map when is_map_key(map, "user_token") or is_map_key(map, "auth_token") ->
          {:error,
           "No subscription params provided. Please provide at least a `schema` or `table` to subscribe to: <redacted>"}

        error ->
          {:error,
           "No subscription params provided. Please provide at least a `schema` or `table` to subscribe to: #{inspect(error)}"}
      end
    end
  end

  defp parse_select(%{"select" => cols}) when is_list(cols) do
    # An empty select list means "primary keys only" (stored as '{}'), which is
    # distinct from omitting select entirely (nil = all columns). Keep the empty
    # list so it reaches the database as '{}' instead of collapsing to nil.
    {:ok, Enum.filter(cols, &is_binary/1)}
  end

  defp parse_select(%{"select" => str}) when is_binary(str) do
    {:error, "Error parsing `select` params: expected a list of column name strings, e.g. select: [\"col1\", \"col2\"]"}
  end

  defp parse_select(_), do: {:ok, nil}

  defp ok_params(action_filter, schema, table, filters, selected_columns) do
    with :ok <- reject_select_on_wildcard(schema, table, selected_columns) do
      {:ok, {action_filter, schema, table, filters, selected_columns}}
    end
  end

  defp reject_select_on_wildcard(_schema, _table, nil), do: :ok

  defp reject_select_on_wildcard(schema, table, _selected_columns)
       when schema == "*" or table == "*" do
    {:error, "Column selection is not supported for wildcard subscriptions. Provide an explicit schema and table name."}
  end

  defp reject_select_on_wildcard(_schema, _table, _selected_columns), do: :ok

  defp action_filter(%{"event" => "*"}), do: "*"

  defp action_filter(%{"event" => event}) when is_binary(event) do
    case String.upcase(event) do
      "INSERT" -> "INSERT"
      "UPDATE" -> "UPDATE"
      "DELETE" -> "DELETE"
      _ -> "*"
    end
  end

  defp action_filter(_), do: "*"

  defp parse_filters(filter) when is_binary(filter) do
    case String.trim(filter) do
      "" -> {:ok, []}
      trimmed -> trimmed |> split_top_level() |> parse_segments()
    end
  end

  defp split_top_level(filter), do: split_top_level(filter, 0, false, 0, "", [])

  defp split_top_level(<<>>, _depth, _quoted, _prev, current, acc), do: Enum.reverse([current | acc])

  defp split_top_level(<<"\\", next, rest::binary>>, depth, true, _prev, current, acc),
    do: split_top_level(rest, depth, true, next, current <> "\\" <> <<next>>, acc)

  defp split_top_level(<<"\"", rest::binary>>, depth, true, _prev, current, acc),
    do: split_top_level(rest, depth, false, ?", current <> "\"", acc)

  defp split_top_level(<<char, rest::binary>>, depth, true, _prev, current, acc),
    do: split_top_level(rest, depth, true, char, current <> <<char>>, acc)

  defp split_top_level(<<"\"", rest::binary>>, depth, false, prev, current, acc) when prev in [?., ?(, ?,],
    do: split_top_level(rest, depth, true, ?", current <> "\"", acc)

  defp split_top_level(<<"(", rest::binary>>, depth, false, _prev, current, acc),
    do: split_top_level(rest, depth + 1, false, ?(, current <> "(", acc)

  defp split_top_level(<<")", rest::binary>>, depth, false, _prev, current, acc),
    do: split_top_level(rest, max(0, depth - 1), false, ?), current <> ")", acc)

  defp split_top_level(<<",", rest::binary>>, 0, false, _prev, current, acc),
    do: split_top_level(rest, 0, false, 0, "", [current | acc])

  defp split_top_level(<<char, rest::binary>>, depth, false, _prev, current, acc),
    do: split_top_level(rest, depth, false, char, current <> <<char>>, acc)

  # Parse each segment, short-circuiting on the first error.
  defp parse_segments(segments) do
    Enum.reduce_while(segments, {:ok, []}, fn segment, {:ok, acc} ->
      case parse_segment(segment) do
        {:ok, parsed} -> {:cont, {:ok, [parsed | acc]}}
        {:error, _} = error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, parsed} -> {:ok, Enum.reverse(parsed)}
      error -> error
    end
  end

  defp parse_segment(segment) do
    case String.trim(segment) do
      "" ->
        {:error, "filter must not contain empty segments (check for extra commas)"}

      trimmed ->
        with [col, rest] <- String.split(trimmed, "=", parts: 2),
             {negate, op_value} = parse_negate(rest),
             [filter_type, value] <- String.split(op_value, ".", parts: 2),
             # On an unsupported operator, fall through with the parsed parts so the `else`
             # branch can report them (e.g. `["foo", "hey"]`).
             true <- filter_type in @filter_types || [filter_type, value],
             {:ok, formatted_value} <- format_filter_value(filter_type, value) do
          {:ok, {col, filter_type, formatted_value, negate}}
        else
          {:error, msg} -> {:error, msg}
          e -> {:error, inspect(e)}
        end
    end
  end

  # The `not.` prefix negates the operator.
  defp parse_negate("not." <> op_value), do: {true, op_value}
  defp parse_negate(op_value), do: {false, op_value}

  defp format_filter_value("in", value) do
    size = byte_size(value)

    if size >= 2 and binary_part(value, 0, 1) == "(" and binary_part(value, size - 1, 1) == ")" do
      {:ok, "{" <> binary_part(value, 1, size - 2) <> "}"}
    else
      {:error, "`in` filter value must be wrapped by parentheses"}
    end
  end

  defp format_filter_value(_filter, value), do: {:ok, unquote_value(value)}

  defp unquote_value(<<"\"", rest::binary>> = original) do
    case take_quoted(rest, "") do
      {:ok, unquoted} -> unquoted
      :error -> original
    end
  end

  defp unquote_value(value), do: value

  defp take_quoted(<<"\"">>, acc), do: {:ok, acc}
  defp take_quoted(<<"\"", _rest::binary>>, _acc), do: :error
  defp take_quoted(<<"\\", char, rest::binary>>, acc), do: take_quoted(rest, acc <> <<char>>)
  defp take_quoted(<<char, rest::binary>>, acc), do: take_quoted(rest, acc <> <<char>>)
  defp take_quoted(<<>>, _acc), do: :error
end
