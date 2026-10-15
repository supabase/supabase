import { Result } from '~/features/helpers.fn'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { POST } from '../route'

vi.mock(import('~/lib/openAi'), () => ({
  openAI: () => ({
    createContentEmbedding: async () => Result.ok({ embedding: [0.1], tokenCount: 1 }),
  }),
}))

vi.mock('~/lib/supabase', () => ({
  supabase: () => ({
    rpc: async () => ({
      data: [
        { type: 'markdown', page_title: 'Guide', href: '/guides/a', content: null },
        {
          type: 'troubleshooting',
          page_title: 'Old troubleshooting',
          href: '/guides/troubleshooting/old',
          content: null,
        },
      ],
      error: null,
    }),
  }),
}))

vi.mock(import('~/resources/globalSearch/kbTroubleshootingSearch'), async (importOriginal) => ({
  ...(await importOriginal()),
  USE_KB_TROUBLESHOOTING_SEARCH: true,
}))

async function searchDocs() {
  const query = `query { searchDocs(query: "timeout") { nodes { __typename title href } } }`
  const response = await POST(
    new Request('http://localhost/api/graphql', { method: 'POST', body: JSON.stringify({ query }) })
  )
  return (await response.json()).data.searchDocs.nodes
}

describe('searchDocs with KB troubleshooting search', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('replaces the docs DB troubleshooting results with KB results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json([
          {
            title: 'KB article',
            href: 'https://supabase.com/kb/troubleshooting/kb',
            excerpt: 'x',
            score: 1,
          },
        ])
      )
    )

    expect(await searchDocs()).toEqual([
      { __typename: 'Guide', title: 'Guide', href: '/guides/a' },
      {
        __typename: 'TroubleshootingGuide',
        title: 'KB article',
        href: 'https://supabase.com/kb/troubleshooting/kb',
      },
    ])
  })

  it('still returns docs results when KB is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )

    expect(await searchDocs()).toEqual([{ __typename: 'Guide', title: 'Guide', href: '/guides/a' }])
  })
})
