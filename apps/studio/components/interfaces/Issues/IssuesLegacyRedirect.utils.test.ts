import { describe, expect, it } from 'vitest'

import {
  getIssuesCategoryDestination,
  getLegacyIssueDestination,
} from './IssuesLegacyRedirect.utils'
import type { Issue } from '@/data/issues/issue.types'
import type { Lint } from '@/data/lint/lint-query'

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
  cache_key: 'opaque_finding_with_underscores',
}

const issue: Issue = {
  id: 'unindexed_foreign_keys',
  title: finding.title,
  description: finding.description,
  severity: 'warning',
  category: 'performance',
  source: 'lint',
  docsUrl: finding.remediation,
  affected: [
    {
      id: finding.cache_key,
      lint: finding,
      severity: 'warning',
      resource: { type: 'table', schema: 'public', name: 'posts' },
      detail: finding.detail,
      action: null,
    },
  ],
}

const pathname = '/dashboard/project/default/issues'
const resolve = (query: string) =>
  getLegacyIssueDestination(new URL(`https://example.com${pathname}${query}`), [issue], pathname)

describe('legacy advisor destinations', () => {
  it('resolves an exact finding to its grouped check and translates severity', () => {
    expect(
      resolve('?category=performance&id=opaque_finding_with_underscores&preset=WARN#finding')
    ).toBe(
      '/dashboard/project/default/issues/unindexed_foreign_keys?category=performance&severity=warning#finding'
    )
  })

  it.each([
    ['ERROR', 'critical'],
    ['WARN', 'warning'],
    ['INFO', 'info'],
  ])('translates %s without a selected finding', (preset, severity) => {
    expect(resolve(`?category=security&preset=${preset}`)).toBe(
      `${pathname}?category=security&severity=${severity}`
    )
  })

  it('keeps the filtered list for a missing finding without guessing from its key', () => {
    expect(resolve('?category=performance&id=unindexed_foreign_keys_missing&preset=INFO')).toBe(
      `${pathname}?category=performance&severity=info`
    )
  })

  it('keeps explicit modern filters and unrelated query parameters', () => {
    expect(resolve('?severity=critical,warning&q=posts&preset=INFO&category=security')).toBe(
      `${pathname}?severity=critical%2Cwarning&q=posts&category=security`
    )
    expect(resolve('?severity=critical&category=security#finding')).toBeNull()
  })

  it('preserves the query and hash in a category redirect with a base path', () => {
    expect(
      getIssuesCategoryDestination(
        new URL(
          'https://example.com/dashboard/project/default/advisors/security?id=key&preset=ERROR#finding'
        ),
        'security',
        pathname
      )
    ).toBe(`${pathname}?id=key&preset=ERROR&category=security#finding`)
  })
})
