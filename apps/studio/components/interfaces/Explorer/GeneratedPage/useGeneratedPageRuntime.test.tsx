import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import type { ApprovedGeneratedPageQueries } from './generated-page.utils'
import { useGeneratedPageRuntime } from './useGeneratedPageRuntime'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'
import { customRenderHook } from '@/tests/lib/custom-render'

const page: RenderPageInput = {
  title: 'Service health',
  html: '<p>Service health</p>',
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 25 },
  ],
  log_queries: [],
  enable_supabase_client: false,
}

const approvedQueries: ApprovedGeneratedPageQueries = {
  database: new Map([
    [
      'recent_users',
      {
        title: 'Recent users',
        sql: acceptUntrustedSql(untrustedSql('select id from auth.users')),
        rowLimit: 25,
      },
    ],
  ]),
  logs: new Map(),
}

describe('useGeneratedPageRuntime', () => {
  // StrictMode runs every effect's cleanup once after mount. A handed-over approval is
  // seeded only once, so that cleanup must not drop it — otherwise the expanded page runs
  // with no approved queries and every query fails with "This page is not running."
  it('keeps a handed-over approval through a StrictMode effect replay', () => {
    const { result } = customRenderHook(() => useGeneratedPageRuntime({ page, approvedQueries }), {
      reactStrictMode: true,
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.getApprovedQueries()).toBe(approvedQueries)
  })
})
