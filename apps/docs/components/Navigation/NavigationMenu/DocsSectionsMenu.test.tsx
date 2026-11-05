// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocsSectionsMenu } from './DocsSectionsMenu'

// common reads matchMedia on import, and jsdom has none
vi.hoisted(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

vi.mock('next/navigation', () => ({ usePathname: () => '/guides/database/overview' }))

const openMenu = () => {
  render(<DocsSectionsMenu />)
  fireEvent.click(screen.getByRole('button', { name: 'Docs' }))
}

const queryMenu = () => screen.queryByRole('navigation', { name: 'Supabase sections' })

describe('DocsSectionsMenu', () => {
  afterEach(cleanup)

  it('closes when a press lands outside the menu', () => {
    openMenu()

    fireEvent.pointerDown(document.body)

    expect(queryMenu()).toBeNull()
  })

  it('stays open when a press lands inside the menu', () => {
    openMenu()

    fireEvent.pointerDown(screen.getByRole('link', { name: 'Reference' }))

    expect(queryMenu()).not.toBeNull()
  })
})
