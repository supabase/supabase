import { PGliteWorker } from '@electric-sql/pglite/worker'

import { SANDBOX_SETUP_STATEMENTS } from './sandbox.constants'
import { applySchema, applySeed } from './sandbox.utils'
import { type DatabaseSchemaDDLData } from '@/data/rls-tester/get-schema-ddl'
import { type TableSeedData } from '@/data/rls-tester/get-seed-data'
import { getErrorMessage } from '@/lib/get-error-message'

type RLSTestResult = Record<string, unknown>[]

export interface SandboxCore {
  setSchema(data: DatabaseSchemaDDLData): Promise<void>
  setSeed(tables: TableSeedData[]): Promise<void>
  destroy(): Promise<void>
  run: (props: { sql: string }) => Promise<{ result: RLSTestResult }>
}

let instance: SandboxCore | null = null
let initPromise: Promise<SandboxCore> | null = null

export const getSandboxCore = async () => {
  if (instance) return instance
  if (!initPromise) {
    initPromise = boot().finally(() => {
      initPromise = null
    })
  }
  return initPromise
}

const boot = async (): Promise<SandboxCore> => {
  const webWorker = new Worker(new URL('./pglite.worker.ts', import.meta.url), { type: 'module' })
  const pg = await PGliteWorker.create(webWorker)

  for (const sql of SANDBOX_SETUP_STATEMENTS) {
    try {
      await pg.exec(sql)
    } catch (err) {
      console.warn('[Postgres sandbox] setup:', (err as Error).message, `— ${sql.slice(0, 60)}`)
    }
  }

  function makeExecutor() {
    return { execSql: (sql: string) => pg.exec(sql).then(() => undefined as void) }
  }

  async function setSchema(data: DatabaseSchemaDDLData): Promise<void> {
    await applySchema(makeExecutor(), data)
  }

  async function setSeed(tables: TableSeedData[]): Promise<void> {
    await applySeed(makeExecutor(), tables)
  }

  const run = async ({ sql }: { sql: string }) => {
    try {
      // [Joshen] First 2 results will be from role impersonation, the actual result from the
      // query will be returned as the 3rd result.
      const results = await pg.exec(sql)
      return { result: results[2].rows ?? [] }
    } catch (error) {
      await pg.exec('ROLLBACK').catch(() => {})
      throw error instanceof Error ? error : new Error(getErrorMessage(error) ?? String(error))
    }
  }

  const destroy = async () => {
    webWorker.terminate()
    instance = null
  }

  instance = { run, destroy, setSchema, setSeed }
  return instance
}
