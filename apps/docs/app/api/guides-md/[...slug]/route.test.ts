import { describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    promises: { ...actual.promises, readFile: async () => '# Guide\n\nContent.\n' },
  }
})

import { GET } from './route'

describe('guides markdown route', () => {
  it('serves the generated markdown file as is', async () => {
    const response = await GET(new Request('https://supabase.com/docs'), {
      params: Promise.resolve({ slug: ['auth'] }),
    })
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
    expect(await response.text()).toBe('# Guide\n\nContent.\n')
  })
})
