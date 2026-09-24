import { describe, expect, it } from 'vitest'

import { getGeneratedPageTools } from './generated-page-tools'

describe('render_page tool', () => {
  it('rejects a page whose inline script does not compile', async () => {
    const { inputSchema } = getGeneratedPageTools().render_page
    const result = await (
      inputSchema as {
        safeParseAsync: (value: unknown) => Promise<{ success: boolean; error?: unknown }>
      }
    ).safeParseAsync({
      title: 'Service health',
      database_queries: [],
      log_queries: [],
      enable_supabase_client: false,
      html: '<script>render(rows, (row => row)</script>',
    })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error)).toContain('missing ) after argument list')
  })
})
