import { afterEach, describe, expect, it, vi } from 'vitest'

import { isAuthStorageAvailable } from './auth-browser-support'

describe('isAuthStorageAvailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when localStorage is writable', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    } as Storage)

    expect(isAuthStorageAvailable()).toBe(true)
  })

  it('returns false when localStorage throws (blocked third-party storage)', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new DOMException('Access denied')
      },
      removeItem: () => {},
    } as unknown as Storage)

    expect(isAuthStorageAvailable()).toBe(false)
  })

  it('returns false when localStorage is missing', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(isAuthStorageAvailable()).toBe(false)
  })
})
