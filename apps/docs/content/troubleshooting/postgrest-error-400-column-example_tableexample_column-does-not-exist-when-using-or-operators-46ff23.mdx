---
title = "PostgREST error: 400 'column example_table.example_column does not exist' when using OR operators"
date_created = "2026-06-15T04:04:26+00:00"
topics = [ "platform", "api" ]
keywords = [ "postgrest", "column does not exist" ]
[[errors]]
http_status_code = 400
message = "column example_table.example_column does not exist"
---

If you receive a `400` error with the message `column example_table.example_column does not exist` only on mutation requests (`PATCH`, `POST`, `DELETE`) — while `SELECT` queries on the same column work fine — this is a known bug in PostgREST versions before 14.4 ([issue #3707](https://github.com/PostgREST/postgrest/issues/3707)).

## Root cause

The bug is triggered when an `or()` filter is included in a mutation request. PostgREST incorrectly applies the OR filter's column resolution logic to the mutation plan, causing it to fail to locate columns that exist and are otherwise accessible.

## How to confirm

1. **Reproduce the asymmetry** — run the same filter as a `GET` request. If it succeeds but the `PATCH`/`POST`/`DELETE` fails with the same column reference, the bug is the likely cause.
2. **Check your PostgREST version** — go to [Project Settings > Infrastructure](/dashboard/project/_/settings/infrastructure) and note the Postgres version. PostgREST 14.1 and earlier are affected; 14.4+ includes the fix.
3. **Check Postgres logs** — if you have logging enabled, you should see `column "example_column" does not exist` errors correlating with the timestamps of the failed mutation requests.

## Resolution

### Option 1: Upgrade (permanent fix)

Navigate to [Project Settings > Infrastructure](/dashboard/project/_/settings/infrastructure) and upgrade to the latest Postgres version. This automatically upgrades PostgREST to 14.5+, where the bug is resolved.

### Option 2: Query workaround (immediate)

Explicitly include the column referenced in the error in the `select` parameter of your mutation request. This forces PostgREST to resolve the column correctly during the mutation plan.

For example, if your request looks like:

```
PATCH /rest/v1/example_table?or=(example_column.eq.value1,example_column.eq.value2)
```

Add `select=` with the affected column:

```
PATCH /rest/v1/example_table?or=(example_column.eq.value1,example_column.eq.value2)&select=id,example_column
```

This workaround applies per-request and does not require any schema changes or infrastructure modifications.
