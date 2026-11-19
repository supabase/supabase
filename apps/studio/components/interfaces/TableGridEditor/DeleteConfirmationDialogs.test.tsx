import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useState, type PropsWithChildren } from 'react'
import { Button } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { DeleteConfirmationDialogs } from './DeleteConfirmationDialogs'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { tableEditorKeys } from '@/data/table-editor/keys'
import type { Entity } from '@/data/table-editor/table-editor-types'
import { TableEditorStateContextProvider, useTableEditorStateSnapshot } from '@/state/table-editor'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

// The table open in the grid, which must never be the one that gets deleted
const OPEN_TABLE = {
  id: 1,
  schema: 'public',
  name: 'open_table',
  entity_type: ENTITY_TYPE.TABLE,
  columns: [],
  primary_keys: [],
} as unknown as Entity

// The table named in the editor state, as when a sidebar row's menu is used
const TARGET = { id: 2, schema: 'public', name: 'target_table' }

type DeleteAction = 'onDeleteTable' | 'onDeleteView' | 'onDeleteMaterializedView'

// Stands in for the sidebar menu, which opens the dialog for a table id and nothing else
const OpenDialogButton = ({ action }: { action: DeleteAction }) => {
  const snap = useTableEditorStateSnapshot()
  return <Button onClick={() => snap[action](TARGET.id)}>Open dialog</Button>
}

// Lets a test unmount the dialogs while a delete is still in flight, as happens when the deleted
// table is the one open in the grid and the page swaps to "table not found"
let unmountDialogs: () => void = () => {}
const UnmountableHost = ({ children }: PropsWithChildren) => {
  const [isMounted, setIsMounted] = useState(true)
  unmountDialogs = () => setIsMounted(false)
  return isMounted ? <>{children}</> : null
}

const mockApi = (
  entityType: ENTITY_TYPE,
  { onDeleteRequest }: { onDeleteRequest?: () => void | Promise<void> } = {}
) => {
  const statements: string[] = []
  let isDeleted = false

  // useSelectedProjectQuery
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error partial project response
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
  // The table editor query and the delete mutation both run SQL through pg-meta
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const queryName = new URL(request.url).searchParams.get('key') ?? ''
      if (queryName.startsWith('table-editor')) {
        return HttpResponse.json(
          isDeleted ? [] : [{ entity: { ...TARGET, entity_type: entityType, columns: [] } }]
        )
      }
      statements.push(((await request.json()) as { query: string }).query)
      isDeleted = true
      await onDeleteRequest?.()
      return HttpResponse.json([])
    },
  })

  return statements
}

const renderDialogs = (action: DeleteAction, onTableDeleted = vi.fn()) =>
  customRender(
    <TableEditorStateContextProvider>
      <OpenDialogButton action={action} />
      <DeleteConfirmationDialogs selectedTable={OPEN_TABLE} onTableDeleted={onTableDeleted} />
    </TableEditorStateContextProvider>
  )

describe('DeleteConfirmationDialogs', () => {
  it.each([
    {
      label: 'table',
      entityType: ENTITY_TYPE.TABLE,
      action: 'onDeleteTable',
      statement: /drop table/i,
    },
    {
      label: 'view',
      entityType: ENTITY_TYPE.VIEW,
      action: 'onDeleteView',
      statement: /drop view/i,
    },
    {
      label: 'materialized view',
      entityType: ENTITY_TYPE.MATERIALIZED_VIEW,
      action: 'onDeleteMaterializedView',
      statement: /drop materialized view/i,
    },
  ] as const)(
    'deletes the $label named in the state, not the one open in the grid',
    async ({ label, entityType, action, statement }) => {
      const user = userEvent.setup()
      const onTableDeleted = vi.fn()
      const statements = mockApi(entityType)

      renderDialogs(action, onTableDeleted)

      await user.click(screen.getByRole('button', { name: 'Open dialog' }))
      const dialog = await screen.findByRole('dialog', {
        name: `Confirm deletion of ${label} "${TARGET.name}"`,
      })
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(statements).toHaveLength(1))
      expect(statements[0]).toMatch(statement)
      expect(statements[0]).toContain(`${TARGET.schema}.${TARGET.name}`)
      expect(statements[0]).not.toContain(OPEN_TABLE.name)
      await waitFor(() =>
        expect(onTableDeleted).toHaveBeenCalledWith(
          expect.objectContaining({ id: TARGET.id, name: TARGET.name })
        )
      )
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    }
  )

  it('still reports the deletion when the dialogs unmount while the delete is in flight', async () => {
    const user = userEvent.setup()
    const onTableDeleted = vi.fn()
    mockApi(ENTITY_TYPE.TABLE, {
      onDeleteRequest: () => act(() => unmountDialogs()),
    })

    customRender(
      <TableEditorStateContextProvider>
        <OpenDialogButton action="onDeleteTable" />
        <UnmountableHost>
          <DeleteConfirmationDialogs selectedTable={OPEN_TABLE} onTableDeleted={onTableDeleted} />
        </UnmountableHost>
      </TableEditorStateContextProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog', {
      name: `Confirm deletion of table "${TARGET.name}"`,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() =>
      expect(onTableDeleted).toHaveBeenCalledWith(
        expect.objectContaining({ id: TARGET.id, name: TARGET.name })
      )
    )
  })

  it('still reports the deletion when the deleted table disappears before the delete settles', async () => {
    const user = userEvent.setup()
    const onTableDeleted = vi.fn()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    // The refetch that follows a delete lands while the delete is still finishing, so the table the
    // dialogs were showing no longer exists by the time the delete reports success
    mockApi(ENTITY_TYPE.TABLE, {
      onDeleteRequest: () =>
        act(async () => {
          queryClient.setQueryData(tableEditorKeys.tableEditor('default', TARGET.id), null)
          // Let the resulting render happen before the delete responds
          await new Promise((resolve) => setTimeout(resolve, 0))
        }),
    })

    customRender(
      <TableEditorStateContextProvider>
        <OpenDialogButton action="onDeleteTable" />
        <DeleteConfirmationDialogs selectedTable={OPEN_TABLE} onTableDeleted={onTableDeleted} />
      </TableEditorStateContextProvider>,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog', {
      name: `Confirm deletion of table "${TARGET.name}"`,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(onTableDeleted).toHaveBeenCalledWith(
        expect.objectContaining({ id: TARGET.id, name: TARGET.name })
      )
    )
  })

  it('does not delete anything when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    const onTableDeleted = vi.fn()
    const statements = mockApi(ENTITY_TYPE.TABLE)

    renderDialogs('onDeleteTable', onTableDeleted)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog', {
      name: `Confirm deletion of table "${TARGET.name}"`,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(statements).toEqual([])
    expect(onTableDeleted).not.toHaveBeenCalled()
  })
})
