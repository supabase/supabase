import { afterAll, expect, test } from 'vitest'

import { getEntityTypesSQL } from '../../../src'
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

type EntityTypesRow = {
  data: {
    entities: Array<{ name: string; type: string; is_partition: boolean }>
    count: number
  }
}

const listEntities = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  namePrefix: string
) => {
  const [row] = await db.executeQuery<EntityTypesRow[]>(
    getEntityTypesSQL({
      schemas: ['public'],
      sort: 'alphabetical',
      filterTypes: ['r', 'v', 'm', 'f', 'p'],
      search: namePrefix,
      limit: 100,
      page: 0,
    })
  )
  return row.data.entities.map((e) => `${e.name} ${e.type}${e.is_partition ? ' partition' : ''}`)
}

withTestDatabase('flags partitions, which are ordinary tables in the catalog', async (db) => {
  await db.executeQuery(`
    create table public.shade_plain (id int);
    create table public.shade_parted (id int, hue int not null, primary key (id, hue))
      partition by range (hue);
    create table public.shade_parted_low partition of public.shade_parted
      for values from (0) to (180);
    create table public.shade_parted_rest partition of public.shade_parted default;
  `)

  // The parent reports as a partitioned table; its children report as tables,
  // so is_partition is the only thing separating them from shade_plain
  expect(await listEntities(db, 'shade_')).toEqual([
    'shade_parted p',
    'shade_parted_low r partition',
    'shade_parted_rest r partition',
    'shade_plain r',
  ])
})

withTestDatabase('does not flag non-table relations as partitions', async (db) => {
  await db.executeQuery(`
    create table public.tone_base (id int);
    create view public.tone_view as select * from public.tone_base;
    create materialized view public.tone_matview as select * from public.tone_base;
  `)

  expect(await listEntities(db, 'tone_')).toEqual(['tone_base r', 'tone_matview m', 'tone_view v'])
})
