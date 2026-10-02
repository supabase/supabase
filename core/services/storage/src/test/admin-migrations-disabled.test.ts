import type { FastifyInstance } from 'fastify'
import { getConfig, mergeConfig } from '../config'
import { createAdminApp } from './common'

getConfig()

type DisabledRouteCase = {
  method: 'DELETE' | 'GET' | 'POST'
  url: string
  payload?: Record<string, unknown>
}

const disabledRouteCases: DisabledRouteCase[] = [
  { method: 'POST', url: '/migrations/migrate/fleet' },
  {
    method: 'POST',
    url: '/migrations/reset/fleet',
    payload: { untilMigration: 'storage-schema' },
  },
  { method: 'GET', url: '/migrations/active' },
  { method: 'DELETE', url: '/migrations/active' },
  { method: 'GET', url: '/migrations/progress' },
  { method: 'GET', url: '/migrations/failed' },
]

let adminApp: FastifyInstance

describe('Admin migrations routes with queue disabled', () => {
  beforeAll(async () => {
    mergeConfig({
      pgQueueEnable: false,
    })
    adminApp = await createAdminApp()
  })

  afterAll(async () => {
    await adminApp.close()
  })

  for (const { method, url, payload } of disabledRouteCases) {
    test(`returns 400 for ${method} ${url} when queue is disabled`, async () => {
      const response = await adminApp.inject({
        method,
        url,
        payload,
        headers: { apikey: process.env.ADMIN_API_KEYS },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ message: 'Queue is not enabled' })
    })
  }
})
