import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AnnouncerProvider } from 'surfaces/common'
import type { Branch } from 'surfaces/contract'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createToolCallStore, type ToolCallSnapshot } from '../host/tool-call-store'
import { POLL_INTERVAL_MS } from '../host/use-poll'
import { BranchCardScreen, branchScopedProjectId, type BranchCardData } from './BranchCardScreen'

const created: Branch = {
  id: 'branch-id',
  name: 'feature-login',
  project_ref: 'branchrefbranchrefbr',
  parent_project_ref: 'abcdefghijklmnopqrst',
  status: 'CREATING_PROJECT',
}
const parent = {
  id: created.parent_project_ref,
  name: 'Design check',
  status: 'ACTIVE_HEALTHY',
  region: 'us-east-1',
  organization_slug: 'hobby',
}
const ready = { call: { status: 'ready', data: created } } as const
const unscoped = { name: created.name, project_id: created.parent_project_ref }

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

function renderScreen({
  statuses,
  snapshot = { ...ready, input: unscoped },
}: {
  /** `listBranches` returns the branch with these statuses in turn; the last repeats. */
  statuses: string[]
  snapshot?: Partial<ToolCallSnapshot<Branch>>
}) {
  const { store } = createToolCallStore<Branch>({
    isConnected: true,
    canCallTools: true,
    canOpenLinks: true,
    ...snapshot,
  })
  let call = 0
  const data = {
    listBranches: vi.fn(async () => ({
      branches: [
        { ...created, id: 'another-branch' },
        { ...created, status: statuses[Math.min(call++, statuses.length - 1)]! },
      ],
    })),
    getProject: vi.fn(async () => parent),
    getOrganization: vi.fn(async () => ({ id: 'hobby', name: 'Hobby' })),
    getProjectUrl: vi.fn(async () => ({ url: 'https://branchrefbranchrefbr.supabase.co' })),
    getPublishableKeys: vi.fn(async () => ({
      keys: [{ api_key: 'sb_publishable_key', name: 'default', type: 'publishable' }],
    })),
  } satisfies BranchCardData
  render(
    <BranchCardScreen
      session={{ toolCall: store, data, agent: { agentName: 'agent', openLink: vi.fn() } }}
    />,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TooltipProvider>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </TooltipProvider>
      ),
    }
  )
  return data
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('BranchCardScreen', () => {
  it('shows the branch under its organization and project', async () => {
    const data = renderScreen({ statuses: ['CREATING_PROJECT'] })
    await advance(0)

    expect(screen.getByText(/Hobby/).textContent).toBe('Hobby/Design check')
    expect(screen.getByRole('heading', { name: 'feature-login' })).toBeTruthy()
    expect(screen.getByText('branchrefbranchrefbr')).toBeTruthy()
    expect(data.getProject).toHaveBeenCalledWith({ id: created.parent_project_ref })
    expect(data.listBranches).toHaveBeenCalledWith({ project_id: created.parent_project_ref })
  })

  it('names the step while the branch sets up, then shows Active', async () => {
    renderScreen({
      statuses: [
        'CREATING_PROJECT',
        'RUNNING_MIGRATIONS',
        'MIGRATIONS_PASSED',
        'FUNCTIONS_DEPLOYED',
      ],
    })

    await advance(0)
    expect(screen.getByText('Creating')).toBeTruthy()
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Running migrations')).toBeTruthy()
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Deploying functions')).toBeTruthy()
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Connection details' })).toBeTruthy()
  })

  it('shows which step failed', async () => {
    renderScreen({ statuses: ['RUNNING_MIGRATIONS', 'MIGRATIONS_FAILED'] })

    await advance(0)
    await advance(POLL_INTERVAL_MS)
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Failed while running migrations (MIGRATIONS_FAILED).')).toBeTruthy()
  })

  it('waits for the arguments before reading, since they say how the server is scoped', async () => {
    const data = renderScreen({ statuses: ['CREATING_PROJECT'], snapshot: ready })
    await advance(POLL_INTERVAL_MS)
    expect(data.listBranches).not.toHaveBeenCalled()
  })

  it('reads the branch’s own connection details on an unscoped server', async () => {
    const data = renderScreen({ statuses: ['FUNCTIONS_DEPLOYED'] })
    await advance(0)

    fireEvent.click(screen.getByRole('button', { name: 'Connection details' }))
    await advance(0)
    expect(data.getProjectUrl).toHaveBeenCalledWith({ project_id: created.project_ref })
    expect(screen.getByLabelText('Project URL')).toBeTruthy()
  })

  it('points to the dashboard on a server scoped to the parent, which cannot reach the branch', async () => {
    // A scoped server takes no project_id for create_branch.
    const data = renderScreen({
      statuses: ['FUNCTIONS_DEPLOYED'],
      snapshot: { ...ready, input: { name: created.name } },
    })
    await advance(0)

    fireEvent.click(screen.getByRole('button', { name: 'Connection details' }))
    await advance(0)
    expect(data.getProjectUrl).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Open in Studio' })).toBeTruthy()
  })

  it('knows which project a scoped connection is locked to', () => {
    const snapshot = { isConnected: true, canCallTools: true, canOpenLinks: true }
    // So the data port leaves project_id out of list_branches, as the server requires.
    expect(branchScopedProjectId({ ...snapshot, ...ready, input: { name: 'develop' } })).toBe(
      created.parent_project_ref
    )
    expect(branchScopedProjectId({ ...snapshot, ...ready, input: unscoped })).toBeNull()
    expect(branchScopedProjectId({ ...snapshot, ...ready })).toBeNull()
  })
})
