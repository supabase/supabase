import { promises as fs } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/public/markdown/reference-manifest.json', () => ({
  default: {
    'javascript/start': 'javascript/v2/introduction',
    'escaping/section': '../../../../etc/passwd',
  },
}))

vi.mock('node:fs', () => ({
  promises: { readFile: vi.fn() },
}))

const { GET } = await import('./route')

const readFile = vi.mocked(fs.readFile)

const request = (slug: string[]) =>
  GET(new Request('https://supabase.com/docs/api/reference-md'), {
    params: Promise.resolve({ slug }),
  })

describe('GET /api/reference-md/[...slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readFile.mockResolvedValue('# Introduction\n' as never)
  })

  it('serves the file the manifest maps the path to, as cacheable markdown', async () => {
    const response = await request(['javascript', 'start'])

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, stale-while-revalidate=3600'
    )
    expect(await response.text()).toBe('# Introduction\n')
    expect(String(readFile.mock.calls[0][0])).toMatch(
      /public\/markdown\/reference-sections\/javascript\/v2\/introduction\.md$/
    )
  })

  it('returns an uncacheable markdown 404 for paths the manifest lacks, without touching disk', async () => {
    for (const slug of [['javascript', 'unknown'], ['index'], ['..', '..', 'etc', 'passwd']]) {
      const response = await request(slug)

      expect(response.status).toBe(404)
      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    }
    expect(readFile).not.toHaveBeenCalled()
  })

  it('refuses a manifest entry that points outside the sections directory', async () => {
    const response = await request(['escaping', 'section'])

    expect(response.status).toBe(404)
    expect(readFile).not.toHaveBeenCalled()
  })

  it('returns 500, not 404, when a mapped file cannot be read', async () => {
    readFile.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }) as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await request(['javascript', 'start'])

    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
