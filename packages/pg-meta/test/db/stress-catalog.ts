/**
 * Synthetic large-catalog builder shared by the catalog plan-guard tests.
 *
 * Context: a real production catalog had ~267K pg_class rows. Unscoped catalog
 * scans in Studio introspection queries turned into O(catalog) seq scans on
 * every dashboard open. To guard against that we build a large synthetic
 * catalog in a `stress` schema and assert query plans stay scoped at scale.
 *
 * `TABLE_COUNT` defaults to 2000 to keep CI fast. Crank `PG_META_STRESS_TABLES`
 * up (e.g. 12000+) for local investigation closer to real incident scale.
 */

import type { createTestDatabase } from './utils'

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

/** Default number of tables to build; override with PG_META_STRESS_TABLES. */
export const DEFAULT_STRESS_TABLE_COUNT = 2000

/** Resolved table count, honoring the PG_META_STRESS_TABLES env override. */
export const STRESS_TABLE_COUNT = Number(
  process.env.PG_META_STRESS_TABLES ?? DEFAULT_STRESS_TABLE_COUNT
)

/**
 * Build a synthetic `stress` schema with `tableCount` tables plus a handful of
 * non-table relations (a view, a materialized view, and a partitioned table
 * with one partition) so relkind-filtering queries have something to hit.
 *
 * Per table: a composite PK index, a unique constraint+index, a check
 * constraint, and a composite FK to the previous table. Every 10th table also
 * has a composite FK to t_0, making t_0 a hub with many incoming FKs (the
 * structurally unavoidable pg_constraint seq scan, since there is no index on
 * pg_constraint.confrelid). Using composite FKs exercises ordinal column
 * pairing across the full stress catalog. Every other table also has RLS
 * enabled with one policy, so pg_policy scales with the catalog.
 *
 * The catalog is built via a server-side procedure with batched commits every
 * 100 tables -- a single transaction creating thousands of tables/indexes/
 * constraints would exhaust the lock table. `analyze` runs at the end so the
 * planner has real statistics.
 */
export async function buildStressCatalog(
  db: TestDatabase,
  tableCount: number = STRESS_TABLE_COUNT
): Promise<void> {
  await db.executeQuery(`
    create schema stress;

    create procedure stress.build(n int) language plpgsql as $$
    begin
      for i in 0..n-1 loop
        execute format(
          'create table stress.t_%s (id int, tenant_id int, u int unique, c int check (c > 0), primary key (id, tenant_id)%s%s)',
          i,
          case when i > 0 then format(', fk_id int, fk_tenant_id int, foreign key (fk_id, fk_tenant_id) references stress.t_%s(id, tenant_id)', i - 1) else '' end,
          case when i > 0 and i % 10 = 0 then ', hub_id int, hub_tenant_id int, foreign key (hub_id, hub_tenant_id) references stress.t_0(id, tenant_id)' else '' end
        );
        -- Every other table gets RLS + a policy so pg_policy grows with the
        -- catalog (as it does in real projects) and planners don't treat it
        -- as an empty table.
        if i % 2 = 0 then
          execute format('alter table stress.t_%s enable row level security', i);
          execute format('create policy p_%s on stress.t_%s for select using (true)', i, i);
        end if;
        if i % 100 = 99 then commit; end if;
      end loop;
    end $$;
  `)

  // `call` performs commits internally, so it must run as its own statement: a
  // pg client query is autocommit by default, but bundling it with other
  // statements in one multi-statement message implicitly wraps the whole
  // message in one transaction, which conflicts with the commits inside the
  // procedure's loop.
  await db.executeQuery(`call stress.build(${tableCount});`)

  // A view, a materialized view, and a partitioned table (with one partition)
  // so queries that filter by relkind (views, matviews, partitioned tables)
  // exercise a non-empty result at scale.
  await db.executeQuery(`
    create view stress.v_hub as select id, u, c from stress.t_0;
    create materialized view stress.mv_hub as select id, u, c from stress.t_0;
    create table stress.p_root (id int not null, region text not null, primary key (id, region))
      partition by list (region);
    create table stress.p_root_east partition of stress.p_root for values in ('east');
  `)

  // Enums and composite types so the user-defined-types introspection query has
  // non-trivial results at scale: multi-label enums with a deliberately
  // NON-alphabetical label order (to exercise the enumsortorder ordering), plus
  // composite types -- one of which has a dropped attribute (to exercise the
  // `not attisdropped` filter). A bulk loop grows pg_type/pg_attribute/pg_enum
  // so the scoped correlated subqueries are exercised against a large catalog.
  await db.executeQuery(`
    create type stress.mood as enum ('ecstatic', 'sad', 'happy', 'ok');
    create type stress.priority as enum ('critical', 'low', 'high', 'medium');
    create type stress.addr as (street text, city text, zip int);
    create type stress.pair as (a int, dropme text, b text);
    alter type stress.pair drop attribute dropme;

    create procedure stress.build_types(n int) language plpgsql as $$
    begin
      for i in 0..n-1 loop
        execute format('create type stress.e_%s as enum (''c'', ''a'', ''b'')', i);
        execute format('create type stress.ct_%s as (x int, y text)', i);
        if i % 100 = 99 then commit; end if;
      end loop;
    end $$;
  `)
  await db.executeQuery(`call stress.build_types(200);`)

  await db.executeQuery(`analyze;`)
}

/**
 * Build `count` user functions plus `count` extension-owned ones, so function
 * search runs against a large pg_proc. The extension functions are members of
 * pgcrypto (installed in its own schema), as in real projects where extension
 * functions outnumber the user's own, and share names with the user ones to
 * check they are excluded.
 *
 * Kept out of `buildStressCatalog` on purpose: growing pg_proc/pg_depend there
 * shifts the plans of unrelated guarded queries. Build it on top of the stress
 * catalog in its own database, so the rest of the query sees realistic stats.
 */
export async function buildStressFunctions(
  db: TestDatabase,
  count: number = STRESS_TABLE_COUNT
): Promise<void> {
  await db.executeQuery(`
    create schema if not exists stress;
    create schema stress_ext;
    create extension pgcrypto schema stress_ext;

    create procedure stress.build_functions(n int) language plpgsql as $$
    begin
      for i in 0..n-1 loop
        execute format('create function stress.fn_%s(a int) returns int language sql as ''select a''', i);
        execute format('create function stress_ext.fn_%s() returns int language sql as ''select 1''', i);
        execute format('alter extension pgcrypto add function stress_ext.fn_%s()', i);
        if i % 100 = 99 then commit; end if;
      end loop;
    end $$;
  `)
  await db.executeQuery(`call stress.build_functions(${count});`)
  await db.executeQuery(`analyze;`)
}

/**
 * Build a user trigger on every 4th stress table, plus triggers that run one
 * shared function on every 24th, so trigger search runs against
 * a large pg_trigger. Foreign keys in the stress catalog already contribute the
 * internal RI triggers a real catalog has, which the search must skip. Needs the
 * stress tables, so call it after `buildStressCatalog`, and keep it in the same
 * separate database as `buildStressFunctions` for the same plan-shift reason.
 */
export async function buildStressTriggers(
  db: TestDatabase,
  tableCount: number = STRESS_TABLE_COUNT
): Promise<void> {
  await db.executeQuery(`
    create function stress.trg() returns trigger language plpgsql as 'begin return new; end';
    create function stress.audit_row_fn() returns trigger language plpgsql as 'begin return new; end';

    create procedure stress.build_triggers(n int) language plpgsql as $$
    begin
      for i in 0..n-1 loop
        if i % 4 = 0 then
          execute format('create trigger trg_%s before insert on stress.t_%s for each row execute function stress.trg()', i, i);
        end if;
        -- Many triggers that run one function, with names that never match its name
        if i % 24 = 0 then
          execute format('create trigger aud_%s before update on stress.t_%s for each row execute function stress.audit_row_fn()', i, i);
        end if;
        if i % 100 = 99 then commit; end if;
      end loop;
    end $$;
  `)
  await db.executeQuery(`call stress.build_triggers(${tableCount});`)
  await db.executeQuery(`analyze;`)
}
