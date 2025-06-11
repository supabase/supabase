import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { routerMock } from './lib/route-mock'
import { mswServer } from './lib/msw'

mswServer.listen({ onUnhandledRequest: 'error' })

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

// Uncomment this if HTML in errors are being annoying.
//
// configure({
//   getElementError: (message, container) => {
//     const error = new Error(message ?? 'Element not found')
//     error.name = 'ElementNotFoundError'
//     return error
//   },
// })

beforeAll(() => {
  vi.mock('next/router', () => require('next-router-mock'))
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation')
    return {
      ...actual,
      useRouter: () => {
        return {
          push: vi.fn(),
          replace: vi.fn(),
        }
      },
      usePathname: () => vi.fn(),
      useSearchParams: () => ({
        get: vi.fn(),
      }),
    }
  })

  vi.mock('next/compat/router', () => require('next-router-mock'))

  routerMock.useParser(createDynamicRouteParser(['/projects/[ref]']))
})

afterAll(() => mswServer.close())

afterEach(() => mswServer.resetHandlers())

afterEach(() => {
  cleanup()
})
