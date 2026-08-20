import { afterAll, beforeAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

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

withTestDatabase('list types', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'user_status')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "attributes": [],
      "comment": null,
      "enums": [
        "ACTIVE",
        "INACTIVE",
      ],
      "format": "user_status",
      "id": Any<Number>,
      "name": "user_status",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('list types with included schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list({
    includedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  expect(res.length).toBeGreaterThan(0)
  res.forEach((type) => {
    expect(type.schema).toBe('public')
  })
})

withTestDatabase('list types with excluded schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.types.list({
    excludedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  res.forEach((type) => {
    expect(type.schema).not.toBe('public')
  })
})

withTestDatabase(
  'list types with excluded schemas and include System Schemas',
  async ({ executeQuery }) => {
    const { sql, zod } = await pgMeta.types.list({
      excludedSchemas: ['public'],
      includeSystemSchemas: true,
    })
    const res = zod.parse(await executeQuery(sql))

    expect(res.length).toBeGreaterThan(0)
    res.forEach((type) => {
      expect(type.schema).not.toBe('public')
    })
  }
)

const OPTION_MATRIX = [
  { label: 'default', options: {} },
  { label: 'includeArrayTypes', options: { includeArrayTypes: true } },
  { label: 'includedSchemas=public', options: { includedSchemas: ['public'] } },
  { label: 'excludedSchemas=public', options: { excludedSchemas: ['public'] } },
  {
    label: 'excludedSchemas=public + includeSystemSchemas',
    options: { excludedSchemas: ['public'], includeSystemSchemas: true },
  },
  {
    label: 'includedSchemas=public + includeArrayTypes',
    options: { includedSchemas: ['public'], includeArrayTypes: true },
  },
]

withTestDatabase(
  'scoped types.list matches legacy for all option combos (enums, composites, dropped attrs, array types)',
  async ({ executeQuery }) => {
    // Fixture coverage: multi-label enum with a NON-alphabetical label order (so
    // enumsortorder matters), a composite type with a dropped attribute, and a
    // composite referencing the enum.
    await executeQuery(`
      create type color as enum ('red', 'green', 'blue', 'yellow');
      create type shipment as (id int8, note text, tossme int, color color);
      alter type shipment drop attribute tossme;
      create type point3 as (x float8, y float8, z float8);
    `)

    // Legacy types.list has no ORDER BY (plan-dependent row order), so sort ONLY
    // the legacy side by id (t.oid) to match the scoped `order by t.oid`.
    for (const { label, options } of OPTION_MATRIX) {
      const legacy = await pgMeta.types.list(options)
      const scoped = await pgMeta.types.list({ ...options, scoped: true })

      const legacyRes = [...legacy.zod.parse(await executeQuery(legacy.sql))].sort(
        (a, b) => a.id - b.id
      )
      const scopedRes = scoped.zod.parse(await executeQuery(scoped.sql))

      expect(scopedRes, `option combo: ${label}`).toEqual(legacyRes)
      // Scoped is already in t.oid order raw (no scoped-side sort).
      const scopedIds = scopedRes.map((t) => t.id)
      expect(scopedIds, `${label} oid-ordered`).toEqual([...scopedIds].sort((a, b) => a - b))
    }

    // Sanity: the enum/composite fixtures actually surface with correct
    // ordering + dropped-attribute handling in the scoped path.
    const { sql, zod } = await pgMeta.types.list({ includedSchemas: ['public'], scoped: true })
    const res = zod.parse(await executeQuery(sql))
    expect(res.find((t) => t.name === 'color')?.enums).toEqual(['red', 'green', 'blue', 'yellow'])
    expect(res.find((t) => t.name === 'shipment')?.attributes.map((a) => a.name)).toEqual([
      'id',
      'note',
      'color',
    ])
  }
)

withTestDatabase('composite type attributes', async ({ executeQuery }) => {
  await executeQuery(`create type test_composite as (id int8, data text);`)

  const { sql, zod } = await pgMeta.types.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ name }) => name === 'test_composite')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "attributes": [
        {
          "name": "id",
          "type_id": 20,
        },
        {
          "name": "data",
          "type_id": 25,
        },
      ],
      "comment": null,
      "enums": [],
      "format": "test_composite",
      "id": Any<Number>,
      "name": "test_composite",
      "schema": "public",
    }
  `
  )
})
