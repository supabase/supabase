import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import type { RuntimeExtensionContext } from '@platformatic/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  config: {
    profilingAutomaticEnabled: true,
    profilingCaptureSeconds: 30,
    profilingCooldownSeconds: 300,
    profilingCpuIntervalMicros: 10_000,
    profilingMaxCapturesPerHour: 6,
    profilingS3Bucket: 'profiles' as string | undefined,
    profilingTriggerElu: 0.55,
    profilingMaxElu: 0.8,
    profilingTriggerDelayP99Ms: 150,
    profilingSevereDelayP99Ms: 1_000,
  },
  appLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  logError: vi.fn(),
  logInfo: vi.fn(),
  wait: vi.fn(),
  stores: [] as Array<{
    archive: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('node:timers/promises', () => ({ setTimeout: mocks.wait }))
vi.mock('../../../config', () => ({ getConfig: () => mocks.config }))
vi.mock('../logger', () => ({
  logger: mocks.appLogger,
  logSchema: {
    error: mocks.logError,
    info: mocks.logInfo,
  },
}))
vi.mock('./store', () => ({
  createProfileStore: () => {
    const store = {
      archive: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    }
    mocks.stores.push(store)
    return store
  },
}))

import setup from './runtime-extension'
import { manualProfileCaptureMessage } from './trigger'

class MockRuntime extends EventEmitter {
  startApplicationProfiling = vi.fn().mockResolvedValue(undefined)
  stopApplicationProfiling = vi
    .fn()
    .mockImplementation((_id: string, options: Record<string, unknown>) =>
      Promise.resolve(
        options.includeSampleCount
          ? { profile: Buffer.from('automatic-profile'), sampleCount: 1 }
          : Buffer.from('manual-profile')
      )
    )
  getApplicationLastProfile = vi.fn().mockResolvedValue({
    profile: Buffer.from('profile'),
    timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
    preserved: false,
  })
}

class MockITC {
  readonly handlers = new Map<string, (payload: unknown) => unknown>()

  handle(name: string, handler: (payload: unknown) => unknown) {
    this.handlers.set(name, handler)
  }

  async invoke(name: string, payload: unknown) {
    const handler = this.handlers.get(name)
    if (!handler) throw new Error(`Missing handler ${name}`)
    return await handler(payload)
  }

  async send<Response = unknown>(): Promise<Response> {
    throw new Error('Not implemented')
  }

  async notify() {}
}

function createContext(runtime = new MockRuntime()) {
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
  }

  return {
    runtime,
    itc: new MockITC(),
    logger,
  } as unknown as RuntimeExtensionContext & {
    runtime: MockRuntime
    itc: MockITC
    logger: typeof logger
  }
}

function profilingNotStartedError() {
  return Object.assign(new Error('Profiling not started'), {
    code: 'PLT_PPROF_PROFILING_NOT_STARTED',
  })
}

describe('Watt profiling runtime extension', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.stores.length = 0
    mocks.wait.mockResolvedValue(undefined)
    Object.assign(mocks.config, {
      profilingAutomaticEnabled: true,
      profilingCaptureSeconds: 30,
      profilingCooldownSeconds: 300,
      profilingCpuIntervalMicros: 10_000,
      profilingMaxCapturesPerHour: 6,
      profilingS3Bucket: 'profiles',
      profilingTriggerElu: 0.55,
      profilingMaxElu: 0.8,
      profilingTriggerDelayP99Ms: 150,
      profilingSevereDelayP99Ms: 1_000,
    })
  })

  it('is registered at its built path in watt.json', () => {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../../watt.json'), 'utf8')
    ) as {
      extensions?: Array<{ path?: string }>
    }

    expect(config.extensions?.map((extension) => extension.path)).toContain(
      './dist/internal/monitoring/pprof/runtime-extension.js'
    )
  })

  it('starts guide-style health-gated profiling for every matching worker', async () => {
    const context = createContext()
    const extension = await setup(context)

    context.runtime.emit('application:worker:started', {
      application: 'other',
      worker: 0,
    })
    context.runtime.emit('application:worker:started', {
      application: 'storage',
      worker: 0,
    })

    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:0', {
        type: 'cpu',
        durationMillis: 30_000,
        eluThreshold: 0.55,
        maxELU: 0.8,
        intervalMicros: 10_000,
      })
    )
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce()
    expect(context.runtime.listenerCount('application:worker:started')).toBe(1)
    expect(context.runtime.listenerCount('application:worker:exited')).toBe(1)
    expect(context.runtime.listenerCount('application:worker:profile:captured')).toBe(1)

    await extension?.close()
  })

  it('retries dormant automatic profiling on the next health metrics tick', async () => {
    const error = new Error('start failed')
    const context = createContext()
    context.runtime.startApplicationProfiling.mockRejectedValueOnce(error)
    const extension = await setup(context)

    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() =>
      expect(mocks.logError).toHaveBeenCalledWith(
        mocks.appLogger,
        'Failed to start Watt automatic profiling',
        expect.objectContaining({ error })
      )
    )

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [],
    })
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledTimes(2)
    )

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [],
    })
    await new Promise((resolve) => setImmediate(resolve))
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledTimes(2)

    await extension?.close()
  })

  it('retries automatic profiling after manual suspension finds it already stopped', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.startApplicationProfiling.mockClear()
    const error = profilingNotStartedError()
    context.runtime.stopApplicationProfiling.mockRejectedValueOnce(error)

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'cpu',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })
    await vi.waitFor(() =>
      expect(mocks.logError).toHaveBeenCalledWith(
        mocks.appLogger,
        'Failed to capture or archive Watt requested profile',
        expect.objectContaining({ error })
      )
    )
    await new Promise((resolve) => setImmediate(resolve))

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [],
    })
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith(
        'storage:0',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()

    await extension?.close()
  })

  it('suspends automatic profiling, archives a manual CPU capture, and restores it', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', {
      application: 'storage',
      worker: 0,
    })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.startApplicationProfiling.mockClear()
    context.runtime.stopApplicationProfiling.mockClear()

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'cpu',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })

    const store = mocks.stores[0]
    await vi.waitFor(() => expect(store.archive).toHaveBeenCalledOnce())
    expect(context.runtime.stopApplicationProfiling).toHaveBeenNthCalledWith(1, 'storage:0', {
      type: 'cpu',
      includeSampleCount: true,
    })
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:0', {
      type: 'cpu',
      intervalMicros: 10_000,
    })
    expect(context.runtime.stopApplicationProfiling).toHaveBeenNthCalledWith(2, 'storage:0', {
      type: 'cpu',
    })
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:0', {
      type: 'cpu',
      durationMillis: 30_000,
      eluThreshold: 0.55,
      maxELU: 0.8,
      intervalMicros: 10_000,
    })
    expect(store.archive).toHaveBeenCalledWith(
      {
        class: 'manual',
        kind: 'cpu',
        reason: 'admin',
        startedAt: expect.any(Date),
        durationSeconds: 15,
      },
      Buffer.from('manual-profile'),
      { applicationId: 'storage', workerId: '0' }
    )

    await extension?.close()
  })

  it('captures and archives a manual heap profile without stopping automatic CPU profiling', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', {
      application: 'storage',
      worker: 0,
    })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.startApplicationProfiling.mockClear()
    context.runtime.stopApplicationProfiling.mockClear()

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'heap',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })

    const store = mocks.stores[0]
    await vi.waitFor(() => expect(store.archive).toHaveBeenCalledOnce())
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce()
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:0', {
      type: 'heap',
    })
    expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce()
    expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledWith('storage:0', {
      type: 'heap',
    })
    expect(store.archive).toHaveBeenCalledWith(
      {
        class: 'manual',
        kind: 'heap',
        reason: 'admin',
        startedAt: expect.any(Date),
        durationSeconds: 15,
      },
      Buffer.from('manual-profile'),
      { applicationId: 'storage', workerId: '0' }
    )

    await extension?.close()
  })

  it('waits for automatic startup before suspending it for a manual capture', async () => {
    const automaticStart = Promise.withResolvers<void>()
    const context = createContext()
    context.runtime.startApplicationProfiling.mockReturnValueOnce(automaticStart.promise)
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', {
      application: 'storage',
      worker: 0,
    })

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'cpu',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })
    await new Promise((resolve) => setImmediate(resolve))
    expect(context.runtime.stopApplicationProfiling).not.toHaveBeenCalled()

    automaticStart.resolve()
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    expect(context.runtime.stopApplicationProfiling).toHaveBeenNthCalledWith(1, 'storage:0', {
      type: 'cpu',
      includeSampleCount: true,
    })

    await extension?.close()
  })

  it('does not resume a manual capture after its worker exits during automatic startup', async () => {
    const automaticStart = Promise.withResolvers<void>()
    const context = createContext()
    context.runtime.startApplicationProfiling.mockReturnValueOnce(automaticStart.promise)
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', {
      application: 'storage',
      worker: 0,
    })

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'cpu',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())

    context.runtime.emit('application:worker:exited', { application: 'storage', worker: 0 })
    automaticStart.resolve()
    await new Promise((resolve) => setImmediate(resolve))

    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce()
    expect(context.runtime.stopApplicationProfiling).not.toHaveBeenCalled()
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()
    await extension?.close()
  })

  it('rejects overlapping manual captures for the same worker', async () => {
    mocks.config.profilingAutomaticEnabled = false
    const capture = Promise.withResolvers<void>()
    mocks.wait.mockReturnValueOnce(capture.promise)
    const context = createContext()
    const extension = await setup(context)
    const request = {
      application: 'storage',
      worker: '0',
      type: 'cpu',
      seconds: 15,
      reason: 'admin',
    }

    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: true,
    })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: false,
      reason: 'busy',
    })

    capture.resolve()
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    await extension?.close()
  })

  it('stops an active manual capture when the extension closes', async () => {
    mocks.config.profilingAutomaticEnabled = false
    let captureSignal: AbortSignal | undefined
    mocks.wait.mockImplementationOnce(
      (_delay: number, _value: undefined, options: { signal?: AbortSignal }) =>
        new Promise<void>((_resolve, reject) => {
          captureSignal = options.signal
          options.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
            once: true,
          })
        })
    )
    const context = createContext()
    const extension = await setup(context)

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'heap',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())

    await extension?.close()
    expect(captureSignal?.aborted).toBe(true)
    expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce()
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()
  })

  it('cancels an exited worker capture without clearing its replacement lock', async () => {
    mocks.config.profilingAutomaticEnabled = false
    const exitedCapture = Promise.withResolvers<void>()
    const replacementCapture = Promise.withResolvers<void>()
    let exitedCaptureSignal: AbortSignal | undefined
    mocks.wait
      .mockImplementationOnce(
        (_delay: number, _value: undefined, options: { signal?: AbortSignal }) => {
          exitedCaptureSignal = options.signal
          options.signal?.addEventListener(
            'abort',
            () => exitedCapture.reject(options.signal?.reason),
            { once: true }
          )
          return exitedCapture.promise
        }
      )
      .mockReturnValueOnce(replacementCapture.promise)
    const context = createContext()
    const extension = await setup(context)
    const request = {
      application: 'storage',
      worker: '0',
      type: 'heap',
      seconds: 15,
      reason: 'admin',
    } as const

    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: true,
    })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: false,
      reason: 'busy',
    })

    context.runtime.emit('application:worker:exited', { application: 'storage', worker: 0 })
    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: true,
    })
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledTimes(2)
    )
    await new Promise((resolve) => setImmediate(resolve))
    const exitedCaptureAborted = exitedCaptureSignal?.aborted ?? false

    await expect(context.itc.invoke(manualProfileCaptureMessage, request)).resolves.toEqual({
      scheduled: false,
      reason: 'busy',
    })

    exitedCapture.resolve()
    replacementCapture.resolve()
    await extension?.close()
    expect(exitedCaptureAborted).toBe(true)
    expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce()
    expect(mocks.stores[0].archive).toHaveBeenCalledOnce()
  })

  it('cleans automatic collection locks when a worker exits', async () => {
    mocks.config.profilingCooldownSeconds = 0
    const firstProfile = Promise.withResolvers<{
      profile: Buffer
      timestamp: number
      preserved: boolean
    }>()
    const context = createContext()
    context.runtime.getApplicationLastProfile.mockReturnValueOnce(firstProfile.promise)
    const extension = await setup(context)
    const completedAt = Date.parse('2026-07-23T10:00:30.000Z')
    const emitProfile = (timestamp: number) =>
      context.runtime.emit('application:worker:profile:captured', {
        id: 'storage:0',
        application: 'storage',
        worker: 0,
        type: 'cpu',
        timestamp,
      })

    emitProfile(completedAt)
    await vi.waitFor(() => expect(context.runtime.getApplicationLastProfile).toHaveBeenCalledOnce())

    context.runtime.emit('application:worker:exited', { application: 'storage', worker: 0 })
    emitProfile(completedAt + 1)
    await vi.waitFor(() =>
      expect(context.runtime.getApplicationLastProfile).toHaveBeenCalledTimes(2)
    )

    firstProfile.resolve({
      profile: Buffer.from('first-profile'),
      timestamp: completedAt,
      preserved: false,
    })
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledTimes(2))
    await extension?.close()
  })

  it('archives the window containing a severe delay, then restores ELU gating', async () => {
    mocks.config.profilingCooldownSeconds = 0
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()
    const automaticStop = Promise.withResolvers<{ profile: Buffer; sampleCount: number }>()
    context.runtime.stopApplicationProfiling.mockReturnValueOnce(automaticStop.promise)
    const severeDelayProfile = Buffer.from('severe-delay-profile')

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [
        { type: 'eventLoopDelay', p99: 1_200, timestamp: Date.parse('2026-07-23T10:00:00.000Z') },
        { type: 'eventLoopDelay', p99: 1_500, timestamp: Date.parse('2026-07-23T10:00:01.000Z') },
      ],
    })

    await vi.waitFor(() => expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: Date.parse('2026-07-23T10:00:00.500Z'),
    })
    await new Promise((resolve) => setImmediate(resolve))
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()

    await expect(
      context.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'cpu',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: false, reason: 'busy' })

    automaticStop.resolve({ profile: severeDelayProfile, sampleCount: 1 })
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    expect(mocks.stores[0].archive).toHaveBeenCalledWith(
      {
        class: 'auto',
        kind: 'cpu',
        reason: 'event-loop-delay-severe',
        startedAt: new Date('2026-07-23T09:59:30.000Z'),
        durationSeconds: 30,
      },
      severeDelayProfile,
      { applicationId: 'storage', workerId: '0' }
    )
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenLastCalledWith('storage:0', {
        type: 'cpu',
        durationMillis: 30_000,
        eluThreshold: 0.55,
        maxELU: 0.8,
        intervalMicros: 10_000,
      })
    )
    expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce()
    expect(context.runtime.getApplicationLastProfile).not.toHaveBeenCalled()
    expect(mocks.wait).not.toHaveBeenCalled()

    await extension?.close()
  })

  it('prioritizes a severe delay after a moderate trigger in the same metrics batch', async () => {
    mocks.config.profilingCooldownSeconds = 0
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()
    const automaticStop = Promise.withResolvers<{ profile: Buffer; sampleCount: number }>()
    context.runtime.stopApplicationProfiling.mockReturnValueOnce(automaticStop.promise)
    const base = Date.parse('2026-07-23T10:00:00.000Z')
    const severeAt = base + 3_000

    for (const timestamp of [base, base + 1_000]) {
      context.runtime.emit('application:worker:health:metrics', {
        id: 'storage:0',
        application: 'storage',
        worker: 0,
        healthSignals: [{ type: 'eventLoopDelay', p99: 200, timestamp }],
      })
    }

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [
        { type: 'eventLoopDelay', p99: 200, timestamp: base + 2_000 },
        { type: 'eventLoopDelay', p99: 1_200, timestamp: severeAt },
      ],
    })

    await vi.waitFor(() => expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce())
    const severeDelayProfile = Buffer.from('mixed-batch-severe-delay-profile')
    automaticStop.resolve({ profile: severeDelayProfile, sampleCount: 1 })

    await vi.waitFor(() =>
      expect(mocks.stores[0].archive).toHaveBeenCalledWith(
        {
          class: 'auto',
          kind: 'cpu',
          reason: 'event-loop-delay-severe',
          startedAt: new Date(severeAt - 30_000),
          durationSeconds: 30,
        },
        severeDelayProfile,
        { applicationId: 'storage', workerId: '0' }
      )
    )

    await extension?.close()
  })

  it('restarts automatic profiling when a delay transition finds it already stopped', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.startApplicationProfiling.mockClear()
    const error = profilingNotStartedError()
    context.runtime.stopApplicationProfiling.mockRejectedValueOnce(error)

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [
        { type: 'eventLoopDelay', p99: 1_200, timestamp: Date.parse('2026-07-23T10:00:00.000Z') },
      ],
    })

    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith(
        'storage:0',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )
    expect(mocks.logError).toHaveBeenCalledWith(
      mocks.appLogger,
      'Failed to arm Watt automatic profiling after event loop delay',
      expect.objectContaining({ error })
    )

    await extension?.close()
  })

  it('arms the next window when a severe delay profile has no samples', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()
    const emptyProfile = Buffer.from('empty-profile')
    expect(emptyProfile.byteLength).toBeGreaterThan(0)
    context.runtime.stopApplicationProfiling.mockResolvedValueOnce({
      profile: emptyProfile,
      sampleCount: 0,
    })

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [
        { type: 'eventLoopDelay', p99: 1_200, timestamp: Date.parse('2026-07-23T10:00:00.000Z') },
      ],
    })

    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:0', {
        type: 'cpu',
        durationMillis: 30_000,
        maxELU: 0.8,
        intervalMicros: 10_000,
      })
    )
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
    })

    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    expect(mocks.stores[0].archive).toHaveBeenCalledWith(
      expect.objectContaining({ class: 'auto', reason: 'event-loop-delay-severe' }),
      Buffer.from('profile'),
      { applicationId: 'storage', workerId: '0' }
    )
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenLastCalledWith(
        'storage:0',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )

    await extension?.close()
  })

  it('cleans profiling state when an armed worker exits', async () => {
    const context = createContext()
    const extension = await setup(context)
    const base = Date.parse('2026-07-23T10:00:00.000Z')
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [
        { type: 'eventLoopDelay', p99: 200, timestamp: base },
        { type: 'eventLoopDelay', p99: 200, timestamp: base + 1 },
        { type: 'eventLoopDelay', p99: 200, timestamp: base + 2 },
      ],
    })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())

    context.runtime.emit('application:worker:exited', { application: 'storage', worker: 0 })
    context.runtime.startApplicationProfiling.mockClear()
    context.runtime.stopApplicationProfiling.mockClear()

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [],
    })
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith(
        'storage:0',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )
    context.runtime.startApplicationProfiling.mockClear()
    context.runtime.stopApplicationProfiling.mockClear()

    const emitDelay = (offset: number) =>
      context.runtime.emit('application:worker:health:metrics', {
        id: 'storage:0',
        application: 'storage',
        worker: 0,
        healthSignals: [{ type: 'eventLoopDelay', p99: 200, timestamp: base + offset }],
      })

    emitDelay(1_000)
    emitDelay(2_000)
    await new Promise((resolve) => setImmediate(resolve))
    expect(context.runtime.stopApplicationProfiling).not.toHaveBeenCalled()
    expect(context.runtime.startApplicationProfiling).not.toHaveBeenCalled()

    emitDelay(3_000)
    await vi.waitFor(() => expect(context.runtime.stopApplicationProfiling).toHaveBeenCalledOnce())
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce()

    await extension?.close()
  })

  it('arms automatic profiling only after three hot delay windows of five', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 1 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()
    const base = Date.parse('2026-07-23T10:00:00.000Z')
    const emit = (p99: number, offset: number) =>
      context.runtime.emit('application:worker:health:metrics', {
        id: 'storage:1',
        application: 'storage',
        worker: 1,
        healthSignals: [{ type: 'eventLoopDelay', p99, timestamp: base + offset }],
      })

    emit(200, 0)
    emit(100, 1_000)
    emit(200, 2_000)
    emit(100, 3_000)
    await new Promise((resolve) => setImmediate(resolve))
    expect(context.runtime.startApplicationProfiling).not.toHaveBeenCalled()
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()

    emit(200, 4_000)
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith('storage:1', {
        type: 'cpu',
        durationMillis: 30_000,
        maxELU: 0.8,
        intervalMicros: 10_000,
      })
    )
    expect(mocks.stores[0].archive).not.toHaveBeenCalled()

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:1',
      application: 'storage',
      worker: 1,
      type: 'cpu',
      timestamp: base + 34_000,
    })

    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    expect(mocks.stores[0].archive).toHaveBeenCalledWith(
      expect.objectContaining({ class: 'auto', reason: 'event-loop-delay' }),
      Buffer.from('profile'),
      { applicationId: 'storage', workerId: '1' }
    )
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenLastCalledWith(
        'storage:1',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )

    await extension?.close()
  })

  it('retries automatic profiling after an armed rotation finds it already stopped', async () => {
    const context = createContext()
    const extension = await setup(context)
    const base = Date.parse('2026-07-23T10:00:00.000Z')
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    context.runtime.startApplicationProfiling.mockClear()

    for (const offset of [0, 1_000, 2_000]) {
      context.runtime.emit('application:worker:health:metrics', {
        id: 'storage:0',
        application: 'storage',
        worker: 0,
        healthSignals: [{ type: 'eventLoopDelay', p99: 200, timestamp: base + offset }],
      })
    }
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith(
        'storage:0',
        expect.not.objectContaining({ eluThreshold: expect.anything() })
      )
    )
    context.runtime.startApplicationProfiling.mockClear()
    context.runtime.stopApplicationProfiling.mockClear()
    const error = profilingNotStartedError()
    context.runtime.stopApplicationProfiling.mockRejectedValueOnce(error)

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: base + 32_000,
    })
    await vi.waitFor(() =>
      expect(mocks.logError).toHaveBeenCalledWith(
        mocks.appLogger,
        'Failed to restore Watt automatic profiling after delay arm',
        expect.objectContaining({ error })
      )
    )
    await new Promise((resolve) => setImmediate(resolve))

    context.runtime.emit('application:worker:health:metrics', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      healthSignals: [],
    })
    await vi.waitFor(() =>
      expect(context.runtime.startApplicationProfiling).toHaveBeenCalledWith(
        'storage:0',
        expect.objectContaining({ eluThreshold: 0.55 })
      )
    )

    await extension?.close()
  })

  it('applies the shared budget cooldown to delay-triggered automatic arming', async () => {
    const context = createContext()
    const extension = await setup(context)
    context.runtime.emit('application:worker:started', { application: 'storage', worker: 0 })
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())
    vi.clearAllMocks()
    context.runtime.stopApplicationProfiling.mockResolvedValueOnce({
      profile: Buffer.from('profile'),
      sampleCount: 1,
    })
    const base = Date.parse('2026-07-23T10:00:00.000Z')
    const severe = (offset: number) =>
      context.runtime.emit('application:worker:health:metrics', {
        id: 'storage:0',
        application: 'storage',
        worker: 0,
        healthSignals: [{ type: 'eventLoopDelay', p99: 2_000, timestamp: base + offset }],
      })

    severe(0)
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce())

    severe(1_000)
    await new Promise((resolve) => setImmediate(resolve))
    expect(mocks.stores[0].archive).toHaveBeenCalledOnce()
    expect(context.runtime.startApplicationProfiling).toHaveBeenCalledOnce()

    await extension?.close()
  })

  it('retrieves and archives completed profiles from the runtime main thread', async () => {
    const context = createContext()
    const extension = await setup(context)
    const completedAt = Date.parse('2026-07-23T10:00:30.000Z')

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: completedAt,
    })

    const store = mocks.stores[0]
    await vi.waitFor(() => expect(store.archive).toHaveBeenCalledOnce())
    expect(context.runtime.getApplicationLastProfile).toHaveBeenCalledWith('storage:0', {
      type: 'cpu',
    })
    expect(store.archive).toHaveBeenCalledWith(
      {
        class: 'auto',
        kind: 'cpu',
        reason: 'watt-health',
        startedAt: new Date('2026-07-23T10:00:00.000Z'),
        durationSeconds: 30,
      },
      Buffer.from('profile'),
      { applicationId: 'storage', workerId: '0' }
    )
    expect(mocks.logInfo).toHaveBeenCalledWith(mocks.appLogger, 'Archived Watt automatic profile', {
      type: 'profiling',
      metadata: JSON.stringify({
        application: 'storage',
        worker: 0,
        preserved: false,
      }),
    })
    expect(context.logger.info).not.toHaveBeenCalled()
    expect(context.logger.error).not.toHaveBeenCalled()

    await extension?.close()
  })

  it('logs archive failures through the structured profiling schema', async () => {
    const context = createContext()
    const error = new Error('archive failed')
    const extension = await setup(context)
    mocks.stores[0].archive.mockRejectedValueOnce(error)

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
    })

    await vi.waitFor(() =>
      expect(mocks.logError).toHaveBeenCalledWith(
        mocks.appLogger,
        'Failed to archive Watt automatic profile',
        {
          type: 'profiling',
          error,
          metadata: JSON.stringify({ application: 'storage', worker: 0 }),
        }
      )
    )

    await extension?.close()
  })

  it('labels overload evidence preserved by the Watt main thread', async () => {
    const context = createContext()
    context.runtime.getApplicationLastProfile.mockResolvedValueOnce({
      profile: Buffer.from('overload-profile'),
      timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
      preserved: true,
    })
    const extension = await setup(context)

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
    })

    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    expect(mocks.stores[0].archive).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'watt-health-overload' }),
      Buffer.from('overload-profile'),
      { applicationId: 'storage', workerId: '0' }
    )

    await extension?.close()
  })

  it('keeps the existing global budget and per-worker cooldown around Watt windows', async () => {
    mocks.config.profilingMaxCapturesPerHour = 2
    const context = createContext()
    const extension = await setup(context)
    const base = Date.parse('2026-07-23T10:00:00.000Z')

    for (const [worker, offset] of [
      [0, 0],
      [0, 1_000],
      [1, 2_000],
      [2, 3_000],
    ] as const) {
      context.runtime.getApplicationLastProfile.mockResolvedValueOnce({
        profile: Buffer.from(`profile-${worker}`),
        timestamp: base + offset,
        preserved: false,
      })
      context.runtime.emit('application:worker:profile:captured', {
        id: `storage:${worker}`,
        application: 'storage',
        worker,
        type: 'cpu',
        timestamp: base + offset,
      })
      await new Promise((resolve) => setImmediate(resolve))
    }

    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledTimes(2))
    expect(context.runtime.getApplicationLastProfile).toHaveBeenCalledTimes(2)

    await extension?.close()
  })

  it('drains uploads and removes listeners before destroying the S3 client', async () => {
    const context = createContext()
    const extension = await setup(context)
    let releaseUpload!: () => void
    mocks.stores[0].archive.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        releaseUpload = resolve
      })
    )

    context.runtime.emit('application:worker:profile:captured', {
      id: 'storage:0',
      application: 'storage',
      worker: 0,
      type: 'cpu',
      timestamp: Date.parse('2026-07-23T10:00:30.000Z'),
    })
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())

    let closed = false
    const close = extension?.close().then(() => {
      closed = true
    })
    await new Promise((resolve) => setImmediate(resolve))
    expect(closed).toBe(false)
    expect(context.runtime.listenerCount('application:worker:started')).toBe(0)
    expect(context.runtime.listenerCount('application:worker:exited')).toBe(0)
    expect(context.runtime.listenerCount('application:worker:profile:captured')).toBe(0)
    expect(context.runtime.listenerCount('application:worker:health:metrics')).toBe(0)

    releaseUpload()
    await close
    expect(mocks.stores[0].destroy).toHaveBeenCalledOnce()
  })

  it('keeps manual triggers available when automatic profiling is disabled', async () => {
    const disabled = createContext()
    mocks.config.profilingAutomaticEnabled = false
    const extension = await setup(disabled)

    expect(mocks.stores).toHaveLength(1)
    expect(disabled.runtime.listenerCount('application:worker:started')).toBe(0)
    expect(disabled.runtime.listenerCount('application:worker:exited')).toBe(1)
    await expect(
      disabled.itc.invoke(manualProfileCaptureMessage, {
        application: 'storage',
        worker: '0',
        type: 'heap',
        seconds: 15,
        reason: 'admin',
      })
    ).resolves.toEqual({ scheduled: true })
    await vi.waitFor(() => expect(mocks.stores[0].archive).toHaveBeenCalledOnce())
    await extension?.close()
  })

  it('stays inactive when its dedicated bucket is missing', async () => {
    const missingBucket = createContext()

    mocks.config.profilingAutomaticEnabled = true
    mocks.config.profilingS3Bucket = undefined
    await expect(setup(missingBucket)).resolves.toBeUndefined()
    expect(mocks.logError).toHaveBeenCalledWith(
      mocks.appLogger,
      'Automatic profiling extension disabled',
      {
        type: 'profiling',
        error: expect.objectContaining({ message: expect.stringContaining('PROFILING_S3_BUCKET') }),
      }
    )
    expect(mocks.stores).toHaveLength(0)
  })
})
