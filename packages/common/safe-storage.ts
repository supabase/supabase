export type StorageKind = 'local' | 'session'

// [Ali] Dedupe warnings so a fully-blocked environment doesn't flood the console with
// the same message on every read/write. Keyed by kind + action + storage key.
const warnedKeys = new Set<string>()

function reportFailure(kind: StorageKind, action: string, key: string, error: unknown) {
  const dedupeKey = `${kind}:${action}:${key}`
  if (warnedKeys.has(dedupeKey)) return
  warnedKeys.add(dedupeKey)

  console.warn(
    `[safe-storage] ${kind}Storage.${action}("${key}") failed; continuing without persistence.`,
    error
  )
}

function getBackingStore(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function createSafeStorage(kind: StorageKind) {
  return {
    getItem(key: string): string | null {
      const store = getBackingStore(kind)
      if (store === null) return null
      try {
        return store.getItem(key)
      } catch (error) {
        reportFailure(kind, 'getItem', key, error)
        return null
      }
    },

    setItem(key: string, value: string): void {
      const store = getBackingStore(kind)
      if (store === null) return
      try {
        store.setItem(key, value)
      } catch (error) {
        reportFailure(kind, 'setItem', key, error)
      }
    },

    removeItem(key: string): void {
      const store = getBackingStore(kind)
      if (store === null) return
      try {
        store.removeItem(key)
      } catch (error) {
        reportFailure(kind, 'removeItem', key, error)
      }
    },

    keys(): string[] {
      const store = getBackingStore(kind)
      if (store === null) return []
      try {
        return Object.keys(store)
      } catch (error) {
        reportFailure(kind, 'keys', '*', error)
        return []
      }
    },

    clear(): void {
      const store = getBackingStore(kind)
      if (store === null) return
      try {
        store.clear()
      } catch (error) {
        reportFailure(kind, 'clear', '*', error)
      }
    },
  }
}

export const safeLocalStorage = createSafeStorage('local')
export const safeSessionStorage = createSafeStorage('session')
