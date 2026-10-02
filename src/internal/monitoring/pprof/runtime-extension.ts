import { setTimeout as wait } from 'node:timers/promises'
import type {
  HealthMetricsEvent,
  ProfileCapturedEvent,
  RuntimeExtensionContext,
  WorkerLifecycleEvent,
} from '@platformatic/runtime'
import { getConfig } from '../../../config'
import { logger, logSchema } from '../logger'
import { createProfileStore } from './store'
import type { ProfileClass } from './store-key'
import {
  type ManualProfileCaptureRequest,
  type ManualProfileCaptureResponse,
  manualProfileCaptureMessage,
} from './trigger'

const application = 'storage'

class CaptureBudget {
  private readonly captures: number[] = []
  private readonly cooldownUntil = new Map<string, number>()

  constructor(
    private readonly maxCapturesPerHour: number,
    private readonly cooldownMillis: number
  ) {}

  reserve(target: string, now: number) {
    while (this.captures.length > 0 && now - this.captures[0] >= 3_600_000) {
      this.captures.shift()
    }
    if (
      this.captures.length >= this.maxCapturesPerHour ||
      now < (this.cooldownUntil.get(target) ?? 0)
    ) {
      return false
    }

    this.captures.push(now)
    this.cooldownUntil.set(target, now + this.cooldownMillis)
    return true
  }

  forgetTarget(target: string) {
    this.cooldownUntil.delete(target)
  }
}

function isAbortError(error: unknown) {
  return (
    error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError'
  )
}

function isProfilingNotStartedError(error: unknown) {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'PLT_PPROF_PROFILING_NOT_STARTED'
  )
}

async function setup({ runtime, itc }: RuntimeExtensionContext) {
  const {
    profilingAutomaticEnabled,
    profilingCaptureSeconds,
    profilingCooldownSeconds,
    profilingCpuIntervalMicros,
    profilingMaxCapturesPerHour,
    profilingMaxElu,
    profilingS3Bucket,
    profilingSevereDelayP99Ms,
    profilingTriggerDelayP99Ms,
    profilingTriggerElu,
  } = getConfig()

  if (!profilingS3Bucket) {
    if (profilingAutomaticEnabled) {
      logSchema.error(logger, 'Automatic profiling extension disabled', {
        type: 'profiling',
        error: new Error('PROFILING_S3_BUCKET is required when automatic profiling is enabled'),
      })
    }
    return
  }

  const durationMillis = profilingCaptureSeconds * 1_000
  const automaticEnabled = profilingAutomaticEnabled && profilingMaxCapturesPerHour > 0
  const automaticOptions = {
    type: 'cpu',
    durationMillis,
    eluThreshold: profilingTriggerElu,
    maxELU: profilingMaxElu,
    intervalMicros: profilingCpuIntervalMicros,
  }
  const armedAutomaticOptions = {
    type: 'cpu',
    durationMillis,
    maxELU: profilingMaxElu,
    intervalMicros: profilingCpuIntervalMicros,
  }
  const budget = new CaptureBudget(profilingMaxCapturesPerHour, profilingCooldownSeconds * 1_000)
  const automaticTargets = new Set<string>()
  const automaticStarts = new Map<string, Promise<boolean>>()
  const delayArms = new Map<string, { armed: boolean; reason: string; triggeredAt: number }>()
  const delayWindows = new Map<string, boolean[]>()
  const collecting = new Set<string>()
  const manualCaptures = new Map<string, AbortController>()
  const tasks = new Set<Promise<unknown>>()
  const store = createProfileStore()
  const shutdown = new AbortController()
  let closing = false

  const stopAutomaticProfiling = async (target: string) => {
    try {
      return await runtime.stopApplicationProfiling(target, {
        type: 'cpu',
        includeSampleCount: true,
      })
    } catch (error) {
      if (isProfilingNotStartedError(error)) {
        automaticTargets.delete(target)
      }
      throw error
    }
  }

  const track = (task: Promise<unknown>) => {
    tasks.add(task)
    void task.finally(() => tasks.delete(task))
  }

  const startAutomaticProfiling = (
    target: string,
    worker: number | string,
    options: Record<string, unknown> = automaticOptions
  ) => {
    if (closing || !automaticEnabled) return Promise.resolve(false)
    const pending = automaticStarts.get(target)
    if (pending) return pending

    const task = (async () => {
      try {
        await runtime.startApplicationProfiling(target, options)
        automaticTargets.add(target)
        return true
      } catch (error) {
        logSchema.error(logger, 'Failed to start Watt automatic profiling', {
          type: 'profiling',
          error,
          metadata: JSON.stringify({ application, worker }),
        })
        return false
      } finally {
        automaticStarts.delete(target)
      }
    })()
    automaticStarts.set(target, task)
    return task
  }

  const onWorkerStarted = (event: WorkerLifecycleEvent) => {
    if (closing || event.application !== application || !automaticEnabled) return
    track(startAutomaticProfiling(`${event.application}:${event.worker}`, event.worker))
  }

  const onWorkerExited = (event: WorkerLifecycleEvent) => {
    if (event.application !== application) return
    const target = `${event.application}:${event.worker}`
    delayArms.delete(target)
    delayWindows.delete(target)
    automaticTargets.delete(target)
    collecting.delete(target)
    for (const type of ['cpu', 'heap']) {
      const captureKey = `${target}:${type}`
      manualCaptures.get(captureKey)?.abort()
      manualCaptures.delete(captureKey)
    }
    budget.forgetTarget(target)
  }

  const onProfileCaptured = (event: ProfileCapturedEvent) => {
    const delayArm = delayArms.get(event.id)
    const delayReason = delayArm?.armed ? delayArm.reason : undefined
    if (
      closing ||
      !automaticEnabled ||
      event.application !== application ||
      event.type !== 'cpu' ||
      collecting.has(event.id) ||
      manualCaptures.has(`${event.id}:cpu`) ||
      delayArm?.armed === false ||
      (!delayReason && !budget.reserve(event.id, event.timestamp))
    ) {
      return
    }

    collecting.add(event.id)
    const logMetadata = {
      application: event.application,
      worker: event.worker,
    }
    const task = (async () => {
      try {
        const { profile, timestamp, preserved } = await runtime.getApplicationLastProfile(
          event.id,
          { type: event.type }
        )
        const completedAt = timestamp ?? event.timestamp
        await store.archive(
          {
            class: 'auto',
            kind: 'cpu',
            reason: delayReason ?? (preserved ? 'watt-health-overload' : 'watt-health'),
            startedAt: new Date(completedAt - durationMillis),
            durationSeconds: profilingCaptureSeconds,
          },
          Buffer.from(profile),
          {
            applicationId: event.application,
            workerId: `${event.worker}`,
          }
        )
        logSchema.info(logger, 'Archived Watt automatic profile', {
          type: 'profiling',
          metadata: JSON.stringify({ ...logMetadata, preserved }),
        })
      } catch (error) {
        logSchema.error(logger, 'Failed to archive Watt automatic profile', {
          type: 'profiling',
          error,
          metadata: JSON.stringify(logMetadata),
        })
      } finally {
        if (delayReason) {
          try {
            await stopAutomaticProfiling(event.id)
            automaticTargets.delete(event.id)
            if (!closing) {
              await startAutomaticProfiling(event.id, event.worker)
            }
          } catch (error) {
            if (!isAbortError(error)) {
              logSchema.error(
                logger,
                'Failed to restore Watt automatic profiling after delay arm',
                {
                  type: 'profiling',
                  error,
                  metadata: JSON.stringify({
                    application: event.application,
                    worker: event.worker,
                  }),
                }
              )
            }
          } finally {
            delayArms.delete(event.id)
          }
        }
        collecting.delete(event.id)
      }
    })()
    track(task)
  }

  const captureProfile = async (
    request: ManualProfileCaptureRequest,
    profileClass: ProfileClass,
    capture: AbortController
  ) => {
    const target = `${request.application}:${request.worker}`
    const captureKey = `${target}:${request.type}`
    const logMetadata = {
      application: request.application,
      worker: request.worker,
      type: request.type,
      reason: request.reason,
      class: profileClass,
    }
    let automaticWasRunning = false
    let automaticStopped = false
    let manualStarted = false
    let manualStopped = false

    try {
      if (request.type === 'cpu') {
        await automaticStarts.get(target)
        capture.signal.throwIfAborted()
        automaticWasRunning = automaticTargets.has(target)
        if (automaticWasRunning) {
          await stopAutomaticProfiling(target)
          automaticTargets.delete(target)
          automaticStopped = true
        }
      }

      capture.signal.throwIfAborted()
      const startedAt = new Date()
      await runtime.startApplicationProfiling(target, {
        type: request.type,
        ...(request.type === 'cpu' ? { intervalMicros: profilingCpuIntervalMicros } : {}),
      })
      manualStarted = true
      await wait(request.seconds * 1_000, undefined, {
        signal: AbortSignal.any([shutdown.signal, capture.signal]),
      })
      const profile = await runtime.stopApplicationProfiling(target, { type: request.type })
      manualStopped = true

      await store.archive(
        {
          class: profileClass,
          kind: request.type,
          reason: request.reason,
          startedAt,
          durationSeconds: request.seconds,
        },
        Buffer.from(profile),
        {
          applicationId: request.application,
          workerId: `${request.worker}`,
        }
      )
      logSchema.info(logger, 'Archived Watt requested profile', {
        type: 'profiling',
        metadata: JSON.stringify(logMetadata),
      })
    } catch (error) {
      if (!isAbortError(error)) {
        logSchema.error(logger, 'Failed to capture or archive Watt requested profile', {
          type: 'profiling',
          error,
          metadata: JSON.stringify(logMetadata),
        })
      }
    } finally {
      if (manualStarted && !manualStopped && !capture.signal.aborted) {
        try {
          await runtime.stopApplicationProfiling(target, { type: request.type })
        } catch (error) {
          if (!isAbortError(error)) {
            logSchema.error(logger, 'Failed to stop Watt requested profiling', {
              type: 'profiling',
              error,
              metadata: JSON.stringify(logMetadata),
            })
          }
        }
      }
      if (automaticWasRunning && automaticStopped && !closing && !capture.signal.aborted) {
        await startAutomaticProfiling(target, request.worker)
      }
      if (manualCaptures.get(captureKey) === capture) {
        manualCaptures.delete(captureKey)
      }
    }
  }

  // Severe delay signals preserve the current window containing the stall
  // when Watt returns one; an empty gated window falls back to the next window.
  // Recurring delay signals arm automatic rotation without the lower ELU
  // trigger so the next complete window captures the continuing incident.
  const captureDelayProfile = async (
    target: string,
    worker: number | string,
    arm: { armed: boolean; reason: string; triggeredAt: number }
  ) => {
    await automaticStarts.get(target)
    if (closing) {
      delayArms.delete(target)
      return
    }

    try {
      if (!automaticTargets.has(target)) {
        throw new Error('Watt automatic profiling is not active for this worker')
      }
      const { profile, sampleCount } = await stopAutomaticProfiling(target)
      automaticTargets.delete(target)
      if (arm.reason === 'event-loop-delay-severe' && sampleCount > 0) {
        try {
          await store.archive(
            {
              class: 'auto',
              kind: 'cpu',
              reason: arm.reason,
              startedAt: new Date(arm.triggeredAt - durationMillis),
              durationSeconds: profilingCaptureSeconds,
            },
            Buffer.from(profile),
            {
              applicationId: application,
              workerId: `${worker}`,
            }
          )
          logSchema.info(logger, 'Archived Watt severe-delay profile', {
            type: 'profiling',
            metadata: JSON.stringify({ application, worker }),
          })
        } catch (error) {
          logSchema.error(logger, 'Failed to archive Watt severe-delay profile', {
            type: 'profiling',
            error,
            metadata: JSON.stringify({ application, worker }),
          })
        } finally {
          delayArms.delete(target)
          if (!closing) {
            await startAutomaticProfiling(target, worker)
          }
        }
        return
      }
      if (!(await startAutomaticProfiling(target, worker, armedAutomaticOptions))) {
        throw new Error('Failed to arm Watt automatic profiling')
      }
      arm.armed = true
      logSchema.info(logger, 'Armed Watt automatic profiling after event loop delay', {
        type: 'profiling',
        metadata: JSON.stringify({ application, worker, reason: arm.reason }),
      })
    } catch (error) {
      delayArms.delete(target)
      logSchema.error(logger, 'Failed to arm Watt automatic profiling after event loop delay', {
        type: 'profiling',
        error,
        metadata: JSON.stringify({ application, worker, reason: arm.reason }),
      })
      if (!closing && !automaticTargets.has(target)) {
        await startAutomaticProfiling(target, worker)
      }
    }
  }

  const onHealthMetrics = (event: HealthMetricsEvent) => {
    if (closing || event.application !== application) return
    const captureKey = `${event.id}:cpu`
    if (
      automaticEnabled &&
      !automaticTargets.has(event.id) &&
      !automaticStarts.has(event.id) &&
      !delayArms.has(event.id) &&
      !collecting.has(event.id) &&
      !manualCaptures.has(captureKey)
    ) {
      track(startAutomaticProfiling(event.id, event.worker))
    }
    const windows = delayWindows.get(event.id) ?? []
    delayWindows.set(event.id, windows)
    let trigger: { reason: string; triggeredAt: number } | undefined
    for (const signal of event.healthSignals) {
      if (signal.type !== 'eventLoopDelay' || typeof signal.p99 !== 'number') continue
      windows.push(signal.p99 >= profilingTriggerDelayP99Ms)
      if (windows.length > 5) windows.shift()
      let reason: string | undefined
      if (signal.p99 >= profilingSevereDelayP99Ms) reason = 'event-loop-delay-severe'
      else if (windows.filter(Boolean).length >= 3) reason = 'event-loop-delay'
      if (
        reason &&
        (!trigger ||
          (trigger.reason === 'event-loop-delay' && reason === 'event-loop-delay-severe'))
      ) {
        trigger = { reason, triggeredAt: signal.timestamp ?? Date.now() }
      }
    }
    if (
      !trigger ||
      collecting.has(event.id) ||
      delayArms.has(event.id) ||
      manualCaptures.has(captureKey) ||
      !budget.reserve(event.id, trigger.triggeredAt)
    ) {
      return
    }
    const arm = { armed: false, reason: trigger.reason, triggeredAt: trigger.triggeredAt }
    delayArms.set(event.id, arm)
    track(captureDelayProfile(event.id, event.worker, arm))
  }

  itc.handle(
    manualProfileCaptureMessage,
    (request: ManualProfileCaptureRequest): ManualProfileCaptureResponse => {
      const worker = `${request?.worker ?? ''}`
      const target = `${request?.application}:${worker}`
      const captureKey = `${target}:${request?.type}`
      if (
        closing ||
        request?.application !== application ||
        !/^\d+$/.test(worker) ||
        (request?.type !== 'cpu' && request?.type !== 'heap') ||
        !Number.isSafeInteger(request?.seconds) ||
        request.seconds < 1 ||
        request.seconds > 300 ||
        typeof request?.reason !== 'string' ||
        request.reason.length === 0 ||
        request.reason.length > 100
      ) {
        return { scheduled: false, reason: 'unavailable' }
      }
      if (
        (request.type === 'cpu' && (collecting.has(target) || delayArms.has(target))) ||
        manualCaptures.has(captureKey)
      ) {
        return { scheduled: false, reason: 'busy' }
      }

      const capture = new AbortController()
      manualCaptures.set(captureKey, capture)
      track(captureProfile({ ...request, worker }, 'manual', capture))
      return { scheduled: true }
    }
  )

  runtime.on('application:worker:exited', onWorkerExited)
  if (automaticEnabled) {
    runtime.on('application:worker:started', onWorkerStarted)
    runtime.on('application:worker:profile:captured', onProfileCaptured)
    runtime.on('application:worker:health:metrics', onHealthMetrics)
  }

  return {
    async close() {
      closing = true
      shutdown.abort()
      runtime.off('application:worker:started', onWorkerStarted)
      runtime.off('application:worker:exited', onWorkerExited)
      runtime.off('application:worker:profile:captured', onProfileCaptured)
      runtime.off('application:worker:health:metrics', onHealthMetrics)
      await Promise.allSettled([...tasks])
      store.destroy()
    },
  }
}

// Watt dynamically imports CommonJS extensions and expects module.exports itself
// to be the setup function. This compiles to that shape instead of exports.default.
export = setup
