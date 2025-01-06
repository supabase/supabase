/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { APIMock } from './mocks/api'
import { routerMock } from './mocks/router'

export const mswServer = setupServer(...APIMock)

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

beforeAll(() => {
  console.log('🤖 Starting MSW Server')

  mswServer.listen({ onUnhandledRequest: 'error' })
  vi.mock('next/router', () => require('next-router-mock'))
  vi.mock('next/compat/router', () => require('next-router-mock'))

  routerMock.useParser(createDynamicRouteParser(['/projects/[ref]']))
})

afterAll(() => mswServer.close())

afterEach(() => mswServer.resetHandlers())

afterEach(() => {
  cleanup()
})
