// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageActionButtons } from './PageActionButtons'

const navigation = vi.hoisted(() => ({ pathname: '/guides/getting-started' }))
const sendTelemetryEvent = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }))
vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))

const MARKDOWN_URL = 'https://supabase.com/docs/guides/getting-started.md'

const renderActions = () =>
  render(
    <TooltipProvider>
      <PageActionButtons />
    </TooltipProvider>
  )

const openPageActionsMenu = () =>
  fireEvent.keyDown(screen.getByRole('button', { name: 'More page actions' }), { key: 'Enter' })

const stubMarkdownFetch = (isOk: boolean) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: isOk, text: async () => '# Getting started' }))
  )

describe('PageActionButtons', () => {
  // radix and the clipboard helper use browser APIs that jsdom does not have
  beforeEach(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } })
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
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
      properties: { pageType: 'guide', origin: 'page_actions_button' },
    })
  })

  it('reuses the markdown it loaded on hover for the copy', async () => {
    navigation.pathname = '/guides/getting-started'
    stubMarkdownFetch(true)

    renderActions()
    const copyButton = screen.getByRole('button', { name: 'Copy page' })
    fireEvent.pointerEnter(copyButton)
    fireEvent.click(copyButton)

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Getting started')
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('counts no copy when the markdown fails to load', async () => {
    navigation.pathname = '/guides/getting-started'
    stubMarkdownFetch(false)

    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it('shows the check before the button takes the last used action, and keeps it after a reload', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    navigation.pathname = '/guides/getting-started'

    const { unmount } = renderActions()
    openPageActionsMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: /copy markdown url/i }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())

    expect(screen.getByRole('status').textContent).toBe('Copied to clipboard')
    expect(screen.getByRole('button', { name: 'Copy page' })).toBeTruthy()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('button', { name: 'Copy Markdown URL' })).toBeTruthy()
    vi.useRealTimers()
    unmount()
    vi.mocked(navigator.clipboard.writeText).mockClear()
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown URL' }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MARKDOWN_URL))
  })

  it('asks claude about the page and counts the click', async () => {
    navigation.pathname = '/guides/getting-started'

    renderActions()
    openPageActionsMenu()
    const askClaude = await screen.findByRole('menuitem', { name: /ask claude/i })
    fireEvent.click(askClaude)

    expect(askClaude.getAttribute('href')).toContain(
      encodeURIComponent('https://supabase.com/docs/guides/getting-started')
    )
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'ask_ai_clicked',
      properties: { agent: 'claude', pageType: 'guide', origin: 'page_actions_menu' },
    })
  })
})
