import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerQuerySourceMenu } from './ExplorerQuerySourceMenu'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      id: 1,
      ref: 'default',
      organization_id: 1,
      name: 'Test Project',
      status: 'ACTIVE_HEALTHY',
      cloud_provider: 'AWS',
      region: 'us-east-1',
      db_host: 'db.default.supabase.co',
      restUrl: 'https://default.supabase.co/rest/v1/',
      inserted_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      subscription_id: 'sub_123',
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      high_availability: false,
      integration_source: null,
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
      is_hibernating: false,
    },
  })
})

describe('ExplorerQuerySourceMenu', () => {
  const renderWithFlags = (
    source: Parameters<typeof ExplorerQuerySourceMenu>[0]['source'],
    flags: Record<string, boolean>
  ) =>
    customRender(
      <FeatureFlagContext.Provider value={{ configcat: flags, posthog: {}, hasLoaded: true }}>
        <ExplorerQuerySourceMenu source={source} onSourceChange={vi.fn()} />
      </FeatureFlagContext.Provider>
    )

  it('emits a complete default binding when the query changes source', async () => {
    const onSourceChange = vi.fn()

    customRender(
      <ExplorerQuerySourceMenu
        source={{
          id: 'logs',
          type: 'logs',
          parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
        }}
        onSourceChange={onSourceChange}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Logs' }))
    await userEvent.click(screen.getByText('Database'))

    expect(onSourceChange).toHaveBeenCalledWith({
      id: 'database',
      type: 'database',
      parameters: {},
    })
  })

  it('emits the selected log time range as source parameters', async () => {
    const onSourceChange = vi.fn()

    customRender(
      <ExplorerQuerySourceMenu
        source={{
          id: 'logs',
          type: 'logs',
          parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
        }}
        onSourceChange={onSourceChange}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Logs' }))
    await userEvent.hover(screen.getByText('Time range'))
    await userEvent.click(await screen.findByText('Last 3 hours'))

    expect(onSourceChange).toHaveBeenCalledWith({
      id: 'logs',
      type: 'logs',
      parameters: { time_range: { type: 'relative', amount: 3, unit: 'hour' } },
    })
  })

  it('does not offer logs when source flags are disabled for a database query', async () => {
    renderWithFlags(
      { id: 'database', type: 'database', parameters: {} },
      { sqlEditorLogsSource: false, otelLegacyLogs: false }
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Database' }))

    expect(screen.queryByText('Logs')).not.toBeInTheDocument()
  })

  it('keeps logs available when an existing query already uses it', async () => {
    renderWithFlags(
      {
        id: 'logs',
        type: 'logs',
        parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
      },
      { sqlEditorLogsSource: false, otelLegacyLogs: false }
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Logs' }))

    expect(screen.getAllByText('Logs')).toHaveLength(2)
    expect(screen.getByText('Database')).toBeInTheDocument()
  })
})
