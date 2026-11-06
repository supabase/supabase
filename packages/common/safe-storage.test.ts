// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { safeLocalStorage, safeSessionStorage } from './safe-storage'

type StorageName = 'localStorage' | 'sessionStorage'

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  const methods = {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    },
  }

  return new Proxy(methods as unknown as Storage, {
    ownKeys: () => Array.from(data.keys()),
    getOwnPropertyDescriptor: (_target, prop) =>
      data.has(prop as string)
        ? { enumerable: true, configurable: true, value: data.get(prop as string) }
        : undefined,
    get: (_target, prop) => (prop in methods ? (methods as any)[prop] : data.get(prop as string)),
  })
}

function throwingStorage(): Storage {
  return new Proxy({} as Storage, {
    get() {
      throw new DOMException('storage blocked', 'SecurityError')
    },
    ownKeys() {
      throw new DOMException('storage blocked', 'SecurityError')
    },
  })
}

function installStorage(name: StorageName, value: Storage) {
  Object.defineProperty(window, name, { value, configurable: true, writable: true })
}

// Make even reading `window.localStorage` throw (sandboxed iframe, disabled storage, etc)
function installUnavailableStorage(name: StorageName) {
  Object.defineProperty(window, name, {
    configurable: true,
    get() {
      throw new Error('storage access denied')
    },
  })
}

beforeEach(() => {
  installStorage('localStorage', createMemoryStorage())
  installStorage('sessionStorage', createMemoryStorage())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('safeLocalStorage', () => {
  describe('happy path', () => {
    it('stores and retrieves a value', () => {
      safeLocalStorage.setItem('greeting', 'hello')
      expect(safeLocalStorage.getItem('greeting')).toBe('hello')
    })

    it('returns null for a missing key', () => {
      expect(safeLocalStorage.getItem('does-not-exist')).toBeNull()
    })

    it('removes a value', () => {
      safeLocalStorage.setItem('temp', 'value')
      safeLocalStorage.removeItem('temp')
      expect(safeLocalStorage.getItem('temp')).toBeNull()
    })

    it('lists all keys', () => {
      safeLocalStorage.setItem('a', '1')
      safeLocalStorage.setItem('b', '2')
      const keys = safeLocalStorage.keys()
      expect(keys).toHaveLength(2)
      expect(keys).toEqual(expect.arrayContaining(['a', 'b']))
    })

    it('clears all keys', () => {
      safeLocalStorage.setItem('a', '1')
      safeLocalStorage.setItem('b', '2')
      safeLocalStorage.clear()
      expect(safeLocalStorage.keys()).toHaveLength(0)
    })
  })

  describe('return types match the native Storage API', () => {
    it('write methods return undefined (void)', () => {
      expect(safeLocalStorage.setItem('k', 'v')).toBeUndefined()
      expect(safeLocalStorage.removeItem('k')).toBeUndefined()
      expect(safeLocalStorage.clear()).toBeUndefined()
    })
  })

  describe('when storage methods throw', () => {
    beforeEach(() => {
      installStorage('localStorage', throwingStorage())
    })

    it('getItem returns null and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(safeLocalStorage.getItem('fail-get')).toBeNull()
      expect(warn).toHaveBeenCalledOnce()
    })

    it('setItem swallows the error and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => safeLocalStorage.setItem('fail-set', 'v')).not.toThrow()
      expect(warn).toHaveBeenCalledOnce()
    })

    it('removeItem swallows the error and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => safeLocalStorage.removeItem('fail-remove')).not.toThrow()
      expect(warn).toHaveBeenCalledOnce()
    })

    it('keys returns an empty array and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(safeLocalStorage.keys()).toEqual([])
      expect(warn).toHaveBeenCalledOnce()
    })

    it('clear swallows the error and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => safeLocalStorage.clear()).not.toThrow()
      expect(warn).toHaveBeenCalledOnce()
    })

    it('warns only once per key+action (dedupes repeated failures)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      safeLocalStorage.setItem('dedupe-key', 'a')
      safeLocalStorage.setItem('dedupe-key', 'b')
      safeLocalStorage.setItem('dedupe-key', 'c')
      expect(warn).toHaveBeenCalledOnce()
    })
  })

  describe('when storage is entirely unavailable', () => {
    beforeEach(() => {
      installUnavailableStorage('localStorage')
    })

    it('returns safe defaults without warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(safeLocalStorage.getItem('x')).toBeNull()
      expect(safeLocalStorage.keys()).toEqual([])
      expect(() => safeLocalStorage.setItem('x', 'y')).not.toThrow()
      expect(() => safeLocalStorage.removeItem('x')).not.toThrow()
      expect(() => safeLocalStorage.clear()).not.toThrow()
      // Unavailable storage is an expected condition, not a failure to report.
      expect(warn).not.toHaveBeenCalled()
    })
  })
})

describe('safeSessionStorage', () => {
  it('reads and writes independently from localStorage', () => {
    safeSessionStorage.setItem('session-key', 'session-value')
    expect(safeSessionStorage.getItem('session-key')).toBe('session-value')
    // Not visible to localStorage.
    expect(safeLocalStorage.getItem('session-key')).toBeNull()
  })

  it('swallows errors when session storage methods throw', () => {
    installStorage('sessionStorage', throwingStorage())
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(safeSessionStorage.getItem('session-fail')).toBeNull()
    expect(() => safeSessionStorage.setItem('session-fail', 'v')).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })
})
