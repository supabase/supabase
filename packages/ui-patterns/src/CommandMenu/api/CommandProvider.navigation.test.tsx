import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommandProvider } from './CommandProvider'
import {
  useCommandMenuInitiated,
  useCommandMenuOpen,
  useToggleCommandMenu,
} from './hooks/viewHooks'

type RouteHandler = (url: string, options?: { shallow?: boolean }) => void

const legacyRouter = vi.hoisted(() => {
  const handlers = new Map<string, Set<RouteHandler>>()

  return {
    events: {
      on: (type: string, handler: RouteHandler) => {
        handlers.set(type, (handlers.get(type) ?? new Set()).add(handler))
      },
      off: (type: string, handler: RouteHandler) => {
        handlers.get(type)?.delete(handler)
      },
    },
    emit(type: string, url: string, options?: { shallow?: boolean }) {
      handlers.get(type)?.forEach((handler) => handler(url, options))
    },
    reset() {
      handlers.clear()
    },
  }
})

vi.mock('next/compat/router', () => ({
  useRouter: () => legacyRouter,
}))

const MenuProbe = () => {
  const isInitiated = useCommandMenuInitiated()
  const isOpen = useCommandMenuOpen()
  const toggleOpen = useToggleCommandMenu()

  return (
    <>
      <span>{isInitiated ? 'initiated' : 'idle'}</span>
      <span>{isOpen ? 'open' : 'closed'}</span>
      {isInitiated && <span>menu-mounted</span>}
      <button type="button" onClick={() => toggleOpen()}>
        Toggle menu
      </button>
    </>
  )
}

const renderMenu = () =>
  render(
    <CommandProvider openKey="">
      <MenuProbe />
    </CommandProvider>
  )

const completeRoute = async (url: string, options?: { shallow?: boolean }) => {
  await act(async () => {
    legacyRouter.emit('routeChangeComplete', url, options)
  })
}

describe('CloseOnNavigation', () => {
  beforeEach(() => {
    legacyRouter.reset()
  })

  it('does not mount the command menu on a shallow search update', async () => {
    renderMenu()

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.queryByText('menu-mounted')).not.toBeInTheDocument()

    await completeRoute('/project/ref/editor?schema=auth', { shallow: true })

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.queryByText('menu-mounted')).not.toBeInTheDocument()
  })

  it('mounts the command menu after a real navigation', async () => {
    renderMenu()

    await completeRoute('/project/ref/sql', { shallow: false })

    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()
  })

  it('mounts the command menu when the completion omits shallow', async () => {
    renderMenu()

    await completeRoute('/project/ref/sql')

    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()
  })

  it('keeps an open menu open across a shallow search update and closes it on a real navigation', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))

    expect(screen.getByText('initiated')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()

    await completeRoute('/project/ref/editor?schema=auth', { shallow: true })

    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('menu-mounted')).toBeInTheDocument()

    await completeRoute('/project/ref/sql', { shallow: false })

    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('initiated')).toBeInTheDocument()
  })
})
