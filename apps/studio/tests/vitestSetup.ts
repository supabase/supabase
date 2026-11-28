import './lib/disabled-matchers'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { mswServer } from './lib/msw'
import { routerMock } from './lib/route-mock'

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

// This must stay at module scope: Vitest hoists `vi.mock` above imports.
// Inside `renderRoute`, `useParams` reads from the memory router; elsewhere it uses the static mock.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  const { routeAwareHook } = await import('./lib/route-aware-hooks')
  return {
    ...actual,
    useParams: routeAwareHook(actual.useParams, () => ({ ref: 'default' })),
  }
})

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: `error` })
  routerMock.useParser(createDynamicRouteParser(['/projects/[ref]']))
})

afterEach(() => {
  mswServer.resetHandlers()
})

afterAll(() => {
  mswServer.close()
})
