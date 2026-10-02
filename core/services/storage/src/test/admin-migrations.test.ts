vi.mock('@internal/database/migrations', async () => {
  const actual = await vi.importActual<typeof import('@internal/database/migrations')>(
    '@internal/database/migrations'
  )
  return {
    ...actual,
    resetMigrationsOnTenants: vi.fn(),
    resetMigration: vi.fn(),
    runMigrationsOnAllTenants: vi.fn(),
    runMigrationsOnTenant: vi.fn(),
  }
})

import * as migrations from '@internal/database/migrations'
import { DBMigration } from '@internal/database/migrations'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { mergeConfig } from '../config'
import {
  closeMultitenantPg,
  MIGRATION_ADMIN_JOB_LIMIT,
  multitenantPgExecutor,
} from '../internal/database'
import { PG_BOSS_SCHEMA, Queue } from '../internal/queue/queue'
import { RunMigrationsOnTenants } from '../storage/events/migrations/run-migrations'
import { createAdminApp } from './common'

const tenantId = 'admin-migrations-test-tenant'
const createdJobIds = new Set<string>()
const createdTenantIds = new Set<string>()
const pgBossJobTable = `${PG_BOSS_SCHEMA}.job`
const headers = {
  apikey: process.env.ADMIN_API_KEYS,
}

const tenantPayload = {
  anonKey: 'anon-key',
  databaseUrl: 'postgres://tenant-db',
  jwtSecret: 'jwt-secret',
  serviceKey: 'service-key',
}

function trackJobId(jobId: string) {
  createdJobIds.add(jobId)
  return jobId
}

let adminApp: FastifyInstance

type JobRow = {
  id: string
  name: string
  state: string
  created_on?: Date
  data: object
}

async function insertJobs(jobs: JobRow | JobRow[]) {
  const rows = Array.isArray(jobs) ? jobs : [jobs]

  if (rows.length === 0) {
    return
  }

  await multitenantPgExecutor.query({
    text: `
      INSERT INTO ${pgBossJobTable} (id, name, state, created_on, data)
      SELECT id, name, state, COALESCE(created_on, now()), data
      FROM unnest(
        $1::uuid[],
        $2::text[],
        $3::text[],
        $4::timestamptz[],
        $5::jsonb[]
      ) AS input(id, name, state, created_on, data)
    `,
    values: [
      rows.map((job) => job.id),
      rows.map((job) => job.name),
      rows.map((job) => job.state),
      rows.map((job) => job.created_on || null),
      rows.map((job) => JSON.stringify(job.data)),
    ],
  })
}

async function deleteJobs(jobIds: string[]) {
  await multitenantPgExecutor.query({
    text: `DELETE FROM ${pgBossJobTable} WHERE id = ANY($1::uuid[])`,
    values: [jobIds],
  })
}

async function getJobs<T extends { id: string } = { id: string }>(
  columns: string,
  jobIds: string[]
): Promise<T[]> {
  const result = await multitenantPgExecutor.query<T>({
    text: `
      SELECT ${columns}
      FROM ${pgBossJobTable}
      WHERE id = ANY($1::uuid[])
    `,
    values: [jobIds],
  })

  return result.rows
}

async function updateTenant(
  currentTenantId: string,
  fields: Partial<{ migrations_version: string | null; migrations_status: string | null }>
) {
  const entries = Object.entries(fields)
  await multitenantPgExecutor.query({
    text: `
      UPDATE tenants
      SET ${entries.map(([column], index) => `${column} = $${index + 2}`).join(', ')}
      WHERE id = $1
    `,
    values: [currentTenantId, ...entries.map(([, value]) => value)],
  })
}

async function getTenantMigrationState(currentTenantId: string) {
  const result = await multitenantPgExecutor.query<{
    migrations_version: string | null
    migrations_status: string | null
  }>({
    text: `
      SELECT migrations_version, migrations_status
      FROM tenants
      WHERE id = $1
      LIMIT 1
    `,
    values: [currentTenantId],
  })

  return result.rows[0]
}

async function createTenant(currentTenantId: string) {
  createdTenantIds.add(currentTenantId)
  const response = await adminApp.inject({
    method: 'POST',
    url: `/tenants/${currentTenantId}`,
    payload: tenantPayload,
    headers,
  })

  expect(response.statusCode).toBe(201)
}

describe('Admin migrations routes', () => {
  beforeAll(async () => {
    mergeConfig({
      pgQueueEnable: true,
    })
    await migrations.runMultitenantMigrations()
    await multitenantPgExecutor.query(`CREATE SCHEMA IF NOT EXISTS ${PG_BOSS_SCHEMA}`)
    await multitenantPgExecutor.query(`
      CREATE TABLE IF NOT EXISTS ${pgBossJobTable} (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        state text NOT NULL,
        created_on timestamptz NOT NULL DEFAULT now(),
        data jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `)
    adminApp = await createAdminApp()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.clearAllMocks()

    if (createdJobIds.size > 0) {
      await deleteJobs(Array.from(createdJobIds))
      createdJobIds.clear()
    }

    const tenantIdsToDelete = new Set([tenantId, ...createdTenantIds])
    createdTenantIds.clear()

    for (const currentTenantId of tenantIdsToDelete) {
      await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${currentTenantId}`,
        headers,
      })
    }
  })

  afterAll(async () => {
    await adminApp?.close()
    await closeMultitenantPg()
  })

  test('rejects invalid markCompletedTillMigration for fleet reset', async () => {
    const resetSpy = vi.mocked(migrations.resetMigrationsOnTenants).mockResolvedValue(undefined)

    const response = await adminApp.inject({
      method: 'POST',
      url: '/migrations/reset/fleet',
      payload: {
        untilMigration: 'storage-schema' satisfies keyof typeof DBMigration,
        markCompletedTillMigration: 'not-a-real-migration',
      },
      headers,
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ message: 'Invalid migration' })
    expect(resetSpy).not.toHaveBeenCalled()
  })

  test('rejects invalid markCompletedTillMigration for tenant reset', async () => {
    await createTenant(tenantId)

    const resetSpy = vi.mocked(migrations.resetMigration).mockResolvedValue(false)

    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/migrations/reset`,
      payload: {
        untilMigration: 'storage-schema' satisfies keyof typeof DBMigration,
        markCompletedTillMigration: 'not-a-real-migration',
      },
      headers,
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ message: 'Invalid migration' })
    expect(resetSpy).not.toHaveBeenCalled()
  })

  test('accepts untilMigration that maps to numeric id 0 for fleet reset', async () => {
    const resetSpy = vi.mocked(migrations.resetMigrationsOnTenants).mockResolvedValue(undefined)

    const response = await adminApp.inject({
      method: 'POST',
      url: '/migrations/reset/fleet',
      payload: {
        untilMigration: 'create-migrations-table' satisfies keyof typeof DBMigration,
      },
      headers: {
        ...headers,
        'sb-request-id': 'sb-req-123',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Migrations scheduled' })
    expect(resetSpy).toHaveBeenCalledWith({
      till: 'create-migrations-table',
      markCompletedTillMigration: undefined,
      signal: expect.any(AbortSignal),
      sbReqId: 'sb-req-123',
    })
  })

  test('passes sbReqId to fleet migrate scheduling', async () => {
    const runSpy = vi.mocked(migrations.runMigrationsOnAllTenants).mockResolvedValue(undefined)

    const response = await adminApp.inject({
      method: 'POST',
      url: '/migrations/migrate/fleet',
      headers: {
        ...headers,
        'sb-request-id': 'sb-req-123',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Migrations scheduled' })
    expect(runSpy).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      sbReqId: 'sb-req-123',
    })
  })

  test('manual tenant migration updates the tenant migration state', async () => {
    const migrationTenantId = `admin-migrations-state-${randomUUID().slice(0, 8)}`
    const latestMigration = await migrations.lastLocalMigrationName()

    await createTenant(migrationTenantId)

    await updateTenant(migrationTenantId, {
      migrations_version: null,
      migrations_status: null,
    })

    const migrateResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${migrationTenantId}/migrations`,
      headers,
    })

    expect(migrateResponse.statusCode).toBe(200)
    expect(JSON.parse(migrateResponse.body)).toEqual({ migrated: true })

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${migrationTenantId}/migrations`,
      headers,
    })

    expect(getResponse.statusCode).toBe(200)
    expect(JSON.parse(getResponse.body)).toEqual({
      isLatest: true,
      migrationsVersion: latestMigration,
      migrationsStatus: 'COMPLETED',
    })

    await expect(getTenantMigrationState(migrationTenantId)).resolves.toEqual({
      migrations_version: latestMigration,
      migrations_status: 'COMPLETED',
    })
  })

  test('manual tenant migration records the frozen migration target', async () => {
    const migrationTenantId = `admin-migrations-freeze-${randomUUID().slice(0, 8)}`
    const frozenMigration = 'create-migrations-table' satisfies keyof typeof DBMigration
    let isolatedAdminApp: FastifyInstance | undefined
    let isolatedCloseMultitenantPg: (() => Promise<void>) | undefined

    await createTenant(migrationTenantId)

    await updateTenant(migrationTenantId, {
      migrations_version: null,
      migrations_status: null,
    })

    vi.resetModules()

    try {
      const config = await import('../config')
      config.getConfig({ reload: true })
      config.mergeConfig({
        pgQueueEnable: true,
        dbMigrationFreezeAt: frozenMigration,
      })

      const isolatedMigrations = await import('@internal/database/migrations')
      vi.mocked(isolatedMigrations.runMigrationsOnTenant).mockResolvedValue(undefined)

      isolatedCloseMultitenantPg = (await import('../internal/database')).closeMultitenantPg

      const adminAppModule = await import('../admin-app')
      isolatedAdminApp = adminAppModule.default({})

      if (!isolatedAdminApp) {
        throw new Error('Failed to build isolated admin app')
      }

      const migrateResponse = await isolatedAdminApp.inject({
        method: 'POST',
        url: `/tenants/${migrationTenantId}/migrations`,
        headers,
      })

      expect(migrateResponse.statusCode).toBe(200)
      expect(JSON.parse(migrateResponse.body)).toEqual({ migrated: true })

      const getResponse = await isolatedAdminApp.inject({
        method: 'GET',
        url: `/tenants/${migrationTenantId}/migrations`,
        headers,
      })

      expect(getResponse.statusCode).toBe(200)
      expect(JSON.parse(getResponse.body)).toEqual({
        isLatest: true,
        migrationsVersion: frozenMigration,
        migrationsStatus: 'COMPLETED',
      })

      await expect(getTenantMigrationState(migrationTenantId)).resolves.toEqual({
        migrations_version: frozenMigration,
        migrations_status: 'COMPLETED',
      })
    } finally {
      await isolatedAdminApp?.close()
      await isolatedCloseMultitenantPg?.()
      vi.resetModules()
    }
  })

  test('lists active fleet migration jobs from the current pg-boss queue name', async () => {
    const fleetTenantId = `admin-migrations-fleet-${randomUUID().slice(0, 8)}`
    const jobId = trackJobId(randomUUID())
    const wrongQueueJobId = trackJobId(randomUUID())
    const wrongStateJobId = trackJobId(randomUUID())

    await createTenant(fleetTenantId)

    await insertJobs([
      {
        id: jobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        data: {
          tenantId: fleetTenantId,
        },
      },
      {
        id: wrongQueueJobId,
        name: 'another-queue',
        state: 'active',
        data: {
          tenantId: fleetTenantId,
        },
      },
      {
        id: wrongStateJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'created',
        data: {
          tenantId: fleetTenantId,
        },
      },
    ])

    const response = await adminApp.inject({
      method: 'GET',
      url: '/migrations/active',
      headers,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveLength(1)
    expect(body).toEqual([
      expect.objectContaining({
        id: jobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
      }),
    ])
  })

  test('lists tenant migration jobs from the current pg-boss schema and queue name', async () => {
    const jobTenantId = `admin-migrations-tenant-${randomUUID().slice(0, 8)}`
    const otherTenantId = `admin-migrations-other-${randomUUID().slice(0, 8)}`
    const olderJobId = trackJobId(randomUUID())
    const newerJobId = trackJobId(randomUUID())
    const extraTenantJobIds = Array.from({ length: 99 }, () => trackJobId(randomUUID()))
    const otherTenantJobId = trackJobId(randomUUID())
    const wrongQueueJobId = trackJobId(randomUUID())

    await createTenant(jobTenantId)
    await createTenant(otherTenantId)

    await insertJobs([
      {
        id: olderJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        created_on: new Date('2026-03-25T10:00:00.000Z'),
        data: {
          tenant: {
            ref: jobTenantId,
          },
          tenantId: jobTenantId,
        },
      },
      {
        id: newerJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        created_on: new Date('2026-03-25T11:00:00.000Z'),
        data: {
          tenant: {
            ref: jobTenantId,
          },
          tenantId: jobTenantId,
        },
      },
      ...extraTenantJobIds.map((id) => ({
        id,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        created_on: new Date('2026-03-25T09:00:00.000Z'),
        data: {
          tenant: {
            ref: jobTenantId,
          },
          tenantId: jobTenantId,
        },
      })),
      {
        id: otherTenantJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        data: {
          tenant: {
            ref: otherTenantId,
          },
          tenantId: otherTenantId,
        },
      },
      {
        id: wrongQueueJobId,
        name: 'another-queue',
        state: 'active',
        data: {
          tenant: {
            ref: jobTenantId,
          },
          tenantId: jobTenantId,
        },
      },
    ])

    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${jobTenantId}/migrations/jobs`,
      headers,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveLength(2 + extraTenantJobIds.length)
    expect(body.slice(0, 2)).toEqual([
      expect.objectContaining({
        id: newerJobId,
        name: RunMigrationsOnTenants.getQueueName(),
      }),
      expect.objectContaining({
        id: olderJobId,
        name: RunMigrationsOnTenants.getQueueName(),
      }),
    ])
  })

  test('returns queue progress for the current migration queue', async () => {
    const getQueueSize = vi.fn().mockResolvedValue(7)
    vi.spyOn(Queue, 'getInstance').mockReturnValue({
      getQueueSize,
    } as never)

    const response = await adminApp.inject({
      method: 'GET',
      url: '/migrations/progress',
      headers,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ remaining: 7 })
    expect(getQueueSize).toHaveBeenCalledWith(RunMigrationsOnTenants.getQueueName())
  })

  test('lists failed tenants and paginates by cursor', async () => {
    const firstFailedTenantId = `admin-migrations-failed-${randomUUID().slice(0, 8)}`
    const secondFailedTenantId = `admin-migrations-failed-${randomUUID().slice(0, 8)}`
    const healthyTenantId = `admin-migrations-ok-${randomUUID().slice(0, 8)}`

    await createTenant(firstFailedTenantId)
    await createTenant(secondFailedTenantId)
    await createTenant(healthyTenantId)

    await updateTenant(firstFailedTenantId, {
      migrations_status: 'FAILED',
    })
    await updateTenant(secondFailedTenantId, {
      migrations_status: 'FAILED',
    })
    await updateTenant(healthyTenantId, {
      migrations_status: 'COMPLETED',
    })

    const firstPageResponse = await adminApp.inject({
      method: 'GET',
      url: '/migrations/failed',
      headers,
    })

    expect(firstPageResponse.statusCode).toBe(200)
    const firstPageBody = JSON.parse(firstPageResponse.body)
    expect(firstPageBody.data).toHaveLength(2)
    expect(firstPageBody.data.map((tenant: { id: string }) => tenant.id)).toEqual([
      firstFailedTenantId,
      secondFailedTenantId,
    ])

    const secondPageResponse = await adminApp.inject({
      method: 'GET',
      url: `/migrations/failed?cursor=${firstPageBody.data[0].cursor_id}`,
      headers,
    })

    expect(secondPageResponse.statusCode).toBe(200)
    expect(JSON.parse(secondPageResponse.body)).toEqual({
      next_cursor_id: firstPageBody.data[1].cursor_id,
      data: [
        expect.objectContaining({
          id: secondFailedTenantId,
          cursor_id: firstPageBody.data[1].cursor_id,
        }),
      ],
    })
  })

  test.each([
    '/migrations/failed?cursor=cursor-NaN',
    '/migrations/failed?cursor=-1',
  ])('rejects invalid failed-migrations cursor for %s', async (url) => {
    const response = await adminApp.inject({
      method: 'GET',
      url,
      headers,
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ message: 'Invalid cursor' })
  })

  test('marks only active fleet migration jobs from the current queue as completed', async () => {
    const matchingJobId = trackJobId(randomUUID())
    const wrongQueueJobId = trackJobId(randomUUID())
    const wrongStateJobId = trackJobId(randomUUID())

    await insertJobs([
      {
        id: matchingJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        data: {},
      },
      {
        id: wrongQueueJobId,
        name: 'another-queue',
        state: 'active',
        data: {},
      },
      {
        id: wrongStateJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'created',
        data: {},
      },
    ])

    const response = await adminApp.inject({
      method: 'DELETE',
      url: '/migrations/active',
      headers,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toBe(1)

    const rows = await getJobs<{ id: string; state: string }>('id, state', [
      matchingJobId,
      wrongQueueJobId,
      wrongStateJobId,
    ])
    const statesById = Object.fromEntries(rows.map((row) => [row.id, row.state]))

    expect(statesById).toEqual({
      [matchingJobId]: 'completed',
      [wrongQueueJobId]: 'active',
      [wrongStateJobId]: 'created',
    })
  })

  test('deletes only tenant migration jobs from the current queue', async () => {
    const tenantWithJobsId = `admin-migrations-delete-${randomUUID().slice(0, 8)}`
    const otherTenantId = `admin-migrations-delete-other-${randomUUID().slice(0, 8)}`
    const matchingJobIds = Array.from({ length: MIGRATION_ADMIN_JOB_LIMIT + 1 }, () =>
      trackJobId(randomUUID())
    )
    const otherTenantJobId = trackJobId(randomUUID())
    const wrongQueueJobId = trackJobId(randomUUID())

    await createTenant(tenantWithJobsId)
    await createTenant(otherTenantId)

    await insertJobs([
      ...matchingJobIds.map((id) => ({
        id,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        data: {
          tenant: {
            ref: tenantWithJobsId,
          },
          tenantId: tenantWithJobsId,
        },
      })),
      {
        id: otherTenantJobId,
        name: RunMigrationsOnTenants.getQueueName(),
        state: 'active',
        data: {
          tenant: {
            ref: otherTenantId,
          },
          tenantId: otherTenantId,
        },
      },
      {
        id: wrongQueueJobId,
        name: 'another-queue',
        state: 'active',
        data: {
          tenant: {
            ref: tenantWithJobsId,
          },
          tenantId: tenantWithJobsId,
        },
      },
    ])

    const response = await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantWithJobsId}/migrations/jobs`,
      headers,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toBe(MIGRATION_ADMIN_JOB_LIMIT)

    const secondResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantWithJobsId}/migrations/jobs`,
      headers,
    })

    expect(secondResponse.statusCode).toBe(200)
    expect(JSON.parse(secondResponse.body)).toBe(1)

    const rows = await getJobs<{ id: string; name: string }>('id, name', [
      ...matchingJobIds,
      otherTenantJobId,
      wrongQueueJobId,
    ])
    const namesById = Object.fromEntries(rows.map((row) => [row.id, row.name]))

    expect(namesById).toEqual({
      [otherTenantJobId]: RunMigrationsOnTenants.getQueueName(),
      [wrongQueueJobId]: 'another-queue',
    })
  })

  test('returns 0 when deleting tenant migration jobs for a tenant with no matching jobs', async () => {
    const tenantWithoutJobsId = `admin-migrations-empty-${randomUUID().slice(0, 8)}`

    await createTenant(tenantWithoutJobsId)

    const response = await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantWithoutJobsId}/migrations/jobs`,
      headers,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toBe(0)
  })
})
