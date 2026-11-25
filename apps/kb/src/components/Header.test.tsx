// @vitest-environment jsdom
import { gotrueClient, STORAGE_KEY } from 'common/gotrue'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from './Header'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

// the same structure as Layout.astro: the header island and the toc share a sticky wrapper
const mountPage = () => {
  document.body.innerHTML =
    '<div class="sticky"><div id="island"></div><div id="toc"></div></div><main><h1 data-page-title="Set up the tool">Set up the tool</h1></main><footer></footer>'
  const root = createRoot(document.getElementById('island')!)
  act(() => root.render(<Header topics={[]} currentPath="/kb" />))
  return root
}

const menuButton = () =>
  document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-menu"]')!
const isInert = (selector: string) => document.querySelector(selector)!.hasAttribute('inert')

let onIntersect: (entries: Array<{ isIntersecting: boolean }>) => void = () => {}

const SIGNED_IN_USER = { id: 'user-1', aud: 'authenticated', email: 'reader@example.com' }

const storeSession = () => {
  const session = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: SIGNED_IN_USER,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  localStorage.setItem(`${STORAGE_KEY}-user`, JSON.stringify({ user: SIGNED_IN_USER }))
}

const SIGNED_OUT_LINKS = {
  header: [{ label: 'Sign up', href: 'https://supabase.com/dashboard/sign-up' }],
  drawer: [
    { label: 'Sign in', href: 'https://supabase.com/dashboard/sign-in' },
    { label: 'Start your project', href: 'https://supabase.com/dashboard/sign-up' },
  ],
}

const SIGNED_IN_LINKS = {
  header: [{ label: 'Dashboard', href: 'https://supabase.com/dashboard/projects' }],
  drawer: [{ label: 'Dashboard', href: 'https://supabase.com/dashboard/projects' }],
}

const accountLinks = () => {
  const visibleLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>('a[href*="/dashboard/"]'),
  ].filter((link) => !link.closest('[hidden]'))
  const toEntry = (link: HTMLAnchorElement) => ({
    label: link.textContent,
    href: link.getAttribute('href'),
  })
  return {
    header: visibleLinks.filter((link) => !link.closest('#mobile-menu')).map(toEntry),
    drawer: visibleLinks.filter((link) => link.closest('#mobile-menu')).map(toEntry),
  }
}

const settleAuth = () => act(() => gotrueClient.getSession())

describe('Header', () => {
  let root: Root | undefined

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof onIntersect) {
          onIntersect = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
    localStorage.clear()
    document.documentElement.removeAttribute('data-signed-in')
    vi.unstubAllGlobals()
  })

  it('makes the page under the open menu inert and keeps the header reachable', () => {
    root = mountPage()

    act(() => menuButton().click())
    expect(['#toc', 'main', 'footer'].map(isInert)).toEqual([true, true, true])
    expect(menuButton().closest('[inert]')).toBeNull()

    act(() => menuButton().click())
    expect(['#toc', 'main', 'footer'].map(isInert)).toEqual([false, false, false])
  })

  it('closes on escape, moves focus to the menu button and restores scroll', () => {
    root = mountPage()

    act(() => menuButton().click())
    expect(document.documentElement.style.overflow).toBe('hidden')

    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(menuButton().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menuButton())
    expect(document.documentElement.style.overflow).toBe('')
    expect(isInert('main')).toBe(false)
  })

  it('rolls the logo to the article title once the title scrolls under the header', () => {
    root = mountPage()
    const header = () => document.querySelector('nav [data-roll-role="current"]')!.textContent

    act(() => onIntersect([{ isIntersecting: false }]))
    expect(header()).toContain('Set up the tool')

    act(() => onIntersect([{ isIntersecting: true }]))
    expect(header()).not.toContain('Set up the tool')
  })

  it('links a signed-out reader to sign up', async () => {
    root = mountPage()
    await settleAuth()

    expect(accountLinks()).toEqual(SIGNED_OUT_LINKS)
  })

  it('links a reader with a dashboard session to the dashboard', async () => {
    storeSession()
    root = mountPage()

    await vi.waitFor(async () => {
      await settleAuth()
      expect(accountLinks()).toEqual(SIGNED_IN_LINKS)
    })
  })

  it('signs the reader out and announces it to screen readers', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 204 }))
    storeSession()
    root = mountPage()
    await vi.waitFor(async () => {
      await settleAuth()
      expect(accountLinks()).toEqual(SIGNED_IN_LINKS)
    })

    const accountMenu = document.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!
    act(() =>
      accountMenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    )
    const signOut = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (item) => item.textContent === 'Sign out'
    )!
    act(() => signOut.click())

    await vi.waitFor(async () => {
      await act(async () => {})
      expect(document.querySelector('[role="status"]')?.textContent).toBe('Signed out')
      expect(accountLinks()).toEqual(SIGNED_OUT_LINKS)
    })
  })

  it('keeps focus on the header link when auth settles', async () => {
    root = mountPage()
    const signUp = [...document.querySelectorAll<HTMLAnchorElement>('nav a')].find(
      (link) => link.textContent === 'Sign up'
    )!
    signUp.focus()
    expect(document.activeElement).toBe(signUp)
    await settleAuth()

    expect(document.activeElement).toBe(signUp)
  })

  it('keeps focus on the drawer link when auth settles', async () => {
    storeSession()
    document.documentElement.setAttribute('data-signed-in', '')
    root = mountPage()
    act(() => menuButton().click())

    expect(accountLinks().drawer).toEqual([...SIGNED_OUT_LINKS.drawer, ...SIGNED_IN_LINKS.drawer])
    const dashboard = [...document.querySelectorAll<HTMLAnchorElement>('#mobile-menu a')].find(
      (link) => link.textContent === 'Dashboard'
    )!
    dashboard.focus()
    expect(document.activeElement).toBe(dashboard)

    await vi.waitFor(async () => {
      await settleAuth()
      expect(accountLinks()).toEqual(SIGNED_IN_LINKS)
    })
    expect(document.activeElement).toBe(dashboard)
  })
})
