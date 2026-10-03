defmodule Realtime.Tenants.Repo do
  @moduledoc """
  Database operations done against the tenant database
  """
  use Realtime.Logs
  import Ecto.Query
  alias Realtime.Repo.Replica

  @doc """
  Lists all records for a given query and converts them into a given struct
  """
  @spec all(DBConnection.conn(), Ecto.Queryable.t(), module(), [Postgrex.execute_option()]) ::
          {:ok, list(struct())} | {:error, any()}
  def all(conn, query, result_struct, opts \\ []) do
    conn
    |> run_all_query(query, opts)
    |> result_to_structs(result_struct)
  end

  @doc """
  Fetches one record for a given query and converts it into a given struct
  """
  @spec one(
          DBConnection.conn(),
          Ecto.Query.t(),
          module(),
          Postgrex.option() | Keyword.t()
        ) ::
          {:error, any()} | {:ok, struct()} | Ecto.Changeset.t()
  def one(conn, query, result_struct, opts \\ []) do
    conn
    |> run_all_query(query, opts)
    |> result_to_single_struct(result_struct, nil)
  end

  @doc """
  Inserts a given changeset into the database and converts the result into a given struct.

  Partially mirrors `Ecto.Repo.insert/2`'s `:returning` option. Pass `returning: false` to omit
  `RETURNING *` and return `{:ok, struct}` built from the fields that were sent, instead
  of the row loaded from the database. This matters for authorization probes: with
  `RETURNING *`, Postgres enforces the SELECT (read) policy on the returned row, which
  would conflate write with read. Without it, a member with write-but-not-read access
  still inserts successfully.
  """
  @spec insert(
          DBConnection.conn(),
          Ecto.Changeset.t(),
          module(),
          Postgrex.option() | Keyword.t()
        ) ::
          {:ok, struct()} | {:error, any()} | Ecto.Changeset.t()
  def insert(conn, changeset, result_struct, opts \\ []) do
    {returning?, opts} = Keyword.pop(opts, :returning, true)

    with {:ok, {query, args}} <- insert_query_from_changeset(changeset, returning: returning?) do
      result = run_query_with_trap(conn, query, args, opts)

      if returning? do
        result_to_single_struct(result, result_struct, changeset)
      else
        with {:ok, %Postgrex.Result{}} <- result, do: {:ok, Ecto.Changeset.apply_changes(changeset)}
      end
    end
  end

  @doc """
  Inserts all changesets into the database and converts the result into a given list of structs
  """
  @spec insert_all_entries(
          DBConnection.conn(),
          [Ecto.Changeset.t()],
          module(),
          Postgrex.option() | Keyword.t()
        ) ::
          {:ok, [struct()]} | {:error, any()} | Ecto.Changeset.t()
  def insert_all_entries(conn, changesets, result_struct, opts \\ []) do
    {returning?, opts} = Keyword.pop(opts, :returning, true)

    with {:ok, {query, args}} <- insert_all_query_from_changeset(changesets, returning: returning?) do
      result = run_query_with_trap(conn, query, args, opts)

      if returning? do
        result_to_structs(result, result_struct)
      else
        with {:ok, %Postgrex.Result{}} <- result,
             do: {:ok, Enum.map(changesets, &Ecto.Changeset.apply_changes/1)}
      end
    end
  end

  @doc """
  Deletes records for a given query and returns the number of deleted records
  """
  @spec del(DBConnection.conn(), Ecto.Queryable.t()) ::
          {:ok, non_neg_integer()} | {:error, any()}
  def del(conn, query) do
    with {:ok, %Postgrex.Result{num_rows: num_rows}} <- run_delete_query(conn, query) do
      {:ok, num_rows}
    end
  end

  @doc """
  Updates an entry based on the changeset and returns the updated entry
  """
  @spec update(DBConnection.conn(), Ecto.Changeset.t(), module()) ::
          {:ok, struct()} | {:error, any()} | Ecto.Changeset.t()
  def update(conn, changeset, result_struct, opts \\ []) do
    with {:ok, {query, args}} <- update_query_from_changeset(changeset) do
      conn
      |> run_query_with_trap(query, args, opts)
      |> result_to_single_struct(result_struct, changeset)
    end
  end

  defp result_to_single_struct({:error, _} = error, _, _), do: error

  defp result_to_single_struct({:ok, %Postgrex.Result{rows: []}}, _, _) do
    {:error, :not_found}
  end

  defp result_to_single_struct({:ok, %Postgrex.Result{rows: [row], columns: columns}}, struct, _) do
    repo_module = Replica.replica()
    {:ok, repo_module.load(struct, Enum.zip(columns, row))}
  end

  defp result_to_single_struct({:ok, %Postgrex.Result{num_rows: num_rows}}, _, _) do
    raise("expected at most one result but got #{num_rows} in result")
  end

  defp result_to_structs({:error, _} = error, _), do: error

  defp result_to_structs({:ok, %Postgrex.Result{rows: rows, columns: columns}}, struct) do
    repo_module = Replica.replica()
    {:ok, Enum.map(rows, &repo_module.load(struct, Enum.zip(columns, &1)))}
  end

  defp insert_query_from_changeset(%{valid?: false} = changeset, _opts), do: {:error, changeset}

  defp insert_query_from_changeset(changeset, opts) do
    schema = changeset.data.__struct__
    source = schema.__schema__(:source)
    prefix = schema.__schema__(:prefix)
    acc = %{header: [], rows: []}

    %{header: header, rows: rows} =
      Enum.reduce(changeset.changes, acc, fn {field, row}, %{header: header, rows: rows} ->
        row =
          case row do
            row when is_boolean(row) -> row
            row when is_atom(row) -> Atom.to_string(row)
            _ -> row
          end

        %{
          header: [Atom.to_string(field) | header],
          rows: [row | rows]
        }
      end)

    table = "\"#{prefix}\".\"#{source}\""
    header = "(#{Enum.map_join(header, ",", &"\"#{&1}\"")})"

    arg_index =
      rows
      |> Enum.with_index(1)
      |> Enum.map_join(",", fn {_, index} -> "$#{index}" end)

    returning = if Keyword.get(opts, :returning, true), do: " RETURNING *", else: ""

    {:ok, {"INSERT INTO #{table} #{header} VALUES (#{arg_index})#{returning}", rows}}
  end

  defp insert_all_query_from_changeset(changesets, opts) do
    invalid = Enum.filter(changesets, &(!&1.valid?))

    if invalid != [] do
      {:error, changesets}
    else
      [schema] = changesets |> Enum.map(& &1.data.__struct__) |> Enum.uniq()

      source = schema.__schema__(:source)
      prefix = schema.__schema__(:prefix)
      changes = Enum.map(changesets, & &1.changes)

      %{header: header, rows: rows} =
        Enum.reduce(changes, %{header: [], rows: []}, fn v, changes_acc ->
          Enum.reduce(v, changes_acc, fn {field, row}, %{header: header, rows: rows} ->
            row =
              case row do
                row when is_boolean(row) -> row
                row when is_atom(row) -> Atom.to_string(row)
                _ -> row
              end

            %{
              header: Enum.uniq([Atom.to_string(field) | header]),
              rows: [row | rows]
            }
          end)
        end)

      args_index =
        rows
        |> Enum.chunk_every(length(header))
        |> Enum.reduce({"", 1}, fn row, {acc, count} ->
          arg_index =
            row
            |> Enum.with_index(count)
            |> Enum.map_join("", fn {_, index} -> "$#{index}," end)
            |> String.trim_trailing(",")
            |> then(&"(#{&1})")

          {"#{acc},#{arg_index}", count + length(row)}
        end)
        |> elem(0)
        |> String.trim_leading(",")

      table = "\"#{prefix}\".\"#{source}\""
      header = "(#{Enum.map_join(header, ",", &"\"#{&1}\"")})"
      returning = if Keyword.get(opts, :returning, true), do: " RETURNING *", else: ""
      {:ok, {"INSERT INTO #{table} #{header} VALUES #{args_index}#{returning}", rows}}
    end
  end

  defp update_query_from_changeset(%{valid?: false} = changeset), do: {:error, changeset}

  defp update_query_from_changeset(changeset) do
    repo_module = Replica.replica()
    %Ecto.Changeset{data: %{id: id, __struct__: struct}, changes: changes} = changeset
    changes = Keyword.new(changes)
    query = from(c in struct, where: c.id == ^id, select: c, update: [set: ^changes])
    {:ok, repo_module.to_sql(:update_all, query)}
  end

  defp run_all_query(conn, query, opts) do
    repo_module = Replica.replica()
    {query, args} = repo_module.to_sql(:all, query)
    run_query_with_trap(conn, query, args, opts)
  end

  defp run_delete_query(conn, query) do
    repo_module = Replica.replica()
    {query, args} = repo_module.to_sql(:delete_all, query)
    run_query_with_trap(conn, query, args)
  end

  defp run_query_with_trap(conn, query, args, opts \\ []) do
    Postgrex.query(conn, query, args, opts)
  rescue
    e ->
      log_error("ErrorRunningQuery", e)
      {:error, :postgrex_exception}
  catch
    :exit, {:noproc, {DBConnection.Holder, :checkout, _}} ->
      log_error(
        "UnableCheckoutConnection",
        "Unable to checkout connection, please check your connection pool configuration"
      )

      {:error, :postgrex_exception}

    :exit, reason ->
      log_error("UnknownError", reason)

      {:error, :postgrex_exception}
  end
end
