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
import { MenuId } from './NavigationMenu'
import * as currentNavItems from './NavigationMenu.constants'
import { getMenuId } from './NavigationMenu.utils'
import * as option1NavItems from '~/features/IaNav/option1.constants'
import { useNavItems } from '~/features/IaNav/useNavItems'

const navigation = vi.hoisted(() => ({ pathname: '/guides/database/overview' }))

vi.mock('~/features/IaNav/IaNavRouteProvider', () => ({
  useDocsPathname: () => navigation.pathname,
}))

vi.mock('~/features/IaNav/useIaNavReady', () => ({ useIaNavReady: () => true }))

vi.mock('~/features/IaNav/useNavItems', () => ({ useNavItems: vi.fn() }))

// the guide tree imports the IaNav barrel, and the variant hook there loads browser-only modules
vi.mock('~/features/IaNav/useIaNavVariant', () => ({ useIaNavVariant: () => 'control' }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

const LevelDepth = () => <p>{`depth ${useDocsSidebarNav().stack.length}`}</p>

const sidebar = (menuId = getMenuId(navigation.pathname)) => (
  <DocsSidebarNavProvider menuId={menuId}>
    <DocsSidebarNavTop />
    <DocsSidebarNav>page tree</DocsSidebarNav>
    <LevelDepth />
  </DocsSidebarNavProvider>
)

const renderSidebar = (menuId?: MenuId) => render(sidebar(menuId))

describe('DocsSidebarNav', () => {
  afterEach(cleanup)

  beforeEach(() => {
    navigation.pathname = '/guides/database/overview'
    vi.mocked(useNavItems).mockReturnValue(currentNavItems)
  })

  it('starts at the section list when no product holds the page', () => {
    navigation.pathname = '/'

    renderSidebar(MenuId.Contributing)

    expect(screen.getByText('depth 1')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /back to/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/')
  })

  it('follows the page levels again when Home links the current page', () => {
    navigation.pathname = '/'

    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /back to Home/ }))
    expect(screen.getByText('depth 1')).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: 'Home' }))

    expect(screen.getByText('depth 2')).toBeTruthy()
  })

  it('opens the levels of the page from the option-1 nav, with a getting started link its tree leaves out', () => {
    navigation.pathname = '/guides/local-development'
    vi.mocked(useNavItems).mockReturnValue(option1NavItems)

    renderSidebar()

    expect(
      screen.getByRole('button', { name: 'Local Development and CLI, back to Develop and deploy' })
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Getting Started' }).getAttribute('href')).toBe(
      '/guides/local-development'
    )
  })

  it('picks the option-1 product whose link is the page when products share a path', () => {
    navigation.pathname = '/guides/platform/backups'
    vi.mocked(useNavItems).mockReturnValue(option1NavItems)

    renderSidebar()

    expect(
      screen.getByRole('button', { name: 'Backups, restore and upgrades, back to Run and manage' })
    ).toBeTruthy()
  })

  it.each([
    ['/guides/realtime/broadcast', 'REST, GraphQL and Realtime APIs, back to Build'],
    ['/guides/deployment/terraform/tutorial', 'Terraform, back to Develop and deploy'],
  ])('opens the option-1 product whose tree holds %s', (pathname, backButtonName) => {
    navigation.pathname = pathname
    vi.mocked(useNavItems).mockReturnValue(option1NavItems)

    renderSidebar()

    expect(screen.getByRole('button', { name: backButtonName })).toBeTruthy()
  })

  it('marks only the product of the page as current when products share a path', () => {
    navigation.pathname = '/guides/platform/backups'
    vi.mocked(useNavItems).mockReturnValue(option1NavItems)

    renderSidebar()
    fireEvent.click(
      screen.getByRole('button', { name: 'Backups, restore and upgrades, back to Run and manage' })
    )

    const currentLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(currentLinks.map((link) => link.textContent)).toEqual(['Backups, restore and upgrades'])
  })

  it('keeps the level when a modified click opens a product in another tab', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Database, back to Products' }))

    fireEvent.click(screen.getByRole('link', { name: 'Auth' }), { metaKey: true })

    expect(screen.getByRole('button', { name: 'Products, back to Home' })).toBeTruthy()
  })

  it('links the resources home when the tree lists only the glossary', () => {
    navigation.pathname = '/guides/resources/glossary'

    renderSidebar()

    expect(screen.getByRole('link', { name: 'Getting Started' }).getAttribute('href')).toBe(
      '/guides/resources'
    )
  })

  it('names the resources level after its tree on the resources home', () => {
    navigation.pathname = '/guides/resources'

    renderSidebar()

    expect(screen.getByRole('button', { name: 'Resources, back to Home' })).toBeTruthy()
  })

  it('opens the levels of the new page after browsing away from the last one', () => {
    const { rerender } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Database, back to Products' }))

    navigation.pathname = '/guides/auth'
    rerender(sidebar())

    expect(screen.getByRole('button', { name: 'Auth, back to Products' })).toBeTruthy()
  })

  it('adds no getting started link when the tree already lists the home page', () => {
    renderSidebar()

    expect(screen.queryByRole('link', { name: 'Getting Started' })).toBeNull()
  })

  it('goes back one level and names the level it goes to', () => {
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Database, back to Products' }))

    expect(screen.getByText('depth 2')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Products, back to Home' })).toBeTruthy()
  })

  it('keeps keyboard focus in the sidebar when the focused back button goes away', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Database, back to Products' }))
    const backButton = screen.getByRole('button', { name: 'Products, back to Home' })

    backButton.focus()
    fireEvent.click(backButton)

    expect(backButton.isConnected).toBe(false)
    expect(document.activeElement).not.toBe(document.body)
  })

  it('links a product row to its overview and opens its pages', () => {
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Database, back to Products' }))
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

  it.each([
    ['/guides/resources', []],
    ['/guides/resources/glossary', ['Glossary']],
  ])('marks a footer link current only on its own page (%s)', (pathname, currentLabels) => {
    navigation.pathname = pathname

    render(<DocsSidebarResources />)

    const currentLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(currentLinks.map((link) => link.textContent)).toEqual(currentLabels)
  })
})
