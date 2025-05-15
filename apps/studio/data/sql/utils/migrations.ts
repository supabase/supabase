import { makeRandomString } from 'lib/helpers'

const initialiseHistoryTable = `begin;

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
alter table supabase_migrations.schema_migrations add column if not exists statements text[];
alter table supabase_migrations.schema_migrations add column if not exists name text;
alter table supabase_migrations.schema_migrations add column if not exists created_by text;
alter table supabase_migrations.schema_migrations add column if not exists idempotency_key text unique;

commit;`

export const applyAndTrackMigrations = (query: string, name?: string, append?: boolean) => {
  // Escapes literals using postgres dollar quoted string
  const dollar = `$${makeRandomString(20)}$`
  const quote = (s?: string) => (s ? dollar + s + dollar : `''`)
  return `begin;

-- apply sql from post body
${query};

-- track statements in history table
${trackMigrations(quote(query), quote(name), append)}

commit;`
}

// All params are treated as valid sql expressions
export const trackMigrations = (query: string, name?: string, append?: boolean) => {
  return `
insert into supabase_migrations.schema_migrations as old (version, name, statements)
select case
  when ${append ?? 'count(version) = 1'} then max(version)
  else to_char(current_timestamp, 'YYYYMMDDHHMISS')
end, ${name}, array[${query}] from supabase_migrations.schema_migrations
on conflict (version) do update set
  statements = old.statements || EXCLUDED.statements,
  name = coalesce(EXCLUDED.name, old.name);
`
}
