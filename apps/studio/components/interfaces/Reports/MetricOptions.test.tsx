import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MetricOptions } from './MetricOptions'
import { projectKeys } from '@/data/projects/keys'
import { METRICS } from '@/lib/constants/metrics'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import type { Dashboards } from '@/types'

mockAnimationsApi()

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/content',
    response: () =>
      HttpResponse.json<components['schemas']['GetUserContentResponse_Output']>({
        data: [],
        cursor: undefined,
      }),
  })
  mswServer.use(
    http.get('*/api/enabled-features-overrides', () =>
      HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
    )
  )
})

afterEach(() => vi.useRealTimers())

function renderPicker(layout: Dashboards.Chart[] = []) {
  const onAddCharts = vi.fn()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  const config: Dashboards.Content = {
    schema_version: 1,
    period_start: {},
    period_end: {},
    interval: '1h',
    layout,
  }

  customRender(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Add block</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <MetricOptions config={config} onAddCharts={onAddCharts} />
      </DropdownMenuContent>
    </DropdownMenu>,
    { queryClient }
  )

  return { onAddCharts }
}

async function openCategory(user: ReturnType<typeof userEvent.setup>, label: string) {
  const category = screen.getByRole('menuitem', { name: label })
  act(() => category.focus())
  await user.keyboard('{ArrowRight}')
}

describe('MetricOptions', () => {
  it('keeps selections across sections and commits them in one action', async () => {
    const user = userEvent.setup()
    const { onAddCharts } = renderPicker()
    await user.click(screen.getByRole('button', { name: 'Add block' }))
    await openCategory(user, 'Instance health')
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Average CPU % Usage' }))
    expect(onAddCharts).not.toHaveBeenCalled()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Average CPU % Usage' })).toBeChecked()

    await openCategory(user, 'Authentication')
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Auth Requests' }))
    await user.click(screen.getByRole('menuitem', { name: 'Add 2 blocks' }))

    expect(onAddCharts).toHaveBeenCalledExactlyOnceWith([
      METRICS.find((metric) => metric.key === 'avg_cpu_usage'),
      METRICS.find((metric) => metric.key === 'total_auth_requests'),
    ])
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('discards pending selections when dismissed and prevents re-adding existing blocks', async () => {
    const user = userEvent.setup()
    const { onAddCharts } = renderPicker([
      {
        id: 'existing',
        attribute: 'ram_usage' as Dashboards.ChartType,
        label: 'Memory % Usage',
        provider: 'infra-monitoring',
        chart_type: 'bar',
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ])
    await user.click(screen.getByRole('button', { name: 'Add block' }))
    await openCategory(user, 'Instance health')
    const existing = await screen.findByRole('menuitemcheckbox', { name: 'Memory % Usage' })
    expect(existing).toBeChecked()
    expect(existing).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Average CPU % Usage' }))
    fireEvent.keyDown(screen.getByRole('menuitemcheckbox', { name: 'Average CPU % Usage' }), {
      key: 'Escape',
    })
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Add block' }))
    expect(screen.getByRole('menuitem', { name: 'Add 0 blocks' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(onAddCharts).not.toHaveBeenCalled()
  })

  it('keeps selected SQL snippets when search results change', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const snippets: components['schemas']['GetUserContentResponse_Output']['data'] = [
      {
        id: 'first-snippet',
        name: 'First query',
        favorite: false,
        inserted_at: '2026-11-24T00:00:00Z',
        updated_at: '2026-11-24T00:00:00Z',
        owner: { id: 1, username: 'test' },
        owner_id: 1,
        project_id: 1,
        type: 'sql',
        updated_by: null,
        visibility: 'project',
        content: { sql: 'select 1', schema_version: '1' },
      },
    ]
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: ({ request }) =>
        HttpResponse.json<components['schemas']['GetUserContentResponse_Output']>({
          data: new URL(request.url).searchParams.has('name') ? [] : snippets,
        }),
    })
    const user = userEvent.setup({
      advanceTimers: (delay) => act(() => vi.advanceTimersByTimeAsync(delay)),
    })
    const { onAddCharts } = renderPicker()
    await user.click(screen.getByRole('button', { name: 'Add block' }))
    await openCategory(user, 'SQL snippets')
    await user.click(await screen.findByRole('option', { name: 'First query' }))
    const search = screen.getByPlaceholderText('Search snippets...')
    await user.click(search)
    await user.paste('missing')
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(await screen.findByText('No snippets found')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Add 1 block' }))

    expect(onAddCharts).toHaveBeenCalledExactlyOnceWith([
      { id: 'first-snippet', key: 'snippet_first-snippet', label: 'First query' },
    ])
  })
})
