// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AGENT_CLIENT_PARAM } from '~/features/ui/AgentPluginsPanel.data'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageActionButtons } from './PageActionButtons'

const renderActions = () =>
  render(
    <TooltipProvider>
      <PageActionButtons />
    </TooltipProvider>
  )

const navigation = vi.hoisted(() => ({
  pathname: '/guides/getting-started',
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}))
const sendTelemetryEvent = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}))
vi.mock('common', () => ({ useSearchParamsShallow: () => navigation.searchParams }))
vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))

const stubMarkdownFetch = (isOk: boolean) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: isOk, text: async () => '# Getting started' }))
  )

describe('PageActionButtons', () => {
  // cmdk and Radix lean on browser APIs jsdom doesn't ship
  beforeEach(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Element.prototype.scrollIntoView ??= () => {}
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } })
    navigation.searchParams = new URLSearchParams()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('offers the markdown actions on a guide with a markdown version', () => {
    navigation.pathname = '/guides/getting-started'

    renderActions()

    expect(screen.getByRole('button', { name: 'Copy page' })).toBeTruthy()
  })

  it('hides the markdown actions on a guide without a markdown version', () => {
    navigation.pathname = '/guides/local-development/cli/config'

    renderActions()

    expect(screen.queryByRole('button', { name: 'Copy page' })).toBeNull()
  })

  it('copies the markdown of the page and counts the copy', async () => {
    navigation.pathname = '/guides/getting-started'
    stubMarkdownFetch(true)

    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }))

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Getting started')
    )
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'copy_as_markdown_clicked',
      properties: { pageType: 'guide' },
    })
  })

  it('counts no copy when the markdown fails to load', async () => {
    navigation.pathname = '/guides/getting-started'
    stubMarkdownFetch(false)

    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it('switches the agent in place on its own setup page', () => {
    navigation.pathname = '/guides/ai-tools/plugins'

    renderActions()
    fireEvent.click(screen.getByRole('button', { name: /set up agent/i }))
    fireEvent.click(screen.getByRole('option', { name: /codex/i }))

    expect(navigation.searchParams.get(AGENT_CLIENT_PARAM)).toBe('codex')
    expect(navigation.push).not.toHaveBeenCalled()
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'agent_setup_clicked',
      properties: { agent: 'codex' },
    })
  })
})
