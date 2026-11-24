// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

// helpers.ts reads matchMedia on import, and jsdom has no matchMedia
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
}))

const { SIGNED_IN_HINT_SCRIPT, STORAGE_KEY } = await import('./gotrue')

const AVATAR_URL = 'https://avatars.example.com/reader.png'

const runHintScript = () => new Function(SIGNED_IN_HINT_SCRIPT)()

const storeSession = (userMetadata: Record<string, unknown>) => {
  localStorage.setItem(STORAGE_KEY, '{}')
  localStorage.setItem(
    `${STORAGE_KEY}-user`,
    JSON.stringify({ user: { id: 'user-1', user_metadata: userMetadata } })
  )
}

const isMarked = () => document.documentElement.hasAttribute('data-signed-in')

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('data-signed-in')
  document.documentElement.style.removeProperty('--signed-in-avatar')
})

it('marks the page and its avatar when a dashboard session is stored', () => {
  storeSession({ avatar_url: AVATAR_URL })
  runHintScript()

  expect(isMarked()).toBe(true)
  expect(document.documentElement.style.getPropertyValue('--signed-in-avatar')).toBe(
    `url("${AVATAR_URL}")`
  )
})

it('marks the page when the stored user is corrupt', () => {
  localStorage.setItem(STORAGE_KEY, '{}')
  localStorage.setItem(`${STORAGE_KEY}-user`, '{not json')
  runHintScript()

  expect(isMarked()).toBe(true)
})

it('leaves the page unmarked when no session is stored', () => {
  runHintScript()

  expect(isMarked()).toBe(false)
})

it('does not throw when the browser blocks site storage', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Access is denied for this document.', 'SecurityError')
  })

  expect(runHintScript).not.toThrow()
})
