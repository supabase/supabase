import { vi } from 'vitest'

const { mockBeginTransaction, mockHandleUpgrade } = vi.hoisted(() => ({
  mockBeginTransaction: vi.fn(),
  mockHandleUpgrade: vi.fn(),
}))

vi.mock('../../../config', () => ({
  getConfig: () => ({
    isMultitenant: true,
  }),
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
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@storage/events', () => ({
  BaseEvent: class {
    static getQueueName() {
      return (this as unknown as { queueName: string }).queueName
    }
  },
}))

import { logSchema } from '@internal/monitoring'
import {
  UpgradeBaseEvent,
  type UpgradeBaseEventPayload,
  type UpgradeTransaction,
} from './base-event'

class TestUpgrade extends UpgradeBaseEvent<UpgradeBaseEventPayload> {
  static queueName = 'test-upgrade'

  static override handleUpgrade(tnx: UpgradeTransaction, job: never) {
    return mockHandleUpgrade(tnx, job)
  }
}

function makeTransaction() {
  return {
    query: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  }
}

describe('UpgradeBaseEvent pg runOnce', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the pg transaction path and records the completed upgrade', async () => {
    const tx = makeTransaction()
    tx.query
      .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    mockBeginTransaction.mockResolvedValue(tx)
    mockHandleUpgrade.mockResolvedValue(undefined)

    await TestUpgrade.handle({} as never)

    expect(mockHandleUpgrade).toHaveBeenCalledWith(tx, {})
    expect(tx.query).toHaveBeenLastCalledWith({
      text: expect.stringContaining('INSERT INTO event_upgrades'),
      values: ['test-upgrade'],
    })
    expect(tx.commit).toHaveBeenCalledTimes(1)
    expect(tx.rollback).not.toHaveBeenCalled()
  })

  it('commits without running the upgrade when the event is already recorded', async () => {
    const tx = makeTransaction()
    tx.query
      .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] })
      .mockResolvedValueOnce({ rows: [{ event_id: 'test-upgrade' }] })
    mockBeginTransaction.mockResolvedValue(tx)

    await TestUpgrade.handle({} as never)

    expect(mockHandleUpgrade).not.toHaveBeenCalled()
    expect(tx.commit).toHaveBeenCalledTimes(1)
    expect(tx.rollback).not.toHaveBeenCalled()
  })

  it('rolls back when the upgrade callback fails', async () => {
    const error = new Error('upgrade failed')
    const tx = makeTransaction()
    tx.query
      .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] })
      .mockResolvedValueOnce({ rows: [] })
    mockBeginTransaction.mockResolvedValue(tx)
    mockHandleUpgrade.mockRejectedValue(error)

    await expect(TestUpgrade.handle({} as never)).rejects.toThrow(error)

    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.rollback).toHaveBeenCalledTimes(1)
  })

  it('preserves upgrade errors when rollback fails', async () => {
    const error = new Error('upgrade failed')
    const rollbackError = new Error('rollback failed')
    const tx = makeTransaction()
    tx.query
      .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] })
      .mockResolvedValueOnce({ rows: [] })
    tx.rollback.mockRejectedValue(rollbackError)
    mockBeginTransaction.mockResolvedValue(tx)
    mockHandleUpgrade.mockRejectedValue(error)

    await expect(TestUpgrade.handle({} as never)).rejects.toBe(error)

    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.rollback).toHaveBeenCalledTimes(1)
    expect(logSchema.warning).toHaveBeenCalledWith(
      expect.anything(),
      '[Upgrade] Failed to rollback transaction',
      expect.objectContaining({
        type: 'upgradeEvent',
        error: rollbackError,
      })
    )
  })
})
