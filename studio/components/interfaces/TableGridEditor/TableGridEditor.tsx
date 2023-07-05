import { useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { find, isUndefined, noop } from 'lodash'
import type { PostgresColumn, PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { QueryKey, useQueryClient } from '@tanstack/react-query'

import { SchemaView } from 'types'
import { useCheckPermissions, useFlag, useStore, useUrlState } from 'hooks'
import useEntityType from 'hooks/misc/useEntityType'
import { useParams } from 'common/hooks'
import GridHeaderActions from './GridHeaderActions'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor'
import {
  Dictionary,
  parseSupaTable,
  SupabaseGrid,
  SupabaseGridRef,
  SupaTable,
} from 'components/grid'
import { sqlKeys } from 'data/sql/keys'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { JsonEditValue } from './SidePanelEditor/RowEditor/RowEditor.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'
import { ForeignRowSelectorProps } from './SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import TableDefinition from './TableDefinition'
import APIDocumentationPanel from './APIDocumentationPanel'
import { ERROR_PRIMARY_KEY_NOTFOUND } from 'components/grid/constants'

export interface TableGridEditorProps {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  selectedSchema?: string
  selectedTable: any // PostgresTable | SchemaView

  /** Determines what side panel editor to show */
  sidePanelKey?: 'row' | 'column' | 'table' | 'json' | 'foreign-row-selector' | 'csv-import'
  /** Toggles if we're duplicating a table */
  isDuplicating: boolean
  /** Selected entities if we're editing a row, column or table */
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable
  selectedValueForJsonEdit?: JsonEditValue
  selectedForeignKeyToEdit?: {
    foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
    row: any
    column: any
  }

  onAddRow: () => void
  onEditRow: (row: Dictionary<any>) => void
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
  onExpandJSONEditor: (column: string, row: any) => void
  onEditForeignKeyColumnValue: (args: {
    foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
    row: any
    column: any
  }) => void
  onClosePanel: () => void
  onImportData: () => void
}

const TableGridEditor = ({
  theme = 'dark',

  selectedSchema,
  selectedTable,
  sidePanelKey,
  isDuplicating,
  selectedRowToEdit,
  selectedColumnToEdit,
  selectedTableToEdit,
  selectedValueForJsonEdit,
  selectedForeignKeyToEdit,

  onAddRow = noop,
  onEditRow = noop,
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
  onExpandJSONEditor = noop,
  onEditForeignKeyColumnValue = noop,
  onClosePanel = noop,
  onImportData = noop,
}: TableGridEditorProps) => {
  const { meta, ui, vault } = useStore()
  const router = useRouter()
  const { ref: projectRef, id } = useParams()
  const gridRef = useRef<SupabaseGridRef>(null)

  const { project } = useProjectContext()
  const isVaultEnabled = useFlag('vaultExtension')
  const [encryptedColumns, setEncryptedColumns] = useState([])
  const [apiPreviewPanelOpen, setApiPreviewPanelOpen] = useState(false)

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()
  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  const canEditTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  const isReadOnly = !canEditTables && !canEditColumns

  const getEncryptedColumns = async (table: any) => {
    const columns = await vault.listEncryptedColumns(table.schema, table.name)
    setEncryptedColumns(columns)
  }

  const queryClient = useQueryClient()
  const { mutate: mutateUpdateTableRow } = useTableRowUpdateMutation({
    async onMutate({ projectRef, table, configuration, payload }) {
      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))

      const queryKey = sqlKeys.query(projectRef, [
        table.schema,
        table.name,
        { table: { name: table.name, schema: table.schema } },
      ])

      await queryClient.cancelQueries(queryKey)

      const previousRowsQueries = queryClient.getQueriesData<{ result: any[] }>(queryKey)

      queryClient.setQueriesData<{ result: any[] }>(queryKey, (old) => {
        return {
          result:
            old?.result.map((row) => {
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
          )
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

  const { refetch } = useProjectJsonSchemaQuery({ projectRef })
  const refreshDocs = async () => await refetch()

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
  })
  const foreignKeyMeta = data || []

  useEffect(() => {
    if (selectedTable !== undefined && selectedTable.id !== undefined && isVaultEnabled) {
      getEncryptedColumns(selectedTable)
    }
  }, [selectedTable?.id])

  const entityType = useEntityType(selectedTable?.id)

  // NOTE: DO NOT PUT HOOKS AFTER THIS LINE
  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(id)} />
  }

  const tableId = selectedTable?.id

  const isViewSelected =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const isTableSelected = entityType?.type === ENTITY_TYPE.TABLE
  const isForeignTableSelected = entityType?.type === ENTITY_TYPE.FOREIGN_TABLE
  const isLocked = meta.excludedSchemas.includes(entityType?.schema ?? '')
  const canEditViaTableEditor = isTableSelected && !isLocked

  // [Joshen] We can tweak below to eventually support composite keys as the data
  // returned from foreignKeyMeta should be easy to deal with, rather than pg-meta
  const formattedRelationships = (selectedTable?.relationships ?? []).map(
    (relationship: PostgresRelationship) => {
      const relationshipMeta = foreignKeyMeta.find(
        (fk: ForeignKeyConstraint) => fk.id === relationship.id
      )
      return {
        ...relationship,
        deletion_action: relationshipMeta?.deletion_action ?? FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
      }
    }
  )

  const gridTable =
    !isViewSelected && !isForeignTableSelected
      ? parseSupaTable(
          {
            table: selectedTable as PostgresTable,
            columns: (selectedTable as PostgresTable).columns ?? [],
            primaryKeys: (selectedTable as PostgresTable).primary_keys ?? [],
            relationships: formattedRelationships,
          },
          encryptedColumns
        )
      : parseSupaTable({
          table: selectedTable as SchemaView,
          columns: (selectedTable as SchemaView).columns ?? [],
          primaryKeys: [],
          relationships: [],
        })

  const gridKey = `${selectedTable.schema}_${selectedTable.name}`

  const onRowCreated = (row: Dictionary<any>) => {
    if (gridRef.current) gridRef.current.rowAdded(row)
  }

  const onRowUpdated = (row: Dictionary<any>, idx: number) => {
    if (gridRef.current) gridRef.current.rowEdited(row, idx)
  }

  const onColumnSaved = (hasEncryptedColumns = false) => {
    if (hasEncryptedColumns) getEncryptedColumns(selectedTable)
  }

  const onTableCreated = (table: PostgresTable) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  const onSqlQuery = async (query: string) => {
    const res = await meta.query(query)
    if (res.error) {
      return { error: res.error }
    } else {
      return { data: res }
    }
  }

  const onSelectEditColumn = async (name: string) => {
    // For some reason, selectedTable here is stale after adding a table
    // temporary workaround is to list grab the selected table again
    const tables: PostgresTable[] = meta.tables.list()
    // @ts-ignore
    const table = tables.find((table) => table.id === Number(tableId))
    const column = find(table!.columns, { name }) as PostgresColumn
    if (column) {
      onEditColumn(column)
    } else {
      console.error(`Unable to find column ${name} in ${table?.name}`)
    }
  }

  const onSelectDeleteColumn = async (name: string) => {
    // For some reason, selectedTable here is stale after adding a table
    // temporary workaround is to list grab the selected table again
    const tables: PostgresTable[] = meta.tables.list()
    const table = tables.find((table) => table.id === Number(tableId))
    const column = find(table!.columns, { name }) as PostgresColumn
    onDeleteColumn(column)
  }

  const onError = (error: any) => {
    ui.setNotification({
      category: 'error',
      message: error?.details ?? error?.message ?? error,
    })
  }

  const updateTableRow = (previousRow: any, updatedData: any) => {
    if (!project) return

    const enumArrayColumns = selectedTable.columns
      .filter((column: any) => {
        return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
      })
      .map((column: any) => column.name)

    const identifiers = {} as Dictionary<any>
    ;(selectedTable as PostgresTable).primary_keys.forEach(
      (column) => (identifiers[column.name] = previousRow[column.name])
    )

    const configuration = { identifiers }
    if (Object.keys(identifiers).length === 0) {
      return ui.setNotification({
        category: 'error',
        message: ERROR_PRIMARY_KEY_NOTFOUND,
      })
    }

    mutateUpdateTableRow({
      projectRef: project.ref,
      connectionString: project.connectionString,
      table: gridTable as SupaTable,
      configuration,
      payload: updatedData,
      enumArrayColumns,
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
        ref={gridRef}
        theme={theme}
        gridProps={{ height: '100%' }}
        storageRef={projectRef}
        editable={!isReadOnly && canEditTables && canEditViaTableEditor}
        schema={selectedTable.schema}
        table={gridTable}
        refreshDocs={refreshDocs}
        headerActions={
          isTableSelected || isViewSelected || canEditViaTableEditor ? (
            <>
              {canEditViaTableEditor && (
                <GridHeaderActions
                  table={selectedTable as PostgresTable}
                  apiPreviewPanelOpen={apiPreviewPanelOpen}
                  setApiPreviewPanelOpen={setApiPreviewPanelOpen}
                  refreshDocs={refreshDocs}
                />
              )}
              {(isTableSelected || isViewSelected) && (
                <>
                  {canEditViaTableEditor && (
                    <div className="h-[20px] w-px border-r border-scale-600"></div>
                  )}
                  <div>
                    <TwoOptionToggle
                      width={75}
                      options={['definition', 'data']}
                      activeOption={selectedView}
                      borderOverride="border-gray-500"
                      onClickOption={setSelectedView}
                    />
                  </div>
                </>
              )}
            </>
          ) : null
        }
        onAddColumn={onAddColumn}
        onEditColumn={onSelectEditColumn}
        onDeleteColumn={onSelectDeleteColumn}
        onAddRow={onAddRow}
        updateTableRow={updateTableRow}
        onEditRow={onEditRow}
        onImportData={onImportData}
        onError={onError}
        onSqlQuery={onSqlQuery}
        onExpandJSONEditor={onExpandJSONEditor}
        onEditForeignKeyColumnValue={onEditForeignKeyColumnValue}
        showCustomChildren={(isViewSelected || isTableSelected) && selectedView === 'definition'}
        customHeader={
          (isViewSelected || isTableSelected) && selectedView === 'definition' ? (
            <div className="flex items-center space-x-2">
              <p>
                SQL Definition of <code className="text-sm">{selectedTable.name}</code>{' '}
              </p>
              <p className="text-scale-1000 text-sm">(Read only)</p>
            </div>
          ) : null
        }
      >
        {(isViewSelected || isTableSelected) && <TableDefinition id={selectedTable?.id} />}
      </SupabaseGrid>

      {!isUndefined(selectedSchema) && (
        <SidePanelEditor
          selectedSchema={selectedSchema}
          isDuplicating={isDuplicating}
          selectedTable={selectedTable as PostgresTable}
          selectedRowToEdit={selectedRowToEdit}
          selectedColumnToEdit={selectedColumnToEdit}
          selectedTableToEdit={selectedTableToEdit}
          selectedValueForJsonEdit={selectedValueForJsonEdit}
          selectedForeignKeyToEdit={selectedForeignKeyToEdit}
          sidePanelKey={sidePanelKey}
          onRowCreated={onRowCreated}
          onRowUpdated={onRowUpdated}
          onColumnSaved={onColumnSaved}
          onTableCreated={onTableCreated}
          closePanel={onClosePanel}
        />
      )}

      <APIDocumentationPanel
        visible={apiPreviewPanelOpen}
        onClose={() => setApiPreviewPanelOpen(false)}
      />
    </>
  )
}

export default observer(TableGridEditor)
