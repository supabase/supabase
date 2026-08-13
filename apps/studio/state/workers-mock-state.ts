import { proxy, snapshot, useSnapshot } from 'valtio'

import {
  WORKERS_INSTANCE_CAP,
  WORKERS_REGION,
} from '@/components/interfaces/Workers/Workers.constants'
import type {
  Worker,
  WorkerAccess,
  WorkerErrorReason,
  WorkerLifecycleEvent,
  WorkerMetrics,
  WorkerRuntime,
  WorkerSize,
  WorkerState,
} from '@/components/interfaces/Workers/Workers.types'

/**
 * Prototype-only in-memory store for the Workers dashboard.
 *
 * There is no Management API for workers yet — this valtio store simulates the
 * lifecycle (deploy → active, suspend/resume, crash, delete) with timers so the
 * dashboard can be demoed end to end. State is keyed by project ref and resets
 * on reload.
 */

// Fixed base timestamp for seed data so SSR and client render identically (no
// hydration mismatch). Runtime-created workers use Date.now() on the client.
const SEED_BASE = new Date('2026-08-10T09:00:00.000Z').getTime()
const seedTime = (minutesAgo: number) => new Date(SEED_BASE - minutesAgo * 60_000).toISOString()

// Timings for simulated lifecycle transitions (ms). Short enough to feel snappy
// in a demo, long enough to read the intermediate state.
const DEPLOY_MS = 2500
const DRAIN_MS = 1800
const RESUME_MS = 1600

let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${(idCounter += 1)}`

const isBrowser = typeof window !== 'undefined'
const nowIso = () => (isBrowser ? new Date().toISOString() : seedTime(0))

interface WorkersProjectState {
  workers: Worker[]
}

interface WorkersState {
  byProject: Record<string, WorkersProjectState>
}

export const workersState = proxy<WorkersState>({
  byProject: {},
})

function seedWorkers(): Worker[] {
  return [
    {
      id: 'wk-embed',
      name: 'embed',
      runtime: 'python',
      size: '4x2',
      access: 'public',
      instances: 2,
      region: WORKERS_REGION,
      state: 'active',
      createdAt: seedTime(60 * 26),
      updatedAt: seedTime(42),
      events: [
        { id: 'ev-embed-1', at: seedTime(60 * 26), level: 'info', message: 'Deploy started' },
        {
          id: 'ev-embed-2',
          at: seedTime(60 * 26 - 1),
          level: 'info',
          message: 'Built image python:3.14-slim',
        },
        {
          id: 'ev-embed-3',
          at: seedTime(60 * 26 - 1),
          level: 'info',
          message: 'Worker active on 2 instances',
        },
      ],
    },
    {
      id: 'wk-resize-images',
      name: 'resize-images',
      runtime: 'node',
      size: '2x1',
      access: 'private',
      instances: 1,
      region: WORKERS_REGION,
      state: 'active',
      createdAt: seedTime(60 * 8),
      updatedAt: seedTime(15),
      events: [
        { id: 'ev-resize-1', at: seedTime(60 * 8), level: 'info', message: 'Deploy started' },
        {
          id: 'ev-resize-2',
          at: seedTime(60 * 8 - 1),
          level: 'info',
          message: 'Worker active on 1 instance',
        },
      ],
    },
    {
      id: 'wk-nightly-report',
      name: 'nightly-report',
      runtime: 'deno',
      size: '2x1',
      access: 'private',
      instances: 1,
      region: WORKERS_REGION,
      state: 'suspended',
      createdAt: seedTime(60 * 72),
      updatedAt: seedTime(60 * 5),
      events: [
        {
          id: 'ev-nightly-1',
          at: seedTime(60 * 5),
          level: 'info',
          message: 'Suspended after idle timeout',
        },
      ],
    },
  ]
}

function getProjectState(projectRef: string): WorkersProjectState {
  if (!workersState.byProject[projectRef]) {
    workersState.byProject[projectRef] = { workers: seedWorkers() }
  }
  return workersState.byProject[projectRef]
}

function findWorker(projectRef: string, id: string): Worker | undefined {
  return workersState.byProject[projectRef]?.workers.find((w) => w.id === id)
}

function appendEvent(worker: Worker, event: Omit<WorkerLifecycleEvent, 'id' | 'at'>) {
  worker.events.push({ id: nextId('ev'), at: nowIso(), ...event })
  worker.updatedAt = nowIso()
}

export interface DeployWorkerInput {
  name: string
  runtime: WorkerRuntime
  size: WorkerSize
  access: WorkerAccess
  instances: number
}

export interface DeployRejection {
  ok: false
  reason: 'cap' | 'duplicate'
  message: string
}

export interface DeploySuccess {
  ok: true
  worker: Worker
}

export type DeployResult = DeploySuccess | DeployRejection

const totalInstances = (workers: Worker[]) =>
  workers
    .filter((w) => w.state !== 'killed')
    .reduce((sum, w) => sum + w.instances, 0)

/**
 * Creates a worker in `deploying` and transitions it to `active` after a short
 * delay. Rejects (without creating) if the project's instance cap would be
 * exceeded or the name already exists.
 */
export function deployWorker(projectRef: string, input: DeployWorkerInput): DeployResult {
  const project = getProjectState(projectRef)

  const duplicate = project.workers.some(
    (w) => w.name === input.name && w.state !== 'killed'
  )
  if (duplicate) {
    return {
      ok: false,
      reason: 'duplicate',
      message: `A worker named "${input.name}" already exists`,
    }
  }

  if (totalInstances(project.workers) + input.instances > WORKERS_INSTANCE_CAP) {
    return {
      ok: false,
      reason: 'cap',
      message: `This project is at the ${WORKERS_INSTANCE_CAP}-instance cap. Reduce instances or delete a worker.`,
    }
  }

  const worker: Worker = {
    id: nextId('wk'),
    name: input.name,
    runtime: input.runtime,
    size: input.size,
    access: input.access,
    instances: input.instances,
    region: WORKERS_REGION,
    state: 'deploying',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    events: [{ id: nextId('ev'), at: nowIso(), level: 'info', message: 'Deploy started' }],
  }
  project.workers.unshift(worker)

  if (isBrowser) {
    window.setTimeout(() => {
      const w = findWorker(projectRef, worker.id)
      if (!w || w.state !== 'deploying') return
      w.state = 'active'
      appendEvent(w, {
        level: 'info',
        message: `Worker active on ${w.instances} instance${w.instances === 1 ? '' : 's'}`,
      })
    }, DEPLOY_MS)
  }

  return { ok: true, worker }
}

export function suspendWorker(projectRef: string, id: string) {
  const worker = findWorker(projectRef, id)
  if (!worker || worker.state !== 'active') return
  worker.state = 'draining'
  appendEvent(worker, { level: 'info', message: 'Draining connections before suspend' })
  if (!isBrowser) return
  window.setTimeout(() => {
    const w = findWorker(projectRef, id)
    if (!w || w.state !== 'draining') return
    w.state = 'suspended'
    appendEvent(w, { level: 'info', message: 'Suspended after drain' })
  }, DRAIN_MS)
}

export function resumeWorker(projectRef: string, id: string) {
  const worker = findWorker(projectRef, id)
  if (!worker || (worker.state !== 'suspended' && worker.state !== 'errored')) return
  worker.state = 'resuming'
  worker.errorReason = undefined
  appendEvent(worker, { level: 'info', message: 'Resuming worker' })
  if (!isBrowser) return
  window.setTimeout(() => {
    const w = findWorker(projectRef, id)
    if (!w || w.state !== 'resuming') return
    w.state = 'active'
    appendEvent(w, { level: 'info', message: `Worker active on ${w.instances} instances` })
  }, RESUME_MS)
}

/** Redeploy from an errored state (Overview "Redeploy" button). */
export function redeployWorker(projectRef: string, id: string) {
  const worker = findWorker(projectRef, id)
  if (!worker) return
  worker.state = 'resuming'
  worker.errorReason = undefined
  appendEvent(worker, { level: 'info', message: 'Redeploy started' })
  if (!isBrowser) return
  window.setTimeout(() => {
    const w = findWorker(projectRef, id)
    if (!w || w.state !== 'resuming') return
    w.state = 'active'
    appendEvent(w, { level: 'info', message: `Worker active on ${w.instances} instances` })
  }, DEPLOY_MS)
}

export function deleteWorker(projectRef: string, id: string) {
  const project = workersState.byProject[projectRef]
  if (!project) return
  project.workers = project.workers.filter((w) => w.id !== id)
}

/** Unhappy path: transition an active worker to `errored` with a reason. */
export function crashWorker(
  projectRef: string,
  id: string,
  reason: Extract<WorkerErrorReason, 'crash' | 'unresponsive'> = 'crash'
) {
  const worker = findWorker(projectRef, id)
  if (!worker) return
  worker.state = 'errored'
  worker.errorReason = reason
  appendEvent(worker, {
    level: 'error',
    reason,
    message:
      reason === 'unresponsive'
        ? 'Health check failed — worker did not respond on $PORT'
        : 'Worker exited with a non-zero status',
  })
}

/** Unhappy path: a deploy that fails during build instead of going active. */
export function failDeploy(
  projectRef: string,
  id: string,
  reason: Extract<WorkerErrorReason, 'build' | 'entrypoint' | 'dependency'> = 'build'
) {
  const worker = findWorker(projectRef, id)
  if (!worker) return
  worker.state = 'errored'
  worker.errorReason = reason
  appendEvent(worker, {
    level: 'error',
    reason,
    message:
      reason === 'dependency'
        ? 'Dependency install failed during build'
        : reason === 'entrypoint'
          ? 'Entrypoint not found'
          : 'Build failed',
  })
}

/**
 * Appends a burst of simulated request events to an active worker (the detail
 * page "Simulate traffic" affordance). Returns the number of requests simulated.
 */
export function simulateTraffic(projectRef: string, id: string): number {
  const worker = findWorker(projectRef, id)
  if (!worker || worker.state !== 'active') return 0
  const requests = 1200 + worker.instances * 240
  appendEvent(worker, {
    level: 'info',
    message: `Simulated ${requests.toLocaleString()} requests across ${worker.instances} instance${
      worker.instances === 1 ? '' : 's'
    }`,
  })
  return requests
}

/** Find a worker by name (detail pages resolve by name, not id). */
export function findWorkerByName(projectRef: string, name: string): Worker | undefined {
  return workersState.byProject[projectRef]?.workers.find((w) => w.name === name)
}

/** Deterministic pseudo-random from a string, so mock metrics don't jitter. */
function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 0xffffffff
}

/**
 * Mock last-24h metrics derived deterministically from the worker's name and
 * state, so the Overview tab is stable across renders.
 */
export function getWorkerMetrics(worker: Pick<Worker, 'name' | 'state' | 'instances'>): WorkerMetrics {
  const seed = hashString(worker.name)
  const base = Math.floor(2000 + seed * 40000) * worker.instances

  if (worker.state === 'errored') {
    const requests = Math.floor(base * 0.4)
    const errors = Math.floor(requests * (0.2 + seed * 0.3))
    return {
      requests24h: requests,
      errors24h: errors,
      errorRate: requests === 0 ? 0 : errors / requests,
      avgLatencyMs: Math.floor(60 + seed * 120),
      p99LatencyMs: Math.floor(400 + seed * 600),
      cpuPercent: Math.floor(10 + seed * 20),
      memoryPercent: Math.floor(30 + seed * 40),
    }
  }

  if (worker.state === 'suspended' || worker.state === 'killed') {
    return {
      requests24h: 0,
      errors24h: 0,
      errorRate: 0,
      avgLatencyMs: 0,
      p99LatencyMs: 0,
      cpuPercent: 0,
      memoryPercent: 0,
    }
  }

  const errors = Math.floor(base * (0.001 + seed * 0.004))
  return {
    requests24h: base,
    errors24h: errors,
    errorRate: base === 0 ? 0 : errors / base,
    avgLatencyMs: Math.floor(24 + seed * 40),
    p99LatencyMs: Math.floor(120 + seed * 180),
    cpuPercent: Math.floor(20 + seed * 45),
    memoryPercent: Math.floor(35 + seed * 45),
  }
}

export const useWorkersSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(workersState, options)

/**
 * Seeds a project's mock workers if not already present. Call from an effect —
 * never during render — since it mutates the valtio proxy.
 */
export function ensureProjectSeeded(projectRef: string | undefined) {
  if (!projectRef) return
  if (!workersState.byProject[projectRef]) getProjectState(projectRef)
}

/**
 * Convenience hook: the worker list for a project. Read-only — pair with
 * `ensureProjectSeeded` in an effect to populate the initial mock data.
 *
 * valtio snapshots are deeply readonly at the type level; the cast keeps
 * consumer components on the plain `Worker` type (they only read, never mutate).
 */
export function useProjectWorkers(projectRef: string | undefined): Worker[] {
  const snap = useSnapshot(workersState)
  if (!projectRef) return []
  return (snap.byProject[projectRef]?.workers ?? []) as Worker[]
}

export function getProjectWorkersSnapshot(projectRef: string): Worker[] {
  getProjectState(projectRef)
  return (snapshot(workersState).byProject[projectRef]?.workers ?? []) as Worker[]
}

export const currentInstancesUsed = (projectRef: string): number => {
  const workers = workersState.byProject[projectRef]?.workers ?? []
  return totalInstances(workers as Worker[])
}
