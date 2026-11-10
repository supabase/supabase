import { act, fireEvent, screen } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AdvisorButton } from './AdvisorButton'
import { FloatingMobileToolbar } from '@/components/layouts/Navigation/FloatingMobileToolbar/FloatingMobileToolbar'
import { MobileSheetProvider } from '@/components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { sidebarManagerState, useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const PanelHost = () => {
  const { activeSidebar } = useSidebarManagerSnapshot()
  return activeSidebar?.component()
}

describe('Issues trigger discovery', () => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    addAPIMock({ method: 'get', path: '/platform/notifications', response: [] })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: [] },
    })
    sidebarManagerState.registerSidebar(SIDEBAR_KEYS.ADVISOR_PANEL, () => (
      <div>Issues panel content</div>
    ))
  })

  afterEach(async () => {
    await act(async () => {
      sidebarManagerState.unregisterSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
    })
  })

  it.each([false, undefined])('opens Advisor Center when the flag is %s', async (issuesInbox) => {
    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: issuesInbox === undefined ? {} : { issuesInbox }, posthog: {} }}
      >
        <AdvisorButton projectRef="default" />
        <PanelHost />
      </FeatureFlagContext.Provider>
    )

    expect(screen.queryByRole('button', { name: 'Issues' })).not.toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Advisor Center' }))
    })
    expect(screen.getByText('Issues panel content')).toBeInTheDocument()
  })

  it('opens the registered Issues panel when enabled', async () => {
    customRender(
      <FeatureFlagContext.Provider value={{ configcat: { issuesInbox: true }, posthog: {} }}>
        <AdvisorButton projectRef="default" />
        <PanelHost />
      </FeatureFlagContext.Provider>
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Issues' }))
    })

    expect(screen.getByText('Issues panel content')).toBeInTheDocument()
  })
  it.each([false, undefined, true])(
    'opens the matching panel from the mobile toolbar: %s',
    async (issuesInbox) => {
      customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: issuesInbox === undefined ? {} : { issuesInbox }, posthog: {} }}
        >
          <MobileSheetProvider>
            <FloatingMobileToolbar />
            <PanelHost />
          </MobileSheetProvider>
        </FeatureFlagContext.Provider>
      )
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: issuesInbox ? 'Issues' : 'Advisor Center' })
        )
      })
      expect(screen.getByText('Issues panel content')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: issuesInbox ? 'Advisor Center' : 'Issues' })
      ).not.toBeInTheDocument()
    }
  )
})
