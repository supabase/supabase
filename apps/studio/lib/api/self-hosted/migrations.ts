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
    -- the previous one would reuse its version and fail on the primary key. Instead, use
    -- the first second from now that is after the latest version, and lock the table so
    -- concurrent migrations don't race. "Now" is read after the lock is taken, so a
    -- migration that commits later always gets a later version.
    -- Versions are only compared as text, never parsed, so rows that aren't valid
    -- timestamps (e.g. 00000000000000_init) can't make the insert fail. Versions more
    -- than an hour ahead are ignored, so a far-future row can't block new versions. If
    -- no second in the next hour qualifies, the version is null and the not-null
    -- constraint rolls back the migration instead of applying it untracked.
    lock table supabase_migrations.schema_migrations in share row exclusive mode;
    insert into supabase_migrations.schema_migrations (version, name, statements)
    values (
      (
        with
          window_start as (
            select date_trunc('second', clock_timestamp()) as ts
          ),
          latest as (
            select max(version) as version
            from supabase_migrations.schema_migrations, window_start
            where version ~ '^[0-9]{14}$'
              and version <= to_char(window_start.ts + interval '1 hour', 'YYYYMMDDHH24MISS')
          )
        select candidate.version
        from window_start,
          latest,
          generate_series(0, 3600) as offset_seconds,
          lateral (
            select to_char(
              window_start.ts + make_interval(secs => offset_seconds),
              'YYYYMMDDHH24MISS'
            ) as version
          ) as candidate
        where candidate.version > coalesce(latest.version, '')
          -- The one-hour bound on latest can exclude an existing version, e.g. when a
          -- daylight saving change repeats an hour, so also skip versions already in use.
          and not exists (
            select 1
            from supabase_migrations.schema_migrations as used
            where used.version = candidate.version
          )
        order by offset_seconds
        limit 1
      ),
      ${quote(name)},
      array[${quote(query)}]
    );

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
