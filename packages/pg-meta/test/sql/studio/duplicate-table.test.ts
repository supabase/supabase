import { afterAll, expect, test } from 'vitest'

import { getDuplicateRowsSQL, getDuplicateTableSQL } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

withTestDatabase(
  'duplicates rows into a table with GENERATED ALWAYS identity and generated columns',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public.duplicate_source (
        id bigint generated always as identity primary key,
        name text,
        name_upper text generated always as (upper(name)) stored
      );
      insert into public.duplicate_source (name) values ('a'), ('b');
    `)

    await executeQuery(
      getDuplicateTableSQL({
        sourceTableName: 'duplicate_source',
        sourceTableSchema: 'public',
        duplicatedTableName: 'duplicate_copy',
      })
    )

    // Generated columns cannot receive explicit values, so they are excluded
    // from the column list. OVERRIDING SYSTEM VALUE keeps the source ids for
    // the GENERATED ALWAYS identity column.
    await executeQuery(
      getDuplicateRowsSQL({
        sourceTableName: 'duplicate_source',
        sourceTableSchema: 'public',
        duplicatedTableName: 'duplicate_copy',
        columns: ['id', 'name'],
      })
    )

    const rows = await executeQuery(
      `select id, name, name_upper from public.duplicate_copy order by id`
    )
    expect(rows).toEqual([
      { id: 1, name: 'a', name_upper: 'A' },
      { id: 2, name: 'b', name_upper: 'B' },
    ])
  }
)

withTestDatabase(
  'duplicates rows into a table that only has generated columns',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public.generated_only (
        value text generated always as ('constant') stored
      );
      insert into public.generated_only default values;
      insert into public.generated_only default values;
    `)

    await executeQuery(
      getDuplicateTableSQL({
        sourceTableName: 'generated_only',
        sourceTableSchema: 'public',
        duplicatedTableName: 'generated_only_copy',
      })
    )

    // An empty column list copies no explicit columns, so Postgres fills the
    // generated values instead of receiving rejected explicit values.
    await executeQuery(
      getDuplicateRowsSQL({
        sourceTableName: 'generated_only',
        sourceTableSchema: 'public',
        duplicatedTableName: 'generated_only_copy',
        columns: [],
      })
    )

    const rows = await executeQuery(`select * from public.generated_only_copy`)
    expect(rows).toEqual([{ value: 'constant' }, { value: 'constant' }])
  }
)
