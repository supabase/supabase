import type { ProjectOverview } from '@supabase/mcp-server-supabase/apps'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { AskAgent, Loadable } from '../common'
import { renderWithTooltip, testCapabilities, testProject } from '../test-utils'
import { ProjectHome, type ProjectHomeProps } from './project-home'

// Recharts' ResponsiveContainer observes its size; jsdom has no ResizeObserver.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})
afterEach(cleanup)

const hour = 3_600_000
const overview: ProjectOverview = {
  projectId: testProject.id,
  observedAt: '2026-11-09T00:00:00Z',
  start: '2026-11-08T00:00:00Z',
  end: '2026-11-09T00:00:00Z',
  traffic: {
    status: 'ready',
    data: {
      requests: 1200,
      responses: 1190,
      errors: 12,
      unknownStatus: 10,
      errorRate: 1.01,
      points: [
        { timestamp: 0, requests: 600, errorRate: 0.5 },
        { timestamp: hour, requests: 600, errorRate: null },
      ],
    },
  },
  security: {
    status: 'ready',
    data: {
      total: 1,
      truncated: false,
      issues: [{ name: 'rls_disabled_in_public', title: 'RLS disabled', level: 'ERROR', count: 2 }],
    },
  },
  performance: { status: 'ready', data: { total: 0, truncated: false, issues: [] } },
}

const loaded = (data: ProjectOverview): Loadable<ProjectOverview> => ({ status: 'success', data })

function setup({
  props = {},
  capabilities = testCapabilities,
}: {
  props?: Partial<ProjectHomeProps>
  capabilities?: typeof testCapabilities
} = {}) {
  const onAsk = vi.fn<AskAgent>(async () => {})
  const onRefresh = vi.fn()
  const element = (overrides: Partial<ProjectHomeProps> = {}) => (
    <ProjectHome
      project={testProject}
      capabilities={capabilities}
      overview={loaded(overview)}
      onRefresh={onRefresh}
      onAsk={onAsk}
      {...props}
      {...overrides}
    />
  )
  const result = renderWithTooltip(element())
  return { ...result, element, onAsk, onRefresh }
}

describe('ProjectHome', () => {
  it('summarizes traffic and advisors from the loaded overview', () => {
    setup()
    expect(screen.getByText('1.2K')).toBeTruthy()
    expect(screen.getByText('1.01%')).toBeTruthy()
    expect(screen.getByText('RLS disabled')).toBeTruthy()
    expect(screen.getByText('No performance issues')).toBeTruthy()
    expect(screen.getByTestId('activity-chart')).toBeTruthy()
  })

  it('counts each failing check once as an issue, and shows the project’s users', () => {
    setup({
      props: {
        overview: loaded({ ...overview, users: { status: 'ready', data: { total: 4663 } } }),
      },
    })
    const stat = (label: string) =>
      screen.getByText(label, { selector: 'dt' }).parentElement?.textContent
    // Two affected tables under one check are one issue, as on Studio's Issues page.
    expect(stat('Issues')).toBe('Issues1')
    expect(stat('Users')).toBe('Users4.7K')
  })

  it('shows no user count rather than zero when the server cannot read it', () => {
    setup()
    expect(screen.getByText('Users').parentElement?.textContent).toBe('Users—')
  })

  it('switches to hourly error rates and says which requests they leave out', () => {
    setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Error rate' }))
    const chart = screen.getByRole('img', { name: /^Error rate by hour\./ })
    expect(chart.getAttribute('aria-label')).toContain('10 requests have no valid status')
  })

  it('questions zero traffic instead of drawing a healthy flat line', () => {
    setup({
      props: {
        overview: loaded({
          ...overview,
          traffic: {
            status: 'ready',
            data: {
              requests: 0,
              responses: 0,
              errors: 0,
              unknownStatus: 0,
              errorRate: null,
              points: [],
            },
          },
        }),
      },
    })
    expect(screen.getByText('No requests recorded')).toBeTruthy()
    expect(screen.queryByTestId('activity-chart')).toBeNull()
  })

  it('never shows a failed section as zero or healthy', () => {
    const unavailable = { status: 'unavailable' as const, message: 'Advisors need a newer plan.' }
    setup({
      props: {
        overview: loaded({
          ...overview,
          traffic: { status: 'unavailable', message: 'Traffic is not captured.' },
          security: unavailable,
          performance: unavailable,
        }),
      },
    })
    expect(screen.getByText('Traffic is not captured.')).toBeTruthy()
    expect(screen.getAllByText('Advisors need a newer plan.')).toHaveLength(2)
    expect(screen.queryByText(/^No .* issues$/)).toBeNull()
    expect(screen.queryByTestId('activity-chart')).toBeNull()
    expect(screen.getAllByText('—')).toHaveLength(4)
  })

  it('shows a failed read as an error with retry, and draws no chart', () => {
    const { onRefresh, rerender, element } = setup({
      props: { overview: { status: 'error', message: 'Overview access denied' } },
    })
    expect(screen.getAllByText('Overview access denied').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('activity-chart')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)

    rerender(element({ overview: loaded(overview) }))
    expect(screen.getByText('1.2K')).toBeTruthy()
  })

  it('explains that the overview is unavailable on connections without it', () => {
    setup({ props: { overview: { status: 'idle' } } })
    expect(
      screen.getByText('Project overview data is not available on this connection.')
    ).toBeTruthy()
    expect(screen.queryByTestId('activity-chart')).toBeNull()
  })

  it('asks the agent to run each check on this project', async () => {
    const { onAsk } = setup()
    for (const title of ['Security check', 'Health check', 'Performance check', 'Capacity check']) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: new RegExp(title) }))
      })
    }
    expect(onAsk.mock.calls.map(([request]) => request)).toEqual(
      ['security', 'health', 'performance', 'capacity'].map((check) => ({
        type: 'project-check',
        project: testProject,
        check,
      }))
    )
    expect(screen.getByText('Sent to chat.')).toBeTruthy()
  })

  it('focuses a Review on the selected advisor finding', async () => {
    const { onAsk } = setup()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review RLS disabled' }))
    })
    expect(onAsk.mock.calls[0][0]).toMatchObject({
      type: 'review-finding',
      project: testProject,
      category: 'security',
      finding: { name: 'rls_disabled_in_public' },
    })
  })

  it('reports a failed send so the user knows nothing reached chat', async () => {
    const onAsk = vi.fn<AskAgent>(async () => {
      throw new Error('Message delivery failed')
    })
    setup({ props: { onAsk } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Health check/ }))
    })
    expect(screen.getByText('Message delivery failed')).toBeTruthy()
  })

  it('explains and disables checks on hosts that cannot send prompts', () => {
    setup({ props: { onAsk: undefined } })
    expect(screen.getByText('This host doesn’t support sending prompts to chat.')).toBeTruthy()
    const check = screen.getByRole<HTMLButtonElement>('button', { name: /Security check/ })
    expect(check.disabled).toBe(true)
  })

  it('keeps Home useful for paused projects and connections without database access', () => {
    setup({
      props: { project: { ...testProject, status: 'INACTIVE' }, overview: { status: 'idle' } },
      capabilities: { ...testCapabilities, database: false },
    })
    expect(screen.getByText(/This project is paused/)).toBeTruthy()
    expect(screen.getByText('This connection doesn’t include database access.')).toBeTruthy()
    expect(screen.getByText('Paused')).toBeTruthy()
  })

  it('names the organization and how this connection reaches the project in the header', () => {
    setup({ props: { organizationName: 'Acme Inc' } })
    const header = screen.getByRole('banner')
    expect(header.textContent).toContain('Acme Inc')
    expect(header.textContent).toContain(testProject.id)
    expect(header.textContent).toContain(testProject.region)
    expect(header.textContent).toContain('Read-only')
  })
})
