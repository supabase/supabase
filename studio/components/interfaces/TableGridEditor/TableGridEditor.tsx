import { FC, useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { find, isUndefined } from 'lodash'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SchemaView } from 'types'
import { checkPermissions, useFlag, useStore } from 'hooks'
import GridHeaderActions from './GridHeaderActions'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor'
import { Dictionary, parseSupaTable, SupabaseGrid, SupabaseGridRef } from 'components/grid'

interface Props {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  selectedSchema?: string
  selectedTable: any // PostgresTable | SchemaView

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

const TableGridEditor: FC<Props> = ({
  theme = 'dark',

  selectedSchema,
  selectedTable,
  sidePanelKey,
  isDuplicating,
  selectedRowToEdit,
  selectedColumnToEdit,
  selectedTableToEdit,

  onAddRow = () => {},
  onEditRow = () => {},
  onAddColumn = () => {},
  onEditColumn = () => {},
  onDeleteColumn = () => {},
  onClosePanel = () => {},
}) => {
  const { meta, ui, vault } = useStore()
  const router = useRouter()
  const gridRef = useRef<SupabaseGridRef>(null)
  const projectRef = ui.selectedProject?.ref

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

  const tableId = selectedTable?.id

  // @ts-ignore
  const schema = meta.schemas.list().find((schema) => schema.name === selectedSchema)
  const isViewSelected = !Object.keys(selectedTable).includes('rls_enabled')
  const isForeignTableSelected = meta.foreignTables.byId(selectedTable.id) !== undefined
  const isLocked = meta.excludedSchemas.includes(schema?.name ?? '')
  const canUpdateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditViaTableEditor = !isViewSelected && !isForeignTableSelected && !isLocked

  const gridTable =
    !isViewSelected && !isForeignTableSelected
      ? parseSupaTable(
          {
            table: selectedTable as PostgresTable,
            columns: (selectedTable as PostgresTable).columns ?? [],
            primaryKeys: (selectedTable as PostgresTable).primary_keys,
            relationships: (selectedTable as PostgresTable).relationships,
          },
          encryptedColumns
        )
      : (selectedTable as SchemaView).name

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
        headerActions={
          canEditViaTableEditor && <GridHeaderActions table={selectedTable as PostgresTable} />
        }
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
          selectedTable={selectedTable as PostgresTable}
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
