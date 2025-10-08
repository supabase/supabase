import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { isEmpty, isUndefined, noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useDatabasePublicationCreateMutation } from 'data/database-publications/database-publications-create-mutation'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import type { Constraint } from 'data/database/constraints-query'
import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { databaseKeys } from 'data/database/keys'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { entityTypeKeys } from 'data/entity-types/keys'
import { tableEditorKeys } from 'data/table-editor/keys'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { tableKeys } from 'data/tables/keys'
import { RetrieveTableResult } from 'data/tables/table-retrieve-query'
import { getTables } from 'data/tables/tables-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import type { Dictionary } from 'types'
import { SonnerProgress } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ColumnEditor from './ColumnEditor/ColumnEditor'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import ForeignRowSelector from './RowEditor/ForeignRowSelector/ForeignRowSelector'
import JsonEditor from './RowEditor/JsonEditor/JsonEditor'
import RowEditor from './RowEditor/RowEditor'
import { convertByteaToHex } from './RowEditor/RowEditor.utils'
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
import { SpreadsheetImport } from './SpreadsheetImport/SpreadsheetImport'
import { TableEditor } from './TableEditor/TableEditor'
import type { ImportContent } from './TableEditor/TableEditor.types'

export interface SidePanelEditorProps {
  editable?: boolean
  selectedTable?: PostgresTable
  includeColumns?: boolean // This is mainly used for invalidating useTablesQuery

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: RetrieveTableResult) => void
}

const SidePanelEditor = ({
  editable = true,
  selectedTable,
  includeColumns = false,
  onTableCreated = noop,
}: SidePanelEditorProps) => {
  const { ref } = useParams()
  const snap = useTableEditorStateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

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

  const getImpersonatedRoleState = useGetImpersonatedRoleState()

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
          table: selectedTable,
          payload,
          enumArrayColumns,
          roleImpersonationState: getImpersonatedRoleState(),
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
              table: selectedTable,
              configuration,
              payload,
              enumArrayColumns,
              roleImpersonationState: getImpersonatedRoleState(),
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
      selectedTable.primary_keys.forEach((column) => {
        const col = selectedTable.columns?.find((x) => x.name === column.name)
        identifiers[column.name] =
          col?.format === 'bytea' ? convertByteaToHex(row![column.name]) : row![column.name]
      })

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
    const { primaryKey, foreignKeyRelations, existingForeignKeyRelations } = configuration

    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    const response = isNewRecord
      ? await createColumn({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          payload: payload as CreateColumnPayload,
          selectedTable,
          primaryKey,
          foreignKeyRelations,
        })
      : await updateColumn({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          originalColumn: selectedColumnToEdit as PostgresColumn,
          payload: payload as UpdateColumnPayload,
          selectedTable,
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
        queryClient.invalidateQueries(tableEditorKeys.tableEditor(project?.ref, selectedTable?.id)),
        queryClient.invalidateQueries(
          databaseKeys.foreignKeyConstraints(project?.ref, selectedTable?.schema)
        ),
        queryClient.invalidateQueries(
          databaseKeys.tableDefinition(project?.ref, selectedTable?.id)
        ),
        queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
      ])

      // We need to invalidate tableRowsAndCount after tableEditor
      // to ensure the query sent is correct
      await queryClient.invalidateQueries(
        tableRowKeys.tableRowsAndCount(project?.ref, selectedTable?.id)
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

  const updateTableRealtime = async (table: RetrieveTableResult, enabled: boolean) => {
    if (!project) return console.error('Project is required')
    const realtimePublication = publications?.find((pub) => pub.name === 'supabase_realtime')

    try {
      if (realtimePublication === undefined) {
        const realtimeTables = enabled ? [`${table.schema}.${table.name}`] : []
        await createPublication({
          projectRef: project.ref,
          connectionString: project.connectionString,
          name: 'supabase_realtime',
          publish_insert: true,
          publish_update: true,
          publish_delete: true,
          tables: realtimeTables,
        })
        return
      }
      if (realtimePublication.tables === null) {
        // UI doesn't have support for toggling realtime for ALL tables
        // Switch it to individual tables via an array of strings
        // Refer to PublicationStore for more information about this
        const publicTables = await queryClient.fetchQuery({
          queryKey: tableKeys.list(project.ref, 'public', includeColumns),
          queryFn: ({ signal }) =>
            getTables(
              {
                projectRef: project.ref,
                connectionString: project.connectionString,
                schema: 'public',
              },
              signal
            ),
        })
        // TODO: support tables in non-public schemas
        const realtimeTables = enabled
          ? publicTables.map((t) => `${t.schema}.${t.name}`)
          : publicTables.filter((t) => t.id !== table.id).map((t) => `${t.schema}.${t.name}`)
        await updatePublication({
          id: realtimePublication.id,
          projectRef: project.ref,
          connectionString: project.connectionString,
          tables: realtimeTables,
        })
        return
      }
      const isAlreadyEnabled = realtimePublication.tables.some((x) => x.id == table.id)
      const realtimeTables =
        isAlreadyEnabled && !enabled
          ? // Toggle realtime off
            realtimePublication.tables
              .filter((t) => t.id !== table.id)
              .map((t) => `${t.schema}.${t.name}`)
          : !isAlreadyEnabled && enabled
            ? // Toggle realtime on
              realtimePublication.tables
                .map((t) => `${t.schema}.${t.name}`)
                .concat([`${table.schema}.${table.name}`])
            : null
      if (realtimeTables === null) return
      await updatePublication({
        id: realtimePublication.id,
        projectRef: project.ref,
        connectionString: project.connectionString,
        tables: realtimeTables,
      })
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
          organizationSlug: org?.slug,
        })
        if (isRealtimeEnabled) await updateTableRealtime(table, true)

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(project?.ref, table.schema, includeColumns)),
          queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
        ])

        toast.success(`Table ${table.name} is good to go!`, { id: toastId })
        onTableCreated(table)
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
          organizationSlug: org?.slug,
        })

        if (table === undefined) {
          return toast.error('Failed to update table')
        }
        if (isTableLike(table)) {
          await updateTableRealtime(table, isRealtimeEnabled)
        }

        if (hasError) {
          toast.warning(
            `Table ${table.name} has been updated but there were some errors. Please check these errors separately.`
          )
        } else {
          if (ref && payload.name) {
            // [Joshen] Only table entities can be updated via the dashboard
            const tabId = createTabId(ENTITY_TYPE.TABLE, { id: selectedTable.id })
            tabsSnap.updateTab(tabId, { label: payload.name })
          }
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

    await queryClient.invalidateQueries(
      tableRowKeys.tableRowsAndCount(project?.ref, selectedTable?.id)
    )
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
          editable={editable}
          closePanel={onClosePanel}
          saveChanges={saveRow}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      {!isUndefined(selectedTable) && (
        <ColumnEditor
          column={
            snap.sidePanel?.type === 'column'
              ? (snap.sidePanel.column as unknown as PostgresColumn)
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
      <SchemaEditor
        visible={snap.sidePanel?.type === 'schema'}
        onSuccess={onClosePanel}
        closePanel={onClosePanel}
      />
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
