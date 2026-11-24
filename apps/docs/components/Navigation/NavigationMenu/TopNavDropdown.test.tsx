// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AuthProvider } from 'common/auth'
import { gotrueClient, STORAGE_KEY } from 'common/gotrue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DocsTopNavDropdown from './TopNavDropdown'

// helpers.ts reads matchMedia on import, and jsdom has no matchMedia
vi.hoisted(() =>
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
)

const AVATAR_URL = 'https://avatars.example.com/reader.png'

const SIGNED_IN_USER = {
  id: 'user-1',
  aud: 'authenticated',
  email: 'reader@example.com',
}

const storeSession = (avatarUrl = AVATAR_URL) => {
  const user = { ...SIGNED_IN_USER, user_metadata: { avatar_url: avatarUrl } }
  const session = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  localStorage.setItem(`${STORAGE_KEY}-user`, JSON.stringify({ user }))
}

const renderMenu = async () => {
  render(
    <AuthProvider>
      <DocsTopNavDropdown />
    </AuthProvider>
  )
  await act(() => gotrueClient.getSession())
}

const openMenu = () =>
  fireEvent.keyDown(screen.getByRole('button', { name: 'Open menu' }), { key: 'Enter' })

const getAvatar = (trigger: HTMLElement) =>
  trigger.querySelector<HTMLElement>('[style*="background-image"]')

describe('DocsTopNavDropdown', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('shows the menu icon and no account items when signed out', async () => {
    await renderMenu()
    openMenu()

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(getAvatar(trigger)).toBeNull()
    expect(trigger.querySelector('svg[class*="lucide-menu"]')).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Account Preferences' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).toBeNull()
  })

  it('shows the avatar and account items when signed in', async () => {
    storeSession()
    await renderMenu()
    openMenu()

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(getAvatar(trigger)?.style.backgroundImage).toContain(AVATAR_URL)
    expect(trigger.querySelector('svg[class*="lucide-user"]')).not.toBeNull()
    expect(screen.getByText('reader@example.com')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Account Preferences' }).getAttribute('href')).toBe(
      'https://supabase.com/dashboard/account/me'
    )
    expect(screen.getByRole('menuitem', { name: 'All Projects' }).getAttribute('href')).toBe(
      'https://supabase.com/dashboard/projects'
    )
  })

  it('shows the person icon instead of a broken image when the avatar is empty', async () => {
    storeSession('')
    await renderMenu()

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(getAvatar(trigger)).toBeNull()
    expect(trigger.querySelector('svg[class*="lucide-user"]')).not.toBeNull()
  })

  it('ends the stored session on sign out', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 204 }))
    storeSession()
    await renderMenu()
    openMenu()

    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
