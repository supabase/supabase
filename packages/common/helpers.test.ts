// @vitest-environment jsdom
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectBrowser, ensurePlatformSuffix, mergeRefs } from './helpers'

// helpers.ts evaluates `window.matchMedia(...)` at module load, and jsdom does
// not implement matchMedia. Stub it before importing so the module can load.
vi.hoisted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    window.matchMedia = () =>
      ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  }
})

describe('detectBrowser', () => {
  const setUserAgent = (ua: string) => {
    vi.stubGlobal('navigator', { userAgent: ua })
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects Chrome', () => {
    setUserAgent('Mozilla/5.0 Chrome/90.0.0.0 Safari/537.36')
    expect(detectBrowser()).toBe('Chrome')
  })

  it('detects Edge (Chromium) before Chrome', () => {
    setUserAgent('Mozilla/5.0 Chrome/120 Safari/537.36 Edg/120.0')
    expect(detectBrowser()).toBe('Edge')
  })

  it('detects Firefox', () => {
    setUserAgent('Mozilla/5.0 Firefox/88.0')
    expect(detectBrowser()).toBe('Firefox')
  })

  it('detects Safari', () => {
    setUserAgent('Mozilla/5.0 Version/14.0 Safari/605.1.15')
    expect(detectBrowser()).toBe('Safari')
  })

  it('returns undefined for an unknown user agent', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)')
    expect(detectBrowser()).toBeUndefined()
  })

  it('does not throw and returns undefined when navigator is absent (SSR)', () => {
    vi.stubGlobal('navigator', undefined)
    expect(() => detectBrowser()).not.toThrow()
    expect(detectBrowser()).toBeUndefined()
  })
})

describe('ensurePlatformSuffix', () => {
  it('appends /platform when missing', () => {
    expect(ensurePlatformSuffix('https://api.x.com')).toBe('https://api.x.com/platform')
  })

  it('leaves the url unchanged when /platform is already present', () => {
    expect(ensurePlatformSuffix('https://api.x.com/platform')).toBe('https://api.x.com/platform')
  })
})

describe('mergeRefs', () => {
  it('calls a function ref with the value', () => {
    const fnRef = vi.fn()
    mergeRefs<string>(fnRef)('hello')
    expect(fnRef).toHaveBeenCalledWith('hello')
  })

  it("assigns the value to an object ref's current", () => {
    const objRef = createRef<string>()
    mergeRefs<string>(objRef)('world')
    expect(objRef.current).toBe('world')
  })

  it('ignores null and undefined refs without throwing', () => {
    // undefined is not part of React.Ref<T>, but mergeRefs must still skip it safely
    expect(() => mergeRefs<string>(null, undefined as any)('value')).not.toThrow()
  })

  it('forwards the value to multiple refs at once', () => {
    const fnRef = vi.fn()
    const objRef = createRef<string>()
    mergeRefs<string>(fnRef, objRef, null)('shared')
    expect(fnRef).toHaveBeenCalledWith('shared')
    expect(objRef.current).toBe('shared')
  })
})
