defmodule TestHelpers do
  @moduledoc """
  Generic helpers for tests.

  `use TestHelpers` brings these helpers into scope alongside `WaitForIt` and `WaitForIt.Test`;
  the three case templates in `test/support` do this already, so most tests get it for free.
  """

  import WaitForIt

  @default_timeout 5_000
  @default_interval 100

  @negative_timeout 500
  @negative_interval 25

  # `assert_eventually` and `refute_eventually` below shadow their `WaitForIt.Test` namesakes so
  # that they keep this suite's historical wait budget.
  @shadowed_assertions for {name, arity} <- WaitForIt.Test.__info__(:macros),
                           name in [:assert_eventually, :refute_eventually],
                           do: {name, arity}

  @doc """
  Imports this module together with `WaitForIt.Test`, and requires `WaitForIt`.

  The waiting assertions that this module overrides with backward-compatible defaults are
  excluded from the `WaitForIt.Test` import; everything else it exports (`assert_always/2`, which
  keeps the library's own 100ms default) comes through untouched.
  """
  defmacro __using__(_opts) do
    quote do
      import TestHelpers
      import WaitForIt.Test, except: unquote(@shadowed_assertions)

      import WaitForIt
    end
  end

  @doc """
  Creates a logical replication slot.

  Temporary by default, because that is the only kind Multigres accepts without
  registering the slot for failover. Pass `temporary: false` for a slot that
  outlives the session that made it: a handful of tests need one nobody is
  consuming, or one dropped through another connection.

  `:plugin` (required) - which plugin a slot decodes with
  """
  @spec create_replication_slot(pid(), String.t(), keyword()) :: Postgrex.Result.t()
  def create_replication_slot(conn, slot_name, opts) do
    opts = Keyword.validate!(opts, [:plugin, temporary: true])
    plugin = Keyword.fetch!(opts, :plugin)

    if opts[:temporary] do
      Postgrex.query!(
        conn,
        "SELECT pg_create_logical_replication_slot(slot_name => $1::name, plugin => $2::name, temporary => true)",
        [slot_name, plugin]
      )
    else
      create_persistent_slot(conn, slot_name, plugin)
    end
  end

  # Multigres only admits a non-temporary slot when it is registered for failover, and
  # `failover` is a PostgreSQL 17 parameter, so it is passed only where the server has it.
  # Either way the slot ends up in the same state - persistent and inactive.
  defp create_persistent_slot(conn, slot_name, plugin) do
    %{rows: [[failover_supported?]]} =
      Postgrex.query!(
        conn,
        """
        SELECT EXISTS (
          SELECT 1 FROM pg_proc p, unnest(p.proargnames) n
          WHERE p.proname = 'pg_create_logical_replication_slot' AND n = 'failover'
        )
        """,
        []
      )

    if failover_supported? do
      Postgrex.query!(
        conn,
        "SELECT pg_create_logical_replication_slot(slot_name => $1::name, plugin => $2::name, failover => true)",
        [slot_name, plugin]
      )
    else
      Postgrex.query!(
        conn,
        "SELECT pg_create_logical_replication_slot(slot_name => $1::name, plugin => $2::name)",
        [slot_name, plugin]
      )
    end
  end

  @doc """
  Drops a replication slot, tolerating its absence. For cleanup, not assertions.
  """
  @spec drop_replication_slot(pid(), String.t()) :: :ok
  def drop_replication_slot(conn, slot_name) do
    Postgrex.query(conn, "SELECT pg_drop_replication_slot($1)", [slot_name])
    :ok
  end

  @doc """
  Runs `fun` until it returns a truthy value, retrying until it succeeds or the timeout is reached.

  Returns `true` if `fun` succeeded or `false` if it timed out.

  This now uses `WaitForIt.until/2` under the hood, so you can pass any options that it accepts.

  ## Options

    * `:timeout` - the amount of time to wait (in milliseconds) before giving up, or `:infinity`
      to wait indefinitely
    * `:interval` - the polling interval in milliseconds, or a
      [`WaitForIt.Backoff`](https://hexdocs.pm/wait_for_it/WaitForIt.Backoff.html) function
    * `:pre_wait` - wait for the given number of milliseconds before evaluating for the first time
    * `:signal` - disable polling and use a signal of the given name instead

  ### Deprecated Options

  If the following options are provided, they will be converted to the new options above.
  If `:sleep` is provided, it will be used as the `:interval` option. If `:retries` is provided,
  it will be used to calculate the `:timeout` option.

    * `:retries` - the number of times to retry before giving up (default: 50)
    * `:sleep` - the amount of time to sleep between retries (default: 100)
  """
  @spec eventually((-> as_boolean(term())), keyword()) :: boolean()
  def eventually(fun, opts \\ []) do
    retries = Keyword.get(opts, :retries, 50)
    sleep = Keyword.get(opts, :sleep, 100)

    wait_for_it_opts =
      opts
      |> Keyword.drop([:retries, :sleep])
      |> Keyword.put_new(:timeout, retries * sleep)
      |> Keyword.put_new(:interval, sleep)

    case WaitForIt.until(fun, wait_for_it_opts) do
      {:ok, _value} -> true
      {:timeout, _last_value} -> false
    end
  end

  @doc """
  Like `WaitForIt.Test.assert_eventually/2`, but defaults `:timeout` to #{@default_timeout}ms and
  `:interval` to #{@default_interval}ms, matching the wait budget of the old
  `retries: 50, sleep: 100` default that this test suite relied on before switching to
  `wait_for_it`. Any options passed here override these defaults.
  """
  defmacro assert_eventually(expression, opts \\ []) do
    quote do
      require WaitForIt.Test
      WaitForIt.Test.assert_eventually(unquote(expression), TestHelpers.__with_defaults__(unquote(opts)))
    end
  end

  @doc """
  Like `WaitForIt.Test.refute_eventually/2`, but defaults `:timeout` to #{@negative_timeout}ms and
  `:interval` to #{@negative_interval}ms.

  Deliberately a much smaller budget than `assert_eventually/2`. A passing `assert_eventually`
  stops as soon as the condition holds, so a generous timeout there costs nothing; a passing
  `refute_eventually` proves a negative by watching the whole window elapse, so its timeout is
  paid in full on every run. The default is sized for "the thing that must not happen would have
  happened by now" against a local database, and samples often enough within that window to
  catch it. Where the negative genuinely needs longer to settle, pass an explicit `:timeout`.
  """
  defmacro refute_eventually(expression, opts \\ []) do
    quote do
      require WaitForIt.Test
      WaitForIt.Test.refute_eventually(unquote(expression), TestHelpers.__negative_defaults__(unquote(opts)))
    end
  end

  @doc false
  def __with_defaults__(opts) do
    opts
    |> Keyword.put_new(:timeout, @default_timeout)
    |> Keyword.put_new(:interval, @default_interval)
  end

  @doc false
  def __negative_defaults__(opts) do
    opts
    |> Keyword.put_new(:timeout, @negative_timeout)
    |> Keyword.put_new(:interval, @negative_interval)
  end

  @doc """
  Checks out every connection in `db_conn`'s pool and holds them, so the next caller has to queue.

  `count` is the size of the pool: this blocks until the pool reports it has nothing left to hand
  out, so a smaller number raises.

  The holders sleep in Elixir inside a transaction rather than in a `pg_sleep/1`, so a pool with a
  `statement_timeout` cannot hand a connection back in the middle of a test. Works for a pool on
  another node: the holders run there.
  """
  @spec hold_connections!(pid() | atom(), pos_integer()) :: :ok
  def hold_connections!(db_conn, count \\ 1) do
    test = self()

    holders = for _ <- 1..count, do: Node.spawn_link(node(db_conn), __MODULE__, :__hold_connection__, [db_conn, test])

    for _ <- holders do
      receive do
        {:holding, _holder} -> :ok
      after
        @default_timeout ->
          raise "only some of the #{count} connection(s) on #{inspect(db_conn)} were checked out in time"
      end
    end

    # And the pool agrees there is nothing left for the next caller.
    await_pool_saturated!(db_conn)
  end

  @doc false
  def __hold_connection__(db_conn, test) do
    Postgrex.transaction(
      db_conn,
      fn _conn ->
        send(test, {:holding, self()})
        Process.sleep(:infinity)
      end,
      timeout: to_timeout(minute: 1)
    )
  end

  @doc """
  Blocks until `db_conn`'s pool has no connection left to hand out.

  Useful for tests that deliberately exhaust a pool and then assert on the resulting
  `:queue_timeout`. Also works for a pool on another node.
  """
  @spec await_pool_saturated!(pid() | atom()) :: :ok
  def await_pool_saturated!(db_conn) do
    match_wait!([%{ready_conn_count: 0}], DBConnection.get_connection_metrics(db_conn),
      timeout: @default_timeout,
      interval: 10
    )

    :ok
  end

  @doc """
  Blocks until `db_conn`'s pool has a connection ready to hand out.

  Pair with `await_pool_saturated!/1` around whatever checks the connection out.
  """
  @spec await_pool_ready!(pid() | atom()) :: :ok
  def await_pool_ready!(db_conn) do
    case_wait DBConnection.get_connection_metrics(db_conn),
      timeout: @default_timeout,
      interval: 10 do
      [%{ready_conn_count: ready}] when ready > 0 -> :ok
    else
      metrics -> raise "pool #{inspect(db_conn)} had no connection ready: #{inspect(metrics)}"
    end
  end
end
