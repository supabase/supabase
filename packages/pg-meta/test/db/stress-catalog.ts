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
 * Per table: a PK index, a unique constraint+index, a check constraint, and an
 * FK to the previous table. Every 10th table also FKs to t_0, making t_0 a hub
 * with many incoming FKs (the structurally unavoidable pg_constraint seq scan,
 * since there is no index on pg_constraint.confrelid).
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
          'create table stress.t_%s (id int primary key, u int unique, c int check (c > 0)%s%s)',
          i,
          case when i > 0 then format(', fk int references stress.t_%s(id)', i - 1) else '' end,
          case when i > 0 and i % 10 = 0 then ', hub int references stress.t_0(id)' else '' end
        );
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

  await db.executeQuery(`analyze;`)
}
