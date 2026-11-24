import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { consentState } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { EntityListItem } from './EntityListItem'
import { TABLE_SEARCH_TRACK_DEBOUNCE_MS, TableEditorMenu } from './TableEditorMenu'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
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
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: () => HttpResponse.json<never[]>([]),
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

  it('tracks schema switches with isSystemSchema and isPublic without leaking schema names', async () => {
    const user = userEvent.setup()
    renderMenu()

    const trigger = await screen.findByTestId('schema-selector')

    // Re-selecting the current schema should not fire an event
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'public' }))
    expect(telemetryRequests).toHaveLength(0)

    // Switch to system schema
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

  it('tracks create schema and new table sidebar clicks', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(await screen.findByTestId('schema-selector'))
    await user.click(await screen.findByRole('option', { name: /Create a new schema/i }))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_new_item_clicked',
          custom_properties: { itemType: 'schema' },
        },
      ])
    })

    await user.click(await screen.findByRole('button', { name: 'New table' }))

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(2)
    })
    expect(telemetryRequests[1]).toMatchObject({
      action: 'table_editor_new_item_clicked',
      custom_properties: { itemType: 'table', trigger: 'sidebar' },
    })
  })

  it('debounces table search submission and cancels when cleared before debounce expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
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

    // Typing then clearing before the debounce elapses should not fire another event
    fireEvent.change(searchInput, { target: { value: 'orders' } })
    fireEvent.change(searchInput, { target: { value: '' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TABLE_SEARCH_TRACK_DEBOUNCE_MS)
    })

    expect(telemetryRequests).toHaveLength(1)
  })

  it('tracks entity-type filter changes with the updated visibleTypeCount', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(await screen.findByRole('button', { name: 'Filter' }))

    const viewsCheckbox = await screen.findByRole('checkbox', { name: /^view$/i })
    await user.click(viewsCheckbox)

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_entity_filter_updated',
          custom_properties: { visibleTypeCount: 4 },
        },
      ])
    })

    const selectOnlyButtons = screen.getAllByRole('button', { name: 'Select only' })
    await user.click(selectOnlyButtons[0])

    await waitFor(() => {
      expect(telemetryRequests).toHaveLength(2)
    })
    expect(telemetryRequests[1]).toMatchObject({
      action: 'table_editor_entity_filter_updated',
      custom_properties: { visibleTypeCount: 1 },
    })

    // Clicking Select only on the same single type is a no-op
    await user.click(selectOnlyButtons[0])
    expect(telemetryRequests).toHaveLength(2)
  })

  it('tracks entity action clicks with action and entityType without leaking entity names', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    onTestFinished(() => writeText.mockRestore())

    customRender(
      <TableEditorStateContextProvider>
        <EntityListItem
          id={42}
          projectRef="default"
          isLocked={false}
          onExportCLI={vi.fn()}
          item={{
            id: 42,
            schema: 'public',
            name: 'secret_customers',
            type: ENTITY_TYPE.TABLE,
            comment: null,
            rls_enabled: true,
            is_partition: false,
          }}
        />
      </TableEditorStateContextProvider>
    )

    await user.click(
      await screen.findByRole('button', { name: 'More options for secret_customers' })
    )
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: 'Copy name' }))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_entity_action_clicked',
          custom_properties: {
            action: 'copy_name',
            entityType: 'table',
          },
        },
      ])
    })
    expect(JSON.stringify(telemetryRequests)).not.toContain('secret_customers')
  })
})
