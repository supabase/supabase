# Measuring logs query performance

Read this before you benchmark a logs query or claim a change makes one cheaper.
The easy mistakes all produce convincing numbers for something production doesn't
actually do: a different query shape, different settings, a different ClickHouse
build, or a cold cache.

## Know what the endpoint actually runs

The `logs.all.otel` endpoint doesn't run your SQL as written. It wraps it: `logs`
becomes a CTE over the underlying table that restricts rows to the project, the
allowed sources, and the requested time range, and computes `source` from the
table's internal source names with a `multiIf`. Your query becomes the body that
reads from that CTE.

That has consequences you won't see when querying the table directly:

- **`source = '...'` filters a computed column.** It can't narrow the scan using
  the table's sort key. It still works as a cheap early filter, before
  `log_attributes` is read.
- **Map subcolumns don't pass through the CTE.** `log_attributes.keys` in your
  query still reads the whole map; the CTE hands over `log_attributes` as one
  column. Only a column the CTE exposes directly, such as a dedicated keys column,
  avoids that.
- **Each `FROM logs` re-runs the CTE.** Every branch of a `UNION ALL` scans again.

To benchmark realistically, copy the wrapper from a real query in
`system.query_log` and put your query inside it, rather than querying the table
directly.

## Use the settings production uses

The endpoint's database user has its own settings profile, and it differs from a
console session's defaults. The one that matters most here is
`query_plan_max_limit_for_lazy_materialization`: the endpoint sets it far higher
than the default. With the default, an `ORDER BY ... LIMIT 50` query reads
`log_attributes` and `event_message` for every row in the range. With the
endpoint's setting, it reads them only for the 50 rows it returns. Benchmarks run
with default settings can overstate a list query's cost several times over.

Check the `Settings` column in `system.query_log` for real endpoint queries, and
add the same `SETTINGS` to your benchmark queries.

## Check the plan on the cluster you care about

- `EXPLAIN PLAN`: `JoinLazyColumnsStep` and `LazilyReadFromMergeTree` mean
  lazy materialization is on for that query.
- `EXPLAIN PLAN header = 1`: shows exactly which columns each read step reads,
  for example the full `log_attributes Map(String, String)` versus only
  `log_attributes.keys Array(String)`.
- `EXPLAIN ESTIMATE`: the parts, rows, and blocks the index analysis selects.
  It reads no data, so it's a safe way to compare time ranges or filters.

Planner behavior differs between ClickHouse versions and between Cloud builds. We
have seen a Cloud build skip lazy materialization for a `WHERE` over a CTE, while
the open-source release of the same version and the cluster serving production
traffic applied it. Staging and production can run different builds, so don't
carry a conclusion from one cluster to the other without checking the plan on
both.

## What a single benchmark run can and can't tell you

Reliable from one run:

- rows read, parts and blocks selected, decompressed bytes read
- whether the result is correct (compare a hash of the rows)

Not reliable from one run: **CPU and S3 requests for production traffic.** Each
replica has its own cache of data fetched from S3. Real traffic, especially
polling, keeps the recent data it reads cached; a one-off benchmark usually lands
on a replica without it and pays S3 fetches that both versions share. That can
hide a real saving, or invent one. Measure CPU and S3 impact by comparing real
queries in `system.query_log` before and after the change ships.

Common pitfalls:

- **Don't wrap the query in `SELECT count() FROM (...)`.** ClickHouse drops
  columns the outer query doesn't use, so the benchmark stops reading the map.
  Reference every column instead, e.g. `sum(cityHash64(col1, col2, ...))`.
- **Run comparisons one at a time, alternating which version goes first.**
  Concurrent runs share CPU and cache.
- **Turn off the query cache** with `SETTINGS use_query_cache = 0`.
- **Tag benchmark queries** with a leading comment (`-- bench <name>`) so you can
  find them in `system.query_log` for CPU, memory, parts, and `S3GetObject`.
- **Keep `system.query_log` scans narrow** with a tight `event_time` range: the
  query text column is large, and a few days of it is hundreds of gigabytes.
- **Use recent data** when the cost depends on recent, unmerged parts, such as
  live polling or short ranges.
