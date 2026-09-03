import { beforeEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import worker from './index.ts'
import { chatBodySchema } from './src/http/chat-body.ts'
import { jsonError } from './src/http/errors.ts'

const { generateAssistantResponse, getTools, getModel } = vi.hoisted(() => ({
  generateAssistantResponse: vi.fn(),
  getTools: vi.fn(),
  getModel: vi.fn(),
}))

vi.mock('@supabase/server', () => ({
  withSupabase:
    (
      config: { auth: 'user' | 'none' },
      handler: (req: Request, ctx: unknown) => Response | Promise<Response>
    ) =>
    async (request: Request) => {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 })
      }
      if (config.auth === 'user' && !request.headers.get('authorization')) {
        return Response.json(
          { code: 'unauthorized', message: 'Sign in to continue.' },
          { status: 401 }
        )
      }
      return handler(request, {
        supabase: {},
        supabaseAdmin: {},
        userClaims: config.auth === 'user' ? { id: 'user-1', email: 'user@test.com' } : null,
      })
    },
}))

vi.mock('./src/ai/generate-assistant-response.ts', () => ({
  generateAssistantResponse,
}))

vi.mock('./src/ai/tools/index.ts', () => ({
  getTools,
}))

vi.mock('./src/ai/model.ts', () => ({
  getModel,
}))

vi.mock('./src/ai/model.utils.ts', () => ({
  DEFAULT_ASSISTANT_BASE_MODEL_ID: 'gpt-5.6-luna',
  getAssistantModelEntry: (id: string) => ({ id }),
  isKnownAssistantModelId: (id: string) =>
    id === 'gpt-5.6-luna' || id === 'gpt-5.4-nano' || id === 'gpt-5.3-codex',
  isAssistantBaseModelId: (id: string) => id === 'gpt-5.6-luna' || id === 'gpt-5.4-nano',
}))

vi.mock('./src/ai/assistant-message-metadata.ts', async () => {
  const schema = z
    .object({
      containsLogsSnippets: z.boolean().optional(),
    })
    .optional()
  return {
    assistantMessageMetadataSchema: schema,
    messagesIncludeLogsSnippets: () => false,
  }
})

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost:8787${path}`, init)
}

describe('jsonError', () => {
  test('returns JSON with code and message', async () => {
    const response = jsonError(401, 'unauthorized', 'Sign in to continue.', { hint: 'token' })
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: 'unauthorized',
      message: 'Sign in to continue.',
      hint: 'token',
    })
  })
})

describe('chat body schema', () => {
  test('accepts a single message', () => {
    const parsed = chatBodySchema.safeParse({
      message: { id: 'm1', role: 'user', parts: [] },
      trigger: 'submit-message',
    })
    expect(parsed.success).toBe(true)
  })

  test('accepts Studio DefaultChatTransport messages array', () => {
    const parsed = chatBodySchema.safeParse({
      messages: [{ id: 'm1', role: 'user', parts: [] }],
    })
    expect(parsed.success).toBe(true)
  })

  test('rejects an empty body', () => {
    const parsed = chatBodySchema.safeParse({})
    expect(parsed.success).toBe(false)
  })
})

describe('api worker router', () => {
  beforeEach(() => {
    generateAssistantResponse.mockReset()
    getTools.mockReset()
    getModel.mockReset()
  })

  test('GET /health returns 200', async () => {
    const response = await worker.fetch(request('/health'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, build: 'dev' })
  })

  test('unknown path returns 404', async () => {
    const response = await worker.fetch(request('/nope'))
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ code: 'not_found' })
  })

  test('unknown method on a known path returns 405', async () => {
    const response = await worker.fetch(request('/health', { method: 'POST' }))
    expect(response.status).toBe(405)
    await expect(response.json()).resolves.toMatchObject({ code: 'invalid_request' })
  })

  test('chat without auth returns 401', async () => {
    const response = await worker.fetch(
      request('/v1/conversations/00000000-0000-0000-0000-000000000001/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
        }),
      })
    )
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ code: 'unauthorized' })
  })
})
