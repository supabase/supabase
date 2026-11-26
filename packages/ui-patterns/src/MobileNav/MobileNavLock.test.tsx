import { fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileNavLock } from './MobileNavLock'

const originalMatchMedia = window.matchMedia

const OpenNav = ({ onToggle }: { onToggle: () => void }) => {
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <nav>
        <button ref={toggleRef} type="button" onClick={onToggle}>
          Main menu
        </button>
      </nav>
      <div>
        <MobileNavLock toggleRef={toggleRef} />
        <a href="#drawer-link">Drawer link</a>
      </div>
      <button type="button">Popup item</button>
    </>
  )
}

const mockDesktopQuery = () => {
  const listeners: Array<(event: Pick<MediaQueryListEvent, 'matches'>) => void> = []
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: (
      _type: string,
      listener: (event: Pick<MediaQueryListEvent, 'matches'>) => void
    ) => listeners.push(listener),
    removeEventListener: vi.fn(),
  })
  return (matches: boolean) => {
    for (const listener of listeners) listener({ matches })
  }
}

describe('MobileNavLock', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('closes the nav on escape from inside the drawer', () => {
    const onToggle = vi.fn()
    render(<OpenNav onToggle={onToggle} />)

    fireEvent.keyDown(screen.getByText('Drawer link'), { key: 'Escape' })

    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('closes the nav on escape after a click moved focus to the body', () => {
    const onToggle = vi.fn()
    render(<OpenNav onToggle={onToggle} />)

    fireEvent.keyDown(document.body, { key: 'Escape' })

    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('leaves the nav open on escape from a popup outside the nav and drawer', () => {
    const onToggle = vi.fn()
    render(<OpenNav onToggle={onToggle} />)

    fireEvent.keyDown(screen.getByText('Popup item'), { key: 'Escape' })

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('leaves the nav open on keys other than escape', () => {
    const onToggle = vi.fn()
    render(<OpenNav onToggle={onToggle} />)

    fireEvent.keyDown(screen.getByText('Drawer link'), { key: 'Enter' })

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('closes the nav when the viewport reaches desktop width', () => {
    const changeViewport = mockDesktopQuery()
    const onToggle = vi.fn()
    render(<OpenNav onToggle={onToggle} />)

    changeViewport(false)
    expect(onToggle).not.toHaveBeenCalled()

    changeViewport(true)
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
