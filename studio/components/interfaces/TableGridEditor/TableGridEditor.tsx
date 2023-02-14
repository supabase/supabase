import { useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { find, isUndefined, noop } from 'lodash'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SchemaView } from 'types'
import { checkPermissions, useFlag, useParams, useStore } from 'hooks'
import { Table } from 'data/tables/table-query'
import GridHeaderActions from './GridHeaderActions'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor'
import { Dictionary, parseSupaTable, SupabaseGrid, SupabaseGridRef } from 'components/grid'

export interface TableGridEditorProps {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  selectedSchema?: string
  selectedTable: Table // PostgresTable | SchemaView

  /** Determines what side panel editor to show */
  sidePanelKey?: 'row' | 'column' | 'table'
  /** Toggles if we're duplicating a table */
  isDuplicating: boolean
  /** Selected entities if we're editing a row, column or table */
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable

  onAddRow: () => void
  onEditRow: (row: Dictionary<any>) => void
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
  onClosePanel: () => void
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

  onAddRow = noop,
  onEditRow = noop,
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
  onClosePanel = noop,
}: TableGridEditorProps) => {
  const { meta, ui, vault } = useStore()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const gridRef = useRef<SupabaseGridRef>(null)

  const [encryptedColumns, setEncryptedColumns] = useState([])
  const isVaultEnabled = useFlag('vaultExtension')

  const getEncryptedColumns = async (table: any) => {
    const columns = await vault.listEncryptedColumns(table.schema, table.name)
    setEncryptedColumns(columns)
  }

  useEffect(() => {
    if (selectedTable !== undefined && selectedTable.id !== undefined && isVaultEnabled) {
      getEncryptedColumns(selectedTable)
    }
  }, [selectedTable?.id])

  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(router.query.id)} />
  }

  const tableId = selectedTable.id

  const isViewSelected = selectedTable.type === 'view'
  const isForeignTableSelected = selectedTable.type === 'foreign_table'
  const isLocked = false // TODO(alaister): meta.excludedSchemas.includes(schema?.name ?? '')
  const canUpdateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditViaTableEditor = !isViewSelected && !isForeignTableSelected && !isLocked

  const gridTable =
    !isViewSelected && !isForeignTableSelected
      ? parseSupaTable(
          {
            table: selectedTable,
            columns: selectedTable.columns ?? [],
            primaryKeys: selectedTable.primary_keys,
            relationships: selectedTable.relationships,
          },
          encryptedColumns
        )
      : selectedTable.name

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

  console.log('gridTable:', gridTable)

  return (
    <>
      <SupabaseGrid
        key={gridKey}
        ref={gridRef}
        theme={theme}
        gridProps={{ height: '100%' }}
        storageRef={projectRef}
        editable={canUpdateTables && canEditViaTableEditor}
        schema={selectedTable.schema}
        table={gridTable}
        headerActions={canEditViaTableEditor && <GridHeaderActions table={selectedTable} />}
        onAddColumn={onAddColumn}
        onEditColumn={onSelectEditColumn}
        onDeleteColumn={onSelectDeleteColumn}
        onAddRow={onAddRow}
        onEditRow={onEditRow}
        onError={onError}
        onSqlQuery={onSqlQuery}
      />
      {!isUndefined(selectedSchema) && (
        <SidePanelEditor
          selectedSchema={selectedSchema}
          isDuplicating={isDuplicating}
          selectedTable={selectedTable}
          selectedRowToEdit={selectedRowToEdit}
          selectedColumnToEdit={selectedColumnToEdit}
          selectedTableToEdit={selectedTableToEdit}
          sidePanelKey={sidePanelKey}
          onRowCreated={onRowCreated}
          onRowUpdated={onRowUpdated}
          onColumnSaved={onColumnSaved}
          onTableCreated={onTableCreated}
          closePanel={onClosePanel}
        />
      )}
    </>
  )
}

export default observer(TableGridEditor)
