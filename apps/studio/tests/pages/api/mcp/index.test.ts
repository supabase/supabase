import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { mswServer } from 'tests/lib/msw'
import handler from '../../../../pages/api/mcp/index'

describe('/api/mcp', () => {
  beforeEach(() => {
    // Disable MSW for these tests
    mswServer.close()
  })

  describe('Method handling', async () => {
    it('should handle POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: {},
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(405)
    })

    it('should return 405 for non-POST methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: { message: 'Method GET Not Allowed' },
      })
      expect(res._getHeaders()).toEqual({ allow: ['POST'], 'content-type': 'application/json' })
    })
  })

  describe('Query validation', async () => {
    it('should accept valid feature groups', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { features: 'docs,database' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })

    it('should reject invalid feature groups', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { features: 'invalid,unknown' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toHaveProperty('error')
    })

    it('should work without features parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: {},
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })
  })
})
