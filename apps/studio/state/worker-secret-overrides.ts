import { proxy, useSnapshot } from 'valtio'

/**
 * Per-worker secret overrides — prototype-only client state.
 *
 * Rationale: the current project Secrets API (used by Edge Functions and by
 * Workers at alpha) exposes a single project pool. A future Workers Secrets
 * API will add fine-grained per-worker scoping on top. Until that ships, this
 * store previews that experience client-side:
 *
 *   - `overrides[name] = value` overrides a project secret's value for this
 *     worker only.
 *   - `denied` is a list of project secret names this worker cannot read.
 *
 * State is keyed by `${projectRef}:${workerName}` (the v2 API keys workers by
 * name, not id) and lives in memory only — it resets on reload.
 */

export interface WorkerSecretOverride {
  name: string
  value: string
  updatedAt: string
}

interface WorkerOverrideRecord {
  overrides: Record<string, WorkerSecretOverride>
  denied: string[]
}

interface OverridesState {
  byWorker: Record<string, WorkerOverrideRecord>
}

const overridesState = proxy<OverridesState>({ byWorker: {} })

const isBrowser = typeof window !== 'undefined'
const nowIso = () =>
  isBrowser ? new Date().toISOString() : '2026-08-10T09:00:00.000Z'

const keyFor = (projectRef: string, workerName: string) => `${projectRef}:${workerName}`

const ensureRecord = (projectRef: string, workerName: string): WorkerOverrideRecord => {
  const k = keyFor(projectRef, workerName)
  if (!overridesState.byWorker[k]) {
    overridesState.byWorker[k] = { overrides: {}, denied: [] }
  }
  return overridesState.byWorker[k]
}

const emptyRecord: WorkerOverrideRecord = { overrides: {}, denied: [] }

export function useWorkerOverrides(
  projectRef: string | undefined,
  workerName: string | undefined
): WorkerOverrideRecord {
  const snap = useSnapshot(overridesState)
  if (!projectRef || !workerName) return emptyRecord
  return (snap.byWorker[keyFor(projectRef, workerName)] ?? emptyRecord) as WorkerOverrideRecord
}

/** Set (or replace) a per-worker override / worker-only secret by name. */
export function setWorkerOverride(
  projectRef: string,
  workerName: string,
  secret: { name: string; value: string }
) {
  const record = ensureRecord(projectRef, workerName)
  record.overrides[secret.name] = {
    name: secret.name,
    value: secret.value,
    updatedAt: nowIso(),
  }
  // Adding an override implicitly re-allows a previously denied secret.
  record.denied = record.denied.filter((n) => n !== secret.name)
}

/** Remove a per-worker override (falls back to the project value). */
export function removeWorkerOverride(projectRef: string, workerName: string, name: string) {
  const record = overridesState.byWorker[keyFor(projectRef, workerName)]
  if (!record) return
  delete record.overrides[name]
}

/** Deny (or restore) access to a project secret for a specific worker. */
export function setProjectSecretAccess(
  projectRef: string,
  workerName: string,
  name: string,
  allowed: boolean
) {
  const record = ensureRecord(projectRef, workerName)
  const denied = new Set(record.denied)
  if (allowed) denied.delete(name)
  else denied.add(name)
  record.denied = Array.from(denied)
}
