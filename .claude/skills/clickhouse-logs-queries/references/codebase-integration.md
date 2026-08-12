# Wiring a logs query in the Studio codebase

This covers writing analytics log SQL inside `apps/studio` so it is safe, routed
to the right endpoint, and consistent with the existing OTEL builders. Read this
when you are editing TypeScript that builds or runs a logs query, not when you are
just writing a query in the Logs Explorer UI.

## Branded SQL: never concatenate user input

All analytics log SQL must be a `SafeLogSqlFragment`, built with the helpers in
`apps/studio/data/logs/safe-analytics-sql.ts`. This is enforced by eslint, and the
branding is what keeps interpolated values from becoming injection. The key
exports:

- `safeSql\`...\``— a tagged template that only accepts`SafeLogSqlFragment`interpolations. Plain strings (and Postgres-branded`SafeSqlFragment`) are
  rejected at compile time, so you cannot accidentally drop a raw value in.
- `analyticsLiteral(value)` — turns a string/number/boolean into a safely escaped
  literal fragment (single quotes and backslashes are escaped). Use it for every
  dynamic value, especially the `source`.
- `joinSqlFragments(fragments, separator)` — joins already-safe fragments with a
  fixed structural separator (`' and '`, `', '`, etc.).
- `keyword(value, allowed)` — resolves a value against a compile-time allow-list of
  fragments (e.g. an `AND`/`OR` operator). Returns the allow-listed fragment, never
  the raw input.
- `quotedIdent(value)` — backtick-quotes a dotted identifier path after validating
  each segment.

There is intentionally no exported "raw" escape hatch. Compose with `safeSql` plus
these helpers.

```ts
import { analyticsLiteral, safeSql } from 'data/logs/safe-analytics-sql'

const source = 'edge_logs'
const sql = safeSql`
  select timestamp, event_message
  from logs
  where source = ${analyticsLiteral(source)}
  order by timestamp desc
  limit 100
`
```

## Pick the endpoint and builder by flag

The ClickHouse path is gated by the `otelLegacyLogs` PostHog flag
(`useFlag('otelLegacyLogs')` from `common`). Keep the BigQuery path working when
the flag is off. Two helpers in `apps/studio/data/logs/logs-endpoint.ts` express
the split:

- `logsAllEndpointUrl(useOtel)` — returns the `logs.all.otel` endpoint when
  `useOtel`, otherwise the legacy `logs.all` endpoint.
- `pickLogsQueryBuilder(useOtel, otel, bq)` — picks between an OTEL builder and a
  BigQuery builder while preserving the type.

```ts
const useOtel = useFlag('otelLegacyLogs')
const builder = pickLogsQueryBuilder(useOtel, genDefaultQueryOtel, genDefaultQuery)
const endpoint = logsAllEndpointUrl(useOtel)
// include { otel: useOtel } in the React Query key so the two paths cache separately
```

Run the fragment through `executeAnalyticsSql` (`apps/studio/data/logs/execute-analytics-sql.ts`)
against that endpoint.

## Follow the existing OTEL builders

When you need a new query shape, mirror the generators in
`apps/studio/components/interfaces/Settings/Logs/Logs.utils.otel.ts` rather than
inventing a parallel style. They already encode the conventions:

- `genDefaultQueryOtel`, `genCountQueryOtel`, `genChartQueryOtel`,
  `genSingleLogQueryOtel` — the row/count/chart/single-log builders. They select
  the real columns plus source-specific `log_attributes[...]` lookups aliased to
  the leaf names the renderers expect.
- `mapOtelPreviewRow`, `mapOtelSingleLogToLegacy`, `otelTimestampToMicros` — the
  JS normalization layer. `timestamp` must end up a microsecond number for the
  pagination cursor and the renderers, so reuse `otelTimestampToMicros` rather
  than parsing the ISO string yourself.

The map-key discovery hook (`apps/studio/data/logs/otel-log-keys-query.ts`,
`fetchOtelLogKeys` / `useOtelLogKeysQuery`) is the canonical example of a small,
correctly-branded OTEL query — read it before writing a new one.

## Keep `log_attributes` out of row lists

The cost model is in [the main skill file](../SKILL.md#reading-the-map-is-all-or-nothing):
reading one key costs what the whole map costs, so a list projection is
all-or-nothing. In this codebase that shape is already built — reuse it rather
than reinventing it:

- `genDefaultQueryOtel` emits the lean projection (`id, timestamp,
event_message`) and `genAttributeHydrationQueryOtel` fetches the aliased
  columns for one rendered page. `useLogsPreview` runs the second query inside
  the list query's `queryFn` and merges by `id`, so the row shape the renderers
  consume is unchanged.
- `otelListNeedsHydration` is the gate. It inspects the generated `WHERE` for
  `log_attributes` and keeps the single-query form when a filter already reads
  the map — those queries pay for it regardless, so splitting would add a round
  trip and save nothing. Write new filters normally; the gate picks them up
  without being updated.

For a point lookup, follow `getUnifiedLogInspection`
(`apps/studio/data/logs/unified-log-inspection-query.ts`): filter by `source`,
and bound `iso_timestamp_start`/`iso_timestamp_end` to a tight window around the
row's own timestamp, which the caller already has from the page it rendered.
Bound time through those request params, not an inline `WHERE timestamp` — that
is the convention every query in these files follows.

## Checklist

- [ ] Every dynamic value goes through `analyticsLiteral` (or another sanitizer),
      never string concatenation. Compose with `safeSql`, never a plain template
      literal — interpolating a fragment into one silently drops the brand.
- [ ] The query filters by `source` and includes a `LIMIT`.
- [ ] No `log_attributes` in a row-list projection. If the rendered row needs
      attributes, hydrate the page separately rather than trimming keys —
      trimming saves nothing.
- [ ] A lookup by `id` also filters by `source` and is bounded to a tight
      timestamp window; `id` is not in the sort key.
- [ ] The time window is the narrowest that answers the question, especially for
      any query that reads the map.
- [ ] Numeric `log_attributes` values are wrapped in `toInt32OrZero`.
- [ ] The endpoint and builder are chosen with `logsAllEndpointUrl` /
      `pickLogsQueryBuilder` off `useFlag('otelLegacyLogs')`.
- [ ] The React Query key distinguishes the OTEL and BigQuery paths.
- [ ] `timestamp` is normalized to micros for any row consumed by the table/cursor.
- [ ] There is a unit test asserting the generated SQL string (see
      `Logs.utils.otel.test.ts` and `safe-analytics-sql.test.ts` for the pattern).
