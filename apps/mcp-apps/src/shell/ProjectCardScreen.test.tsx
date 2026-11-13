import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Project } from 'surfaces/contract'
import { TooltipProvider } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AgentHost } from '../host/app-context'
import { dashboardUrl, ProjectCardScreen } from './ProjectCardScreen'

afterEach(() => {
  cleanup()
  setVisibility('visible')
})

const starting: Project = {
  id: 'abcdefghijklmnopqrst',
  ref: 'abcdefghijklmnopqrst',
  name: 'Support inbox',
  status: 'COMING_UP',
  region: 'us-east-1',
  organization_slug: 'acme',
}
const active: Project = { ...starting, status: 'ACTIVE_HEALTHY' }

const getOrganization = vi.fn(async () => ({ id: 'acme', name: 'Acme Inc' }))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
  document.dispatchEvent(new Event('visibilitychange'))
}

function agent(): AgentHost & { publish: ReturnType<typeof vi.fn> } {
  const publish = vi.fn()
  return {
    agentName: 'agent',
    openLink: vi.fn(),
    context: { publish, share: vi.fn(), clear: vi.fn() } as unknown as AgentHost['context'],
    publish,
  }
}

const renderCard = (element: ReactElement) => render(element, { wrapper: TooltipProvider })

describe('ProjectCardScreen', () => {
  it('updates a new project to Active without a refresh, and tells the agent', async () => {
    const statuses = ['COMING_UP', 'ACTIVE_HEALTHY']
    const getProject = vi.fn(async () => ({
      ...starting,
      status: statuses.shift() ?? 'ACTIVE_HEALTHY',
    }))
    const host = agent()
    renderCard(
      <ProjectCardScreen
        initial={starting}
        data={{ getProject, getOrganization }}
        agent={host}
        changingPollMs={5}
        settledPollMs={60_000}
      />
    )

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Status: Active'))
    expect(getProject).toHaveBeenCalledWith({ id: starting.id })
    // The agent learns the project is ready without polling get_project itself.
    expect(host.publish).toHaveBeenLastCalledWith({
      project: { id: starting.id, name: starting.name, status: 'ACTIVE_HEALTHY' },
    })
  })

  it('keeps reading a settled project, more slowly, to catch later changes such as a pause', async () => {
    const getProject = vi.fn(async () => ({ ...active, status: 'INACTIVE' }))
    renderCard(
      <ProjectCardScreen
        initial={active}
        data={{ getProject, getOrganization }}
        agent={agent()}
        changingPollMs={60_000}
        settledPollMs={5}
      />
    )
    expect(await screen.findByText('Paused')).toBeTruthy()
  })

  it('waits while the view is hidden and resumes when it is shown', async () => {
    setVisibility('hidden')
    const getProject = vi.fn(async () => active)
    renderCard(
      <ProjectCardScreen
        initial={starting}
        data={{ getProject, getOrganization }}
        agent={agent()}
        changingPollMs={5}
      />
    )
    await wait(30)
    expect(getProject).not.toHaveBeenCalled()
    setVisibility('visible')
    await waitFor(() => expect(getProject).toHaveBeenCalled())
  })

  it('shows a failed read as the status', async () => {
    const getProject = vi.fn(async () => {
      throw new Error('Network error')
    })
    renderCard(
      <ProjectCardScreen
        initial={starting}
        data={{ getProject, getOrganization }}
        agent={agent()}
        changingPollMs={60_000}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
    expect(await screen.findByText('Check failed')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Failed to check status: Network error')
  })

  it('names the organization once it is known', async () => {
    renderCard(
      <ProjectCardScreen
        initial={active}
        data={{ getProject: vi.fn(), getOrganization }}
        agent={agent()}
      />
    )
    expect(await screen.findByText('Acme Inc')).toBeTruthy()
    expect(getOrganization).toHaveBeenCalledWith({ id: 'acme' })
  })

  it('opens the project in the dashboard', () => {
    const host = agent()
    renderCard(
      <ProjectCardScreen
        initial={active}
        data={{ getProject: vi.fn(), getOrganization }}
        agent={host}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open in dashboard' }))
    expect(host.openLink).toHaveBeenCalledWith(dashboardUrl(active))
    expect(dashboardUrl(active)).toBe('https://supabase.com/dashboard/project/abcdefghijklmnopqrst')
  })
})
