import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { Button, SheetTitle } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetProvider, useMobileSheet } from './MobileSheetContext'
import { StudioMobileSheetNav } from './StudioMobileSheetNav'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const IssuesMobileMenu = ({
  namedContent,
}: {
  namedContent?: 'search' | typeof SIDEBAR_KEYS.HELP_PANEL
}) => {
  const { setContent } = useMobileSheet()
  return (
    <>
      <Button
        onClick={() => {
          if (namedContent) {
            if (namedContent === SIDEBAR_KEYS.HELP_PANEL)
              sidebarManagerState.openSidebar(namedContent)
            setContent(namedContent)
            return
          }
          setContent(
            <>
              <SheetTitle>Issues menu</SheetTitle>
              <span>Issues content</span>
            </>
          )
        }}
      >
        Open issues menu
      </Button>
      <StudioMobileSheetNav shouldCloseOnQueryChange={false} />
    </>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  sidebarManagerState.unregisterSidebar(SIDEBAR_KEYS.HELP_PANEL)
})

describe('StudioMobileSheetNav', () => {
  it.each(['search', SIDEBAR_KEYS.HELP_PANEL] as const)(
    'closes %s content for query navigation while Issues menu filtering is preserved',
    async (namedContent) => {
      vi.stubGlobal('innerWidth', 390)
      routerMock.setCurrentUrl('/project/default/issues?q=function')
      sidebarManagerState.registerSidebar(SIDEBAR_KEYS.HELP_PANEL, () => (
        <SheetTitle>Help</SheetTitle>
      ))
      const user = userEvent.setup()
      customRender(
        <MobileSheetProvider>
          <IssuesMobileMenu namedContent={namedContent} />
        </MobileSheetProvider>
      )
      await user.click(screen.getByRole('button', { name: 'Open issues menu' }))
      expect(await screen.findByRole('dialog')).toBeInTheDocument()

      await act(async () => routerMock.push('/project/default/issues?category=security'))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    }
  )

  it('keeps the Issues menu open for filter updates and closes for an issue link', async () => {
    vi.stubGlobal('innerWidth', 390)
    routerMock.setCurrentUrl('/project/default/issues')
    const user = userEvent.setup()
    customRender(
      <MobileSheetProvider>
        <IssuesMobileMenu />
      </MobileSheetProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Open issues menu' }))
    expect(await screen.findByRole('dialog', { name: 'Issues menu' })).toBeInTheDocument()

    await act(async () => routerMock.push('/project/default/issues?q=function'))
    expect(screen.getByRole('dialog', { name: 'Issues menu' })).toBeInTheDocument()

    await act(async () => routerMock.push('/project/default/issues'))
    expect(screen.getByRole('dialog', { name: 'Issues menu' })).toBeInTheDocument()

    await act(async () => routerMock.push('/project/default/issues/function_search_path_mutable'))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Issues menu' })).not.toBeInTheDocument()
    )
  })
})
