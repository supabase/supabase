import { screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HealthPage from '@/pages/project/[ref]/advisors/health'
import PerformancePage from '@/pages/project/[ref]/advisors/performance'
import SecurityPage from '@/pages/project/[ref]/advisors/security'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'
import { routerMock } from '@/tests/lib/route-mock'

describe('Legacy Advisor pages', () => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/advisors/run',
      response: { data: { type: 'project_advisors', attributes: { lints: [] } } },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['security', SecurityPage, 'Security Advisor'],
    ['performance', PerformancePage, 'Performance Advisor'],
    ['health', HealthPage, 'Health Advisor'],
  ] as const)(
    'renders the existing %s Advisor when Issues is off',
    async (category, Page, title) => {
      routerMock.setCurrentUrl(`/project/default/advisors/${category}`)
      customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: { issuesInbox: false, healthAdvisor: true }, posthog: {} }}
        >
          <Page dehydratedState={undefined} />
        </FeatureFlagContext.Provider>
      )
      expect(await screen.findByText(title)).toBeInTheDocument()
      expect(await screen.findByText('Errors')).toBeInTheDocument()
    }
  )

  it.each([
    ['security', SecurityPage],
    ['performance', PerformancePage],
    ['health', HealthPage],
  ] as const)(
    'redirects %s to Issues when enabled with legacy finding context',
    async (category, Page) => {
      const replace = vi.fn()
      vi.stubGlobal('location', {
        href: `http://localhost:3000/project/default/advisors/${category}?preset=WARN&id=finding#detail`,
        replace,
      })
      routerMock.setCurrentUrl(`/project/default/advisors/${category}`)
      customRender(
        <FeatureFlagContext.Provider value={{ configcat: { issuesInbox: true }, posthog: {} }}>
          <Page dehydratedState={undefined} />
        </FeatureFlagContext.Provider>
      )
      await waitFor(() =>
        expect(replace).toHaveBeenCalledWith(
          `/project/default/issues?preset=WARN&id=finding&category=${category}#detail`
        )
      )
    }
  )
})
