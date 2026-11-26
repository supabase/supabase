import { useLocation } from '@tanstack/react-router'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
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
import { createTestRouter, customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('next/link', async () => await import('@/compat/next/link'))

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
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setContent } = useMobileSheet()
  const isIssuesPage = getPathSegment(pathname, 3) === 'issues'
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

const renderProject = (issuesInbox: boolean, initialUrl = '/project/default') => {
  const router = createTestRouter(initialUrl)
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
      <MobileSheetProvider>
        <ProjectMenu />
      </MobileSheetProvider>
    </FeatureFlagContext.Provider>,
    {
      router,
      nuqs: {
        hasMemory: true,
        resetUrlUpdateQueueOnMount: false,
        onUrlUpdate: ({ queryString }) => {
          void router.navigate({ href: `${router.state.location.pathname}${queryString}` })
        },
      },
    }
  )
  return router
}

describe('Issues navigation from the mobile project menu', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 390)
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
    const router = renderProject(true)
    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const menu = within(await screen.findByRole('dialog', { name: 'Project menu' }))
    expect(await menu.findByRole('link', { name: 'Project Overview' })).toHaveAttribute(
      'data-active',
      'true'
    )
    await user.click(await menu.findByRole('link', { name: 'Issues' }))
    await waitFor(() => expect(router.state.location.href).toBe('/project/default/issues'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Issues' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const issuesMenu = await screen.findByRole('dialog', { name: 'Project menu' })
    const search = within(issuesMenu).getByRole('textbox', { name: 'Search issues' })
    await user.click(search)
    await user.paste('accounts')
    await waitFor(() =>
      expect(router.state.location.href).toBe('/project/default/issues?q=accounts')
    )
    expect(issuesMenu).toBeInTheDocument()

    await user.click(within(issuesMenu).getByRole('button', { name: 'Filters' }))
    await user.click(screen.getByRole('menuitem', { name: 'Severity' }))
    const criticalFilter = await screen.findByRole('menuitemcheckbox', { name: 'Critical' })
    criticalFilter.focus()
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ severity: 'critical', q: 'accounts' })
    )
    await user.keyboard('{Escape}')
    expect(issuesMenu).toBeInTheDocument()
    await user.click(within(issuesMenu).getByRole('link', { name: /RLS disabled/i }))
    await waitFor(() =>
      expect(router.state.location.href).toBe(
        '/project/default/issues/rls_disabled_in_public?severity=critical&q=accounts'
      )
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('keeps Advisors as a submenu when Issues is off', async () => {
    const user = userEvent.setup()
    const router = renderProject(false)
    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const menu = within(await screen.findByRole('dialog', { name: 'Project menu' }))
    await user.click(await menu.findByRole('button', { name: 'Advisors' }))
    expect(await menu.findByRole('link', { name: 'Security Advisor' })).toHaveAttribute(
      'href',
      '/project/default/advisors/security'
    )
    expect(router.state.location.href).toBe('/project/default')
    expect(screen.getByRole('dialog', { name: 'Project menu' })).toBeInTheDocument()
  })

  it('marks Issues as the active section on Advisors routes when Issues is on', async () => {
    const user = userEvent.setup()
    renderProject(true, '/project/default/advisors/security')
    await user.click(screen.getByRole('button', { name: 'Open project menu' }))
    const menu = within(await screen.findByRole('dialog', { name: 'Project menu' }))
    expect(await menu.findByRole('link', { name: 'Issues' })).toHaveAttribute('data-active', 'true')
    expect(menu.getByRole('link', { name: 'Project Overview' })).toHaveAttribute(
      'data-active',
      'false'
    )
  })
})
