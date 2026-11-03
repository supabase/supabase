import { useSyncExternalStore } from 'react'

export type MemoryCommitmentPreview = 'default' | 'warn' | 'problematic' | 'severe'

const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_ENABLED = env === 'local' || env === 'staging'
const overrides = new Map<string, MemoryCommitmentPreview>()
const listeners = new Set<() => void>()

export function getMemoryCommitmentPreview(
  projectRef: string | undefined
): MemoryCommitmentPreview {
  if (!IS_ENABLED || !projectRef) return 'default'
  return overrides.get(projectRef) ?? 'default'
}

export function setMemoryCommitmentPreview(projectRef: string, preview: MemoryCommitmentPreview) {
  if (!IS_ENABLED || !projectRef || getMemoryCommitmentPreview(projectRef) === preview) return
  if (preview === 'default') overrides.delete(projectRef)
  else overrides.set(projectRef, preview)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  if (!IS_ENABLED) return () => {}
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useMemoryCommitmentPreview(projectRef: string | undefined) {
  return useSyncExternalStore<MemoryCommitmentPreview>(
    subscribe,
    () => getMemoryCommitmentPreview(projectRef),
    () => 'default'
  )
}
