import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { consentState } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { TABLE_SEARCH_TRACK_DEBOUNCE_MS, TableEditorMenu } from './TableEditorMenu'
import { TableEditorStateContextProvider } from '@/state/table-editor'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissions } from '@/tests/lib/msw-permissions'
import { allPermissionsFor } from '@/tests/lib/permissions-fixtures'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

describe('TableEditorMenu telemetry', () => {
  const telemetryRequests: Array<Record<string, unknown>> = []

  beforeEach(() => {
    telemetryRequests.length = 0
    routerMock.setCurrentUrl('/project/default/editor')

    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })

    mockPermissions(allPermissionsFor(['default-org']))

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project response for useSelectedProjectQuery
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.includes('pg_namespace') && !query.includes('pg_class')) {
          return HttpResponse.json([
            { id: 1, name: 'public' },
            { id: 2, name: 'auth' },
            { id: 3, name: 'custom_app' },
          ])
        }
        if (query.includes('entities') && query.includes('count')) {
          return HttpResponse.json([{ data: { entities: [], count: 0 } }])
        }
        return HttpResponse.json<unknown[]>([])
      },
    })

    addAPIMock({
      method: 'post',
      path: '/platform/telemetry/event',
      response: async ({ request }) => {
        telemetryRequests.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json<Record<string, never>>({}, { status: 201 })
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderMenu = () =>
    customRender(
      <TableEditorStateContextProvider>
        <TableEditorMenu />
      </TableEditorStateContextProvider>,
      { nuqs: { searchParams: { schema: 'public' }, hasMemory: true } }
    )

  it('tracks schema switches once per change with system/public flags and no schema names', async () => {
    const user = userEvent.setup()
    renderMenu()

    const trigger = await screen.findByTestId('schema-selector')

    // Re-selecting the current schema should not fire an event
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'public' }))
    expect(telemetryRequests).toHaveLength(0)

    // Switch to system schema (verifies cmdk option click fires once, not twice)
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'auth' }))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_schema_updated',
          custom_properties: { isSystemSchema: true, isPublic: false },
        },
      ])
    })

    // Switch to custom user schema
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'custom_app' }))

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(2)
    })
    expect(telemetryRequests[1]).toMatchObject({
      action: 'table_editor_schema_updated',
      custom_properties: { isSystemSchema: false, isPublic: false },
    })

    // Switch back to public
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'public' }))

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(3)
    })
    expect(telemetryRequests[2]).toMatchObject({
      action: 'table_editor_schema_updated',
      custom_properties: { isSystemSchema: false, isPublic: true },
    })
    expect(JSON.stringify(telemetryRequests)).not.toContain('custom_app')
  })

  it('debounces table search and cancels pending events when cleared or switching schemas', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderMenu()

    const searchInput = await screen.findByPlaceholderText('Search tables...')

    // Rapid edits collapse into a single debounced event with no query text
    fireEvent.change(searchInput, { target: { value: 'u' } })
    fireEvent.change(searchInput, { target: { value: 'us' } })
    fireEvent.change(searchInput, { target: { value: 'users_secret' } })

    expect(telemetryRequests).toHaveLength(0)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TABLE_SEARCH_TRACK_DEBOUNCE_MS)
    })

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(1)
    })
    expect(telemetryRequests[0]).toMatchObject({
      action: 'table_editor_table_search_submitted',
    })
    expect(JSON.stringify(telemetryRequests)).not.toContain('users_secret')

    // Clearing before debounce elapses cancels the event
    fireEvent.change(searchInput, { target: { value: 'orders' } })
    fireEvent.change(searchInput, { target: { value: '' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TABLE_SEARCH_TRACK_DEBOUNCE_MS)
    })

    expect(telemetryRequests).toHaveLength(1)

    // Switching schemas while a search debounce is pending cancels the search event
    fireEvent.change(searchInput, { target: { value: 'invoices' } })
    await user.click(await screen.findByTestId('schema-selector'))
    await user.click(await screen.findByRole('option', { name: 'auth' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TABLE_SEARCH_TRACK_DEBOUNCE_MS)
    })

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(2)
    })
    expect(telemetryRequests[1]).toMatchObject({
      action: 'table_editor_schema_updated',
      custom_properties: { isSystemSchema: true, isPublic: false },
    })
  })
})
