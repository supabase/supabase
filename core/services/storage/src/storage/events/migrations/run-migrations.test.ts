import { vi } from 'vitest'

const {
  mockGetTenantConfig,
  mockDeleteTenantConfig,
  mockAreMigrationsUpToDate,
  mockRunMigrationsOnTenant,
  mockUpdateTenantMigrationsState,
  mockDeleteIfActiveExists,
  mockInfo,
  mockError,
} = vi.hoisted(() => ({
  mockGetTenantConfig: vi.fn(),
  mockDeleteTenantConfig: vi.fn(),
  mockAreMigrationsUpToDate: vi.fn(),
  mockRunMigrationsOnTenant: vi.fn(),
  mockUpdateTenantMigrationsState: vi.fn(),
  mockDeleteIfActiveExists: vi.fn(),
  mockInfo: vi.fn(),
  mockError: vi.fn(),
}))

vi.mock('@internal/database', () => ({
  deleteTenantConfig: mockDeleteTenantConfig,
  getTenantConfig: mockGetTenantConfig,
  TenantMigrationStatus: {
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    FAILED_STALE: 'FAILED_STALE',
  },
}))

vi.mock('@internal/database/migrations', () => ({
  areMigrationsUpToDate: mockAreMigrationsUpToDate,
  runMigrationsOnTenant: mockRunMigrationsOnTenant,
  updateTenantMigrationsState: mockUpdateTenantMigrationsState,
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {
    static deleteIfActiveExists = mockDeleteIfActiveExists

    static getQueueName(this: { queueName: string }) {
      return this.queueName
    }
  },
}))

vi.mock('@internal/monitoring', () => ({
  logger: {},
  logSchema: {
    info: mockInfo,
    error: mockError,
    warning: vi.fn(),
  },
}))

import { TenantMigrationStatus } from '@internal/database'
import { ERRORS } from '@internal/errors'
import { RunMigrationsOnTenants } from './run-migrations'

function makeJob(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'job-1',
    name: RunMigrationsOnTenants.getQueueName(),
    retryCount: 0,
    retryLimit: 3,
    singletonKey: 'migrations_tenant-a',
    data: {
      tenantId: 'tenant-a',
      upToMigration: 'storage-schema',
      sbReqId: 'sb-req-123',
      tenant: {
        ref: 'tenant-a',
        host: '',
      },
    },
    ...overrides,
  }
}

describe('RunMigrationsOnTenants.handle', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetTenantConfig.mockResolvedValue({
      databaseUrl: 'postgres://tenant-db',
    })
    mockAreMigrationsUpToDate.mockResolvedValue(false)
    mockRunMigrationsOnTenant.mockResolvedValue(undefined)
    mockUpdateTenantMigrationsState.mockResolvedValue(undefined)
    mockDeleteIfActiveExists.mockResolvedValue(undefined)
  })

  it('runs migrations and marks the tenant completed on success', async () => {
    await expect(RunMigrationsOnTenants.handle(makeJob() as never)).resolves.toBeUndefined()

    expect(mockDeleteTenantConfig).toHaveBeenCalledWith('tenant-a')
    expect(mockDeleteTenantConfig.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetTenantConfig.mock.invocationCallOrder[0]
    )
    expect(mockRunMigrationsOnTenant).toHaveBeenCalledWith({
      databaseUrl: 'postgres://tenant-db',
      tenantId: 'tenant-a',
      waitForLock: false,
      upToMigration: 'storage-schema',
    })
    expect(mockUpdateTenantMigrationsState).toHaveBeenCalledWith('tenant-a', {
      migration: 'storage-schema',
      state: TenantMigrationStatus.COMPLETED,
    })
    expect(mockDeleteIfActiveExists).not.toHaveBeenCalled()
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] completed for tenant tenant-a',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('short-circuits when migrations are already up to date', async () => {
    mockAreMigrationsUpToDate.mockResolvedValue(true)

    await expect(RunMigrationsOnTenants.handle(makeJob() as never)).resolves.toBeUndefined()

    expect(mockRunMigrationsOnTenant).not.toHaveBeenCalled()
    expect(mockUpdateTenantMigrationsState).not.toHaveBeenCalled()
    expect(mockDeleteIfActiveExists).not.toHaveBeenCalled()
  })

  it('returns without marking the tenant failed on lock timeout', async () => {
    mockRunMigrationsOnTenant.mockRejectedValue(ERRORS.LockTimeout())

    await expect(RunMigrationsOnTenants.handle(makeJob() as never)).resolves.toBeUndefined()

    expect(mockUpdateTenantMigrationsState).not.toHaveBeenCalled()
    expect(mockDeleteIfActiveExists).not.toHaveBeenCalled()
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] lock timeout for tenant tenant-a',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('marks the tenant FAILED and rethrows when a retryable failure happens', async () => {
    mockRunMigrationsOnTenant.mockRejectedValue(new Error('migration failed'))

    await expect(RunMigrationsOnTenants.handle(makeJob() as never)).rejects.toThrow(
      'migration failed'
    )

    expect(mockUpdateTenantMigrationsState).toHaveBeenCalledWith('tenant-a', {
      state: TenantMigrationStatus.FAILED,
    })
    expect(mockDeleteIfActiveExists).toHaveBeenCalledWith(
      RunMigrationsOnTenants.getQueueName(),
      'migrations_tenant-a',
      'job-1'
    )
    expect(mockError).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] failed for tenant tenant-a',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('marks the tenant FAILED_STALE on the final retry before rethrowing', async () => {
    mockRunMigrationsOnTenant.mockRejectedValue(new Error('migration failed'))

    await expect(
      RunMigrationsOnTenants.handle(
        makeJob({
          retryCount: 3,
          retryLimit: 3,
        }) as never
      )
    ).rejects.toThrow('migration failed')

    expect(mockUpdateTenantMigrationsState).toHaveBeenCalledWith('tenant-a', {
      state: TenantMigrationStatus.FAILED_STALE,
    })
    expect(mockDeleteIfActiveExists).toHaveBeenCalledWith(
      RunMigrationsOnTenants.getQueueName(),
      'migrations_tenant-a',
      'job-1'
    )
  })
})
