import type { CreationCall } from 'surfaces/project'

/**
 * A tool call a view follows from before its result arrives: where the call is, its
 * arguments once the host sends them, and what the host lets the view do.
 */
export interface ToolCallSnapshot<T> {
  call: CreationCall<T>
  /** Arguments of the tool call, once received. */
  input?: Record<string, unknown>
  /** False until the host handshake completes; the capabilities are unknown until then. */
  isConnected: boolean
  /** Whether the host proxies tool calls, so the view can read more than its own result. */
  canCallTools: boolean
  canOpenLinks: boolean
}

/** For `useSyncExternalStore`. */
export interface ToolCallStore<T> {
  subscribe(onChange: () => void): () => void
  getSnapshot(): ToolCallSnapshot<T>
}

/** A tool call's snapshot and the way to change it. The host connection, previews and tests feed it. */
export function createToolCallStore<T>(initial: Partial<ToolCallSnapshot<T>> = {}) {
  let snapshot: ToolCallSnapshot<T> = {
    call: { status: 'loading' },
    isConnected: false,
    canCallTools: false,
    canOpenLinks: false,
    ...initial,
  }
  const listeners = new Set<() => void>()
  const store: ToolCallStore<T> = {
    subscribe(onChange) {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    getSnapshot: () => snapshot,
  }
  return {
    store,
    update(change: Partial<ToolCallSnapshot<T>>) {
      snapshot = { ...snapshot, ...change }
      for (const listener of listeners) listener()
    },
  }
}
