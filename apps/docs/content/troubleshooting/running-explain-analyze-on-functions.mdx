---
title = "Running EXPLAIN ANALYZE on functions"
topics = ["database", "functions"]
keywords = [] # any strings (topics are automatically added so no need to duplicate)
database_id = "1d62cace-c0f6-47a0-8690-002a797da33b"

[api]
sdk = ["rpc"]
---

Sometimes it can help to look at Postgres query plans inside a function. The problem is that running [`EXPLAIN ANALYZE`](https://www.depesz.com/2013/04/16/explaining-the-unexplainable/) on a function usually just shows a [function scan](https://pganalyze.com/docs/explain/scan-nodes/function-scan) or result node, which gives little insight into how the queries actually perform.

[`auto_explain`](https://www.postgresql.org/docs/current/auto-explain.html) is a pre-installed module that is able to log query plans for queries within functions.

`auto_explain` has a few settings that you still need to configure:

- `auto_explain.log_nested_statements`: log the plans of queries within functions
- `auto_explain.log_analyze`: capture the `explain analyze` results instead of `explain`
- `auto_explain.log_min_duration`: if a query is expected to run for longer than the setting's threshold, log the plan

Changing these settings at a broad scale can lead to excessive logging. Instead, you can change the configs within a `begin/rollback` block with the `set local` command. This ensures the changes are isolated to the transaction, and any writes made during testing are undone.

```sql
begin;

set local auto_explain.log_min_duration = '0';       -- log all query plans
set local auto_explain.log_analyze = true;           -- use explain analyze
set local auto_explain.log_buffers  = true;          -- use explain (buffers)
set local auto_explain.log_nested_statements = true; -- log query plans in functions

select example_func(); ---<--ADD YOUR FUNCTION HERE

rollback;
```

If needed, you can change these settings for specific roles, but we don't recommend configuring the value below `1s` for extended periods, as it may degrade performance.

For instance, you could change the value for the authenticator role (powers the Data API).

```sql
ALTER ROLE postgres SET auto_explain.log_min_duration = '.5s';
```

After running your test, you should be able to find the plan in the [Postgres logs](/dashboard/project/_/logs/postgres-logs?s=duration:). The auto_explain module always starts logs with the term "duration:", which can be used as a filter keyword.

You can also filter for the specific function in the [log explorer](/dashboard/project/_/logs/explorer?q=select%0A++cast%28postgres_logs.timestamp+as+datetime%29+as+timestamp%2C%0A++event_message+AS+query_and_plan%2C%0A++parsed.user_name%2C%0A++parsed.context%0Afrom%0A++postgres_logs%0A++cross+join+unnest%28metadata%29+as+metadata%0A++cross+join+unnest%28metadata.parsed%29+as+parsed%0Awhere%0A++regexp_contains%28event_message%2C+%27duration%3A%27%29%0A++AND%0A++regexp_contains%28context%2C+%27example_func%27%29+--%3C----ADD+FUNCTION+NAME+HERE.+IS+CASE+SENSITIVE%0Aorder+by+timestamp+desc%0Alimit+100%3B) with the below query:

```sql
select
  cast(postgres_logs.timestamp as datetime) as timestamp,
  event_message as query_and_plan,
  parsed.user_name,
  parsed.context
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.parsed) as parsed
where regexp_contains(event_message, 'duration:') and regexp_contains(context, '(?i)FUNCTION_NAME')
order by timestamp desc
limit 100;
```
