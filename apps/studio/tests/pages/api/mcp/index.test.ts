import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { mswServer } from 'tests/lib/msw'
import handler from '../../../../pages/api/mcp/index'

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
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    handleRequest: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@supabase/mcp-server-supabase', () => ({
  createSupabaseMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('/api/mcp', () => {
  beforeEach(() => {
    // Disable MSW for these tests
    mswServer.close()
    // Clear mock state between tests
    vi.clearAllMocks()
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
