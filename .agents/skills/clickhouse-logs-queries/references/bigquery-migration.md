# Migrating a BigQuery logs query to ClickHouse

The old logs engine gave each service its own table and exposed structured fields
through repeated `cross join unnest(...)` over a nested `metadata` column. The
ClickHouse engine has one `logs` table and a flat `log_attributes` map. Conversion
is mechanical once you internalize the mapping.

## The five steps

1. **Replace the table with `logs` plus a `source` filter.** The old table name is
   the `source` value: `from postgres_logs as t` becomes
   `from logs where source = 'postgres_logs'`. Never select from a per-service
   table name (`postgres_logs`, `edge_logs`, ...) on the ClickHouse engine.
   - Exception: pg_cron logs live under `source = 'postgres_logs'`.

2. **Remove every unnest join.** Delete `cross join unnest(metadata) as m`,
   `cross join unnest(m.parsed) as p`, `left join unnest(...) on true`, and so on.
   They have no equivalent — the data is already flat in the map.

3. **Rewrite every unnest-alias column as a map lookup.** A field taken off
   `unnest(metadata)` becomes `log_attributes['field']`. A field off a nested
   struct like `unnest(m.parsed)` becomes `log_attributes['parsed.field']`: keep
   the struct name as a dotted prefix, drop the `metadata` root and every alias.

4. **Wrap numeric fields in `toInt32OrZero(...)`** before comparing or aggregating
   them — map values are strings.

5. **Swap BigQuery functions for ClickHouse ones** (see the table below).

Preserve the original select list, filters, group by, order by, and limit intent
throughout.

## Function substitutions

| Need             | BigQuery                      | ClickHouse                  |
| ---------------- | ----------------------------- | --------------------------- |
| Count rows       | `count(*)`                    | `count()`                   |
| Regex match      | `regexp_contains(x, 'p')`     | `match(x, 'p')`             |
| Substring match  | `x like '%p%'`                | `x ilike '%p%'` or `like`   |
| Numeric coercion | `cast(x as int64)`            | `toInt32OrZero(x)`          |
| Timestamp value  | `cast(timestamp as datetime)` | `timestamp`                 |
| All columns      | `select *`                    | list the columns explicitly |

## Full before/after

BigQuery:

```sql
select count(t.timestamp) as count, p.error_severity
from
  postgres_logs as t
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as p
where p.error_severity in ('ERROR', 'FATAL', 'PANIC')
group by p.error_severity
order by count desc
limit 100;
```

ClickHouse:

```sql
select count() as count, log_attributes['parsed.error_severity'] as error_severity
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
group by log_attributes['parsed.error_severity']
order by count desc
limit 100
```

Notice: `count(t.timestamp)` became `count()`, the two unnest joins are gone,
`p.error_severity` became `log_attributes['parsed.error_severity']`, and the
`from`/`where` targets the single table.

## Getting the keys right

The most common conversion mistake is dropping a dotted prefix — writing
`log_attributes['x_real_ip']` when the real key is
`log_attributes['request.headers.x_real_ip']`, or `log_attributes['cf.country']`
instead of `log_attributes['request.cf.country']`. Do not invent or shorten keys.
When unsure, discover the real keys from data:

```sql
select arrayJoin(mapKeys(log_attributes)) as key, count() as n
from logs
where source = 'edge_logs'
group by key
order by n desc
limit 200;
```

Then map each old nested path to the matching key exactly as it appears.
