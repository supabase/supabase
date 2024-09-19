import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { isEmpty, isUndefined, noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabasePublicationCreateMutation } from 'data/database-publications/database-publications-create-mutation'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import type { Constraint } from 'data/database/constraints-query'
import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { entityTypeKeys } from 'data/entity-types/keys'
import { sqlKeys } from 'data/sql/keys'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { tableKeys } from 'data/tables/keys'
import { getTables } from 'data/tables/tables-query'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useGetImpersonatedRole } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { Dictionary } from 'types'
import { SonnerProgress } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ColumnEditor from './ColumnEditor/ColumnEditor'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import ForeignRowSelector from './RowEditor/ForeignRowSelector/ForeignRowSelector'
import JsonEditor from './RowEditor/JsonEditor/JsonEditor'
import RowEditor from './RowEditor/RowEditor'
import { TextEditor } from './RowEditor/TextEditor'
import SchemaEditor from './SchemaEditor'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import {
  createColumn,
  createTable,
  duplicateTable,
  insertRowsViaSpreadsheet,
  insertTableRows,
  updateColumn,
  updateTable,
} from './SidePanelEditor.utils'
import SpreadsheetImport from './SpreadsheetImport/SpreadsheetImport'
import TableEditor from './TableEditor/TableEditor'
import type { ImportContent } from './TableEditor/TableEditor.types'

export interface SidePanelEditorProps {
  editable?: boolean
  selectedTable?: PostgresTable
  includeColumns?: boolean // This is mainly used for invalidating useTablesQuery

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: PostgresTable) => void
}

const SidePanelEditor = ({
  editable = true,
  selectedTable,
  includeColumns = false,
  onTableCreated = noop,
}: SidePanelEditorProps) => {
  const snap = useTableEditorStateSnapshot()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })

  const queryClient = useQueryClient()
  const { project } = useProjectContext()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const enumArrayColumns = (selectedTable?.columns ?? [])
    .filter((column) => {
      return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
    })
    .map((column) => column.name)

  const { mutateAsync: createTableRows } = useTableRowCreateMutation({
    onSuccess() {
      toast.success('Successfully created row')
    },
  })
  const { mutateAsync: updateTableRow } = useTableRowUpdateMutation({
    onSuccess() {
      toast.success('Successfully updated row')
    },
  })
  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutateAsync: createPublication } = useDatabasePublicationCreateMutation()
  const { mutateAsync: updatePublication } = useDatabasePublicationUpdateMutation({
    onError: () => {},
  })

  const getImpersonatedRole = useGetImpersonatedRole()

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number },
    onComplete: (err?: any) => void
  ) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    let saveRowError: Error | undefined
    if (isNewRecord) {
      try {
        await createTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable as any,
          payload,
          enumArrayColumns,
          impersonatedRole: getImpersonatedRole(),
        })
      } catch (error: any) {
        saveRowError = error
      }
    } else {
      const hasChanges = !isEmpty(payload)
      if (hasChanges) {
        if (selectedTable.primary_keys.length > 0) {
          try {
            await updateTableRow({
              projectRef: project.ref,
              connectionString: project.connectionString,
              table: selectedTable as any,
              configuration,
              payload,
              enumArrayColumns,
              impersonatedRole: getImpersonatedRole(),
            })
          } catch (error: any) {
            saveRowError = error
          }
        } else {
          saveRowError = new Error('No primary key')
          toast.error(
            "We can't make changes to this table because there is no primary key. Please create a primary key and try again."
          )
        }
      }
    }

    onComplete(saveRowError)
    if (!saveRowError) {
      setIsEdited(false)
      snap.closeSidePanel()
    }
  }

  const onSaveColumnValue = async (value: string | number | null, resolve: () => void) => {
    if (selectedTable === undefined) return

    let payload
    let configuration
    const isNewRecord = false
    const identifiers = {} as Dictionary<any>
    if (snap.sidePanel?.type === 'json') {
      const selectedValueForJsonEdit = snap.sidePanel.jsonValue
      const { row, column } = selectedValueForJsonEdit
      payload = { [column]: value === null ? null : JSON.parse(value as any) }
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))
      configuration = { identifiers, rowIdx: row.idx }
    } else if (snap.sidePanel?.type === 'cell') {
      const column = snap.sidePanel.value?.column
      const row = snap.sidePanel.value?.row

      if (!column || !row) return
      payload = { [column]: value === null ? null : value }
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))
      configuration = { identifiers, rowIdx: row.idx }
    }

    if (payload !== undefined && configuration !== undefined) {
      try {
        await saveRow(payload, isNewRecord, configuration, () => {})
      } catch (error) {
        // [Joshen] No error handler required as error is handled within saveRow
      } finally {
        resolve()
      }
    }
  }

  const onSaveForeignRow = async (value?: { [key: string]: any }) => {
    if (selectedTable === undefined || !(snap.sidePanel?.type === 'foreign-row-selector')) return
    const selectedForeignKeyToEdit = snap.sidePanel.foreignKey

    try {
      const { row } = selectedForeignKeyToEdit
      const identifiers = {} as Dictionary<any>
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))

      const isNewRecord = false
      const configuration = { identifiers, rowIdx: row.idx }

      saveRow(value, isNewRecord, configuration, () => {})
    } catch (error) {}
  }

  const saveColumn = async (
    payload: CreateColumnPayload | UpdateColumnPayload,
    isNewRecord: boolean,
    configuration: {
      columnId?: string
      primaryKey?: Constraint
      foreignKeyRelations: ForeignKey[]
      existingForeignKeyRelations: ForeignKeyConstraint[]
    },
    resolve: any
  ) => {
    const selectedColumnToEdit = snap.sidePanel?.type === 'column' && snap.sidePanel.column
    const { columnId, primaryKey, foreignKeyRelations, existingForeignKeyRelations } = configuration

    const response = isNewRecord
      ? await createColumn({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          payload: payload as CreateColumnPayload,
          selectedTable: selectedTable as PostgresTable,
          primaryKey,
          foreignKeyRelations,
        })
      : await updateColumn({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          id: columnId as string,
          payload: payload as UpdateColumnPayload,
          selectedTable: selectedTable as PostgresTable,
          primaryKey,
          foreignKeyRelations,
          existingForeignKeyRelations,
        })

    if (response?.error) {
      toast.error(response.error.message)
    } else {
      if (
        !isNewRecord &&
        payload.name &&
        selectedColumnToEdit &&
        selectedColumnToEdit.name !== payload.name
      ) {
        reAddRenamedColumnSortAndFilter(selectedColumnToEdit.name, payload.name)
      }

      await Promise.all([
        queryClient.invalidateQueries(tableKeys.table(project?.ref, selectedTable!.id)),
        queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreign-key-constraints'])),
        queryClient.invalidateQueries(
          sqlKeys.query(project?.ref, [
            'table-definition',
            selectedTable!.schema,
            selectedTable!.name,
          ])
        ),
        queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
      ])

      await queryClient.invalidateQueries(
        sqlKeys.query(project?.ref, [selectedTable!.schema, selectedTable!.name])
      )

      setIsEdited(false)
      snap.closeSidePanel()
    }

    resolve()
  }

  /**
   * Adds the renamed column's filter and/or sort rules.
   */
  const reAddRenamedColumnSortAndFilter = (oldColumnName: string, newColumnName: string) => {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const existingSorts = (prevParams?.sort ?? []) as string[]

      return {
        ...prevParams,
        filter: existingFilters.map((filter: string) => {
          const [column] = filter.split(':')
          return column === oldColumnName ? filter.replace(column, newColumnName) : filter
        }),
        sort: existingSorts.map((sort: string) => {
          const [column] = sort.split(':')
          return column === oldColumnName ? sort.replace(column, newColumnName) : sort
        }),
      }
    })
  }

  const updateTableRealtime = async (table: PostgresTable, enabled: boolean) => {
    if (!project) return console.error('Project is required')
    let realtimePublication = (publications ?? []).find((pub) => pub.name === 'supabase_realtime')
    const publicTables = await queryClient.fetchQuery({
      queryKey: tableKeys.list(project.ref, 'public', includeColumns),
      queryFn: ({ signal }) =>
        getTables(
          { projectRef: project.ref, connectionString: project.connectionString, schema: 'public' },
          signal
        ),
    })

    try {
      if (realtimePublication === undefined) {
        realtimePublication = await createPublication({
          projectRef: project.ref,
          connectionString: project?.connectionString,
          name: 'supabase_realtime',
          publish_insert: true,
          publish_update: true,
          publish_delete: true,
        })
      }
      const { id, tables: publicationTables } = realtimePublication
      if (publicationTables === null) {
        // UI doesn't have support for toggling realtime for ALL tables
        // Switch it to individual tables via an array of strings
        // Refer to PublicationStore for more information about this
        const realtimeTables = enabled
          ? publicTables.map((t: any) => `${t.schema}.${t.name}`)
          : publicTables
              .filter((t: any) => t.id !== table.id)
              .map((t: any) => `${t.schema}.${t.name}`)
        await updatePublication({
          id,
          projectRef: project.ref,
          connectionString: project?.connectionString,
          tables: realtimeTables,
        })
      } else {
        const isAlreadyEnabled = publicationTables.some((x: any) => x.id == table.id)
        const realtimeTables =
          isAlreadyEnabled && !enabled
            ? // Toggle realtime off
              publicationTables
                .filter((t: any) => t.id !== table.id)
                .map((t: any) => `${t.schema}.${t.name}`)
            : !isAlreadyEnabled && enabled
              ? // Toggle realtime on
                [`${table.schema}.${table.name}`].concat(
                  publicationTables.map((t: any) => `${t.schema}.${t.name}`)
                )
              : null
        if (realtimeTables === null) return
        await updatePublication({
          id,
          projectRef: project.ref,
          connectionString: project?.connectionString,
          tables: realtimeTables,
        })
      }
    } catch (error: any) {
      toast.error(`Failed to update realtime for ${table.name}: ${error.message}`)
    }
  }

  const saveTable = async (
    payload: {
      name: string
      schema: string
      comment?: string | undefined
    },
    columns: ColumnField[],
    foreignKeyRelations: ForeignKey[],
    isNewRecord: boolean,
    configuration: {
      tableId?: number
      importContent?: ImportContent
      isRLSEnabled: boolean
      isRealtimeEnabled: boolean
      isDuplicateRows: boolean
      existingForeignKeyRelations: ForeignKeyConstraint[]
      primaryKey?: Constraint
    },
    resolve: any
  ) => {
    let toastId
    let saveTableError = false
    const {
      importContent,
      isRLSEnabled,
      isRealtimeEnabled,
      isDuplicateRows,
      existingForeignKeyRelations,
      primaryKey,
    } = configuration

    try {
      if (
        snap.sidePanel?.type === 'table' &&
        snap.sidePanel.mode === 'duplicate' &&
        selectedTable
      ) {
        const tableToDuplicate = selectedTable

        toastId = toast.loading(`Duplicating table: ${tableToDuplicate.name}...`)

        const table = await duplicateTable(project?.ref!, project?.connectionString, payload, {
          isRLSEnabled,
          isDuplicateRows,
          duplicateTable: tableToDuplicate,
          foreignKeyRelations,
        })
        if (isRealtimeEnabled) await updateTableRealtime(table, isRealtimeEnabled)

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(project?.ref, table.schema, includeColumns)),
          queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
        ])

        toast.success(
          `Table ${tableToDuplicate.name} has been successfully duplicated into ${table.name}!`,
          { id: toastId }
        )
        onTableCreated(table)
      } else if (isNewRecord) {
        toastId = toast.loading(`Creating new table: ${payload.name}...`)

        const table = await createTable({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          toastId,
          payload,
          columns,
          foreignKeyRelations,
          isRLSEnabled,
          importContent,
        })
        if (isRealtimeEnabled) await updateTableRealtime(table as PostgresTable, true)

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(project?.ref, table.schema, includeColumns)),
          queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
        ])

        toast.success(`Table ${table.name} is good to go!`, { id: toastId })
        onTableCreated(table as PostgresTable)
      } else if (selectedTable) {
        toastId = toast.loading(`Updating table: ${selectedTable?.name}...`)

        const { table, hasError } = await updateTable({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          toastId,
          table: selectedTable,
          payload,
          columns,
          foreignKeyRelations,
          existingForeignKeyRelations,
          primaryKey,
        })

        await updateTableRealtime(table, isRealtimeEnabled)

        if (hasError) {
          toast(`Table ${table.name} has been updated, but there were some errors`, { id: toastId })
        } else {
          queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreign-key-constraints']))
          await Promise.all([
            queryClient.invalidateQueries(
              sqlKeys.query(project?.ref, [selectedTable.schema, selectedTable.name])
            ),
            queryClient.invalidateQueries(
              sqlKeys.query(project?.ref, [
                'table-definition',
                selectedTable.schema,
                selectedTable.name,
              ])
            ),
            queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
            queryClient.invalidateQueries(tableKeys.table(project?.ref, table.id)),
          ])

          toast.success(`Successfully updated ${table.name}!`, { id: toastId })
        }
      }
    } catch (error: any) {
      saveTableError = true
      toast.error(error.message, { id: toastId })
    }

    if (!saveTableError) {
      setIsEdited(false)
      snap.closeSidePanel()
    }

    resolve()
  }

  const onImportData = async (importContent: ImportContent) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    const { file, rowCount, selectedHeaders, resolve } = importContent
    const toastId = toast.loading(
      `Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`
    )

    if (file && rowCount > 0) {
      // CSV file upload
      const res: any = await insertRowsViaSpreadsheet(
        project.ref!,
        project.connectionString,
        file,
        selectedTable,
        selectedHeaders,
        (progress: number) => {
          toast.loading(
            <SonnerProgress
              progress={progress}
              message={`Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`}
            />,
            { id: toastId }
          )
        }
      )
      if (res.error) {
        toast.error(`Failed to import data: ${res.error.message}`, { id: toastId })
        return resolve()
      }
    } else {
      // Text paste
      const res: any = await insertTableRows(
        project.ref!,
        project.connectionString,
        selectedTable,
        importContent.rows,
        selectedHeaders,
        (progress: number) => {
          toast.loading(
            <SonnerProgress
              progress={progress}
              message={`Adding ${importContent.rows.length.toLocaleString()} rows to ${
                selectedTable.name
              }`}
            />,
            { id: toastId }
          )
        }
      )
      if (res.error) {
        toast.error(`Failed to import data: ${res.error.message}`, { id: toastId })
        return resolve()
      }
    }

    await Promise.all([
      queryClient.invalidateQueries(
        sqlKeys.query(project?.ref, [selectedTable!.schema, selectedTable!.name])
      ),
    ])
    toast.success(`Successfully imported ${rowCount} rows of data into ${selectedTable.name}`, {
      id: toastId,
    })
    resolve()
    snap.closeSidePanel()
  }

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosingPanel(true)
    } else {
      snap.closeSidePanel()
    }
  }

  return (
    <>
      {!isUndefined(selectedTable) && (
        <RowEditor
          row={snap.sidePanel?.type === 'row' ? snap.sidePanel.row : undefined}
          selectedTable={selectedTable}
          visible={snap.sidePanel?.type === 'row'}
          closePanel={onClosePanel}
          saveChanges={saveRow}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      {!isUndefined(selectedTable) && (
        <ColumnEditor
          column={
            snap.sidePanel?.type === 'column'
              ? (snap.sidePanel.column as PostgresColumn)
              : undefined
          }
          selectedTable={selectedTable}
          visible={snap.sidePanel?.type === 'column'}
          closePanel={onClosePanel}
          saveChanges={saveColumn}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      <TableEditor
        table={
          snap.sidePanel?.type === 'table' &&
          (snap.sidePanel.mode === 'edit' || snap.sidePanel.mode === 'duplicate')
            ? selectedTable
            : undefined
        }
        isDuplicating={snap.sidePanel?.type === 'table' && snap.sidePanel.mode === 'duplicate'}
        visible={snap.sidePanel?.type === 'table'}
        closePanel={onClosePanel}
        saveChanges={saveTable}
        updateEditorDirty={() => setIsEdited(true)}
      />
      <SchemaEditor visible={snap.sidePanel?.type === 'schema'} closePanel={onClosePanel} />
      <JsonEditor
        visible={snap.sidePanel?.type === 'json'}
        row={(snap.sidePanel?.type === 'json' && snap.sidePanel.jsonValue.row) || {}}
        column={(snap.sidePanel?.type === 'json' && snap.sidePanel.jsonValue.column) || ''}
        backButtonLabel="Cancel"
        applyButtonLabel="Save changes"
        readOnly={!editable}
        closePanel={onClosePanel}
        onSaveJSON={onSaveColumnValue}
      />
      <TextEditor
        visible={snap.sidePanel?.type === 'cell'}
        column={(snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.column) || ''}
        row={(snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.row) || {}}
        closePanel={onClosePanel}
        onSaveField={onSaveColumnValue}
      />
      <ForeignRowSelector
        visible={snap.sidePanel?.type === 'foreign-row-selector'}
        // @ts-ignore
        foreignKey={
          snap.sidePanel?.type === 'foreign-row-selector'
            ? snap.sidePanel.foreignKey.foreignKey
            : undefined
        }
        closePanel={onClosePanel}
        onSelect={onSaveForeignRow}
      />
      <SpreadsheetImport
        visible={snap.sidePanel?.type === 'csv-import'}
        selectedTable={selectedTable}
        saveContent={onImportData}
        closePanel={onClosePanel}
        updateEditorDirty={setIsEdited}
      />
      <ConfirmationModal
        visible={isClosingPanel}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosingPanel(false)}
        onConfirm={() => {
          setIsClosingPanel(false)
          setIsEdited(false)
          snap.closeSidePanel()
        }}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default SidePanelEditor
