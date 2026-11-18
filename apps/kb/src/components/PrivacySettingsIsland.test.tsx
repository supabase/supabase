// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { PrivacySettingsIsland } from './PrivacySettingsIsland'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

describe('PrivacySettingsIsland', () => {
  let root: Root | undefined

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
    document.cookie = '_sb_country=; max-age=0'
  })

  it('opens the privacy settings dialog from the footer link', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<PrivacySettingsIsland />))

    const link = container.querySelector('button')
    expect(link?.textContent).toBe('Do Not Sell or Share My Personal Information')
    expect(link?.querySelector('span')?.classList.contains('invisible')).toBe(false)

    await act(async () => link!.click())

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Privacy Settings')
  })

  it('keeps the Privacy Settings label for non-US visitors', () => {
    document.cookie = '_sb_country=DE'
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<PrivacySettingsIsland />))

    expect(container.querySelector('button')?.textContent).toBe('Privacy Settings')
  })
})
