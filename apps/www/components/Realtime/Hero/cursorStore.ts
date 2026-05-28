import type { CursorPayload } from './types'

export type CursorStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Record<string, CursorPayload>
  getServerSnapshot: () => Record<string, CursorPayload>
  setCursor: (id: string, payload: CursorPayload) => void
  removeCursor: (id: string) => void
  clear: () => void
}

const EMPTY_CURSORS: Record<string, CursorPayload> = {}

export function createCursorStore(): CursorStore {
  let cursors = EMPTY_CURSORS
  const listeners = new Set<() => void>()

  const emit = () => {
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => cursors,
    getServerSnapshot: () => EMPTY_CURSORS,
    setCursor: (id, payload) => {
      const prev = cursors[id]
      if (
        prev &&
        prev.position.x === payload.position.x &&
        prev.position.y === payload.position.y
      ) {
        if (Date.now() - prev.timestamp > 1000) {
          cursors = { ...cursors, [id]: { ...payload, timestamp: Date.now() } }
          emit()
        }
        return
      }

      cursors = { ...cursors, [id]: { ...payload, timestamp: Date.now() } }
      emit()
    },
    removeCursor: (id) => {
      if (!cursors[id]) return
      const next = { ...cursors }
      delete next[id]
      cursors = next
      emit()
    },
    clear: () => {
      if (cursors === EMPTY_CURSORS) return
      cursors = EMPTY_CURSORS
      emit()
    },
  }
}
