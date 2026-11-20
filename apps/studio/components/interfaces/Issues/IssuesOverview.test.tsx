import { screen } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
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

  it.each([false, undefined, true])(
    'keeps direct Issues content usable when the flag is %s',
    async (issuesInbox) => {
      customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: issuesInbox === undefined ? {} : { issuesInbox }, posthog: {} }}
        >
          <IssuesOverview />
        </FeatureFlagContext.Provider>
      )

      expect(await screen.findByRole('link', { name: /Security/ })).toHaveAttribute(
        'href',
        '/project/default/issues/rls_disabled_in_public?category=security'
      )
    }
  )

  it('falls back to the filtered list for a category with nothing open', async () => {
    customRender(<IssuesOverview />)

    expect(await screen.findByRole('link', { name: /Performance/ })).toHaveAttribute(
      'href',
      '/project/default/issues?category=performance'
    )
  })
})
