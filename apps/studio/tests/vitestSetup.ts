import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { routerMock } from './lib/route-mock'
import { mswServer } from './lib/msw'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

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
  mswServer.listen({ onUnhandledRequest: `error` })
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

  // Mock the useParams hook from common module globally
  vi.mock('common', async (importOriginal: any) => {
    const actual = await importOriginal()
    return {
      ...(typeof actual === 'object' ? actual : {}),
      useParams: () => ({ ref: 'default' }),
    }
  })

  routerMock.useParser(createDynamicRouteParser(['/projects/[ref]']))
})

afterEach(() => {
  mswServer.resetHandlers()
  cleanup()
})

afterAll(() => {
  mswServer.close()
})
