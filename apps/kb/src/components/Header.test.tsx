// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from './Header'

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

  it('rolls the logo to the article title once the title scrolls under the header', () => {
    root = mountPage()
    const header = () => document.querySelector('nav [data-roll-role="current"]')!.textContent

    act(() => onIntersect([{ isIntersecting: false }]))
    expect(header()).toContain('Set up the tool')

    act(() => onIntersect([{ isIntersecting: true }]))
    expect(header()).not.toContain('Set up the tool')
  })
})
