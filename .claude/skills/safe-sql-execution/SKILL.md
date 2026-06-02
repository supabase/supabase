---
name: safe-sql-execution
description: Safely execute SQL queries against a user database without risking SQL injection or other security vulnerabilities.
---

# Safe SQL execution

Supabase Studio executes SQL statements directly against the user's database.
Because this is the authenticated user's own database, our security model is
different from most frontend applications: a user should be able to execute any
SQL statement, as long as it is proven that they themselves authored it. What
we SHOULD NOT ALLOW is execution of SQL statements that can be influenced by an
attacker, such as through URL parameters.

## Security model

The security model for SQL execution in Supabase Studio is based on the
principle of "proven authorship". This means that a user should only be able to
execute SQL statements that they have explicitly authored, and not statements
that can be influenced by external input.

There are three classes of SQL fragments:

1.  Hardcoded within the application code. These are safe to execute because
    they cannot be influenced by an attacker. They can be marked with the
    `safeSql` utility with `pg-meta`:

    ```ts
    import { safeSql } from '@supabase/pg-meta'

    const sql = safeSql`
      SELECT *
      FROM users
      WHERE id = 1
    `
    ```

    `safeSql` automatically creates a string of the branded type
    `SafeSqlFragment`. (See Provenance Tracking below.)

2.  Third-party influenceable. These are SQL fragments that can be influenced
    by an attacker, such as through URL parameters or LLM output. These should
    be marked with the `untrustedSql` utility with `pg-meta`:

    ```ts
    import { untrustedSql } from '@supabase/pg-meta'

    const unsafeQuery = searchParams.get('query')
    const querySql = untrustedSql(unsafeQuery)
    ```

    `untrustedSql` creates a string of the branded type `UntrustedSqlFragment`.
    (See Provenance Tracking below.)

3.  User-authored. These are SQL fragments that are authored by the user
    themselves within the UI, for example in a text input field. Because the
    user is the author, these should be considered safe to execute.

    However, there is a caveat, where third-party and user-authored code can
    mix, contaminating the user-authored code (for example, if an input is
    prefilled from an unsanitized URL parameter). Provenance tracking helps us
    track these cases.

    For example, a safe input component could be implemented as follows by requiring that its placeholder and controlled value are of type `SafeSqlFragment`. In this case we can use its onChange to promote the user input to `SafeSqlFragment` type, because we know that the user is the author of the input. An implementation of this is in
    @apps/studio/components/ui/SafeSqlInput.tsx:

    ```ts
    import { rawSql, type SafeSqlFragment } from '@supabase/pg-meta'
    import type { ChangeEvent, ComponentProps } from 'react'
    import { Input } from 'ui-patterns/DataInputs/Input'

    type InputProps = ComponentProps<typeof Input>

    export type SafeSqlInputProps = Omit<
      InputProps, 'placeholder' | 'value' | 'onChange'
    > & {
      placeholder?: SafeSqlFragment
      value: SafeSqlFragment
      onChange?:
        (event: ChangeEvent<HTMLInputElement>, value: SafeSqlFragment) => void
    }

    export const SafeSqlInput = ({ onChange, ...props }: SafeSqlInputProps) => (
      <Input
        {...props}
        onChange={(event) => onChange?.(event, rawSql(event.target.value))}
      />
    )
    ```

    This is pretty much the ONLY VALID USE CASE of the rawSql export from
    pg-meta, and it should be used with caution.

## Provenance tracking

Branded types are used to track the provenance of SQL fragments. The types,
exported from `pg-meta`, are:

- `SafeSqlFragment`: represents SQL fragments that are safe to execute, because
  they are either hardcoded in the application or authored by the user
  themselves.
- `UntrustedSqlFragment`: represents SQL fragments that can be influenced by an
  attacker, such as through URL parameters or LLM output.

These are valid ways to generate a `SafeSqlFragment`:

- Using the `safeSql` utility from `pg-meta` to create hardcoded SQL fragments.
- Using the sanitization utilities from `pg-meta` to sanitize untrusted input
  and promote it to a `SafeSqlFragment`:
  - `ident`
  - `literal`
  - `keyword`
- Using the safe SQL manipulation utilities:
  - `joinSqlFragments`
  - `trimSafeSqlFragment`

`UntrustedSqlFragments` can be generated from raw strings using
`untrustedSql()`.

There is also a union type, `DisplayableSqlFragment`, which represents SQL fragments that can be safely displayed in the UI, but not necessarily executed. This includes both `SafeSqlFragment` and `UntrustedSqlFragment`.

## Security of SQL round-tripped from the user's database

SQL derived directly from catalog tables (e.g., function definitions, RLS
expressions, etc.) is considered safe, and it is promoted AT THE POINT OF
BEING QUERIED from the database. In most cases, this is in an
apps/studio/data/\*_/_.ts file, in the utility function that makes the API or
database fetch.

A critical exception to the safety of SQL round-tripped from the database is
user snippets. These must NEVER BE CONSIDERED SAFE because they are both (a)
externally influenceable and (b) auto-saved. The snippet type uses the
`unchecked_sql` property, which is an `UntrustedSqlFragment`, to enforce this.

## Promoting SQL fragments to `SafeSqlFragment` type

Given an insecure string or `UntrustedSqlFragment`, how do we promote it safely
to a `SafeSqlFragment`?

### Sanitization utilities

This is the preferred method when the input is sanitizable, e.g., it is a
relation name, a column name, will be compared as a literal, etc.

The pg-meta library provides the following sanitization utilities that can be
used to safely promote untrusted input to `SafeSqlFragment`:

- `ident`: for sanitizing identifiers such as table names or column names.
- `literal`: for sanitizing literal values that will be used in SQL statements.
- `keyword`: for sanitizing SQL keywords.

### `acceptUntrustedSql`

Some untrusted SQL fragments cannot be sanitized with the above utilities. For
example, the `USING` expression in the RLS policy editor is an arbitrary SQL
expression.

In these cases, we can promote the SQL fragment _upon explicit user action_.
User action indicates that the user has seen the SQL and is OK with running it.
For example, an explicit user action could be clicking a "Run" button.

The promotion happens with the `acceptUntrustedSql` utility from `pg-meta`,  
which takes an `UntrustedSqlFragment` and returns a `SafeSqlFragment`.

This utility MUST ONLY BE USED IN event handlers. It should NEVER be used in
a useQuery, direct in the render body of a component, in a useEffect, or
anywhere it could auto-run without explicit user action.

This is safe:

```ts
import { acceptUntrustedSql } from '@supabase/pg-meta'

function SafeComponent() {
  const { mutate: execute } = useExecuteSqlMutation()

  const handleRun = () => {
    // ✅ GOOD: Safe because it is in an event handler which requires a user
    // click
    execute({ sql: acceptUntrustedSql(/* sql */) })
  }

  return (
    <button onClick={handleRun}>Run</button>
  )
}
```

This is unsafe:

```ts
import { acceptUntrustedSql } from '@supabase/pg-meta'

function UnsafeComponent() {
  const { data } = useQuery({
    queryKey: ['execute-sql', sql],
    queryFn: () => {
      // 🛑 BAD: Unsafe because it is in a query which could auto-run without
      // explicit user action
      return execute({ sql: acceptUntrustedSql(/* sql */) })
    },
  })
}
```

## Type guarantees

SQL run against the user's Postgres database runs through the `executeSql`
function, which only takes arguments of type `SafeSqlFragment` for the SQL
parameter. Raw strings or `UntrustedSqlFragment`s will error at compile time.

## Examples

### Hard-coded SQL

```ts
// ✅ GOOD: Automatically safe with `safeSql` utility
const selectStatement = safeSql`select 1`
```

### SQL with sanitizable interpolations

```ts
// ✅ GOOD: `pg-meta` utilities sanitize the input
const tableName = ident(userInputTableName)
const searchString = literal(userInputSearchString)
const sqlStatement = safeSql`
  SELECT *
  FROM ${tableName}
  WHERE search_column = ${searchString}
`
```

```ts
// 🛑 BAD: Passing raw strings will type error
const tableName = 'my_table'
const sqlStatement = safeSql`
  SELECT *
  FROM ${tableName}
`
```

### Non-sanitizable SQL from a user input

```ts
// ✅ GOOD: SafeSqlInput only allows a value that is a SafeSqlFragment
import { SafeSqlInput } from '@apps/studio/components/ui/SafeSqlInput'

function MyComponent() {
  const [sql, setSql] = useState<SafeSqlFragment>(safeSql``)

  return (
    <SafeSqlInput
      placeholder={safeSql`Enter your SQL query here...`}
      value={sql}
      onChange={(event, value) => setSql(value)}
    />
  )
}
```

```ts
// 🛑 BAD: This input mixes SafeSqlFragments and unsafe strings

function MyBadComponent() {
  const [sql, setSql] = useState<SafeSqlFragment>(safeSql``)

  return (
    <Input
    // 🛑 BAD: This is unsafe because the placeholder is a raw string
      placeholder="Enter your SQL query here..."
      value={sql}
      onChange={(event) => setSql(event.target.value)}
    />
  )
}
```

### Round-tripping SQL from the database (NOT snippet content)

```ts
// ✅ GOOD: SQL from the database is promoted to SafeSqlFragment at the point
// of fetching

// data/function-definitions.ts
function markFunctionDefinitionSafe(
  functionDefinition: FunctionDefinition
): SafeFunctionDefinition {
  return {
    ...functionDefinition,
    definition: functionDefinition.definition as SafeSqlFragment,
  }
}

// data/function-definitions.ts
function getFunctionDefinitions() {
  return GET(`/function-definitions`).then((functionDefinitions) =>
    functionDefinitions.map(markFunctionDefinitionSafe)
  )
}
```

```ts
// 🛑 BAD: Strings are promoted to SafeSqlFragment in a utility function, where
// it is impossible to easily determine the safety of the input

// utils.ts
function markFunctionDefinitionSafe(
  functionDefinition: FunctionDefinition
): SafeFunctionDefinition {
  return {
    ...functionDefinition,
    definition: functionDefinition.definition as SafeSqlFragment,
  }
}

// Component.ts
function MyComponent() {
  const { data: functionDefinitions } = useFunctionDefinitions()
  const safeFunctionDefinitions = functionDefinitions.map(markFunctionDefinitionSafe)
}
```

### Snippet content is ALWAYS UNSAFE

Snippets are auto-persisted to the database and can be created or modified
through externally influenceable channels (e.g., prefilled from URL params).
The `unchecked_sql` property is typed as `UntrustedSqlFragment` to enforce this
— it must only be promoted to `SafeSqlFragment` via `acceptUntrustedSql` in an
event handler that requires explicit user action.

```ts
// 🛑 BAD: Snippet content is executed automatically via useQuery, with no
// explicit user action confirming that the user has reviewed the SQL.
import { acceptUntrustedSql } from '@supabase/pg-meta'

function UnsafeSnippetPreview({ snippet }: { snippet: Snippet }) {
  const { data } = useExecuteSqlQuery({
    sql: acceptUntrustedSql(snippet.content.unchecked_sql),
  })

  return <Results data={data} />
}
```

```ts
// 🛑 BAD: Casting bypasses the type system entirely. The snippet's
// `unchecked_sql` is `UntrustedSqlFragment` for a reason — never cast it.
function UnsafeSnippetRunner({ snippet }: { snippet: Snippet }) {
  const { mutate: execute } = useExecuteSqlMutation()

  useEffect(() => {
    execute({ sql: snippet.content.unchecked_sql as SafeSqlFragment })
  }, [snippet])
}
```

```ts
// ✅ GOOD: Snippet content is only promoted to SafeSqlFragment inside an event
// handler, after the user clicks Run. The user has seen the SQL in the editor
// and explicitly chosen to execute it.
import { acceptUntrustedSql } from '@supabase/pg-meta'

function SnippetRunner({ snippet }: { snippet: Snippet }) {
  const { mutate: execute } = useExecuteSqlMutation()

  const handleRun = () => {
    execute({ sql: acceptUntrustedSql(snippet.content.unchecked_sql) })
  }

  return (
    <>
      <SnippetEditor snippet={snippet} />
      <button onClick={handleRun}>Run</button>
    </>
  )
}
```

## Analytics SQL (BigQuery / ClickHouse)

The same security model applies to analytics queries, which target BigQuery
or ClickHouse via the
`/platform/projects/{ref}/analytics/endpoints/logs.all{,.otel}` endpoints.
Filter keys and values from URL parameters and UI inputs are spliced into SQL
that runs against the project's logs, so the same injection risk exists.

The brand and helpers live in `apps/studio/data/logs/safe-analytics-sql.ts`,
intentionally **disjoint** from the pg-meta `SafeSqlFragment` brand:

- `SafeLogSqlFragment` — branded type for analytics SQL.
- `safeSql` — template tag that only accepts `SafeLogSqlFragment`
  interpolations.
- `analyticsLiteral(value)` — sanitizes string/number/boolean literals.
- `quotedIdent(name)` — validates and backtick-quotes dotted identifiers.
- `keyword(value, allowed)` — validates against an allow-list of operators.
- `joinSqlFragments(fragments, separator)` — composes already-branded
  fragments.

The brands are kept separate because escape semantics differ — Postgres-safe
`E'…'` strings, `::jsonb` casts, and double-quoted identifiers are unsafe for
BigQuery and/or ClickHouse, and vice versa. Crossing the brands would silently
emit unsafe SQL.

The wire-boundary wrapper is `executeAnalyticsSql` in
`apps/studio/data/logs/execute-analytics-sql.ts`, analogous to pg-meta's
`executeSql`. It accepts only `SafeLogSqlFragment` for its `sql` parameter, so
raw strings are rejected at compile time. A grep-based vitest
(`apps/studio/tests/unit/lints/analytics-sql-boundary.test.ts`) prevents
regressions by failing the build if any file outside
`execute-analytics-sql.ts` calls `post()` or `get()` directly against
`logs.all` or `logs.all.otel`.

```ts
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { analyticsLiteral, quotedIdent, safeSql } from '@/data/logs/safe-analytics-sql'

// ✅ GOOD: every interpolation is sanitized.
const sql = safeSql`
  SELECT timestamp, event_message
  FROM ${quotedIdent(table)}
  WHERE id = ${analyticsLiteral(id)}
`

await executeAnalyticsSql({
  projectRef,
  endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
  sql,
  iso_timestamp_start,
  iso_timestamp_end,
})
```

```ts
// 🛑 BAD: raw string interpolation. This fails to type-check at the
// executeAnalyticsSql boundary because the result is `string`, not
// `SafeLogSqlFragment`.
const sql = `SELECT * FROM ${table} WHERE id = '${id}'`
await executeAnalyticsSql({ projectRef, endpoint, sql, ... })
```
