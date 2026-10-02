import { vi } from 'vitest'

const { mockBeginTransaction, mockError, mockGetQueue } = vi.hoisted(() => ({
  mockBeginTransaction: vi.fn(),
  mockError: vi.fn(),
  mockGetQueue: vi.fn(),
}))

vi.mock('../../../config', () => ({
  getConfig: () => ({}),
}))

vi.mock('@internal/database', () => ({
  multitenantPgExecutor: {
    beginTransaction: mockBeginTransaction,
  },
  PgTransaction: class {},
}))

vi.mock('@internal/monitoring', () => ({
  logger: {},
  logSchema: {
    info: vi.fn(),
    error: mockError,
    warning: vi.fn(),
  },
}))

vi.mock('@internal/queue', () => ({
  PG_BOSS_SCHEMA: 'pgboss_v10',
  SYSTEM_TENANT_REF: 'system-tenant',
  Queue: {
    getInstance: () => ({
      getQueue: mockGetQueue,
    }),
  },
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {},
}))

import { MoveJobs } from './move-jobs'

function makeTransaction() {
  return {
    query: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  }
}

function makeMoveJob() {
  return {
    data: {
      fromQueue: 'source-queue',
      toQueue: 'target-queue',
      deleteJobsFromOriginalQueue: false,
      sbReqId: 'sb-req-123',
      tenant: {
        ref: 'tenant-a',
      },
    },
  }
}

describe('pg-boss maintenance pg branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('moves jobs through the pg transaction branch', async () => {
    const tx = makeTransaction()
    tx.query.mockResolvedValueOnce({ rows: [{ locked: true }] }).mockResolvedValueOnce({ rows: [] })
    mockBeginTransaction.mockResolvedValue(tx)
    mockGetQueue.mockResolvedValue({
      name: 'target-queue',
      policy: 'exactly_once',
    })

    await MoveJobs.handle(makeMoveJob() as never)

    expect(tx.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        text: expect.stringContaining('INSERT INTO pgboss_v10.job'),
        values: ['target-queue', 'exactly_once', 'source-queue'],
      })
    )
    expect(tx.commit).toHaveBeenCalledTimes(1)
    expect(tx.rollback).not.toHaveBeenCalled()
  })
})
