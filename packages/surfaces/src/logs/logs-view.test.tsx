import type { LogSettings, Row } from '@supabase/mcp-server-supabase/apps'
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AskAgent, ContextAttachment, Loadable, SelectionSharing } from '../common'
import { renderWithTooltip, testCapabilities, testProject } from '../test-utils'
import { LogsView, type LogsViewProps } from './logs-view'

afterEach(cleanup)

const rows = [
  {
    timestamp: '2026-11-09 10:00:00',
    source: 'edge_logs',
    event_message: 'GET /rest/v1/todos',
    status: '500',
  },
  {
    timestamp: '2026-11-09 10:00:01',
    source: 'postgres_logs',
    event_message: 'checkpoint complete',
  },
  {
    timestamp: '2026-11-09 10:00:02',
    source: 'auth_logs',
    event_message: 'login failed',
    severity_text: 'WARNING',
  },
]

const settings: LogSettings = { minutes: 60, search: '' }
const loaded = (data: Row[]): Loadable<Row[]> => ({ status: 'success', data })

function setup({ logs = rows, props = {} }: { logs?: Row[]; props?: Partial<LogsViewProps> } = {}) {
  const attached: ContextAttachment[] = []
  const selectionSharing: SelectionSharing = {
    attach: vi.fn(async (attachment) => {
      attached.push(attachment)
    }),
    detach: vi.fn(async (attachment) => {
      attached.splice(attached.indexOf(attachment), 1)
    }),
  }
  const onSettingsChange = vi.fn()
  const onRefresh = vi.fn()
  // One read for the whole test; a new read (a refresh) is a new object.
  const initialLogs = loaded(logs)
  const view = (overrides: Partial<LogsViewProps> = {}) => (
    <LogsView
      project={testProject}
      enabled
      settings={settings}
      onSettingsChange={onSettingsChange}
      logs={initialLogs}
      onRefresh={onRefresh}
      selectionSharing={selectionSharing}
      agentName="Codex"
      {...props}
      {...overrides}
    />
  )
  const result = renderWithTooltip(view())
  return { ...result, view, attached, onSettingsChange, onRefresh }
}

const options = () => screen.getAllByRole('option')

describe('LogsView', () => {
  it('explains that logs need the debugging feature instead of showing an empty list', () => {
    setup({ props: { enabled: false } })
    expect(screen.getByText('Logs are unavailable')).toBeTruthy()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('lists the logs the host loaded', () => {
    setup()
    expect(options()).toHaveLength(3)
    expect(options()[0].textContent).toContain('GET /rest/v1/todos')
  })

  it('reports a new search to the host so it can keep the settings', () => {
    const { onSettingsChange } = setup()
    fireEvent.change(screen.getByLabelText('Search logs'), { target: { value: 'login' } })
    expect(onSettingsChange).toHaveBeenCalledWith({ ...settings, search: 'login' })
  })

  it('filters loaded logs locally by search', () => {
    setup({ props: { settings: { ...settings, search: 'LOGIN' } } })
    expect(options()).toHaveLength(1)
    expect(options()[0].textContent).toContain('login failed')
  })

  it('shares a selection with the agent and withdraws it when the selection is cleared', async () => {
    const { attached } = setup()
    fireEvent.click(options()[0])
    await waitFor(() => expect(attached).toHaveLength(1))
    expect(attached[0]).toMatchObject({ projectId: testProject.id, title: '1 selected log' })
    expect(attached[0].text).toContain('GET /rest/v1/todos')

    fireEvent.keyDown(options()[0], { key: 'Escape' })
    await waitFor(() => expect(attached).toHaveLength(0))
  })

  it('supports Shift+Arrow ranges and Cmd+A, attaching every selected row', async () => {
    const { attached } = setup()
    fireEvent.click(options()[0])
    fireEvent.keyDown(options()[0], { key: 'ArrowDown', shiftKey: true })
    await waitFor(() => expect(attached[0]?.title).toBe('2 selected logs'))
    fireEvent.keyDown(options()[1], { key: 'a', metaKey: true })
    await waitFor(() => expect(attached[0]?.title).toBe('3 selected logs'))
    expect(screen.getByLabelText('Selected log metadata')).toBeTruthy()
  })

  it('withdraws shared logs when the search changes what is listed', async () => {
    const { attached, rerender, view } = setup()
    fireEvent.click(options()[1])
    await waitFor(() => expect(attached).toHaveLength(1))
    rerender(view({ settings: { ...settings, search: 'checkpoint' } }))
    await waitFor(() => expect(attached).toHaveLength(0))
    expect(screen.queryByLabelText('Log details')).toBeNull()
  })

  it('withdraws shared logs on refresh and on unmount, so stale rows never linger in chat', async () => {
    const { attached, rerender, view, unmount } = setup()
    fireEvent.click(options()[0])
    await waitFor(() => expect(attached).toHaveLength(1))
    rerender(view({ logs: { status: 'loading' } }))
    await waitFor(() => expect(attached).toHaveLength(0))

    rerender(view({ logs: loaded(rows) }))
    fireEvent.click(options()[0])
    await waitFor(() => expect(attached).toHaveLength(1))
    unmount()
    await waitFor(() => expect(attached).toHaveLength(0))
  })

  it('refuses to share a selection over 32,000 characters and says why', async () => {
    const { attached } = setup({ logs: [{ event_message: 'x'.repeat(32_000) }] })
    fireEvent.click(options()[0])
    expect(
      await screen.findByText(
        'Select fewer logs to keep the chat attachment under 32,000 characters.'
      )
    ).toBeTruthy()
    expect(attached).toHaveLength(0)
  })

  it('asks the named agent to investigate, sending the selection with the request', async () => {
    const onAsk = vi.fn<AskAgent>(async () => {})
    setup({ props: { onAsk, agentName: 'Assistant' } })
    fireEvent.click(options()[0])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send to Assistant' }))
    })
    expect(onAsk).toHaveBeenCalledTimes(1)
    const [request] = onAsk.mock.calls[0]
    expect(request).toMatchObject({ type: 'investigate-logs', project: testProject })
    expect(request.type === 'investigate-logs' && request.attachment.text).toContain(
      'GET /rest/v1/todos'
    )
  })

  it('disables Send when the host cannot send prompts, such as a fixture preview', () => {
    setup({ props: { onAsk: undefined, selectionSharing: undefined } })
    fireEvent.click(options()[0])
    const button = screen.getByRole('button', { name: 'Send to Codex' })
    // Stays focusable so its tooltip can still be read.
    expect(button.getAttribute('aria-disabled')).toBe('true')
  })

  it('shows a failed read as an error with retry, not as an empty time range', () => {
    const { onRefresh } = setup({
      props: { logs: { status: 'error', message: 'Logs access denied' } },
    })
    expect(screen.getByText('Failed to load logs')).toBeTruthy()
    expect(screen.getByText('Error: Logs access denied')).toBeTruthy()
    expect(screen.queryByText('No logs in the selected time range.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
