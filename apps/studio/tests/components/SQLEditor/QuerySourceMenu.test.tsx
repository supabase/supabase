import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it } from 'vitest'

import { QuerySourceMenu } from '@/components/interfaces/SQLEditor/UtilityPanel/QuerySourceMenu/QuerySourceMenu'
import { DEFAULT_LOG_TIME_RANGE } from '@/data/query-sources/query-source-registry'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// QuerySourceMenu renders a Radix dropdown (+ nested dialog), both of which use Web Animations.
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

describe('QuerySourceMenu', () => {
  it('hides logs when creating logs queries is unavailable', async () => {
    customRender(
      <QuerySourceMenu
        id="database-snippet"
        runSource={{ _tag: 'database' }}
        canCreateLogsSnippet={false}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Database' }))

    expect(screen.queryByText('Logs')).not.toBeInTheDocument()
  })

  it('keeps the dropdown open across a source switch, so the new source’s controls appear without reopening it', async () => {
    // Selecting a source doesn't mutate `runSource` in place — it navigates to a
    // fresh tab, and the parent re-renders this component with the new source once
    // the route lands. Rerendering with the switched-to prop below stands in for
    // that navigation, so the test observes exactly what the user does: does the
    // dropdown have to be reopened to see the newly-available controls?
    const { rerender } = customRender(
      <QuerySourceMenu id="new-snippet" runSource={{ _tag: 'database' }} canCreateLogsSnippet />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Query source: Database' }))

    expect(await screen.findByText('Run as')).toBeInTheDocument()
    expect(screen.queryByText('Time range')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Logs'))

    rerender(
      <QuerySourceMenu
        id="new-snippet"
        runSource={{ _tag: 'logs', time_range: DEFAULT_LOG_TIME_RANGE }}
        canCreateLogsSnippet
      />
    )

    // The dropdown never closed, so the logs-only "Time range" control is visible
    // immediately, and the database-only controls are gone — without the user
    // having to reopen the menu.
    expect(screen.getByText('Time range')).toBeInTheDocument()
    expect(screen.queryByText('Run as')).not.toBeInTheDocument()
  })
})
