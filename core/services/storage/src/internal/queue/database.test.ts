import { createRequire } from 'node:module'
import type { DatabaseExecutor, DatabaseStatement } from '@internal/database'
import { PgQueueDB } from './database'

const loadCjs = createRequire(__filename)

type PgBossStatic = {
  getConstructionPlans(schema: string): string
  getMigrationPlans(schema: string, version: number): string
  getRollbackPlans(schema: string, version: number): string
}

type FetchNextJobOptions = {
  includeMetadata?: boolean
  priority?: boolean
  ignoreStartAfter?: boolean
}

type PgBossMigration = {
  version: number
  previous: number
}

type PgBossPlans = {
  JOB_STATES: Record<string, string>
  create(schema: string, version: number): string
  insertVersion(schema: string, version: number): string
  getVersion(schema: string): string
  setVersion(schema: string, version: number): string
  versionTableExists(schema: string): string
  fetchNextJob(schema: string): (options?: FetchNextJobOptions) => string
  completeJobs(schema: string): string
  cancelJobs(schema: string): string
  resumeJobs(schema: string): string
  deleteJobs(schema: string): string
  retryJobs(schema: string): string
  failJobsById(schema: string): string
  failJobsByTimeout(schema: string): string
  insertJob(schema: string): string
  insertJobs(schema: string): string
  getTime(): string
  getSchedules(schema: string): string
  schedule(schema: string): string
  unschedule(schema: string): string
  subscribe(schema: string): string
  unsubscribe(schema: string): string
  getQueuesForEvent(schema: string): string
  archive(schema: string, completedInterval: string, failedInterval?: string): string
  drop(schema: string, interval: string): string
  countStates(schema: string): string
  updateQueue(schema: string): string
  createQueue(schema: string): string
  deleteQueue(schema: string): string
  getQueues(schema: string): string
  getQueueByName(schema: string): string
  getQueueSize(schema: string, options?: { before?: string }): string
  purgeQueue(schema: string): string
  clearStorage(schema: string): string
  trySetMaintenanceTime(schema: string): string
  trySetMonitorTime(schema: string): string
  trySetCronTime(schema: string): string
  locked(schema: string, query: string | string[]): string
  assertMigration(schema: string, version: number): string
  getArchivedJobById(schema: string): string
  getJobById(schema: string): string
}

type MigrationStore = {
  getAll(schema: string): PgBossMigration[]
}

const PgBoss = loadCjs('pg-boss') as PgBossStatic
const plans = loadCjs('pg-boss/src/plans') as PgBossPlans
const migrationStore = loadCjs('pg-boss/src/migrationStore') as MigrationStore
const schemaVersion = (loadCjs('pg-boss/version.json') as { schema: number }).schema

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}

function stripSqlStrings(sql: string): string {
  return sql.replace(/\$[A-Za-z_]*\$[\s\S]*?\$[A-Za-z_]*\$/g, '').replace(/'(?:''|[^'])*'/g, '')
}

function collectPgBossSqlSurface(): Array<[string, string]> {
  const schema = 'pgboss_v10'
  const migrations = migrationStore.getAll(schema) as PgBossMigration[]
  const statements: Array<[string, string]> = [
    ['create', plans.create(schema, schemaVersion)],
    ['insertVersion', plans.insertVersion(schema, schemaVersion)],
    ['getVersion', plans.getVersion(schema)],
    ['setVersion', plans.setVersion(schema, schemaVersion)],
    ['versionTableExists', plans.versionTableExists(schema)],
    ['fetchNextJob default', plans.fetchNextJob(schema)()],
    [
      'fetchNextJob metadata no-priority ignore-start-after',
      plans.fetchNextJob(schema)({
        includeMetadata: true,
        priority: false,
        ignoreStartAfter: true,
      }),
    ],
    ['completeJobs', plans.completeJobs(schema)],
    ['cancelJobs', plans.cancelJobs(schema)],
    ['resumeJobs', plans.resumeJobs(schema)],
    ['deleteJobs', plans.deleteJobs(schema)],
    ['retryJobs', plans.retryJobs(schema)],
    ['failJobsById', plans.failJobsById(schema)],
    ['failJobsByTimeout', plans.failJobsByTimeout(schema)],
    ['insertJob', plans.insertJob(schema)],
    ['insertJobs', plans.insertJobs(schema)],
    ['getTime', plans.getTime()],
    ['getSchedules', plans.getSchedules(schema)],
    ['schedule', plans.schedule(schema)],
    ['unschedule', plans.unschedule(schema)],
    ['subscribe', plans.subscribe(schema)],
    ['unsubscribe', plans.unsubscribe(schema)],
    ['getQueuesForEvent', plans.getQueuesForEvent(schema)],
    ['archive', plans.archive(schema, '1 day', '2 days')],
    ['drop', plans.drop(schema, '1 day')],
    ['countStates', plans.countStates(schema)],
    ['updateQueue', plans.updateQueue(schema)],
    ['createQueue', plans.createQueue(schema)],
    ['deleteQueue', plans.deleteQueue(schema)],
    ['getQueues', plans.getQueues(schema)],
    ['getQueueByName', plans.getQueueByName(schema)],
    ['getQueueSize default', plans.getQueueSize(schema)],
    ['getQueueSize failed', plans.getQueueSize(schema, { before: plans.JOB_STATES.failed })],
    ['purgeQueue', plans.purgeQueue(schema)],
    ['clearStorage', plans.clearStorage(schema)],
    ['trySetMaintenanceTime', plans.trySetMaintenanceTime(schema)],
    ['trySetMonitorTime', plans.trySetMonitorTime(schema)],
    ['trySetCronTime', plans.trySetCronTime(schema)],
    ['locked single query', plans.locked(schema, plans.getTime())],
    ['locked query array', plans.locked(schema, [plans.getTime(), plans.countStates(schema)])],
    ['assertMigration', plans.assertMigration(schema, schemaVersion)],
    ['getArchivedJobById', plans.getArchivedJobById(schema)],
    ['getJobById', plans.getJobById(schema)],
    ['constructionPlans', PgBoss.getConstructionPlans(schema)],
  ]

  for (const migration of migrations) {
    statements.push([
      `migrationPlans from ${migration.previous} to ${schemaVersion}`,
      PgBoss.getMigrationPlans(schema, migration.previous),
    ])
    statements.push([
      `rollbackPlans from ${migration.version}`,
      PgBoss.getRollbackPlans(schema, migration.version),
    ])
  }

  return statements
}

describe('PgQueueDB', () => {
  it('passes pg-boss SQL and positional values through without placeholder rewriting', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ ok: true }],
    })
    const db = new PgQueueDB({ query } as unknown as DatabaseExecutor)

    await expect(db.executeSql('SELECT $1, $2, $3', ['queue-name', undefined, 3])).resolves.toEqual(
      {
        rows: [{ ok: true }],
      }
    )

    expect(query).toHaveBeenCalledWith({
      text: 'SELECT $1, $2, $3',
      values: ['queue-name', null, 3],
    } satisfies DatabaseStatement)
  })

  it('covers pg-boss v10 generated SQL with only pg-compatible placeholders', () => {
    const invalidStatements = collectPgBossSqlSurface().flatMap(([name, sql]) => {
      const stripped = stripSqlStrings(sql)
      const hasQuestionPlaceholder = stripped.includes('?')
      const namedPlaceholders = stripped.match(/(^|[^\w:]):[A-Za-z_][A-Za-z0-9_]*/g) || []

      if (!hasQuestionPlaceholder && namedPlaceholders.length === 0) {
        return []
      }

      return [
        {
          name,
          sql: normalizeSql(sql),
          hasQuestionPlaceholder,
          namedPlaceholders,
        },
      ]
    })

    expect(invalidStatements).toEqual([])
  })
})
