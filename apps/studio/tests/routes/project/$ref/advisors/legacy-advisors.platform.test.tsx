import { screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route as HealthRoute } from '@/routes/project/$ref/advisors/health'
import { Route as PerformanceRoute } from '@/routes/project/$ref/advisors/performance'
import { Route as SecurityRoute } from '@/routes/project/$ref/advisors/security'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'
import { routerMock } from '@/tests/lib/route-mock'
import { renderRoute } from '@/tests/lib/route-render'

vi.mock('@/components/layouts/AdvisorsLayout/LegacyAdvisorsLayout', () => ({
  LegacyAdvisorsLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

type FeatureFlags = { issuesInbox: boolean; healthAdvisor?: boolean }

const renderAdvisorsRoute = (
  route: typeof SecurityRoute | typeof PerformanceRoute | typeof HealthRoute,
  category: string,
  configcat: FeatureFlags
) =>
  renderRoute(route, {
    routeId: `/project/$ref/advisors/${category}`,
    url: `/project/default/advisors/${category}`,
    renderOptions: {
      wrapper: ({ children }) => (
        <CustomWrapper>
          <FeatureFlagContext.Provider value={{ configcat, posthog: {} }}>
            {children}
          </FeatureFlagContext.Provider>
        </CustomWrapper>
      ),
    },
  })

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
    ['security', SecurityRoute, 'Security Advisor'],
    ['performance', PerformanceRoute, 'Performance Advisor'],
    ['health', HealthRoute, 'Health Advisor'],
  ] as const)(
    'renders the existing %s Advisor when Issues is off',
    async (category, route, title) => {
      routerMock.setCurrentUrl(`/project/default/advisors/${category}`)
      await renderAdvisorsRoute(route, category, { issuesInbox: false, healthAdvisor: true })
      expect(await screen.findByText(title)).toBeInTheDocument()
      expect(await screen.findByText('Errors')).toBeInTheDocument()
    }
  )

  it.each([
    ['security', SecurityRoute],
    ['performance', PerformanceRoute],
    ['health', HealthRoute],
  ] as const)(
    'redirects %s to Issues when enabled with legacy finding context',
    async (category, route) => {
      const replace = vi.fn()
      vi.stubGlobal('location', {
        href: `http://localhost:3000/project/default/advisors/${category}?preset=WARN&id=finding#detail`,
        replace,
      })
      routerMock.setCurrentUrl(`/project/default/advisors/${category}`)
      await renderAdvisorsRoute(route, category, { issuesInbox: true })
      await waitFor(() =>
        expect(replace).toHaveBeenCalledWith(
          `/project/default/issues?preset=WARN&id=finding&category=${category}#detail`
        )
      )
    }
  )
})
