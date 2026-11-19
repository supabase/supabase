/**
 * TEMPORARY: answers Studio's catalog intents for a local Spark project, so pg-meta's catalog SQL
 * never reaches Spark. A request without a known intent is left to pg-meta unchanged.
 *
 * Exit condition: Spark's `pg_catalog` runs pg-meta's SQL (D21 in the Spark PoC). Then delete
 * this directory and its call in the query route.
 */
import type { QueryIntent, QueryIntentArgs } from '@supabase/pg-meta'
import { z } from 'zod'

import { answerCatalogIntent, isCatalogIntent, makeSparkModel, type SparkModel } from './catalog'
import { getSparkConfig, makeSparkClient, type SparkClient } from './client'
import { countRows, readRows } from './rows'

export { SparkQueryError } from './client'

const intentBodySchema = z.object({
  intent: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
})

/** Spark has no planner costs; the preflight check always passes. */
const EXPLAIN_PLAN = [{ 'QUERY PLAN': 'Result  (cost=0.00..0.01 rows=1 width=0)' }]

/** Row counts stand in for `pg_stat` live tuples; managed tables keep 0. */
async function withRowCounts(
  spark: SparkClient,
  model: SparkModel,
  tables: unknown[]
): Promise<unknown[]> {
  return Promise.all(
    tables.map(async (t) => {
      const table = t as { schema: string; name: string; live_rows_estimate: number }
      if (model.description.managed_schemas.includes(table.schema)) return table
      const counted = await countRows(spark, model, { schema: table.schema, name: table.name })
      return { ...table, live_rows_estimate: counted[0].count }
    })
  )
}

async function answer(spark: SparkClient, intent: QueryIntent): Promise<unknown[] | undefined> {
  if (intent.id === 'explain') return EXPLAIN_PLAN
  if (intent.id === 'migrations.list') {
    const migrations = await spark.migrations()
    return migrations
      .map(({ version, name, statements }) => ({ version, name, statements }))
      .sort((a, b) => (a.version < b.version ? 1 : -1))
  }
  const model = makeSparkModel(await spark.description())
  if (intent.id === 'rows.read') return readRows(spark, model, intent.args)
  if (intent.id === 'rows.count') return countRows(spark, model, intent.args)
  const rows = answerCatalogIntent(model, intent)
  if (rows === undefined) return undefined
  const isTableList =
    intent.id === 'tables.list' ||
    intent.id === 'tables.paginated' ||
    intent.id === 'tables.retrieve'
  return isTableList ? withRowCounts(spark, model, rows) : rows
}

const OTHER_INTENTS: string[] = ['rows.read', 'rows.count', 'migrations.list', 'explain']

const isKnownIntent = (id: string): id is keyof QueryIntentArgs =>
  isCatalogIntent(id) || OTHER_INTENTS.includes(id)

/** Whether Studio's server answers this project's catalog from Spark (set by the CLI). */
export const isSparkProject = () => getSparkConfig() !== undefined

/**
 * The rows for a pg-meta `/query` body that carries an intent this module answers, or `undefined`
 * to send the SQL to pg-meta as usual.
 */
export async function answerSparkIntent(body: unknown): Promise<unknown[] | undefined> {
  const config = getSparkConfig()
  const parsed = intentBodySchema.safeParse(body)
  if (!config || !parsed.success || !isKnownIntent(parsed.data.intent)) return undefined
  const intent = { id: parsed.data.intent, args: parsed.data.args ?? {} } as QueryIntent
  return answer(makeSparkClient(config), intent)
}
