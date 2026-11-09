import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { Button, SheetTitle } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetProvider, useMobileSheet } from './MobileSheetContext'
import { StudioMobileSheetNav } from './StudioMobileSheetNav'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const IssuesMobileMenu = () => {
  const { setContent } = useMobileSheet()
  return (
    <>
      <Button
        onClick={() =>
          setContent(
            <>
              <SheetTitle>Issues menu</SheetTitle>
              <span>Issues content</span>
            </>
          )
        }
      >
        Open issues menu
      </Button>
      <StudioMobileSheetNav shouldCloseOnQueryChange={false} />
    </>
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('StudioMobileSheetNav', () => {
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
