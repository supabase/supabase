// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

describe('PrivacySettingsIsland', () => {
  let root: Root | undefined

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('opens the privacy settings dialog from the footer link', async () => {
    const { PrivacySettingsIsland } = await import('./PrivacySettingsIsland')

    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<PrivacySettingsIsland />))

    const link = container.querySelector('button')
    expect(link?.textContent).toBe('Privacy Settings')

    await act(async () => link!.click())

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Privacy Settings')
  })
})
