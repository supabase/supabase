// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DocsSearchV2State } from 'common'
import { TooltipProvider } from 'ui'
import { MessageRole, MessageStatus, type Message } from 'ui-patterns/CommandMenu/prepackaged/ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchV2Provider } from './SearchV2Provider'
import { SearchV2Trigger } from './SearchV2Trigger'

const sendTelemetryEvent = vi.fn()
const push = vi.fn()
const handleDocsSearchDebounced = vi.fn()
const resetSearch = vi.fn()
let searchState: DocsSearchV2State

vi.mock('@/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))
const aiMessages: Message[] = []
vi.mock('ui-patterns/CommandMenu/prepackaged/ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui-patterns/CommandMenu/prepackaged/ai')>()),
  useAiChat: () => ({
    submit: vi.fn(),
    reset: () => {},
    messages: aiMessages,
    isResponding: false,
    hasError: false,
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/link', () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: React.ComponentProps<'a'> & { prefetch?: boolean }) => <a {...props} />,
}))
const useDocsSearchV2 = vi.fn((_options: { endpoint: string }) => ({
  searchState,
  handleDocsSearchDebounced,
  resetSearch,
}))
vi.mock('common', () => ({
  useDocsSearchV2: (options: { endpoint: string }) => useDocsSearchV2(options),
}))

const result = {
  path: '/guides/auth',
  title: 'Auth',
  heading: 'Auth',
  excerpt: 'Learn about auth',
  headingPath: ['Auth'],
  score: 1,
}
const resultsState: DocsSearchV2State = {
  status: 'results',
  key: 1,
  results: [result],
  query: 'auth',
}

// cmdk and Radix lean on browser APIs jsdom doesn't ship
beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
  searchState = { status: 'initial', key: 0 }
  aiMessages.length = 0
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function TriggerWithProvider() {
  return (
    <SearchV2Provider>
      <SearchV2Trigger />
    </SearchV2Provider>
  )
}

const eventActions = () => sendTelemetryEvent.mock.calls.map(([event]) => event.action)

function openDialog() {
  const view = render(<TriggerWithProvider />)
  fireEvent.click(screen.getByRole('button', { name: /search/i }))
  return view
}

function setSearchState(view: ReturnType<typeof render>, next: DocsSearchV2State) {
  searchState = next
  act(() => view.rerender(<TriggerWithProvider />))
}

describe('SearchV2 telemetry', () => {
  it("searches through the docs app's own route, under its base path", () => {
    openDialog()

    expect(useDocsSearchV2).toHaveBeenCalledWith({ endpoint: '/docs/api/search_v2' })
  })

  it('sends docs_search_v2_opened with search_input when the trigger is clicked', () => {
    openDialog()

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'search_input' },
    })
  })

  it('sends docs_search_v2_opened with keyboard_shortcut on Cmd+K', () => {
    render(<TriggerWithProvider />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'keyboard_shortcut' },
    })
  })

  it('sends docs_search_v2_opened with keyboard_shortcut on Ctrl+K', () => {
    render(<TriggerWithProvider />)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'keyboard_shortcut' },
    })
  })

  it.each([
    ['Cmd+K', { metaKey: true }],
    ['Ctrl+K', { ctrlKey: true }],
  ])('keeps the legacy command menu shortcut from firing on %s', (_name, modifier) => {
    const legacyShortcut = vi.fn()
    document.addEventListener('keydown', legacyShortcut)
    render(<TriggerWithProvider />)

    fireEvent.keyDown(document.body, { key: 'k', ...modifier })

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(legacyShortcut).not.toHaveBeenCalled()
    document.removeEventListener('keydown', legacyShortcut)
  })

  it('ignores k without Cmd or Ctrl', () => {
    render(<TriggerWithProvider />)

    fireEvent.keyDown(window, { key: 'k' })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it.each([
    ['Ctrl+Shift+K', { ctrlKey: true, shiftKey: true }],
    ['Ctrl+Alt+K', { ctrlKey: true, altKey: true }],
    ['Cmd+Shift+K', { metaKey: true, shiftKey: true }],
    ['Cmd+Alt+K', { metaKey: true, altKey: true }],
  ])('ignores %s so browser shortcuts keep working', (_name, modifier) => {
    render(<TriggerWithProvider />)

    fireEvent.keyDown(window, { key: 'k', ...modifier })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it('sends docs_search_v2_closed when the dialog closes', () => {
    openDialog()
    sendTelemetryEvent.mockClear()

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_closed',
      properties: { closeReason: 'dismissed' },
    })
  })

  it('runs the debounced search while typing and resets when the input is cleared', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'auth' } })
    expect(handleDocsSearchDebounced).toHaveBeenCalledWith('auth')
    expect(resetSearch).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '' } })
    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  it('trims the query before searching', () => {
    openDialog()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '  auth  ' } })

    expect(handleDocsSearchDebounced).toHaveBeenCalledTimes(1)
    expect(handleDocsSearchDebounced).toHaveBeenCalledWith('auth')
  })

  it('holds the search back until the third character', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'au' } })

    expect(handleDocsSearchDebounced).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'aut' } })
    expect(handleDocsSearchDebounced).toHaveBeenCalledWith('aut')
  })

  it('resets the search when deleting back under the threshold, so its results cannot report later', () => {
    openDialog()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'aut' } })
    expect(resetSearch).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'au' } })

    expect(resetSearch).toHaveBeenCalledTimes(1)
    expect(handleDocsSearchDebounced).toHaveBeenCalledTimes(1)
  })

  it('does not count whitespace toward the third character', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: ' au ' } })
    fireEvent.change(input, { target: { value: '     ' } })

    expect(handleDocsSearchDebounced).not.toHaveBeenCalled()
  })

  it('does not search again when only the surrounding whitespace changes', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'auth' } })
    fireEvent.change(input, { target: { value: 'auth ' } })
    fireEvent.change(input, { target: { value: ' auth ' } })

    expect(handleDocsSearchDebounced).toHaveBeenCalledTimes(1)
    expect(handleDocsSearchDebounced).toHaveBeenCalledWith('auth')
  })

  it('does not reset again while the query stays under the threshold', () => {
    openDialog()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'auth' } })

    fireEvent.change(input, { target: { value: 'au' } })
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  it('searches the same query again once it was cleared in between', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'auth' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    fireEvent.change(input, { target: { value: 'auth' } })

    expect(handleDocsSearchDebounced).toHaveBeenCalledTimes(2)
    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  it('sends no docs_search_v2_search_submitted while the query is too short', () => {
    openDialog()
    sendTelemetryEvent.mockClear()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'au' } })

    expect(eventActions()).not.toContain('docs_search_v2_search_submitted')
  })

  it('resets the search from the Clear button', () => {
    openDialog()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'auth' } })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  describe('docs_search_v2_search_submitted', () => {
    it('is sent with hasResults true once results settle', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, resultsState)

      expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_search_submitted',
        properties: { query: 'auth', hasResults: true },
      })
    })

    it('is sent with hasResults false when nothing matches', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, { status: 'noResults', key: 1, query: 'zzz' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_search_submitted',
        properties: { query: 'zzz', hasResults: false },
      })
    })

    it('is not sent while loading or on error', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, { status: 'loading', key: 1, staleResults: [], staleQuery: '' })
      setSearchState(view, { status: 'error', key: 2, message: 'nope' })

      expect(eventActions()).not.toContain('docs_search_v2_search_submitted')
    })
  })

  describe('docs_search_v2_result_clicked', () => {
    it('is sent when a result link is clicked, which closes the dialog without a router push', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.click(screen.getByRole('option', { name: /Learn about auth/ }))

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
      // the link's own click handler closes the dialog before cmdk's onSelect reports the click
      expect(eventActions()).toEqual(['docs_search_v2_closed', 'docs_search_v2_result_clicked'])
      expect(push).not.toHaveBeenCalled()
    })

    it('is sent once and does not close the dialog for a new-tab click', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.click(screen.getByRole('option', { name: /Learn about auth/ }), { metaKey: true })

      expect(eventActions()).toEqual(['docs_search_v2_result_clicked'])
      expect(screen.getByRole('combobox')).toBeTruthy()
    })

    it('is sent on Enter, which navigates with the router and closes the dialog', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
      expect(push).toHaveBeenCalledWith('/guides/auth')
      expect(eventActions()).toEqual(['docs_search_v2_result_clicked', 'docs_search_v2_closed'])
    })

    it('reports the query the visible results belong to while a new search is loading', () => {
      const view = openDialog()
      setSearchState(view, {
        status: 'loading',
        key: 2,
        staleResults: [result],
        staleQuery: 'auth',
      })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'authent' } })
      sendTelemetryEvent.mockClear()

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
    })
  })
})

describe('Ask AI telemetry', () => {
  it('reports a switch between search and Ask AI as its own close reason, not a dismissal', () => {
    openDialog()
    sendTelemetryEvent.mockClear()

    fireEvent.keyDown(window, { key: 'i', metaKey: true })
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_closed',
      properties: { closeReason: 'switched_to_ask_ai' },
    })

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_ask_ai_closed',
      properties: { closeReason: 'switched_to_search' },
    })
  })

  // questions can hold pasted logs or connection strings
  it('sends only the start of a long question, with its full length', () => {
    render(<TriggerWithProvider />)
    fireEvent.keyDown(window, { key: 'i', metaKey: true })
    const input = screen.getByRole('textbox', { name: 'Ask Supabase AI a question' })

    fireEvent.change(input, { target: { value: 'a'.repeat(400) } })
    fireEvent.submit(input.closest('form')!)

    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_ask_ai_question_submitted',
      properties: { question: 'a'.repeat(300), questionLength: 400, questionSource: 'typed' },
    })
  })

  it('copies an answer as Markdown with full source links', async () => {
    aiMessages.push(
      { role: MessageRole.User, content: 'How do I turn on RLS?', status: MessageStatus.Complete },
      {
        role: MessageRole.Assistant,
        content: 'Enable RLS on the table.',
        status: MessageStatus.Complete,
        sources: [{ path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' }],
      }
    )
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    render(
      <TooltipProvider>
        <TriggerWithProvider />
      </TooltipProvider>
    )
    fireEvent.keyDown(window, { key: 'i', metaKey: true })

    fireEvent.click(screen.getByRole('button', { name: 'Copy as Markdown' }))

    await waitFor(() =>
      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'copy_as_markdown_clicked',
        properties: { pageType: 'ask_ai_answer' },
      })
    )
    expect(writeText).toHaveBeenCalledWith(
      'Enable RLS on the table.\n\n### Sources\n\n- https://supabase.com/docs/guides/auth'
    )
  })
})
