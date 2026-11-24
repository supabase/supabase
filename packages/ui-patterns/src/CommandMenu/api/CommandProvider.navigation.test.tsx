import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FrameworkProvider } from 'common'
import { describe, expect, it } from 'vitest'

import { CommandProvider } from './CommandProvider'
import {
  useCommandMenuInitiated,
  useCommandMenuOpen,
  useSetCommandMenuOpen,
} from './hooks/viewHooks'

const MenuProbe = () => {
  const isInitiated = useCommandMenuInitiated()
  const isOpen = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()

  return (
    <>
      <span>{isInitiated ? 'initiated' : 'idle'}</span>
      <span>{isOpen ? 'open' : 'closed'}</span>
      {isInitiated && <span>menu-mounted</span>}
      <button type="button" onClick={() => setOpen(true)}>
        Open menu
      </button>
    </>
  )
}

const renderMenu = (initialPath = '/project/ref') => {
  const utils = render(
    <FrameworkProvider value={{ asPath: initialPath, pathname: initialPath }}>
      <CommandProvider openKey="">
        <MenuProbe />
      </CommandProvider>
    </FrameworkProvider>
  )

  const navigate = async (url: string) => {
    await act(async () => {
      utils.rerender(
        <FrameworkProvider value={{ asPath: url, pathname: url.split(/[?#]/)[0] }}>
          <CommandProvider openKey="">
            <MenuProbe />
          </CommandProvider>
        </FrameworkProvider>
      )
    })
  }

  return { ...utils, navigate }
}

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
