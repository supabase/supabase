import { source } from 'common-tags'

import { executeQuery } from './query'
import { PgMetaDatabaseError, WrappedResult } from './types'
import { assertSelfHosted } from './util'
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
    -- Versions have second precision, so a migration applied within the same second as
    -- the previous one would reuse its version and fail on the primary key. In that case
    -- use the second after the latest version, and lock the table so concurrent migrations
    -- don't race. Only a latest version at or after the current time is parsed, so older
    -- versions that aren't valid timestamps (e.g. 00000000000000_init) are never parsed.
    lock table supabase_migrations.schema_migrations in share row exclusive mode;
    insert into supabase_migrations.schema_migrations (version, name, statements)
    select
      to_char(
        case
          when latest.version >= to_char(current_timestamp, 'YYYYMMDDHH24MISS')
            then to_timestamp(latest.version, 'YYYYMMDDHH24MISS') + interval '1 second'
          else current_timestamp
        end,
        'YYYYMMDDHH24MISS'
      ),
      ${quote(name)},
      array[${quote(query)}]
    from (
      select max(version) as version
      from supabase_migrations.schema_migrations
      where version ~ '^[0-9]{14}$'
    ) as latest;

    commit;
  `
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
