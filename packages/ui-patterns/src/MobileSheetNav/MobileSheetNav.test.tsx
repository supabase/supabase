import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameworkProvider } from 'common'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetNav } from './MobileSheetNav'

const mockRouter = { asPath: '/initial' }
const mockWindowSize = vi.hoisted(() => ({ width: 400 }))

vi.mock('react-use', () => ({
  useWindowSize: () => mockWindowSize,
}))

function FrameworkWrapper({ children }: { children: React.ReactNode }) {
  return <FrameworkProvider value={{ asPath: mockRouter.asPath }}>{children}</FrameworkProvider>
}

function renderWithFramework(ui: React.ReactElement) {
  return render(ui, { wrapper: FrameworkWrapper })
}

function MobileSheetNavWithState({
  shouldCloseOnRouteChange = true,
  shouldCloseOnQueryChange = true,
  shouldCloseOnViewportResize = true,
  children = <div>Nav content</div>,
}: {
  shouldCloseOnRouteChange?: boolean
  shouldCloseOnQueryChange?: boolean
  shouldCloseOnViewportResize?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(true)
  }, [])
  return (
    <>
      <span data-testid="sheet-open">{String(open)}</span>
      <MobileSheetNav
        open={open}
        onOpenChange={setOpen}
        shouldCloseOnRouteChange={shouldCloseOnRouteChange}
        shouldCloseOnQueryChange={shouldCloseOnQueryChange}
        shouldCloseOnViewportResize={shouldCloseOnViewportResize}
      >
        {children}
      </MobileSheetNav>
    </>
  )
}

describe('MobileSheetNav', () => {
  const defaultProps = {
    onOpenChange: vi.fn(),
    children: <div>Nav content</div>,
  }

  beforeEach(() => {
    mockRouter.asPath = '/initial'
    mockWindowSize.width = 400
  })

  describe('shouldCloseOnRouteChange', () => {
    it('calls onOpenChange(false) when route changes and shouldCloseOnRouteChange is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )

      onOpenChange.mockClear()
      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on route change when shouldCloseOnRouteChange is true', async () => {
      const { rerender } = renderWithFramework(<MobileSheetNavWithState />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNavWithState />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('false')
      })
    })

    it('effectively does NOT close the sheet on route change when shouldCloseOnRouteChange is false', async () => {
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnRouteChange={false} />
      )

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(<MobileSheetNavWithState shouldCloseOnRouteChange={false} />)
      })

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })

    it('does not call onOpenChange when route changes if shouldCloseOnRouteChange is false', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav
          {...defaultProps}
          onOpenChange={onOpenChange}
          shouldCloseOnRouteChange={false}
        />
      )

      onOpenChange.mockClear()
      mockRouter.asPath = '/other-page'
      act(() => {
        rerender(
          <MobileSheetNav
            {...defaultProps}
            onOpenChange={onOpenChange}
            shouldCloseOnRouteChange={false}
          />
        )
      })

      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })

  describe('query changes', () => {
    it('closes the sheet for query navigation by default', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )
      onOpenChange.mockClear()
      mockRouter.asPath = '/initial?type=wrappers'
      rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('keeps filters open when opted out, and closes on path navigation', async () => {
      mockRouter.asPath = '/project/default/issues'
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnQueryChange={false} />
      )
      expect(await screen.findByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues?q=function'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      expect(screen.getByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      expect(screen.getByText('Nav content')).toBeInTheDocument()

      mockRouter.asPath = '/project/default/issues/function_search_path_mutable'
      rerender(<MobileSheetNavWithState shouldCloseOnQueryChange={false} />)
      await waitFor(() => expect(screen.queryByText('Nav content')).not.toBeInTheDocument())
    })
  })

  describe('link taps', () => {
    // Router links prevent the default navigation, so the asPath has not changed yet on tap.
    const RouterLink = ({ href, ...props }: React.ComponentProps<'a'> & { href: string }) => (
      <a href={href} onClick={(event) => event.preventDefault()} {...props} />
    )

    it('closes the sheet as soon as an internal link is tapped', async () => {
      const user = userEvent.setup()
      renderWithFramework(
        <MobileSheetNavWithState>
          <RouterLink href="/other-page">Other page</RouterLink>
        </MobileSheetNavWithState>
      )

      await user.click(await screen.findByRole('link', { name: 'Other page' }))

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('false')
    })

    it('keeps the sheet open for new tabs, external links, and opted-out query links', async () => {
      const user = userEvent.setup()
      renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnQueryChange={false}>
          <RouterLink href="/other-page" target="_blank">
            New tab
          </RouterLink>
          <RouterLink href="https://example.com/docs">External</RouterLink>
          <RouterLink href={`${window.location.pathname}?q=function`}>Filter</RouterLink>
        </MobileSheetNavWithState>
      )

      await user.click(await screen.findByRole('link', { name: 'New tab' }))
      await user.click(screen.getByRole('link', { name: 'External' }))
      await user.click(screen.getByRole('link', { name: 'Filter' }))

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })

    it('keeps the sheet open on link taps when shouldCloseOnRouteChange is false', async () => {
      const user = userEvent.setup()
      renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnRouteChange={false}>
          <RouterLink href="/other-page">Other page</RouterLink>
        </MobileSheetNavWithState>
      )

      await user.click(await screen.findByRole('link', { name: 'Other page' }))

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })
  })

  describe('shouldCloseOnViewportResize', () => {
    it('calls onOpenChange(false) when width changes and shouldCloseOnViewportResize is true (default)', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />
      )

      onOpenChange.mockClear()
      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNav {...defaultProps} onOpenChange={onOpenChange} />)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('effectively closes the sheet on viewport resize when shouldCloseOnViewportResize is true', async () => {
      const { rerender } = renderWithFramework(<MobileSheetNavWithState />)

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNavWithState />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('false')
      })
    })

    it('effectively does NOT close the sheet on viewport resize when shouldCloseOnViewportResize is false', async () => {
      const { rerender } = renderWithFramework(
        <MobileSheetNavWithState shouldCloseOnViewportResize={false} />
      )

      await waitFor(() => {
        expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
      })

      mockWindowSize.width = 800
      act(() => {
        rerender(<MobileSheetNavWithState shouldCloseOnViewportResize={false} />)
      })

      expect(screen.getByTestId('sheet-open')).toHaveTextContent('true')
    })

    it('does not call onOpenChange when width changes if shouldCloseOnViewportResize is false', () => {
      const onOpenChange = vi.fn()
      const { rerender } = renderWithFramework(
        <MobileSheetNav
          {...defaultProps}
          onOpenChange={onOpenChange}
          shouldCloseOnViewportResize={false}
        />
      )

      onOpenChange.mockClear()
      mockWindowSize.width = 800
      act(() => {
        rerender(
          <MobileSheetNav
            {...defaultProps}
            onOpenChange={onOpenChange}
            shouldCloseOnViewportResize={false}
          />
        )
      })

      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })
})
