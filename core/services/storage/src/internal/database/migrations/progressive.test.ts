import { vi } from 'vitest'

type MockTenantConfig = {
  migrationStatus: string | undefined
  syncMigrationsDone: boolean
}

type MockMigrationJob = {
  payload: Record<string, unknown> & { tenantId: string }
}

type MockBatchSend = (jobs: MockMigrationJob[]) => Promise<void> | void

const { mockBatchSend, mockGetTenantConfig, mockAreMigrationsUpToDate, mockWarning, mockError } =
  vi.hoisted(() => ({
    mockBatchSend: vi.fn<MockBatchSend>(),
    mockGetTenantConfig: vi.fn<(tenantId: string) => Promise<MockTenantConfig>>(),
    mockAreMigrationsUpToDate: vi.fn<(tenantId: string) => Promise<boolean>>(),
    mockWarning: vi.fn(),
    mockError: vi.fn(),
  }))

vi.mock('../tenant', () => ({
  getTenantConfig: mockGetTenantConfig,
  TenantMigrationStatus: {
    FAILED_STALE: 'FAILED_STALE',
  },
}))

vi.mock('@internal/database/migrations/migrate', () => ({
  areMigrationsUpToDate: mockAreMigrationsUpToDate,
}))

vi.mock('@storage/events', () => ({
  RunMigrationsOnTenants: class {
    static batchSend = mockBatchSend
    payload: MockMigrationJob['payload']

    constructor(payload: MockMigrationJob['payload']) {
      this.payload = payload
    }
  },
}))

vi.mock('../../monitoring', () => ({
  logger: {},
  logSchema: {
    info: vi.fn(),
    warning: mockWarning,
    error: mockError,
  },
}))

import { AsyncAbortController } from '@internal/concurrency'
import { ERRORS } from '@internal/errors'
import { ProgressiveMigrations } from './progressive'

const migrationsUnderTest = new Set<TestProgressiveMigrations>()

class TestProgressiveMigrations extends ProgressiveMigrations {
  private currentTime = 0
  private randomValue = 0

  constructor(options: { maxSize: number; interval: number }) {
    super(options)
    migrationsUnderTest.add(this)
  }

  seed(...tenants: string[]) {
    for (const tenant of tenants) {
      this.tenants.add(tenant)
    }
  }

  pending() {
    return [...this.tenants]
  }

  hasInFlightCreateJobs() {
    return this.inFlightCreateJobs !== undefined
  }

  flush(maxJobs: number) {
    return this.createJobs(maxJobs)
  }

  waitForCurrentRun() {
    return this.inFlightCreateJobs ?? Promise.resolve()
  }

  advanceTime(milliseconds: number) {
    this.currentTime += milliseconds
  }

  async advanceBothClocksBy(timerMilliseconds: number, monotonicMilliseconds = timerMilliseconds) {
    this.advanceTime(monotonicMilliseconds)
    await vi.advanceTimersByTimeAsync(timerMilliseconds)
  }

  setRandom(value: number) {
    this.randomValue = value
  }

  backoffState() {
    return {
      consecutiveFailures: this.consecutiveBatchSendFailures,
      retryInMs: Math.max(this.nextBatchSendAttemptAt - this.currentTime, 0),
    }
  }

  protected now() {
    return this.currentTime
  }

  protected random() {
    return this.randomValue
  }

  cleanup() {
    this.resetBatchSendBackoff()
  }
}

class SettlingWindowProgressiveMigrations extends TestProgressiveMigrations {
  onRunSettled?: () => void

  protected override async createJobsBatch(maxJobs: number) {
    await super.createJobsBatch(maxJobs)

    const onRunSettled = this.onRunSettled
    this.onRunSettled = undefined
    if (onRunSettled) {
      queueMicrotask(onRunSettled)
    }
  }
}

class ThrowOnceProgressiveMigrations extends TestProgressiveMigrations {
  private shouldThrow = true

  protected override async createJobsBatch(maxJobs: number) {
    if (this.shouldThrow) {
      this.shouldThrow = false
      throw new Error('unexpected batch failure')
    }

    return super.createJobsBatch(maxJobs)
  }
}

const mockRunMigrationsBatchSend = mockBatchSend
const defaultOptions = { maxSize: 10, interval: 1000 }
const defaultTenantConfig: MockTenantConfig = {
  migrationStatus: undefined,
  syncMigrationsDone: false,
}

function createMigrations(options: Partial<typeof defaultOptions> = {}) {
  return new TestProgressiveMigrations({ ...defaultOptions, ...options })
}

function startMigrations(options: Partial<typeof defaultOptions> = {}) {
  const migrations = createMigrations(options)
  const controller = new AsyncAbortController()
  migrations.start(controller.signal)

  return { migrations, controller }
}

function sentTenantIds(callIndex = 0) {
  return mockRunMigrationsBatchSend.mock.calls[callIndex][0].map((job) => job.payload.tenantId)
}

function isNodeTimeout(value: unknown): value is NodeJS.Timeout {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hasRef' in value &&
    typeof value.hasRef === 'function'
  )
}

describe('ProgressiveMigrations', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    mockGetTenantConfig.mockResolvedValue(defaultTenantConfig)
    mockAreMigrationsUpToDate.mockResolvedValue(false)
    mockRunMigrationsBatchSend.mockResolvedValue(undefined)
  })

  afterEach(() => {
    for (const migrations of migrationsUnderTest) {
      migrations.cleanup()
    }
    migrationsUnderTest.clear()
    vi.useRealTimers()
  })

  it('keeps batchSend-failed tenants queued and clears the running state', async () => {
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable'))
      .mockResolvedValueOnce(undefined)

    const migrations = createMigrations()

    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(migrations.pending()).toEqual(['tenant-a'])
    expect(migrations.hasInFlightCreateJobs()).toBe(false)
    expect(mockError).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Error sending migration jobs batch',
      expect.objectContaining({
        type: 'migrations',
        metadata: JSON.stringify({
          strategy: 'progressive',
          consecutiveFailures: 1,
          retryDelayMs: 1000,
        }),
      })
    )

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(migrations.pending()).toEqual(['tenant-a'])

    migrations.advanceTime(999)
    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)

    migrations.advanceTime(1)
    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(migrations.pending()).toEqual([])
    expect(migrations.hasInFlightCreateJobs()).toBe(false)
    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 0,
      retryInMs: 0,
    })
  })

  it('does not retain work when batch sending is deliberately disabled', async () => {
    mockRunMigrationsBatchSend.mockReturnValueOnce(undefined)

    const migrations = createMigrations({ maxSize: 1 })
    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()

    expect(migrations.pending()).toEqual([])
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 0,
      retryInMs: 0,
    })
    expect(mockError).not.toHaveBeenCalled()
  })

  it('does not prepare tenants or shorten an active retry when another tenant arrives at capacity', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))

    const { migrations, controller } = startMigrations({ maxSize: 1 })
    migrations.setRandom(1)
    migrations.seed('tenant-a')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 2000,
      })

      await migrations.advanceBothClocksBy(500)
      migrations.addTenant('tenant-b')

      expect(mockGetTenantConfig).toHaveBeenCalledTimes(1)
      expect(migrations.pending()).toEqual(['tenant-a', 'tenant-b'])
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 1500,
      })
      expect(vi.getTimerCount()).toBe(1)
    } finally {
      await controller.abortAsync()
    }
  })

  it('applies jittered exponential backoff, caps it at one minute, and resets on recovery', async () => {
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable 1'))
      .mockRejectedValueOnce(new Error('queue unavailable 2'))
      .mockRejectedValueOnce(new Error('queue unavailable 3'))
      .mockRejectedValueOnce(new Error('queue unavailable 4'))
      .mockRejectedValueOnce(new Error('queue unavailable 5'))
      .mockRejectedValueOnce(new Error('queue unavailable 6'))
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('queue unavailable after recovery'))

    const migrations = createMigrations()
    migrations.setRandom(1)
    migrations.seed('tenant-a')

    for (const [index, retryDelayMs] of [2000, 4000, 8000, 16000, 32000, 60000].entries()) {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(index + 1)
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: index + 1,
        retryInMs: retryDelayMs,
      })

      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(index + 1)
      migrations.advanceTime(retryDelayMs)
    }

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(migrations.pending()).toEqual([])
    expect(migrations.backoffState().consecutiveFailures).toBe(0)

    migrations.setRandom(0)
    migrations.seed('tenant-b')
    await expect(migrations.flush(1)).resolves.toBeUndefined()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(8)
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 1000,
    })
  })

  it('retries at the sampled jittered deadline', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable'))
      .mockResolvedValueOnce(undefined)

    const { migrations, controller } = startMigrations({ interval: 5000 })
    migrations.setRandom(0.5)
    migrations.seed('tenant-a')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 7500,
      })

      await migrations.advanceBothClocksBy(5000)
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)

      await migrations.advanceBothClocksBy(2499)
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)

      await migrations.advanceBothClocksBy(1)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(migrations.pending()).toEqual([])
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 0,
        retryInMs: 0,
      })
    } finally {
      await controller.abortAsync()
    }
  })

  it('honors the retry timer when the monotonic deadline lags by a fraction of a millisecond', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable'))
      .mockResolvedValueOnce(undefined)

    const { migrations, controller } = startMigrations({ interval: 5000 })
    migrations.setRandom(0.5)
    migrations.seed('tenant-a')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()

      await migrations.advanceBothClocksBy(7500, 7499.5)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(migrations.pending()).toEqual([])
    } finally {
      await controller.abortAsync()
    }
  })

  it('keeps queue wakeups alive after an unexpected batch failure', async () => {
    vi.useFakeTimers()
    const abortController = new AsyncAbortController()
    const migrations = new ThrowOnceProgressiveMigrations({
      maxSize: 10,
      interval: 1000,
    })
    migrations.start(abortController.signal)

    try {
      migrations.addTenant('tenant-a')

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(migrations.pending()).toEqual(['tenant-a'])
      expect(vi.getTimerCount()).toBe(1)

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(migrations.pending()).toEqual([])
    } finally {
      await abortController.abortAsync()
    }
  })

  it('schedules an underfilled first batch', async () => {
    vi.useFakeTimers()
    const { migrations, controller } = startMigrations()

    try {
      migrations.addTenant('tenant-a')
      migrations.addTenant('tenant-b')

      expect(migrations.pending()).toEqual(['tenant-a', 'tenant-b'])
      expect(mockRunMigrationsBatchSend).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(1)

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(migrations.pending()).toEqual([])
    } finally {
      await controller.abortAsync()
    }
  })

  it('flushes a full batch without waiting for its underfilled wakeup', async () => {
    vi.useFakeTimers()
    const { migrations, controller } = startMigrations({ maxSize: 2 })

    try {
      migrations.addTenant('tenant-a')
      expect(vi.getTimerCount()).toBe(1)

      migrations.addTenant('tenant-b')
      expect(vi.getTimerCount()).toBe(0)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(mockRunMigrationsBatchSend.mock.calls[0][0]).toHaveLength(2)
      expect(migrations.pending()).toEqual([])
    } finally {
      await controller.abortAsync()
    }
  })

  it('schedules remaining work after a batch that was already in flight', async () => {
    vi.useFakeTimers()
    const tenantConfig = Promise.withResolvers<MockTenantConfig>()
    mockGetTenantConfig.mockReturnValueOnce(tenantConfig.promise)

    const { migrations, controller } = startMigrations({ maxSize: 1 })

    try {
      migrations.addTenant('tenant-a')
      expect(mockGetTenantConfig).toHaveBeenCalledWith('tenant-a')

      migrations.addTenant('tenant-b')
      expect(vi.getTimerCount()).toBe(0)

      tenantConfig.resolve(defaultTenantConfig)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(sentTenantIds()).toEqual(['tenant-a'])
      expect(migrations.pending()).toEqual(['tenant-b'])
      expect(vi.getTimerCount()).toBe(1)

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(sentTenantIds(1)).toEqual(['tenant-b'])
      expect(migrations.pending()).toEqual([])
    } finally {
      await controller.abortAsync()
    }
  })

  it('keeps queue wakeups alive until a rotated preparation failure is retried', async () => {
    vi.useFakeTimers()
    mockGetTenantConfig.mockRejectedValueOnce(new Error('control database unavailable'))
    mockAreMigrationsUpToDate.mockImplementation(async (tenantId) => {
      return tenantId === 'tenant-current'
    })

    const { migrations, controller } = startMigrations({ maxSize: 1 })
    migrations.seed('tenant-retry', 'tenant-sendable', 'tenant-current')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(migrations.pending()).toEqual(['tenant-sendable', 'tenant-current', 'tenant-retry'])

      for (const expectedPending of [['tenant-current', 'tenant-retry'], ['tenant-retry'], []]) {
        await migrations.advanceBothClocksBy(1000)
        await migrations.waitForCurrentRun()

        expect(migrations.pending()).toEqual(expectedPending)
        expect(vi.getTimerCount()).toBe(expectedPending.length > 0 ? 1 : 0)
      }

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    } finally {
      await controller.abortAsync()
    }
  })

  it('resets the failure tier when an unrelated queued batch succeeds', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable 1'))
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('queue unavailable 2'))

    const { migrations, controller } = startMigrations({ maxSize: 1 })
    migrations.seed('tenant-a', 'tenant-b')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(migrations.pending()).toEqual(['tenant-a'])
      expect(vi.getTimerCount()).toBe(1)

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(3)
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 1000,
      })
    } finally {
      await controller.abortAsync()
    }
  })

  it('keeps the failure tier and queue wakeups after an unrelated no-op slice', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable 1'))
      .mockRejectedValueOnce(new Error('queue unavailable 2'))
    mockAreMigrationsUpToDate.mockImplementation(async (tenantId) => {
      return tenantId === 'tenant-current'
    })

    const { migrations, controller } = startMigrations({ maxSize: 1 })
    migrations.setRandom(1)
    migrations.seed('tenant-a', 'tenant-current')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 2000,
      })

      await migrations.advanceBothClocksBy(2000)
      await migrations.waitForCurrentRun()
      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(migrations.pending()).toEqual(['tenant-a'])
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 1,
        retryInMs: 0,
      })
      expect(vi.getTimerCount()).toBe(1)

      await migrations.advanceBothClocksBy(1000)
      await migrations.waitForCurrentRun()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(migrations.pending()).toEqual(['tenant-a'])
      expect(migrations.backoffState()).toEqual({
        consecutiveFailures: 2,
        retryInMs: 4000,
      })
    } finally {
      await controller.abortAsync()
    }
  })

  it('does not let the queue timer keep the process alive', async () => {
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const { migrations, controller } = startMigrations()
    migrations.seed('tenant-a')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      const retryTimer = setTimeoutSpy.mock.results[0]?.value
      expect(isNodeTimeout(retryTimer)).toBe(true)
      if (!isNodeTimeout(retryTimer)) {
        throw new Error('Expected setTimeout() to return a Node.js timer')
      }
      expect(retryTimer.hasRef()).toBe(false)
    } finally {
      await controller.abortAsync()
      setTimeoutSpy.mockRestore()
    }
  })

  it('allows an idle drain to bypass batch-send backoff', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable'))
      .mockResolvedValueOnce(undefined)

    const { migrations, controller } = startMigrations()
    migrations.seed('tenant-a')

    try {
      await expect(migrations.flush(1)).resolves.toBeUndefined()
      expect(migrations.backoffState().consecutiveFailures).toBe(1)
      expect(vi.getTimerCount()).toBe(1)

      await expect(migrations.drain()).resolves.toBeUndefined()

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
      expect(migrations.pending()).toEqual([])
      expect(migrations.backoffState().consecutiveFailures).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      await controller.abortAsync()
    }

    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits for an in-flight batch and drains remaining work on shutdown', async () => {
    vi.useFakeTimers()
    const deferredBatch = Promise.withResolvers<void>()
    mockRunMigrationsBatchSend
      .mockReturnValueOnce(deferredBatch.promise)
      .mockResolvedValueOnce(undefined)

    const { migrations, controller } = startMigrations({ maxSize: 1 })
    migrations.seed('tenant-a', 'tenant-b')

    const flushPromise = migrations.flush(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(sentTenantIds()).toEqual(['tenant-a'])
    expect(migrations.hasInFlightCreateJobs()).toBe(true)

    let abortSettled = false
    const abortPromise = controller.abortAsync().then(() => {
      abortSettled = true
    })
    await vi.advanceTimersByTimeAsync(0)

    try {
      expect(abortSettled).toBe(false)
    } finally {
      deferredBatch.resolve()
      await Promise.all([flushPromise, abortPromise])
    }

    expect(abortSettled).toBe(true)
    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    expect(sentTenantIds(1)).toEqual(['tenant-b'])
    expect(migrations.pending()).toEqual([])
    expect(migrations.hasInFlightCreateJobs()).toBe(false)
  })

  it('does not schedule another retry when the shutdown drain fails', async () => {
    vi.useFakeTimers()
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))

    const { migrations, controller } = startMigrations()
    migrations.seed('tenant-a')

    await controller.abortAsync()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(migrations.pending()).toEqual(['tenant-a'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resets backoff before an idle drain attempt', async () => {
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable 1'))
      .mockRejectedValueOnce(new Error('queue unavailable 2'))

    const migrations = createMigrations()
    migrations.setRandom(1)
    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 2000,
    })

    await expect(migrations.drain()).resolves.toBeUndefined()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    expect(migrations.pending()).toEqual(['tenant-a'])
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 2000,
    })
  })

  it('uses the scheduler interval as a fixed delay when it exceeds the backoff cap', async () => {
    mockRunMigrationsBatchSend
      .mockRejectedValueOnce(new Error('queue unavailable 1'))
      .mockRejectedValueOnce(new Error('queue unavailable 2'))

    const migrations = createMigrations({ interval: 120_000 })
    migrations.setRandom(0)
    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 120_000,
    })

    migrations.advanceTime(120_000)
    migrations.setRandom(1)
    await expect(migrations.flush(1)).resolves.toBeUndefined()

    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 2,
      retryInMs: 120_000,
    })
  })

  it('clears backoff when another process empties the queue', async () => {
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))

    const migrations = createMigrations()
    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    migrations.advanceTime(1000)
    mockAreMigrationsUpToDate.mockResolvedValue(true)

    await expect(migrations.flush(1)).resolves.toBeUndefined()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(migrations.pending()).toEqual([])
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 0,
      retryInMs: 0,
    })
  })

  it('keeps failure history when the next attempt fails during preparation', async () => {
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))

    const migrations = createMigrations()
    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    migrations.advanceTime(1000)
    mockGetTenantConfig.mockRejectedValue(new Error('control database unavailable'))

    await expect(migrations.flush(1)).resolves.toBeUndefined()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(mockGetTenantConfig).toHaveBeenCalledTimes(2)
    expect(migrations.pending()).toEqual(['tenant-a'])
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 0,
    })
  })

  it('retries once when drain joins an in-flight batch that fails', async () => {
    const deferredBatch = Promise.withResolvers<void>()
    mockRunMigrationsBatchSend
      .mockReturnValueOnce(deferredBatch.promise)
      .mockRejectedValueOnce(new Error('queue still unavailable'))

    const migrations = createMigrations({ maxSize: 1 })
    migrations.setRandom(1)
    migrations.seed('tenant-a', 'tenant-b')

    const flushPromise = migrations.flush(1)
    await new Promise((resolve) => setImmediate(resolve))
    const drainPromise = migrations.drain()

    deferredBatch.reject(new Error('queue unavailable'))
    await expect(Promise.all([flushPromise, drainPromise])).resolves.toEqual([undefined, undefined])

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    expect(migrations.pending()).toEqual(['tenant-b', 'tenant-a'])
    expect(migrations.backoffState()).toEqual({
      consecutiveFailures: 1,
      retryInMs: 2000,
    })
  })

  it('keeps new tenants queued while a batch is in flight and ignores duplicate adds', async () => {
    vi.useFakeTimers()
    const deferredBatch = Promise.withResolvers<void>()
    mockRunMigrationsBatchSend.mockReturnValueOnce(deferredBatch.promise)

    const { migrations, controller } = startMigrations()

    migrations.seed('tenant-a')

    try {
      const flushPromise = migrations.flush(1)
      await vi.advanceTimersByTimeAsync(0)

      expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
      expect(migrations.hasInFlightCreateJobs()).toBe(true)

      migrations.addTenant('tenant-a')
      migrations.addTenant('tenant-b')

      expect(migrations.pending()).toEqual(['tenant-a', 'tenant-b'])
      expect(vi.getTimerCount()).toBe(0)

      deferredBatch.resolve()

      await expect(flushPromise).resolves.toBeUndefined()
      expect(migrations.pending()).toEqual(['tenant-b'])
      expect(migrations.hasInFlightCreateJobs()).toBe(false)
    } finally {
      deferredBatch.resolve()
      await controller.abortAsync()
    }
  })

  it('allows a completed tenant to be queued again without admitting duplicates', async () => {
    const migrations = createMigrations()

    migrations.seed('tenant-a')
    await expect(migrations.flush(1)).resolves.toBeUndefined()

    migrations.addTenant('tenant-a')
    migrations.addTenant('tenant-a')

    expect(migrations.pending()).toEqual(['tenant-a'])
  })

  it('starts a follow-up run when drain lands after the run settles but before cleanup', async () => {
    const migrations = new SettlingWindowProgressiveMigrations({
      maxSize: 1,
      interval: 1000,
    })

    mockRunMigrationsBatchSend.mockResolvedValue(undefined)
    let lateDrainPromise: Promise<void> | undefined
    migrations.onRunSettled = () => {
      migrations.addTenant('tenant-b')
      lateDrainPromise = migrations.drain()
    }

    migrations.seed('tenant-a')

    await expect(migrations.flush(1)).resolves.toBeUndefined()
    await lateDrainPromise

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(2)
    expect(sentTenantIds(0)).toEqual(['tenant-a'])
    expect(sentTenantIds(1)).toEqual(['tenant-b'])
    expect(migrations.pending()).toEqual([])
    expect(migrations.hasInFlightCreateJobs()).toBe(false)
  })

  it('requeues only failed sends and retryable preparations from a mixed batch', async () => {
    mockRunMigrationsBatchSend.mockRejectedValueOnce(new Error('queue unavailable'))
    mockAreMigrationsUpToDate.mockImplementation(async (tenantId) => {
      return tenantId === 'tenant-current'
    })
    mockGetTenantConfig.mockImplementation(async (tenantId) => {
      if (tenantId === 'tenant-b') {
        throw ERRORS.MissingTenantConfig(tenantId)
      }

      if (tenantId === 'tenant-c') {
        throw new Error('tenant lookup failed')
      }

      return defaultTenantConfig
    })

    const migrations = createMigrations({ maxSize: 4 })

    migrations.seed('tenant-a', 'tenant-b', 'tenant-c', 'tenant-current', 'tenant-d')

    await expect(migrations.flush(4)).resolves.toBeUndefined()

    expect(mockRunMigrationsBatchSend).toHaveBeenCalledTimes(1)
    expect(mockRunMigrationsBatchSend.mock.calls[0][0]).toHaveLength(1)
    expect(sentTenantIds()).toEqual(['tenant-a'])
    expect(migrations.pending()).toEqual(['tenant-d', 'tenant-a', 'tenant-c'])
    expect(migrations.hasInFlightCreateJobs()).toBe(false)
    expect(mockWarning).toHaveBeenCalledTimes(2)
    expect(mockWarning).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Failed to prepare migration job for tenant tenant-b; dropping tenant from queue because it no longer exists',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-b',
      })
    )
    expect(mockWarning).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Failed to prepare migration job for tenant tenant-c; keeping tenant queued for retry',
      expect.objectContaining({
        type: 'migrations',
        project: 'tenant-c',
      })
    )
  })
})
