import { source } from 'common-tags'
import { makeRandomString } from 'lib/helpers'
import { executeQuery } from './query'

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
      to_char(current_timestamp, 'YYYYMMDDHHMISS'),
      ${quote(name)},
      array[${quote(query)}]
    );

    commit;
  `
}

export type ListMigrationVersionsOptions = {
  headers?: HeadersInit
}

export async function listMigrationVersions({ headers }: ListMigrationVersionsOptions) {
  return await executeQuery({ query: listMigrationVersionsQuery(), headers })
}

export type ApplyAndTrackMigrationsOptions = {
  query: string
  name?: string
  headers?: HeadersInit
}

export async function applyAndTrackMigrations({
  query,
  name,
  headers,
}: ApplyAndTrackMigrationsOptions) {
  const initializeResponse = await executeQuery<void>({
    query: initializeHistoryTableQuery(),
    headers,
  })

  if (initializeResponse.error) {
    return initializeResponse
  }

  const applyAndTrackResponse = await executeQuery({
    query: applyAndTrackMigrationsQuery(query, name),
    headers,
  })

  return applyAndTrackResponse
}
