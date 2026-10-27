import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  CHUNK_LOAD_RELOAD_GUARD_MS,
  CHUNK_LOAD_RELOAD_MAX_PER_TAB,
  CHUNK_LOAD_RELOAD_STORAGE_KEY,
  claimChunkLoadReload,
  getChunkLoadReloadDecision,
  isChunkLoadError,
  shouldReloadForChunkError,
} from './chunk-load-error'

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

function reloadState(at: number, count = 1) {
  return JSON.stringify({ at, count })
}

function chunkError() {
  return new TypeError(
    'Failed to fetch dynamically imported module: https://supabase.com/dashboard/assets/database-abc123.js'
  )
}

describe('isChunkLoadError', () => {
  test.each([
    [
      'Chrome',
      new TypeError(
        'Failed to fetch dynamically imported module: https://supabase.com/dashboard/assets/a.js'
      ),
    ],
    [
      'Firefox',
      new TypeError(
        'error loading dynamically imported module: https://supabase.com/dashboard/assets/a.js'
      ),
    ],
    ['Safari / WebKit', new TypeError('Importing a module script failed.')],
    ['Vite CSS preload', new Error('Unable to preload CSS for /dashboard/assets/a.css')],
    ['webpack JS chunk', new Error('Loading chunk 1234 failed.\n(error: https://x/1234.js)')],
    ['webpack CSS chunk', new Error('Loading CSS chunk 5678 failed.\n(/_next/a.css)')],
    ['ChunkLoadError name', Object.assign(new Error('something else'), { name: 'ChunkLoadError' })],
    ['plain object', { message: 'Importing a module script failed.' }],
  ])('detects %s', (_label, error) => {
    expect(isChunkLoadError(error)).toBe(true)
  })

  test.each([
    ['generic error', new Error('Cannot read properties of undefined')],
    ['network fetch', new TypeError('Failed to fetch')],
    ['DOM error', new Error("Failed to execute 'removeChild' on 'Node'")],
    ['string', 'Importing a module script failed.'],
    ['null', null],
    ['undefined', undefined],
    ['non-string message', { message: 42 }],
  ])('ignores %s', (_label, error) => {
    expect(isChunkLoadError(error)).toBe(false)
  })
})

describe('shouldReloadForChunkError', () => {
  const now = 1_700_000_000_000

  test.each([
    ['no previous reload', null, true],
    ['reload just now', now, false],
    ['reload inside the window', now - CHUNK_LOAD_RELOAD_GUARD_MS + 1, false],
    ['reload exactly at the window edge', now - CHUNK_LOAD_RELOAD_GUARD_MS, true],
    ['reload long ago', now - 60 * 60 * 1000, true],
    ['reload in the future (clock skew)', now + 5_000, false],
  ])('%s', (_label, lastReloadAt, expected) => {
    expect(shouldReloadForChunkError({ now, lastReloadAt })).toBe(expected)
  })

  test('respects a custom window', () => {
    expect(shouldReloadForChunkError({ now, lastReloadAt: now - 1_000, guardMs: 500 })).toBe(true)
  })
})

describe('claimChunkLoadReload', () => {
  const now = 1_700_000_000_000

  test('reloads and records the time when there is no previous reload', () => {
    const storage = createStorage()
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(true)
    expect(storage.values.get(CHUNK_LOAD_RELOAD_STORAGE_KEY)).toBe(reloadState(now, 1))
  })

  test('does not reload for non-chunk errors and leaves storage alone', () => {
    const storage = createStorage()
    expect(claimChunkLoadReload(new Error('boom'), { storage, now })).toBe(false)
    expect(storage.values.size).toBe(0)
  })

  test('falls through to the error UI when a reload happened within the window', () => {
    const storage = createStorage({ [CHUNK_LOAD_RELOAD_STORAGE_KEY]: reloadState(now - 1_000) })
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(false)
    expect(storage.values.get(CHUNK_LOAD_RELOAD_STORAGE_KEY)).toBe(reloadState(now - 1_000))
  })

  test('reloads again for the same message once the window has passed', () => {
    const storage = createStorage()
    const safariError = () => new TypeError('Importing a module script failed.')

    expect(claimChunkLoadReload(safariError(), { storage, now })).toBe(true)
    expect(claimChunkLoadReload(safariError(), { storage, now: now + 1_000 })).toBe(false)
    expect(
      claimChunkLoadReload(safariError(), { storage, now: now + CHUNK_LOAD_RELOAD_GUARD_MS })
    ).toBe(true)
  })

  test.each([
    ['not JSON', 'not-a-number'],
    ['wrong shape', JSON.stringify({ at: 'yesterday', count: 1 })],
    ['negative count', JSON.stringify({ at: 0, count: -1 })],
  ])('treats a malformed stored value (%s) as no previous reload', (_label, raw) => {
    const storage = createStorage({ [CHUNK_LOAD_RELOAD_STORAGE_KEY]: raw })
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(true)
    expect(storage.values.get(CHUNK_LOAD_RELOAD_STORAGE_KEY)).toBe(reloadState(now, 1))
  })

  test('counts reloads and stops at the per-tab cap, even outside the window', () => {
    const storage = createStorage()
    let time = now
    for (let i = 1; i <= CHUNK_LOAD_RELOAD_MAX_PER_TAB; i++) {
      expect(claimChunkLoadReload(chunkError(), { storage, now: time })).toBe(true)
      expect(storage.values.get(CHUNK_LOAD_RELOAD_STORAGE_KEY)).toBe(reloadState(time, i))
      time += CHUNK_LOAD_RELOAD_GUARD_MS
    }
    expect(claimChunkLoadReload(chunkError(), { storage, now: time + 60 * 60 * 1000 })).toBe(false)
  })

  test('does not reload when storage silently drops the write', () => {
    const storage = { getItem: () => null, setItem: vi.fn() }
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(false)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  test('does not reload when storage cannot be read', () => {
    const storage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: vi.fn(),
    }
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  test('does not reload when the guard cannot be written', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(claimChunkLoadReload(chunkError(), { storage, now })).toBe(false)
  })

  test('does not reload without storage (SSR)', () => {
    expect(claimChunkLoadReload(chunkError(), { storage: undefined, now })).toBe(false)
  })
})

describe('getChunkLoadReloadDecision', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('returns false on the server', () => {
    expect(typeof window).toBe('undefined')
    expect(getChunkLoadReloadDecision(chunkError())).toBe(false)
  })

  test('returns the same decision for the same error object and claims the guard once', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)
    const storage = createStorage()
    const setItem = vi.spyOn(storage, 'setItem')
    vi.stubGlobal('window', { sessionStorage: storage })

    const error = chunkError()
    expect(getChunkLoadReloadDecision(error)).toBe(true)
    expect(getChunkLoadReloadDecision(error)).toBe(true)
    expect(setItem).toHaveBeenCalledTimes(1)

    // A different error inside the window is guarded
    expect(getChunkLoadReloadDecision(chunkError())).toBe(false)
  })

  test('re-evaluates a refused error object once the window has passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)
    vi.stubGlobal('window', { sessionStorage: createStorage() })

    expect(getChunkLoadReloadDecision(chunkError())).toBe(true)

    // A retry rethrows the same error object (React.lazy caches the rejection)
    const retried = chunkError()
    expect(getChunkLoadReloadDecision(retried)).toBe(false)
    expect(getChunkLoadReloadDecision(retried)).toBe(false)

    vi.advanceTimersByTime(CHUNK_LOAD_RELOAD_GUARD_MS)
    expect(getChunkLoadReloadDecision(retried)).toBe(true)
  })

  test('returns false when sessionStorage access throws', () => {
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('SecurityError')
      },
    })
    expect(getChunkLoadReloadDecision(chunkError())).toBe(false)
  })

  test('returns false for non-object errors', () => {
    expect(getChunkLoadReloadDecision('Importing a module script failed.')).toBe(false)
  })
})
