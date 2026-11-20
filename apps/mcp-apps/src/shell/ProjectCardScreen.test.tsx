import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AnnouncerProvider } from 'surfaces/common'
import type { Project } from 'surfaces/contract'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AgentHost } from '../host/app-context'
import { createToolCallStore, type ToolCallSnapshot } from '../host/tool-call-store'
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../host/use-poll'
import { ProjectCardScreen, type ProjectCardData } from './ProjectCardScreen'

const created: Project = {
  id: 'abcdefghijklmnopqrst',
  ref: 'abcdefghijklmnopqrst',
  organization_id: 'hobby',
  organization_slug: 'hobby',
  name: 'Design check',
  status: 'COMING_UP',
  region: 'us-east-1',
}
const ready = { call: { status: 'ready', data: created } } as const

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
/** Announcements land on the next animation frame. */
const nextFrame = () => advance(20)

/** `getProject` returns these statuses in turn (an Error rejects); the last repeats. */
function projectReads(...reads: (string | Error)[]) {
  let call = 0
  return vi.fn(async () => {
    const read = reads[Math.min(call++, reads.length - 1)]!
    if (read instanceof Error) throw read
    return { ...created, status: read }
  })
}

function agent() {
  const publish = vi.fn()
  const openLink = vi.fn()
  const host: AgentHost = {
    agentName: 'agent',
    openLink,
    context: { publish, attach: vi.fn(), detach: vi.fn() } as unknown as AgentHost['context'],
  }
  return { host, publish, openLink }
}

function renderScreen({
  snapshot = ready,
  getProject = projectReads('COMING_UP'),
  host = agent().host,
}: {
  snapshot?: Partial<ToolCallSnapshot<Project>>
  getProject?: ProjectCardData['getProject']
  host?: AgentHost
} = {}) {
  const { store, update } = createToolCallStore<Project>({
    isConnected: true,
    canCallTools: true,
    canOpenLinks: true,
    ...snapshot,
  })
  const data = {
    getProject,
    getOrganization: vi.fn(async () => ({ id: 'hobby', name: 'Hobby' })),
    getProjectUrl: vi.fn(async () => ({ url: 'https://abcdefghijklmnopqrst.supabase.co' })),
    getPublishableKeys: vi.fn(async () => ({
      keys: [{ api_key: 'sb_publishable_key', name: 'default', type: 'publishable' }],
    })),
  } satisfies ProjectCardData
  render(<ProjectCardScreen session={{ toolCall: store, data, agent: host }} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <TooltipProvider>
        <AnnouncerProvider>{children}</AnnouncerProvider>
      </TooltipProvider>
    ),
  })
  return { data, update }
}

const retry = () => screen.queryByRole('button', { name: 'Retry' })
const dashboard = () => screen.queryByRole('button', { name: 'Open in dashboard' })

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('ProjectCardScreen', () => {
  it('keeps the card layout before the host sends anything', async () => {
    const { data } = renderScreen({ snapshot: { call: { status: 'loading' } } })
    await advance(0)

    const card = screen.getByRole('region', { name: 'Loading' })
    expect(card.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(data.getProject).not.toHaveBeenCalled()
  })

  it('fills in what the arguments tell it while waiting for the result', async () => {
    renderScreen({
      snapshot: {
        call: { status: 'loading' },
        input: { name: 'Design check', region: 'us-east-1', organization_id: 'hobby' },
      },
    })
    await advance(0)

    expect(screen.getByRole('heading', { name: 'Design check' })).toBeTruthy()
    expect(screen.getByText('Hobby')).toBeTruthy()
    expect(screen.getByText('us-east-1')).toBeTruthy()
    // The ref, the status and Open in dashboard are still unknown.
    expect(screen.queryByText(created.ref!)).toBeNull()
    expect(dashboard()).toBeNull()
  })

  it('goes from the arguments to the result without a reload', async () => {
    const { update } = renderScreen({
      snapshot: { call: { status: 'loading' }, input: { name: 'Design check' } },
    })
    await advance(0)
    act(() => update(ready))
    await advance(0)

    expect(screen.getByText(created.ref!)).toBeTruthy()
    expect(screen.getByText('Creating')).toBeTruthy()
  })

  it('names the step while the project sets up, then shows Active, and tells the agent', async () => {
    const { host, publish } = agent()
    const { data } = renderScreen({
      host,
      getProject: projectReads('COMING_UP', 'ACTIVE_UNHEALTHY', 'ACTIVE_HEALTHY'),
    })

    await advance(0)
    expect(screen.getByText('Creating')).toBeTruthy()
    expect(data.getProject).toHaveBeenCalledWith({ id: created.id })

    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Checking health')).toBeTruthy()

    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Active')).toBeTruthy()
    await nextFrame()
    expect(screen.getByRole('status').textContent).toBe('Active')
    // Checking is live or finished throughout: nothing to retry.
    expect(retry()).toBeNull()
    // The agent learns the project is ready without polling get_project itself.
    expect(publish).toHaveBeenLastCalledWith({
      project: { id: created.id, name: created.name, status: 'ACTIVE_HEALTHY' },
    })

    // Ready and settled: it stops reading.
    await advance(POLL_INTERVAL_MS * 3)
    expect(data.getProject).toHaveBeenCalledTimes(3)
  })

  it('shows connection details once the project is ready', async () => {
    const { data } = renderScreen({ getProject: projectReads('ACTIVE_HEALTHY') })
    await advance(0)
    expect(data.getProjectUrl).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Connection details' }))
    await advance(0)
    expect(data.getProjectUrl).toHaveBeenCalledWith({ project_id: created.ref })
    expect(screen.getByLabelText('Project URL')).toHaveProperty(
      'value',
      'https://abcdefghijklmnopqrst.supabase.co'
    )
    expect(screen.getByLabelText('Publishable key')).toHaveProperty('value', 'sb_publishable_key')
  })

  it('shows which step failed', async () => {
    renderScreen({ getProject: projectReads('INIT_FAILED') })

    await advance(0)
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Failed while creating (INIT_FAILED).')).toBeTruthy()
    // A failed project is final: retrying would read the same failure.
    expect(retry()).toBeNull()
    // It still exists in the dashboard, which is where it's deleted.
    expect(dashboard()).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Connection details' })).toBeNull()
  })

  it('has no dashboard link for a project that was removed', async () => {
    renderScreen({ getProject: projectReads('REMOVED') })

    await advance(0)
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(dashboard()).toBeNull()
  })

  it('has no dashboard link when the project was never created', async () => {
    const { data } = renderScreen({
      snapshot: {
        call: { status: 'error', message: 'Project limit reached for this organization' },
        input: { name: 'Design check', region: 'us-east-1' },
      },
    })

    await advance(0)
    expect(screen.getByRole('heading', { name: 'Design check' })).toBeTruthy()
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Project limit reached for this organization')).toBeTruthy()
    await nextFrame()
    expect(screen.getByRole('alert').textContent).toBe(
      'Project limit reached for this organization'
    )
    expect(dashboard()).toBeNull()
    expect(data.getProject).not.toHaveBeenCalled()
  })

  it('says so when the call was cancelled, even before its arguments arrived', async () => {
    renderScreen({ snapshot: { call: { status: 'cancelled' } } })

    await advance(0)
    expect(screen.getByRole('heading', { name: 'New project' })).toBeTruthy()
    expect(screen.getByText('Cancelled')).toBeTruthy()
  })

  it('offers Retry when the checks keep failing, and resumes', async () => {
    const down = new Error('Service temporarily unavailable')
    renderScreen({
      getProject: projectReads(down, down, down, 'COMING_UP', 'COMING_UP', 'ACTIVE_HEALTHY'),
    })

    await advance(0)
    await advance(POLL_INTERVAL_MS)
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Check failed')).toBeTruthy()
    expect(screen.getByText("Can't check status: Service temporarily unavailable.")).toBeTruthy()

    fireEvent.click(retry()!)
    await advance(0)
    expect(screen.getByText('Creating')).toBeTruthy()
    expect(screen.queryByText(/Can't check status/)).toBeNull()

    // Polling resumed: it reaches Active without another Retry.
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('offers Retry after checking for 10 minutes, and resumes', async () => {
    renderScreen()

    await advance(POLL_TIMEOUT_MS)
    expect(screen.getByText('Creating')).toBeTruthy()
    expect(screen.getByText('Stopped checking after 10 minutes.')).toBeTruthy()

    fireEvent.click(retry()!)
    await advance(0)
    expect(screen.queryByText('Stopped checking after 10 minutes.')).toBeNull()
    expect(retry()).toBeNull()
  })

  it('points to the agent on a host that cannot call tools or open links', async () => {
    const { data } = renderScreen({
      snapshot: { ...ready, canCallTools: false, canOpenLinks: false },
    })

    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Creating')).toBeTruthy()
    expect(
      screen.getByText("Status won't update here. Ask the assistant to check with get_project.")
    ).toBeTruthy()
    expect(data.getProject).not.toHaveBeenCalled()
    expect(data.getOrganization).not.toHaveBeenCalled()
    expect(dashboard()).toBeNull()
    expect(retry()).toBeNull()
  })

  it('opens the project in the dashboard', async () => {
    const { host, openLink } = agent()
    renderScreen({ host })
    await advance(0)

    fireEvent.click(dashboard()!)
    expect(openLink).toHaveBeenCalledWith(
      'https://supabase.com/dashboard/project/abcdefghijklmnopqrst'
    )
  })
})
