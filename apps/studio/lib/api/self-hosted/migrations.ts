import { source } from 'common-tags'
import z from 'zod/v4'

import { executeQuery } from './query'
import { PgMetaDatabaseError, WrappedResult } from './types'
import { assertSelfHosted, isSparkProject } from './util'
import { makeRandomString } from '@/lib/helpers'

export type ListMigrationsResult = {
  version: string
  name?: string
}

const listMigrationVersionsQuery = () =>
  'select version, name from supabase_migrations.schema_migrations order by version'

const initializeHistoryTableQuery = () => `begin;

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
alter table supabase_migrations.schema_migrations add column if not exists statements text[];
alter table supabase_migrations.schema_migrations add column if not exists name text;

commit;`

const applyAndTrackMigrationsQuery = (query: string, name?: string) => {
  // Escapes literals using postgres dollar quoted string
  const dollar = `$${makeRandomString(20)}$`
  const quote = (s?: string) => (s ? dollar + s + dollar : `''`)
  return source`
    begin;

    -- apply sql from post body
    ${query};

    -- track statements in history table
    insert into supabase_migrations.schema_migrations (version, name, statements)
    values (
      to_char(current_timestamp, 'YYYYMMDDHH24MISS'),
      ${quote(name)},
      array[${quote(query)}]
    );

    commit;
  `
}

const sparkMigrationReceiptSchema = z.object({ version: z.string() })

const sparkMigrationErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  formattedError: z.string().optional(),
})

/**
 * TEMPORARY, Spark only. Applies a migration through Spark's own migration route, which runs the
 * SQL and records it in Spark's history in one transaction.
 *
 * Spark refuses the SQL the Postgres path below sends: `alter table ... add column if not exists`
 * on the history table, and `to_char(current_timestamp, ...)` for the version reads as null.
 * Delete once Spark runs `initializeHistoryTableQuery` and `applyAndTrackMigrationsQuery`.
 */
async function applySparkMigration<T>({
  query,
  name,
}: ApplyAndTrackMigrationsOptions): Promise<WrappedResult<T[]>> {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/system/v1/migrations`, {
      method: 'POST',
      // Only the service key: the caller's own headers (cookies, its bearer) are not Spark's to see.
      headers: {
        'Content-Type': 'application/json',
        apikey: `${process.env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql: query, name }),
    })
    const result = await response.json()

    if (response.ok) {
      // A 2xx without Spark's receipt (a gateway's page, another service) applied nothing.
      sparkMigrationReceiptSchema.parse(result)
      return { data: [], error: undefined }
    }

    const { message, code, formattedError } = sparkMigrationErrorSchema.parse(result)
    const error = new PgMetaDatabaseError(
      message,
      code ?? '',
      response.status,
      formattedError ?? message
    )
    return { data: undefined, error }
  } catch (cause) {
    const error = new Error("Spark's migration route did not answer as expected", { cause })
    return { data: undefined, error }
  }
}

export type ListMigrationVersionsOptions = {
  headers?: HeadersInit
}

/**
 * Lists all migrations in the migrations history table.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function listMigrationVersions({
  headers,
}: ListMigrationVersionsOptions): Promise<WrappedResult<ListMigrationsResult[]>> {
  assertSelfHosted()

  const { data, error } = await executeQuery<ListMigrationsResult>({
    query: listMigrationVersionsQuery(),
    headers,
  })

  if (error) {
    // Return empty list if the migrations table doesn't exist
    if (error instanceof PgMetaDatabaseError && error.code === '42P01') {
      return { data: [], error: undefined }
    }

    return { data: undefined, error }
  }

  return { data, error: undefined }
}

export type ApplyAndTrackMigrationsOptions = {
  query: string
  name?: string
  headers?: HeadersInit
}

/**
 * Applies a SQL migration and tracks it in the migrations history table.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function applyAndTrackMigrations<T = unknown>({
  query,
  name,
  headers,
}: ApplyAndTrackMigrationsOptions): Promise<WrappedResult<T[]>> {
  assertSelfHosted()

  if (isSparkProject()) {
    return applySparkMigration<T>({ query, name })
  }

  const initializeResponse = await executeQuery<void>({
    query: initializeHistoryTableQuery(),
    headers,
  })

  if (initializeResponse.error) {
    return initializeResponse
  }

  const applyAndTrackResponse = await executeQuery<T>({
    query: applyAndTrackMigrationsQuery(query, name),
    headers,
  })

  return applyAndTrackResponse
}
