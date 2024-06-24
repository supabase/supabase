import { beforeAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { APIMock } from './mocks/api'
import { routerMock } from './mocks/router'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes'

export const mswServer = setupServer(...APIMock)

beforeAll(() => {
  console.log('🤖 Starting MSW Server')

  mswServer.listen({ onUnhandledRequest: 'error' })
  vi.mock('next/router', () => require('next-router-mock'))
  vi.mock('next/compat/router', () => require('next-router-mock'))

  routerMock.useParser(createDynamicRouteParser(['/projects/[ref]']))
})

afterAll(() => mswServer.close())

afterEach(() => mswServer.resetHandlers())
