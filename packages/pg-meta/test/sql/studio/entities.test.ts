import { afterAll, expect, test } from 'vitest'

import {
  getEntitiesByIdsSQL,
  getEntityTypesSQL,
  getPartitionCountSQL,
  getPartitionInfoSQL,
} from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

const withTestDatabase = (name: string, fn: (db: TestDatabase) => Promise<void>) => {
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
  db: TestDatabase,
  namePrefix: string,
  { excludePartitions = false, parentId }: { excludePartitions?: boolean; parentId?: number } = {}
) => {
  const [row] = await db.executeQuery<EntityTypesRow[]>(
    getEntityTypesSQL({
      schemas: ['public'],
      sort: 'alphabetical',
      filterTypes: ['r', 'v', 'm', 'f', 'p'],
      excludePartitions,
      parentId,
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

const oidOf = async (db: TestDatabase, name: string) => {
  const [{ oid }] = await db.executeQuery<{ oid: number }[]>(
    `select '${name}'::regclass::oid::int as oid`
  )
  return oid
}

withTestDatabase('excludePartitions hides child partitions at every depth', async (db) => {
  await db.executeQuery(`
    create table public.band_plain (id int);
    create table public.band_parted (id int, hue int not null) partition by range (hue);
    create table public.band_parted_low partition of public.band_parted
      for values from (0) to (180) partition by range (hue);
    create table public.band_parted_low_a partition of public.band_parted_low
      for values from (0) to (90);
  `)

  expect(await listEntities(db, 'band_', { excludePartitions: true })).toEqual([
    'band_parted p',
    'band_plain r',
  ])
})

withTestDatabase(
  'lists direct partitions of a parent and links a partition back to it',
  async (db) => {
    await db.executeQuery(`
    create table public.rank_parted (id int, hue int not null) partition by range (hue);
    create table public.rank_parted_low partition of public.rank_parted
      for values from (0) to (180) partition by range (hue);
    create table public.rank_parted_low_a partition of public.rank_parted_low
      for values from (0) to (90);
    create table public.rank_parted_rest partition of public.rank_parted default;
    create table public.rank_legacy_a (id int);
    create table public.rank_legacy_b (id int);
    create table public.rank_legacy_child () inherits (public.rank_legacy_a, public.rank_legacy_b);
  `)
    const parentId = await oidOf(db, 'public.rank_parted')
    const lowId = await oidOf(db, 'public.rank_parted_low')

    // The grandchild stays behind its sub-partitioned parent
    expect(await listEntities(db, 'rank_', { parentId })).toEqual([
      'rank_parted_low p partition',
      'rank_parted_rest r partition',
    ])

    const [parent] = await db.executeQuery<{ name: string; parent_id: number | null }[]>(
      getPartitionInfoSQL({ id: parentId })
    )
    const [low] = await db.executeQuery<{ name: string; parent_id: number | null }[]>(
      getPartitionInfoSQL({ id: lowId })
    )
    expect(parent).toEqual({ name: 'rank_parted', parent_id: null })
    expect(low).toEqual({ name: 'rank_parted_low', parent_id: parentId })

    // Plain inheritance (even with several parents) isn't partitioning
    const [legacy] = await db.executeQuery<{ name: string; parent_id: number | null }[]>(
      getPartitionInfoSQL({ id: await oidOf(db, 'public.rank_legacy_child') })
    )
    expect(legacy).toEqual({ name: 'rank_legacy_child', parent_id: null })
  }
)

withTestDatabase(
  'getPartitionCountSQL counts nested partitions but not the table itself',
  async (db) => {
    await db.executeQuery(`
    create table public.depth_parted (id int, hue int not null) partition by range (hue);
    create table public.depth_parted_low partition of public.depth_parted
      for values from (0) to (180) partition by range (hue);
    create table public.depth_parted_low_a partition of public.depth_parted_low
      for values from (0) to (90);
    create table public.depth_parted_rest partition of public.depth_parted default;
  `)

    const [row] = await db.executeQuery<{ count: number }[]>(
      getPartitionCountSQL({ id: await oidOf(db, 'public.depth_parted') })
    )
    expect(row.count).toBe(3)
  }
)

withTestDatabase('getEntitiesByIdsSQL finds partitions and ignores unknown ids', async (db) => {
  await db.executeQuery(`
    create table public.view_parted (id int, hue int not null) partition by range (hue);
    create table public.view_parted_low partition of public.view_parted for values from (0) to (180);
  `)

  const rows = await db.executeQuery<{ name: string; is_partition: boolean }[]>(
    getEntitiesByIdsSQL({ ids: [await oidOf(db, 'public.view_parted_low'), 999999999] })
  )
  expect(rows).toEqual([expect.objectContaining({ name: 'view_parted_low', is_partition: true })])
})

withTestDatabase(
  'lists partitions of a parent even when they live in another schema',
  async (db) => {
    await db.executeQuery(`
    create schema tint;
    create table public.cross_parted (id int, hue int not null) partition by range (hue);
    create table tint.cross_child partition of public.cross_parted for values from (0) to (10);
  `)

    expect(
      await listEntities(db, 'cross_', { parentId: await oidOf(db, 'public.cross_parted') })
    ).toEqual(['cross_child r partition'])
  }
)
