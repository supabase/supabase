import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CommandProvider } from '../CommandProvider'
import { useCurrentPage, useRegisterPage, useSetPage } from './pagesHooks'
import { PageType } from '../utils'

const PageAdderOne = ({ enabled = true }) => {
  useRegisterPage('Page one', { type: PageType.Commands, sections: [] }, { enabled })
  const setPage = useSetPage()

  useEffect(() => {
    if (enabled) {
      setPage('Page one')
    }
  }, [enabled])

  return <div>Page Adder One</div>
}

const TogglePageAdder = () => {
  const [mounted, setIsMounted] = useState(true)

  return (
    <>
      <button onClick={() => setIsMounted((mounted) => !mounted)}>
        {mounted ? 'Dismount' : 'Mount'}
      </button>
      {mounted && <PageAdderOne />}
    </>
  )
}

const TogglePageEnabled = () => {
  const [enabled, setIsEnabled] = useState(true)

  return (
    <>
      <button onClick={() => setIsEnabled((enabled) => !enabled)}>
        {enabled ? 'Disable' : 'Enable'}
      </button>
      <PageAdderOne enabled={enabled} />
    </>
  )
}

const PageDisplay = () => {
  const currentPage = useCurrentPage()

  return <div data-testid="current-page">{currentPage?.name ?? '[None]'}</div>
}

describe('useRegisterPage', () => {
  it('registers a page on mount', async () => {
    act(() => {
      render(
        <CommandProvider>
          <PageAdderOne />
          <PageDisplay />
        </CommandProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page one')
    })
  })

  it("doesn't register a page on mount if disabled", async () => {
    act(() => {
      render(
        <CommandProvider>
          <PageAdderOne enabled={false} />
          <PageDisplay />
        </CommandProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('[None]')
    })
  })

  it('unregisters a page on dismount', async () => {
    act(() => {
      render(
        <CommandProvider>
          <TogglePageAdder />
          <PageDisplay />
        </CommandProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page one')
    })

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('[None]')
    })
  })

  it('unregisters and reregisters a page if disabled toggled', async () => {
    act(() => {
      render(
        <CommandProvider>
          <TogglePageEnabled />
          <PageDisplay />
        </CommandProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page one')
    })

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('[None]')
    })

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page one')
    })
  })
})
