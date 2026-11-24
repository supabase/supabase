import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameworkProvider, useFramework, type FrameworkContextValue } from 'common'
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { describe, expect, it } from 'vitest'

import { CommandProvider } from './CommandProvider'
import { useCrossCompatRouter } from './hooks/useCrossCompatRouter'
import {
  useCommandMenuInitiated,
  useCommandMenuOpen,
  useSetCommandMenuOpen,
} from './hooks/viewHooks'

const MenuProbe = ({ pushTo }: { pushTo?: string }) => {
  const isInitiated = useCommandMenuInitiated()
  const isOpen = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()
  const router = useCrossCompatRouter()
  const { asPath } = useFramework()

  return (
    <>
      <span>{isInitiated ? 'initiated' : 'idle'}</span>
      <span>{isOpen ? 'open' : 'closed'}</span>
      <span>{`path:${asPath}`}</span>
      {isInitiated && <span>menu-mounted</span>}
      <button type="button" onClick={() => setOpen(true)}>
        Open menu
      </button>
      {pushTo !== undefined && (
        <button type="button" onClick={() => router.push(pushTo)}>
          Navigate
        </button>
      )}
    </>
  )
}

const MenuTree = ({ pushTo }: { pushTo?: string }) => (
  <CommandProvider openKey="">
    <MenuProbe pushTo={pushTo} />
  </CommandProvider>
)

const renderMenu = (initialPath = '/project/ref') => {
  let asPath = initialPath
  const utils = render(<MenuTree />, {
    wrapper: ({ children }) => <FrameworkProvider value={{ asPath }}>{children}</FrameworkProvider>,
  })

  const navigate = async (url: string) => {
    asPath = url
    await act(async () => {
      utils.rerender(<MenuTree />)
    })
  }

  return { ...utils, navigate }
}

/**
 * Mimics the Next Pages Router: `push` renders the new route inside `startTransition` after a
 * tick and resolves only once that render has committed.
 */
const PagesRouterLikeProvider = ({
  initialPath,
  children,
}: PropsWithChildren<{ initialPath: string }>) => {
  const [route, setRoute] = useState({ asPath: initialPath })
  const resolveOnCommit = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    resolveOnCommit.current?.()
    resolveOnCommit.current = null
  }, [route])

  const value = useMemo<FrameworkContextValue>(
    () => ({
      asPath: route.asPath,
      push: (path) =>
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolveOnCommit.current = () => resolve(true)
            startTransition(() => setRoute({ asPath: path }))
          }, 0)
        }),
    }),
    [route]
  )

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}

describe('CommandProvider', () => {
  it('keeps a child mounted when its children change from one element to a fragment', () => {
    let mounts = 0
    const MountCounter = () => {
      useEffect(() => {
        mounts += 1
      }, [])
      return null
    }

    const { rerender } = render(
      <CommandProvider openKey="">
        <MountCounter />
      </CommandProvider>
    )
    rerender(
      <CommandProvider openKey="">
        <>
          <MountCounter />
          <span>sibling</span>
        </>
      </CommandProvider>
    )

    expect(screen.getByText('sibling')).toBeInTheDocument()
    expect(mounts).toBe(1)
  })
})

describe('CloseOnNavigation', () => {
  it('does not initiate a never-opened menu on a real navigation', async () => {
    const { navigate } = renderMenu()

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.queryByText('menu-mounted')).not.toBeInTheDocument()

    await navigate('/project/ref/sql')

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.queryByText('menu-mounted')).not.toBeInTheDocument()
  })

  it('does not initiate a never-opened menu on a shallow query navigation', async () => {
    const { navigate } = renderMenu('/project/ref/editor')

    await navigate('/project/ref/editor?schema=auth')

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.queryByText('menu-mounted')).not.toBeInTheDocument()
  })

  it('initiates and mounts when opened', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()
  })

  it('closes an open menu on a real navigation without unmounting it', async () => {
    const user = userEvent.setup()
    const { navigate } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await navigate('/project/ref/sql')

    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()
  })

  it('closes an open menu on a shallow query navigation', async () => {
    const user = userEvent.setup()
    const { navigate } = renderMenu('/project/ref/editor')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await navigate('/project/ref/editor?schema=auth')

    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()
  })
})

describe('useCrossCompatRouter', () => {
  it('completes a Pages Router navigation that commits inside a transition and closes the menu', async () => {
    const user = userEvent.setup()
    render(
      <PagesRouterLikeProvider initialPath="/guides">
        <MenuTree pushTo="/guides/auth" />
      </PagesRouterLikeProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByText('open')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Navigate' }))

    expect(await screen.findByText('path:/guides/auth')).toBeInTheDocument()
    expect(await screen.findByText('closed')).toBeInTheDocument()
  })

  it('closes the menu once a push to the current URL settles', async () => {
    const user = userEvent.setup()
    render(
      <PagesRouterLikeProvider initialPath="/guides">
        <MenuTree pushTo="/guides" />
      </PagesRouterLikeProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('button', { name: 'Navigate' }))

    expect(await screen.findByText('closed')).toBeInTheDocument()
    expect(screen.getByText('path:/guides')).toBeInTheDocument()
  })

  it('closes the menu when push returns nothing (Next App Router)', async () => {
    const user = userEvent.setup()
    render(
      <FrameworkProvider value={{ asPath: '/guides', push: () => {} }}>
        <MenuTree pushTo="/guides?tab=js" />
      </FrameworkProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('button', { name: 'Navigate' }))

    expect(await screen.findByText('closed')).toBeInTheDocument()
  })
})
