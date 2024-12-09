import { PermissionAction } from '@supabase/shared-types/out/constants'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { find, isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DocsButton } from 'components/ui/DocsButton'
import {
  Entity,
  isMaterializedView,
  isTableLike,
  isView,
} from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { TableRowsData } from 'data/table-rows/table-rows-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import useLatest from 'hooks/misc/useLatest'
import { useUrlState } from 'hooks/ui/useUrlState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { EMPTY_ARR } from 'lib/void'
import { useGetImpersonatedRole } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { Dictionary } from 'types'
import GridHeaderActions from './GridHeaderActions'
import { TableGridSkeletonLoader } from './LoadingState'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor/SidePanelEditor'
import TableDefinition from './TableDefinition'

export interface TableGridEditorProps {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  isLoadingSelectedTable?: boolean
  selectedTable?: Entity
}

const TableGridEditor = ({
  theme = 'dark',
  isLoadingSelectedTable = false,
  selectedTable,
}: TableGridEditorProps) => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()

  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const getImpersonatedRole = useGetImpersonatedRole()
  const [{ view: selectedView = 'data' }] = useUrlState()

  const canEditTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')
  const isReadOnly = !canEditTables && !canEditColumns

  const queryClient = useQueryClient()
  const { mutate: mutateUpdateTableRow } = useTableRowUpdateMutation({
    async onMutate({ projectRef, table, configuration, payload }) {
      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))

      const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })

      await queryClient.cancelQueries(queryKey)

      const previousRowsQueries = queryClient.getQueriesData<TableRowsData>(queryKey)

      queryClient.setQueriesData<TableRowsData>(queryKey, (old) => {
        return {
          rows:
            old?.rows.map((row) => {
              // match primary keys
              if (
                Object.entries(row)
                  .filter(([key]) => primaryKeyColumns.has(key))
                  .every(([key, value]) => value === configuration.identifiers[key])
              ) {
                return { ...row, ...payload }
              }

              return row
            }) ?? [],
        }
      })

      return { previousRowsQueries }
    },
    onError(error, _variables, context) {
      const { previousRowsQueries } = context as {
        previousRowsQueries: [
          QueryKey,
          (
            | {
                result: any[]
              }
            | undefined
          ),
        ][]
      }

      previousRowsQueries.forEach(([queryKey, previousRows]) => {
        if (previousRows) {
          queryClient.setQueriesData(queryKey, previousRows)
        }
        queryClient.invalidateQueries(queryKey)
      })

      onError(error)
    },
  })

  const columnsRef = useLatest(selectedTable?.columns ?? EMPTY_ARR)

  // NOTE: DO NOT PUT HOOKS AFTER THIS LINE
  if (isLoadingSelectedTable) {
    return <TableGridSkeletonLoader />
  }

  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(id)} />
  }

  const isViewSelected = isView(selectedTable) || isMaterializedView(selectedTable)
  const isTableSelected = isTableLike(selectedTable)
  const isLocked = PROTECTED_SCHEMAS.includes(selectedTable?.schema ?? '')
  const canEditViaTableEditor = isTableSelected && !isLocked

  const gridTable = parseSupaTable(selectedTable)

  const gridKey = `${selectedTable.schema}_${selectedTable.name}`

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  // columns must be accessed via columnsRef.current as these two functions immediately become
  // stale as they are accessed via some react-tracked madness
  // [TODO]: refactor out all of react-tracked
  const onSelectEditColumn = (name: string) => {
    const column = find(columnsRef.current, { name })
    if (column) {
      snap.onEditColumn(column)
    } else {
      toast.error(`Unable to find column ${name} in ${selectedTable?.name}`)
    }
  }

  const onSelectDeleteColumn = (name: string) => {
    const column = find(columnsRef.current ?? [], { name })
    if (column) {
      snap.onDeleteColumn(column)
    } else {
      toast.error(`Unable to find column ${name} in ${selectedTable?.name}`)
    }
  }

  const onError = (error: any) => {
    toast.error(error?.details ?? error?.message ?? error)
  }

  const updateTableRow = (previousRow: any, updatedData: any) => {
    if (!project) return

    const enumArrayColumns = selectedTable.columns
      ?.filter((column) => {
        return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
      })
      .map((column) => column.name)

    const identifiers = {} as Dictionary<any>
    isTableLike(selectedTable) &&
      selectedTable.primary_keys.forEach(
        (column) => (identifiers[column.name] = previousRow[column.name])
      )

    const configuration = { identifiers }
    if (Object.keys(identifiers).length === 0) {
      return toast('Unable to update row as table has no primary keys', {
        description: (
          <div>
            <p className="text-sm text-foreground-light">
              Add a primary key column to your table first to serve as a unique identifier for each
              row before updating or deleting the row.
            </p>
            <div className="mt-3">
              <DocsButton href="https://supabase.com/docs/guides/database/tables#primary-keys" />
            </div>
          </div>
        ),
      })
    }

    mutateUpdateTableRow({
      projectRef: project.ref,
      connectionString: project.connectionString,
      table: selectedTable,
      configuration,
      payload: updatedData,
      enumArrayColumns,
      impersonatedRole: getImpersonatedRole(),
    })
  }

  /** [Joshen] We're going to need to refactor SupabaseGrid eventually to make the code here more readable
   * For context we previously built the SupabaseGrid as a reusable npm component, but eventually decided
   * to just integrate it directly into the dashboard. The header, and body (+footer) should be decoupled.
   */

  return (
    <>
      <SupabaseGrid
        key={gridKey}
        theme={theme}
        gridProps={{ height: '100%' }}
        projectRef={projectRef}
        editable={!isReadOnly && canEditViaTableEditor}
        schema={selectedTable.schema}
        table={gridTable}
        headerActions={
          <GridHeaderActions table={selectedTable} canEditViaTableEditor={canEditViaTableEditor} />
        }
        onAddColumn={snap.onAddColumn}
        onEditColumn={onSelectEditColumn}
        onDeleteColumn={onSelectDeleteColumn}
        onAddRow={snap.onAddRow}
        updateTableRow={updateTableRow}
        onEditRow={snap.onEditRow}
        onImportData={snap.onImportData}
        onError={onError}
        onExpandJSONEditor={(column, row) => {
          snap.onExpandJSONEditor({ column, row, value: JSON.stringify(row[column]) || '' })
        }}
        onExpandTextEditor={(column, row) => {
          snap.onExpandTextEditor(column, row)
        }}
        onEditForeignKeyColumnValue={snap.onEditForeignKeyColumnValue}
        showCustomChildren={(isViewSelected || isTableSelected) && selectedView === 'definition'}
        customHeader={
          (isViewSelected || isTableSelected) && selectedView === 'definition' ? (
            <div className="flex items-center space-x-2">
              <p>
                SQL Definition of <code className="text-sm">{selectedTable.name}</code>{' '}
              </p>
              <p className="text-foreground-light text-sm">(Read only)</p>
            </div>
          ) : null
        }
      >
        {(isViewSelected || isTableSelected) && <TableDefinition entity={selectedTable} />}
      </SupabaseGrid>

      <SidePanelEditor
        editable={!isReadOnly && canEditViaTableEditor}
        selectedTable={isTableLike(selectedTable) ? selectedTable : undefined}
        onTableCreated={onTableCreated}
      />
    </>
  )
}

export default TableGridEditor
