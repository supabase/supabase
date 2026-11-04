// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocsSectionsMenu } from './DocsSectionsMenu'
import { SidebarTopSlotProvider, useSidebarTopSlot } from '~/layouts/SidebarTopSlot'

vi.mock('next/navigation', () => ({ usePathname: () => '/guides/database/overview' }))

const openMenu = () => {
  render(<DocsSectionsMenu />)
  fireEvent.click(screen.getByRole('button', { name: 'Docs' }))
}

const SidebarTop = () => <div ref={useSidebarTopSlot().setTarget} />

const openMenuInSidebar = () => {
  render(
    <SidebarTopSlotProvider>
      <DocsSectionsMenu />
      <SidebarTop />
    </SidebarTopSlotProvider>
  )
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

  it('closes when the trigger is pressed while the menu is open', () => {
    openMenu()

    const trigger = screen.getByRole('button', { name: 'Docs' })
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)

    expect(queryMenu()).toBeNull()
  })

  it('closes on escape and returns focus to the trigger', () => {
    openMenu()

    fireEvent.keyDown(screen.getByRole('link', { name: 'Reference' }), { key: 'Escape' })

    expect(queryMenu()).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Docs' }))
  })

  it('moves tab between the trigger and the menu when the menu opens in the sidebar', () => {
    openMenuInSidebar()
    const trigger = screen.getByRole('button', { name: 'Docs' })
    const firstLink = screen.getByRole('link', { name: 'Docs' })

    fireEvent.keyDown(trigger, { key: 'Tab' })
    expect(document.activeElement).toBe(firstLink)

    fireEvent.keyDown(firstLink, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(trigger)
  })
})
