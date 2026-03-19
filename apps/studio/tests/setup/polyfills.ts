import { ReadableStream, TransformStream } from 'node:stream/web'
import { TextDecoder, TextEncoder } from 'node:util'
import { act } from '@testing-library/react'
import { configMocks } from 'jsdom-testing-mocks'
import { vi } from 'vitest'

configMocks({ act })

// Warning: `restoreMocks: true` in vitest.config.ts will
// cause this global mockImplementation to be **reset**
// before any tests are run!
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  CSS: {
    value: {
      supports: (_k: any, _v: any) => false,
      escape: (v: any) => v,
    },
  },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
})

window.HTMLElement.prototype.hasPointerCapture = vi.fn()
