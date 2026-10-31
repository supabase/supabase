import { createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../pages/api/mcp/index'
import { mswServer } from '@/tests/lib/msw'

// Mock the MCP SDK and Supabase MCP server to avoid Hono/node-mocks-http compatibility issues.
//
// Starting with MCP SDK v1.25.x (required by @supabase/mcp-server-supabase@0.6.2), the SDK
// uses @hono/node-server for converting between Node.js HTTP and Web Standard APIs. This is
// incompatible with the node-mocks-http library used in these tests.
//
// Since these tests focus on query parameter validation in the API handler rather than
// testing the MCP transport implementation, we mock both packages to avoid hitting the
// incompatible Hono code paths.
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(function () {
    return { handleRequest: vi.fn().mockResolvedValue(undefined) }
  }),
}))

vi.mock('@supabase/mcp-server-supabase', () => ({
  createSupabaseMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
  }),
  createFeedbackOperations: vi.fn().mockReturnValue({}),
}))

const accessToken = 'a'.repeat(32)

describe('/api/mcp', () => {
  beforeEach(() => {
    // Disable MSW for these tests
    mswServer.close()
    vi.clearAllMocks()
    vi.stubEnv('MCP_ACCESS_TOKEN', accessToken)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Method handling', async () => {
    it('should handle POST requests without a features parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        query: {},
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(createSupabaseMcpServer).toHaveBeenCalledOnce()
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

  describe('Access token', () => {
    it('rejects POST when MCP_ACCESS_TOKEN is not configured', async () => {
      vi.stubEnv('MCP_ACCESS_TOKEN', '')

      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(503)
      expect(JSON.parse(res._getData())).toMatchObject({
        error: { message: expect.stringContaining('not configured') },
      })
      expect(createSupabaseMcpServer).not.toHaveBeenCalled()
    })

    it('rejects POST when the bearer token does not match', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: `Bearer ${'b'.repeat(32)}` },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(res._getHeaders()['www-authenticate']).toBe('Bearer')
      expect(JSON.parse(res._getData())).toMatchObject({
        error: { message: expect.stringContaining('MCP access token') },
      })
      expect(createSupabaseMcpServer).not.toHaveBeenCalled()
    })
  })

  describe('Query validation', async () => {
    it('should accept valid feature groups', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        query: { features: 'docs,database' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(createSupabaseMcpServer).toHaveBeenCalledOnce()
    })

    it('should accept the feedback feature group', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { features: 'feedback' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })

    it('should reject the notebooks feature group', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { features: 'notebooks' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should reject invalid feature groups', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        query: { features: 'invalid,unknown' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toHaveProperty('error')
      expect(createSupabaseMcpServer).not.toHaveBeenCalled()
    })
  })
})
