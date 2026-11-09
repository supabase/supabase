// @vitest-environment jsdom
import { consentState } from 'common/consent-state'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { GuideSidebar } from './GuideSidebar'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

vi.mock('common/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common/constants')>()),
  IS_PLATFORM: true,
}))

describe('GuideSidebar AI tools telemetry', () => {
  let root: Root | undefined
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    globalThis.IntersectionObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
  })

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(new Response('# guide')))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', { clipboard: { writeText: () => Promise.resolve() } })
    consentState.hasConsented = true
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <GuideSidebar
          items={[]}
          pageUrl="https://supabase.com/kb/guides/a"
          markdownUrl="/kb/guides/a.md"
        />
      )
    )
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    consentState.hasConsented = false
    vi.unstubAllGlobals()
  })

  const sent = () =>
    fetchMock.mock.calls
      .filter(([url]) => String(url).endsWith('/telemetry/event'))
      .map(([, init]) => ({ ...JSON.parse(init.body), keepalive: init.keepalive }))

  const clickItem = async (name: string) => {
    const item = [...document.querySelectorAll<HTMLElement>('a, button')].find(
      (element) => element.textContent === name
    )!
    item.addEventListener('click', (event) => event.preventDefault())
    await act(async () => item.click())
  }

  it.each([
    {
      name: 'Connect your AI agent',
      event: { action: 'agent_setup_clicked', keepalive: true },
    },
    {
      name: 'Copy as Markdown',
      event: { action: 'copy_as_markdown_clicked', custom_properties: { pageType: 'kb' } },
    },
    {
      name: 'Ask ChatGPT',
      event: { action: 'ask_ai_clicked', custom_properties: { agent: 'chatgpt', pageType: 'kb' } },
    },
    {
      name: 'Ask Claude',
      event: { action: 'ask_ai_clicked', custom_properties: { agent: 'claude', pageType: 'kb' } },
    },
  ])('sends $event.action when $name is clicked', async ({ name, event }) => {
    await clickItem(name)

    expect(sent()).toHaveLength(1)
    expect(sent()[0]).toMatchObject(event)
  })
})
