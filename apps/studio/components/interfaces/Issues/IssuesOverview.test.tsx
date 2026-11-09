import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssuesOverview } from './IssuesOverview'
import type { Lint } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const makeLint = (name: Lint['name'], level: Lint['level']): Lint => ({
  name,
  title: name,
  level,
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: `${name} description`,
  detail: `${name} detail`,
  remediation: 'https://example.com/fix',
  metadata: { type: 'table', schema: 'public', name },
  cache_key: name,
})

describe('IssuesOverview', () => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: [
        makeLint('rls_enabled_no_policy', 'WARN'),
        makeLint('rls_disabled_in_public', 'ERROR'),
      ],
    })
  })

  it('opens the most severe issue in a category, so a click lands on something to fix', async () => {
    customRender(<IssuesOverview />)

    expect(await screen.findByRole('link', { name: /Security/ })).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public?category=security'
    )
  })

  it('falls back to the filtered list for a category with nothing open', async () => {
    customRender(<IssuesOverview />)

    expect(await screen.findByRole('link', { name: /Performance/ })).toHaveAttribute(
      'href',
      '/project/default/issues?category=performance'
    )
  })
})
