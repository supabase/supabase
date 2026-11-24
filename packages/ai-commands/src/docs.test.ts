import { createClient } from '@supabase/supabase-js'
import { afterEach, expect, it, vi } from 'vitest'

import { clippy } from './docs'

afterEach(() => vi.unstubAllGlobals())

it('streams an answer using the question and matching documentation', async () => {
  const openai = {
    apiKey: 'test',
    moderations: { create: async () => ({ results: [{ flagged: false, categories: {} }] }) },
    embeddings: { create: async () => ({ data: [{ embedding: [1, 2, 3] }] }) },
  }
  const supabase = createClient('https://example.com', 'test', {
    global: {
      fetch: async () =>
        Response.json([{ content: 'Storage documentation', page: { path: '/guides/storage' } }]),
    },
  })
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    expect(body.messages.at(-1).content).toBe('How do I upload a file?')
    expect(
      body.messages.some((message: { content: string }) =>
        message.content.includes('Storage documentation')
      )
    ).toBe(true)
    return new Response('data: streamed answer\n\n')
  })
  vi.stubGlobal('fetch', fetch)

  const response = await clippy(openai, supabase, [
    { role: 'user', content: 'How do I upload a file?' },
  ])

  expect(await response.text()).toBe('data: streamed answer\n\n')
  expect(fetch).toHaveBeenCalledOnce()
})
