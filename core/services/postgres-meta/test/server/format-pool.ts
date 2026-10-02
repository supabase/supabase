import {
  GENERATOR_METADATA_VERSION,
  generateTypescript,
  type GeneratorMetadata,
} from '@supabase/postgrest-typegen'
import { afterEach, expect, test, vi } from 'vitest'

// These tests exercise the worker-thread generation path, which is opt-in via
// PG_META_FORMAT_IN_WORKER and therefore never hit by the rest of the suite.
//
// The env vars are read once when constants.ts is evaluated, so each test stubs
// the env and re-imports the module graph via vi.resetModules() to pick them up.
const loadFormatPool = async (env: Record<string, string>) => {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value)
  }
  return import('../../src/server/format-pool.js')
}

const column = (tableId: number, table: string, position: number) => ({
  table_id: tableId,
  schema: 'public',
  table,
  id: `${tableId}.${position}`,
  ordinal_position: position,
  name: `col_${position}`,
  default_value: null,
  data_type: 'text',
  format: position === 0 ? 'int8' : 'text',
  type_schema: 'pg_catalog',
  is_identity: position === 0,
  identity_generation: null,
  is_generated: false,
  is_nullable: position !== 0,
  is_updatable: true,
  is_unique: position === 0,
  enums: [],
  check: null,
  comment: null,
})

const metadata = (tableCount: number): GeneratorMetadata => {
  const tables = []
  const columns = []
  const primaryKeys = []
  for (let i = 0; i < tableCount; i++) {
    const name = `table_${i}`
    const id = 10000 + i
    tables.push({
      id,
      schema: 'public',
      name,
      rls_enabled: false,
      rls_forced: false,
      replica_identity: 'DEFAULT' as const,
      bytes: 0,
      size: '0 bytes',
      live_rows_estimate: 0,
      dead_rows_estimate: 0,
      comment: null,
    })
    primaryKeys.push({ schema: 'public', table_name: name, name: 'col_0', table_id: id })
    for (let position = 0; position < 4; position++) columns.push(column(id, name, position))
  }
  return {
    version: GENERATOR_METADATA_VERSION,
    schemas: [{ id: 2200, name: 'public', owner: 'postgres' }],
    tables,
    foreignTables: [],
    views: [],
    materializedViews: [],
    columns,
    primaryKeys,
    relationships: [],
    functions: [],
    types: [],
  }
}

const METADATA = metadata(1)
const OPTIONS = { detectOneToOneRelationships: true }

afterEach(() => {
  vi.unstubAllEnvs()
})

test('generates on a worker thread with identical output to generating inline', async () => {
  const { generateTypescriptTypes, destroyFormatPool, isFormatPoolActive } = await loadFormatPool({
    PG_META_FORMAT_IN_WORKER: 'true',
  })

  try {
    expect(isFormatPoolActive()).toBe(false)

    const viaWorker = await generateTypescriptTypes(METADATA, OPTIONS)

    // without this the test would still pass if generation silently fell back
    // to running inline, which is the thing being changed
    expect(isFormatPoolActive()).toBe(true)
    expect(viaWorker).toBe(await generateTypescript(METADATA, OPTIONS))
  } finally {
    await destroyFormatPool()
  }
})

test('generates inline when the worker is not enabled', async () => {
  const { generateTypescriptTypes, destroyFormatPool, isFormatPoolActive } = await loadFormatPool({
    PG_META_FORMAT_IN_WORKER: 'false',
  })

  try {
    expect(await generateTypescriptTypes(METADATA, OPTIONS)).toBe(
      await generateTypescript(METADATA, OPTIONS)
    )
    // no pool was ever created, so generation ran on the main thread
    expect(isFormatPoolActive()).toBe(false)
  } finally {
    await destroyFormatPool()
  }
})

test('never generates on a worker in type-generation mode', async () => {
  const { generateTypescriptTypes, destroyFormatPool, isFormatPoolActive } = await loadFormatPool({
    PG_META_FORMAT_IN_WORKER: 'true',
    PG_META_GENERATE_TYPES: 'typescript',
  })

  try {
    // one-shot CLI generation has no event loop to protect, and a pool would
    // keep the process alive after it is done
    expect(await generateTypescriptTypes(METADATA, OPTIONS)).toBe(
      await generateTypescript(METADATA, OPTIONS)
    )
    expect(isFormatPoolActive()).toBe(false)
  } finally {
    await destroyFormatPool()
  }
})

test('sheds load with FormatQueueFullError once the in-flight limit is reached', async () => {
  const { generateTypescriptTypes, destroyFormatPool, FormatQueueFullError } = await loadFormatPool(
    {
      PG_META_FORMAT_IN_WORKER: 'true',
      PG_META_FORMAT_POOL_SIZE: '1',
      PG_META_FORMAT_MAX_QUEUE: '2',
    }
  )

  // big enough that generating takes long enough for calls to overlap
  const big = metadata(50)

  try {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => generateTypescriptTypes(big, OPTIONS))
    )

    const rejected = results.filter((r) => r.status === 'rejected')
    // 2 admitted, the rest shed immediately rather than queueing
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2)
    expect(rejected).toHaveLength(4)
    for (const result of rejected) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(FormatQueueFullError)
    }
  } finally {
    await destroyFormatPool()
  }
})

test('counts a generation call while it is in flight and releases it afterwards', async () => {
  const { generateTypescriptTypes, destroyFormatPool, inFlightCount } = await loadFormatPool({
    PG_META_FORMAT_IN_WORKER: 'true',
    PG_META_FORMAT_MAX_QUEUE: '2',
  })

  try {
    expect(inFlightCount()).toBe(0)

    const pending = generateTypescriptTypes(METADATA, OPTIONS)
    // observed before awaiting: checking only afterwards would pass even if the
    // counter were never incremented at all
    expect(inFlightCount()).toBe(1)
    await pending

    // a leaked counter would make the pool refuse work forever after a burst
    expect(inFlightCount()).toBe(0)
    await expect(generateTypescriptTypes(METADATA, OPTIONS)).resolves.toBeTypeOf('string')
  } finally {
    await destroyFormatPool()
  }
})
