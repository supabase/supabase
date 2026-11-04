// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DocsSidebarNav,
  DocsSidebarNavProvider,
  DocsSidebarNavTop,
  DocsSidebarResources,
} from './DocsSidebarNav'
import { useDocsSidebarNav } from './DocsSidebarNavContext'
import * as currentNavItems from './NavigationMenu.constants'
import { useNavItems } from '@/features/IaNav'
import * as option1NavItems from '@/features/IaNav/option1.constants'

vi.mock('@/features/IaNav', () => ({
  useIaNavReady: () => true,
  useNavItems: vi.fn(),
}))

const navigation = vi.hoisted(() => ({ pathname: '/guides/database/overview' }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

const LevelDepth = () => <p>{`depth ${useDocsSidebarNav().stack.length}`}</p>

const renderSidebar = () =>
  render(
    <DocsSidebarNavProvider hasSectionMenu>
      <DocsSidebarNavTop />
      <DocsSidebarNav>page tree</DocsSidebarNav>
      <LevelDepth />
    </DocsSidebarNavProvider>
  )

describe('DocsSidebarNav', () => {
  afterEach(cleanup)

  beforeEach(() => {
    navigation.pathname = '/guides/database/overview'
    vi.mocked(useNavItems).mockReturnValue(currentNavItems)
  })

  it('starts at the section list on a page outside every section', () => {
    navigation.pathname = '/'

    renderSidebar()

    expect(screen.getByText('depth 1')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /back to/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/')
  })

  it('opens the levels of the page from the option-1 nav for option-1 visitors', () => {
    navigation.pathname = '/guides/local-development'
    vi.mocked(useNavItems).mockReturnValue(option1NavItems)

    renderSidebar()

    expect(screen.getByRole('button', { name: 'Back to Develop and deploy' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Local Development and CLI' })).toBeTruthy()
  })

  it('goes back one level and names the level it goes to', () => {
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Back to Products' }))

    expect(screen.getByText('depth 2')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Products, back to Home' })).toBeTruthy()
  })

  it('links a product row to its overview and opens its pages', () => {
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Back to Products' }))
    const authRow = screen.getByRole('link', { name: 'Auth' })
    fireEvent.click(authRow)

    expect(authRow.getAttribute('href')).toBe('/guides/auth')
    expect(screen.getByRole('link', { name: 'Password-based' })).toBeTruthy()
  })

  it('starts reference pages at the reference list with no way back to the docs levels', () => {
    navigation.pathname = '/reference/javascript'

    renderSidebar()

    expect(screen.getByText('depth 1')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'JavaScript' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Sidebar levels' })).toBeNull()
  })

  it('keeps only the glossary, changelog and contributing links in the footer', () => {
    render(<DocsSidebarResources />)

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Glossary',
      'Changelog',
      'Contributing',
    ])
  })
})
