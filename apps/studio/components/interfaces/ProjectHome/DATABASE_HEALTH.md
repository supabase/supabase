# Database health score (demo)

A query-only, point-in-time health snapshot for the selected project's Postgres,
rendered as a sortable section on the project homepage. No scheduled jobs, no
persisted scores, no metrics service.

## Files

| File                                                          | Contents                                             |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| `data/database/database-health-query.ts`                      | The five diagnostic queries and the React Query hook |
| `data/database/database-health-score.ts`                      | `DATABASE_HEALTH_CONFIG`, metric schemas, all checks |
| `data/database/database-health-score.test.ts`                 | Unit tests for the scoring model                     |
| `components/interfaces/ProjectHome/DatabaseHealthSection.tsx` | The homepage section                                 |

## Formula

Each category starts at 100 and loses points for every check that crosses its
threshold. Category scores are combined as a weighted average over the
categories that were actually collected:

```
score = round(Σ(category.score × category.weight) / Σ(category.weight))
```

| Category                | Weight |
| ----------------------- | ------ |
| Connections             | 20%    |
| Vacuum and table health | 25%    |
| Locks                   | 15%    |
| Transaction safety      | 20%    |
| Performance             | 20%    |

Status: `healthy` at 80+, `needs_attention` at 50–79, `critical` below 50.

Three conditions cap the overall score at 30 and force `critical`:

- `autovacuum = off`
- `track_counts = off`
- Transaction ID age at or past the 1.6 billion failsafe threshold

Every threshold, weight, and penalty lives in `DATABASE_HEALTH_CONFIG`. Nothing
is hardcoded in the check bodies except the copy.

## Queries

Five grouped queries, one per category, all run in parallel through the existing
`executeSql` helper. Each is prefixed with
`set local statement_timeout = '5s'` so a health check can never become the
expensive query on someone's database.

| Category           | Sources                                                      |
| ------------------ | ------------------------------------------------------------ |
| Connections        | `pg_stat_activity`, `pg_settings`                            |
| Vacuum             | `pg_stat_user_tables`, `pg_class`, `current_setting()`       |
| Locks              | `pg_stat_activity`, `pg_locks`                               |
| Transaction safety | `pg_database`, `pg_class`, `pg_settings`, `pg_stat_activity` |
| Performance        | `pg_stat_database`, `pg_stat_user_tables`, `pg_settings`     |

Results are parsed with zod (`z.coerce.number()`, since Postgres returns
`bigint` and `numeric` as strings over the wire) before scoring.

## Missing data

Missing data never counts as healthy:

- A query that fails or times out marks its category `unavailable`. The category
  is excluded from the weighted average and called out in the UI.
- A check that cannot be evaluated (too few block reads for a meaningful cache
  hit ratio, too few updates for a HOT ratio) is recorded as a skipped check and
  listed under the findings rather than scored.
- If every query fails, the whole result is `unavailable` and no score is shown.

In development, an expandable panel dumps the full result object — per-category
scores, findings, deductions, and skipped checks.

## Current limitations

- **Not calibrated.** Weights and penalties are first-pass guesses. Calibration
  against real projects is follow-up work.
- **Global autovacuum settings only.** The autovacuum-threshold check compares
  against `autovacuum_vacuum_threshold` and
  `autovacuum_vacuum_scale_factor` at the cluster level, so per-table storage
  parameter overrides produce false positives.
- **Dead-tuple ratio, not bloat.** Exact bloat estimation is deliberately out of
  scope; `n_dead_tup / (n_live_tup + n_dead_tup)` from
  `pg_stat_user_tables` is an approximation that misses index bloat entirely.
- **Statistics are cumulative.** Cache hit ratio and HOT update ratio come from
  counters that reset only on `pg_stat_reset()`, so they describe the lifetime of
  the statistics, not the last few minutes.
- **Snapshot only.** Connections, locks, and long transactions are read once. A
  transient spike between refreshes is invisible; a spike at refresh time looks
  permanent.
- **Database scope only.** No CPU, memory, disk, or Auth/Storage/Realtime/Edge
  Function health.
