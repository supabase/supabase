import { vi } from 'vitest'

const { mockGetTenantConfig, mockResetMigration, mockRunMigrationsSend, mockInfo } = vi.hoisted(
  () => ({
    mockGetTenantConfig: vi.fn(),
    mockResetMigration: vi.fn(),
    mockRunMigrationsSend: vi.fn(),
    mockInfo: vi.fn(),
  })
)

vi.mock('@internal/database', () => ({
  getTenantConfig: mockGetTenantConfig,
}))

vi.mock('@internal/database/migrations', () => ({
  DBMigration: {
    'create-migrations-table': 0,
    'storage-schema': 2,
  },
  resetMigration: mockResetMigration,
}))

vi.mock('@internal/monitoring', () => ({
  logger: {},
  logSchema: {
    info: mockInfo,
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {},
}))

vi.mock('./run-migrations', () => ({
  RunMigrationsOnTenants: class {
    static send = mockRunMigrationsSend
  },
}))

import { ResetMigrationsOnTenant } from './reset-migrations'

function makeJob(overrides?: Partial<Record<string, unknown>>) {
  return {
    data: {
      tenantId: 'tenant-a',
      untilMigration: 'storage-schema',
      markCompletedTillMigration: 'create-migrations-table',
      sbReqId: 'sb-req-123',
      tenant: {
        ref: 'tenant-a',
      },
    },
    ...overrides,
  }
}

describe('ResetMigrationsOnTenant.handle', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetTenantConfig.mockResolvedValue({
      databaseUrl: 'postgres://tenant-db',
    })
    mockResetMigration.mockResolvedValue(true)
    mockRunMigrationsSend.mockResolvedValue(undefined)
  })

  it('threads sbReqId through logs and the follow-up migration job', async () => {
    await expect(ResetMigrationsOnTenant.handle(makeJob() as never)).resolves.toBeUndefined()

    expect(mockResetMigration).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      markCompletedTillMigration: 'create-migrations-table',
      untilMigration: 'storage-schema',
      databaseUrl: 'postgres://tenant-db',
    })
    expect(mockRunMigrationsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        singletonKey: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] resetting migrations for tenant-a',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] reset successful for tenant-a',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })
})
