import { beforeAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { APIMock } from './mocks/api'

export const mswServer = setupServer(...APIMock)

beforeAll(() => {
  mswServer.listen()

  vi.mock('next/router', () => require('next-router-mock'))
})

afterAll(() => mswServer.close())

afterEach(() => mswServer.resetHandlers())
