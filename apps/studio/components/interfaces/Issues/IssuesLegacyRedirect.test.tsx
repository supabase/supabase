import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IssuesLegacyRedirect } from './IssuesLegacyRedirect'
import type { Lint } from '@/data/lint/lint-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const finding: Lint = {
  name: 'unindexed_foreign_keys',
  title: 'Unindexed foreign keys',
  level: 'WARN',
  facing: 'EXTERNAL',
  categories: ['PERFORMANCE'],
  description: 'Foreign keys without an index',
  detail: 'Add an index',
  remediation: 'https://example.com',
  metadata: { type: 'table', schema: 'public', name: 'posts' },
  cache_key: 'opaque-key',
}

afterEach(() => window.history.replaceState({}, '', '/'))

describe('IssuesLegacyRedirect', () => {
  it('waits for findings before navigating an old detail link to its check', async () => {
    let releaseLints: (value: Lint[]) => void = () => undefined
    const lints = new Promise<Lint[]>((resolve) => {
      releaseLints = resolve
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectDetail>({
          cloud_provider: 'AWS',
          connectionString: null,
          db_host: 'localhost',
          high_availability: false,
          id: 1,
          inserted_at: '2026-01-01',
          integration_source: null,
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          name: 'Project',
          organization_id: 1,
          ref: 'default',
          region: 'us-east-1',
          restUrl: 'https://example.com',
          status: 'ACTIVE_HEALTHY',
          subscription_id: 'test',
          updated_at: '2026-01-01',
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: async () => HttpResponse.json<Lint[]>(await lints),
    })
    const url = '/project/default/issues?category=performance&id=opaque-key&preset=WARN#finding'
    window.history.replaceState({}, '', url)
    const onRedirect = vi.fn()
    customRender(<IssuesLegacyRedirect onRedirect={onRedirect} />, {
      nuqs: { searchParams: url.split('?')[1].split('#')[0] },
    })
    expect(onRedirect).not.toHaveBeenCalled()
    releaseLints([finding])
    await waitFor(() =>
      expect(onRedirect).toHaveBeenCalledWith(
        '/project/default/issues/unindexed_foreign_keys?category=performance&severity=warning#finding'
      )
    )
    expect(onRedirect).toHaveBeenCalledTimes(1)
  })

  it('leaves a modern URL alone', () => {
    window.history.replaceState(
      {},
      '',
      '/project/default/issues?category=performance&severity=warning'
    )
    const onRedirect = vi.fn()
    customRender(<IssuesLegacyRedirect onRedirect={onRedirect} />, {
      nuqs: { searchParams: 'category=performance&severity=warning' },
    })
    expect(onRedirect).not.toHaveBeenCalled()
  })
})
