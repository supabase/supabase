import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider/next-13.5'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileMenuContent } from './MobileMenuContent'
import { IssuesOverview } from '@/components/interfaces/Issues/IssuesOverview'
import { IssuesSidebar } from '@/components/layouts/IssuesLayout/IssuesSidebar'
import {
  MobileSheetProvider,
  useMobileSheet,
} from '@/components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { StudioMobileSheetNav } from '@/components/layouts/Navigation/NavigationBar/StudioMobileSheetNav'
import type { Lint } from '@/data/lint/lint-query'
import { getPathSegment } from '@/lib/pathname.utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const lint: Lint = {
  name: 'rls_disabled_in_public',
  title: 'RLS disabled',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'Row level security is disabled',
  detail: 'Enable row level security on public.accounts',
  remediation: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
  metadata: { type: 'table', schema: 'public', name: 'accounts' },
  cache_key: 'accounts-rls',
}

const ProjectMenu = () => {
  const router = useRouter()
  const { setContent } = useMobileSheet()
  const isIssuesPage = getPathSegment(router.pathname, 3) === 'issues'
  return (
    <>
      {isIssuesPage && <IssuesOverview />}
      <Button
        onClick={() =>
          setContent(
            <MobileMenuContent
              currentProductMenu={isIssuesPage ? <IssuesSidebar /> : null}
              currentProduct={isIssuesPage ? 'Issues' : 'Project overview'}
              currentSectionKey={isIssuesPage ? 'issues' : null}
              onCloseSheet={() => setContent(null)}
            />
          )
        }
      >
        Open project menu
      </Button>
      <StudioMobileSheetNav shouldCloseOnQueryChange={!isIssuesPage} />
    </>
  )
}

const renderProject = (issuesInbox: boolean) =>
  customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: {
          issuesInbox,
          authOverviewPage: false,
          compute: false,
          explorer: false,
          healthAdvisor: false,
        },
        posthog: {},
      }}
    >
      <MemoryRouterProvider>
        <MobileSheetProvider>
          <ProjectMenu />
        </MobileSheetProvider>
      </MemoryRouterProvider>
    </FeatureFlagContext.Provider>,
    {
      nuqs: {
        hasMemory: true,
        resetUrlUpdateQueueOnMount: false,
        onUrlUpdate: ({ queryString }) => {
          void routerMock.push(`${routerMock.asPath.split('?')[0]}${queryString}`)
        },
      },
    }
  )

describe('Issues navigation from the mobile project menu', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 390)
    routerMock.setCurrentUrl('/project/default')
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [lint] })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: [] },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('navigates to Issues before opening its filters and preserves query updates', async () => {
    const user = userEvent.setup()
    renderProject(true)
    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const menu = within(await screen.findByRole('dialog', { name: 'Project menu' }))
    await user.click(await menu.findByRole('link', { name: 'Issues' }))
    await waitFor(() => expect(routerMock.asPath).toBe('/project/default/issues'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Issues' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const issuesMenu = await screen.findByRole('dialog', { name: 'Project menu' })
    const search = within(issuesMenu).getByRole('textbox', { name: 'Search issues' })
    await user.click(search)
    await user.paste('accounts')
    await waitFor(() => expect(routerMock.asPath).toBe('/project/default/issues?q=accounts'))
    expect(issuesMenu).toBeInTheDocument()

    await user.click(within(issuesMenu).getByRole('button', { name: 'Filters' }))
    await user.click(screen.getByRole('menuitem', { name: 'Severity' }))
    const criticalFilter = await screen.findByRole('menuitemcheckbox', { name: 'Critical' })
    criticalFilter.focus()
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(routerMock.query).toMatchObject({ severity: 'critical', q: 'accounts' })
    )
    await user.keyboard('{Escape}')
    expect(issuesMenu).toBeInTheDocument()
    await user.click(within(issuesMenu).getByRole('link', { name: /RLS disabled/i }))
    await waitFor(() =>
      expect(routerMock.asPath).toBe(
        '/project/default/issues/rls_disabled_in_public?severity=critical&q=accounts'
      )
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('keeps Advisors as a submenu when Issues is off', async () => {
    const user = userEvent.setup()
    renderProject(false)
    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const menu = within(await screen.findByRole('dialog', { name: 'Project menu' }))
    await user.click(await menu.findByRole('button', { name: 'Advisors' }))
    expect(await menu.findByRole('link', { name: 'Security Advisor' })).toHaveAttribute(
      'href',
      '/project/default/advisors/security'
    )
    expect(routerMock.asPath).toBe('/project/default')
    expect(screen.getByRole('dialog', { name: 'Project menu' })).toBeInTheDocument()
  })
})
