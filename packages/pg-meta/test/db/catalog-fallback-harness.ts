import { afterAll, beforeAll, expect, test } from 'vitest'

import { type CatalogQuery, type SafeSqlFragment } from '../../src'
import { SPARK_BIN, SparkQueryError, startSpark } from './spark'
import { createTestDatabase } from './utils'

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

/**
 * The two runs each catalog fallback gets: on a docker Postgres loaded with `postgresSchema`, and
 * on a Spark started from `SPARK_BIN` whose only migration is `sparkSchema` (skipped without it).
 */
export function catalogFallbackHarness({
  postgresSchema,
  sparkSchema,
}: {
  postgresSchema: string
  sparkSchema: string
}) {
  let spark: Awaited<ReturnType<typeof startSpark>> | undefined

  beforeAll(async () => {
    if (SPARK_BIN) spark = await startSpark(sparkSchema)
  }, 60_000)

  afterAll(async () => {
    await spark?.stop()
  })

  if (!SPARK_BIN) {
    console.warn('SPARK_BIN is not set: the Spark runs of the catalog fallbacks are skipped.')
  }

  const sparkQuery: CatalogQuery = (sql) => {
    if (!spark) throw new Error('Spark is not running')
    return spark.query(sql)
  }

  const postgresTest = (name: string, fn: (query: CatalogQuery, db: TestDb) => Promise<void>) =>
    test(`on Postgres, ${name}`, async () => {
      const db = await createTestDatabase()
      try {
        await db.executeQuery(postgresSchema)
        await fn((sql) => db.executeQuery(sql), db)
      } finally {
        await db.cleanup()
      }
    }, 30_000)

  const sparkTest = (name: string, fn: (query: CatalogQuery) => Promise<void>) =>
    test.skipIf(!SPARK_BIN)(`on Spark, ${name}`, () => fn(sparkQuery), 30_000)

  /** Runs pg-meta's SQL on Spark, expects it to fail, and returns the fallback's answer. */
  async function sparkFallback<T>(sql: SafeSqlFragment, fallback: () => Promise<T>): Promise<T> {
    const failure = await sparkQuery(sql).then(
      () => undefined,
      (error: unknown) => error
    )
    expect(failure, 'pg-meta SQL now runs on Spark: delete its fallback').toBeDefined()
    // A transport failure is not Spark refusing the SQL.
    expect(failure).toBeInstanceOf(SparkQueryError)
    expect((failure as SparkQueryError).code).toMatch(/^[0-9A-Z]{5}$/)
    return fallback()
  }

  return { postgresTest, sparkTest, sparkFallback, sparkQuery }
}
