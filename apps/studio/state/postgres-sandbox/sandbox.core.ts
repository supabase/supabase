import { Results } from '@electric-sql/pglite'
import { PGliteWorker } from '@electric-sql/pglite/worker'

import { SANDBOX_SETUP_STATEMENTS } from './sandbox.constants'

export interface SandboxCore {
  // setSchema(data: ProjectSchemaDDLData): Promise<void>
  // setSeed(tables: TableSeedData[]): Promise<void>
  // broadcastSql(sql: string): Promise<void>
  // runAll(tiles: TileConfig[], sql: string): Promise<Record<string, TileResult>>

  // [Joshen] Valid to ignore the following:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runQuery: (sql: string) => Promise<Results<{ [key: string]: any }>[]>
  destroy(): Promise<void>
}

// Singleton
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

  const runQuery = async (sql: string) => await pg.exec(sql)
  const destroy = async () => webWorker.terminate()

  instance = { runQuery, destroy }
  return instance
}
