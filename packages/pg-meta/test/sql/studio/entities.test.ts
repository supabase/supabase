import { afterAll, expect, test } from 'vitest'

import { getEntityTypesSQL, getPartitionCountSQL } from '../../../src'
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
  namePrefix: string,
  excludePartitions = false
) => {
  const [row] = await db.executeQuery<EntityTypesRow[]>(
    getEntityTypesSQL({
      schemas: ['public'],
      sort: 'alphabetical',
      filterTypes: ['r', 'v', 'm', 'f', 'p'],
      excludePartitions,
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

withTestDatabase(
  'excludePartitions keeps parents and drops children, including nested',
  async (db) => {
    await db.executeQuery(`
    create table public.band_plain (id int);
    create table public.band_parted (id int, hue int not null) partition by range (hue);
    create table public.band_parted_low partition of public.band_parted
      for values from (0) to (180) partition by range (hue);
    create table public.band_parted_low_a partition of public.band_parted_low
      for values from (0) to (90);
  `)

    expect(await listEntities(db, 'band_', true)).toEqual(['band_parted p', 'band_plain r'])
  }
)

withTestDatabase('getPartitionCountSQL counts nested partitions and skips the root', async (db) => {
  await db.executeQuery(`
    create table public.depth_parted (id int, hue int not null) partition by range (hue);
    create table public.depth_parted_low partition of public.depth_parted
      for values from (0) to (180) partition by range (hue);
    create table public.depth_parted_low_a partition of public.depth_parted_low
      for values from (0) to (90);
    create table public.depth_parted_rest partition of public.depth_parted default;
    create table public.depth_plain (id int);
  `)

  const countFor = async (name: string) => {
    const [{ oid }] = await db.executeQuery<{ oid: number }[]>(
      `select '${name}'::regclass::oid::int as oid`
    )
    const [row] = await db.executeQuery<{ count: number }[]>(getPartitionCountSQL({ id: oid }))
    return row.count
  }

  expect(await countFor('public.depth_parted')).toBe(3)
  expect(await countFor('public.depth_parted_low')).toBe(1)
  expect(await countFor('public.depth_plain')).toBe(0)
})
