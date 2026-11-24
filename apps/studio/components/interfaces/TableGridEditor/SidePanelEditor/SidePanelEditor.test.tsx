import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { consentState } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { isValidElement, useEffect } from 'react'
import type { CalculatedColumn } from 'react-data-grid'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { SidePanelEditor } from './SidePanelEditor'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { Entity } from '@/data/table-editor/table-editor-types'
import type { SafePostgresTable } from '@/lib/postgres-types'
import { TableEditorStateContextProvider, useTableEditorStateSnapshot } from '@/state/table-editor'
import {
  TableEditorTableStateContextProvider,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const mockTable = {
  id: 1,
  schema: 'public',
  name: 'posts',
  entity_type: ENTITY_TYPE.TABLE,
  primary_keys: [{ name: 'id' }],
  relationships: [],
  columns: [
    {
      id: '1.1',
      table_id: 1,
      table: 'posts',
      schema: 'public',
      name: 'id',
      ordinal_position: 1,
      data_type: 'bigint',
      format: 'int8',
      is_identity: true,
      is_generated: false,
      is_nullable: false,
      default_value: null,
      comment: null,
      enums: [],
    },
    {
      id: '1.2',
      table_id: 1,
      table: 'posts',
      schema: 'public',
      name: 'title',
      ordinal_position: 2,
      data_type: 'text',
      format: 'text',
      is_identity: false,
      is_generated: false,
      is_nullable: true,
      default_value: null,
      comment: null,
      enums: [],
    },
  ],
} as unknown as SafePostgresTable

const OpenEditRowSidePanel = ({ row }: { row: Record<string, unknown> }) => {
  const snap = useTableEditorStateSnapshot()
  useEffect(() => {
    snap.onEditRow(row)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const OpenAddRowSidePanel = () => {
  const snap = useTableEditorStateSnapshot()
  useEffect(() => {
    snap.onAddRow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const GridExpandHarness = ({
  onReady,
}: {
  onReady: (handlers: {
    expandJson: () => void
    expandText: () => void
    getSidePanelType: () => string | undefined
  }) => void
}) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const tableSnap = useTableEditorTableStateSnapshot()

  useEffect(() => {
    const row = { idx: 0, id: 1, title: 'hello', metadata: { a: 1 } }
    const getExpandProp = (columnKey: string) => {
      const col = tableSnap.gridColumns.find((c) => c.key === columnKey) as
        | CalculatedColumn<typeof row>
        | undefined
      const element = col?.renderEditCell?.({
        column: col,
        row,
        rowIdx: 0,
        onRowChange: vi.fn(),
        onClose: vi.fn(),
      })
      if (isValidElement<{ onExpandEditor?: (col: string, r: typeof row) => void }>(element)) {
        return element.props.onExpandEditor
      }
      return undefined
    }

    onReady({
      expandJson: () => getExpandProp('metadata')?.('metadata', row),
      expandText: () => getExpandProp('title')?.('title', row),
      getSidePanelType: () => tableEditorSnap.sidePanel?.type,
    })
  }, [onReady, tableSnap.gridColumns, tableEditorSnap.sidePanel?.type])

  return <div data-testid="side-panel-type">{tableEditorSnap.sidePanel?.type ?? 'none'}</div>
}

describe('SidePanelEditor telemetry', () => {
  const telemetryRequests: Array<Record<string, unknown>> = []

  beforeEach(() => {
    telemetryRequests.length = 0
    routerMock.setCurrentUrl('/project/default/editor/1')

    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })

    mswServer.use(http.get('*/api/enabled-features-overrides', () => HttpResponse.json({})))

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
      response: () => HttpResponse.json<unknown[]>([]),
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

  it('tracks table_editor_row_updated with editMethod side_panel when saving an edited row', async () => {
    const user = userEvent.setup()

    customRender(
      <TableEditorStateContextProvider>
        <OpenEditRowSidePanel row={{ idx: 0, id: 1, title: 'Before' }} />
        <SidePanelEditor selectedTable={mockTable} />
      </TableEditorStateContextProvider>
    )

    const titleInput = (await screen.findByTestId('title-input')) as HTMLTextAreaElement
    await user.clear(titleInput)
    await user.click(titleInput)
    await user.paste('After')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_row_updated',
          custom_properties: { editMethod: 'side_panel' },
        },
      ])
    })
  })

  it('does not track table_editor_row_updated when inserting a new row', async () => {
    const user = userEvent.setup()

    customRender(
      <TableEditorStateContextProvider>
        <OpenAddRowSidePanel />
        <SidePanelEditor selectedTable={mockTable} />
      </TableEditorStateContextProvider>
    )

    const titleInput = (await screen.findByTestId('title-input')) as HTMLTextAreaElement
    await user.click(titleInput)
    await user.paste('Brand new')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument()
    })

    expect(
      telemetryRequests.filter((req) => req.action === 'table_editor_row_updated')
    ).toHaveLength(0)
  })
})

describe('TableEditorTableStateContextProvider cell editor telemetry', () => {
  it('opens json and text side panels and tracks table_editor_cell_editor_opened', async () => {
    const telemetryRequests: Array<Record<string, unknown>> = []
    routerMock.setCurrentUrl('/project/default/editor/1')

    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })

    mswServer.use(http.get('*/api/enabled-features-overrides', () => HttpResponse.json({})))

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
      response: () => HttpResponse.json<unknown[]>([]),
    })

    addAPIMock({
      method: 'post',
      path: '/platform/telemetry/event',
      response: async ({ request }) => {
        telemetryRequests.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json<Record<string, never>>({}, { status: 201 })
      },
    })

    const tableWithJsonAndText = {
      ...mockTable,
      columns: [
        ...(mockTable.columns ?? []).map((col) => ({ ...col, is_updatable: true })),
        {
          id: '1.3',
          table_id: 1,
          table: 'posts',
          schema: 'public',
          name: 'metadata',
          ordinal_position: 3,
          data_type: 'jsonb',
          format: 'jsonb',
          is_identity: false,
          is_generated: false,
          is_nullable: true,
          is_updatable: true,
          default_value: null,
          comment: null,
          enums: [],
        },
      ],
    } as unknown as Entity

    let handlers: { expandJson: () => void; expandText: () => void } | undefined

    customRender(
      <TableEditorStateContextProvider>
        <TableEditorTableStateContextProvider projectRef="default" table={tableWithJsonAndText}>
          <GridExpandHarness onReady={(h) => (handlers = h)} />
        </TableEditorTableStateContextProvider>
      </TableEditorStateContextProvider>
    )

    await waitFor(() => expect(handlers).toBeDefined())

    handlers!.expandJson()
    await waitFor(() => expect(screen.getByTestId('side-panel-type')).toHaveTextContent('json'))

    handlers!.expandText()
    await waitFor(() => expect(screen.getByTestId('side-panel-type')).toHaveTextContent('cell'))

    await waitFor(() => {
      expect(telemetryRequests).toMatchObject([
        {
          action: 'table_editor_cell_editor_opened',
          custom_properties: { editorType: 'json' },
        },
        {
          action: 'table_editor_cell_editor_opened',
          custom_properties: { editorType: 'text' },
        },
      ])
    })
  })
})
