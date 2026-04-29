import * as Sentry from '@sentry/nextjs'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { isEmpty, isUndefined, noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { SonnerProgress } from 'ui'

import { ColumnEditor } from './ColumnEditor/ColumnEditor'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import { OperationQueueSidePanel } from './OperationQueueSidePanel/OperationQueueSidePanel'
import { ForeignRowSelector } from './RowEditor/ForeignRowSelector/ForeignRowSelector'
import { JsonEditor } from './RowEditor/JsonEditor'
import { RowEditor } from './RowEditor/RowEditor'
import { convertByteaToHex } from './RowEditor/RowEditor.utils'
import { TextEditor } from './RowEditor/TextEditor'
import { SchemaEditor } from './SchemaEditor'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import {
  createColumn,
  createTable,
  duplicateTable,
  getRowFromSidePanel,
  insertRowsViaSpreadsheet,
  insertTableRows,
  updateColumn,
  updateTable,
} from './SidePanelEditor.utils'
import { SpreadsheetImport } from './SpreadsheetImport/SpreadsheetImport'
import {
  useTableApiAccessHandlerWithHistory,
  type TableApiAccessParams,
} from './TableEditor/ApiAccessToggle'
import { TableEditor } from './TableEditor/TableEditor'
import type { ImportContent } from './TableEditor/TableEditor.types'
import { useTableRowOperations } from '@/components/grid/hooks/useTableRowOperations'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { type GeneratedPolicy } from '@/components/interfaces/Auth/Policies/Policies.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { databasePoliciesKeys } from '@/data/database-policies/keys'
import { useDatabasePublicationCreateMutation } from '@/data/database-publications/database-publications-create-mutation'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from '@/data/database-publications/database-publications-update-mutation'
import type { Constraint } from '@/data/database/constraints-query'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import { databaseKeys } from '@/data/database/keys'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { lintKeys } from '@/data/lint/keys'
import { privilegeKeys } from '@/data/privileges/keys'
import { useTableApiAccessPrivilegesMutation } from '@/data/privileges/table-api-access-mutation'
import { tableEditorKeys } from '@/data/table-editor/keys'
import { isTableLike, type Entity } from '@/data/table-editor/table-editor-types'
import { tableRowKeys } from '@/data/table-rows/keys'
import { tableKeys } from '@/data/tables/keys'
import { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import { getTables } from '@/data/tables/tables-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { useUrlState } from '@/hooks/ui/useUrlState'
import { useVisibleKey } from '@/hooks/ui/useVisibleKey'
import { type ApiPrivilegesByRole } from '@/lib/data-api-types'
import { isObjectContainingKeys } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'
import type { DeepReadonly, Prettify } from '@/lib/type-helpers'
import { useTableEditorStateSnapshot, type TableEditorState } from '@/state/table-editor'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { Dictionary } from '@/types'

export type SaveTableParams =
  | SaveTableParamsNew
  | SaveTableParamsDuplicate
  | SaveTableParamsExisting

type SaveTableParamsBase = {
  configuration: SaveTableConfiguration
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  resolve: () => void
  generatedPolicies?: GeneratedPolicy[]
}

type SaveTableParamsNew = SaveTableParamsBase & {
  action: 'create'
  payload: SaveTablePayloadNew
}

type SaveTableParamsDuplicate = SaveTableParamsBase & {
  action: 'duplicate'
  payload: SaveTablePayloadDuplicate
}

type SaveTableParamsExisting = SaveTableParamsBase & {
  action: 'update'
  payload: SaveTablePayloadExisting
}

type SaveTablePayloadBase = {
  /**
   * Comment to set on the table
   *
   * `null` removes existing comment
   * `undefined` leaves comment unchanged
   */
  comment?: string | null
}

type SaveTablePayloadNew = SaveTablePayloadBase & {
  name: string
  schema: string
}

type SaveTablePayloadDuplicate = SaveTablePayloadBase & {
  name: string
}

type SaveTablePayloadExisting = SaveTablePayloadBase & {
  name?: string
  rls_enabled?: boolean
}

type SaveTableConfiguration = Prettify<{
  tableId?: number
  importContent?: ImportContent
  isRLSEnabled: boolean
  isRealtimeEnabled: boolean
  isDuplicateRows: boolean
  existingForeignKeyRelations: ForeignKeyConstraint[]
  primaryKey?: Constraint
}>

const DUMMY_TABLE_API_ACCESS_PARAMS: TableApiAccessParams = {
  type: 'new',
}

const createTableApiAccessHandlerParams = ({
  snap,
  selectedTable,
}: {
  snap: DeepReadonly<TableEditorState>
  selectedTable?: PostgresTable
}): TableApiAccessParams | undefined => {
  const tableSidePanel = snap.sidePanel?.type === 'table' ? snap.sidePanel : undefined
  if (!tableSidePanel) return undefined

  if (tableSidePanel.mode === 'new') {
    return {
      type: 'new',
    }
  }

  if (!selectedTable) return undefined

  if (tableSidePanel.mode === 'duplicate') {
    return {
      type: 'duplicate',
      templateSchemaName: selectedTable.schema,
      templateTableName: selectedTable.name,
    }
  }

  return {
    type: 'edit',
    schemaName: selectedTable.schema,
    tableName: selectedTable.name,
  }
}

export interface SidePanelEditorProps {
  editable?: boolean
  selectedTable?: PostgresTable
  includeColumns?: boolean // This is mainly used for invalidating useTablesQuery

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: RetrieveTableResult) => void
}

export const SidePanelEditor = ({
  editable = true,
  selectedTable,
  includeColumns = false,
  onTableCreated = noop,
}: SidePanelEditorProps) => {
  const { ref } = useParams()
  const snap = useTableEditorStateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })

  const track = useTrack()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const { updateRow, addRow, isEditPending } = useTableRowOperations()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const csvImportKey = useVisibleKey(snap.sidePanel?.type === 'csv-import')

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tableApiAccessParams = createTableApiAccessHandlerParams({
    snap,
    selectedTable,
  })
  const apiAccessToggleHandler = useTableApiAccessHandlerWithHistory(
    // Dummy params used to appease TypeScript, actually gated by enabled flag
    tableApiAccessParams ?? DUMMY_TABLE_API_ACCESS_PARAMS,
    {
      enabled: tableApiAccessParams !== undefined,
    }
  )

  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isEdited,
    onClose: () => {
      setIsEdited(false)
      snap.closeSidePanel()
    },
  })

  const enumArrayColumns = (selectedTable?.columns ?? [])
    .filter((column) => {
      return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
    })
    .map((column) => column.name)

  const { mutateAsync: createPublication } = useDatabasePublicationCreateMutation()
  const { mutateAsync: updatePublication } = useDatabasePublicationUpdateMutation({
    onError: () => {},
  })
  const { mutateAsync: updateApiPrivileges } = useTableApiAccessPrivilegesMutation({
    onError: () => {}, // Errors handled inline
  })

  const isDuplicating = snap.sidePanel?.type === 'table' && snap.sidePanel.mode === 'duplicate'

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number; createMore?: boolean },
    onComplete: (err?: any) => void
  ) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    let saveRowError: Error | undefined
    if (isNewRecord) {
      try {
        await addRow({
          tableId: selectedTable.id,
          table: selectedTable as unknown as Entity,
          rowData: payload,
          enumArrayColumns,
        })
      } catch (error: any) {
        saveRowError = error
      }
    } else {
      const hasChanges = !isEmpty(payload)
      if (hasChanges) {
        if (selectedTable.primary_keys.length > 0) {
          const row = getRowFromSidePanel(snap.sidePanel)

          if (!row) {
            saveRowError = new Error('No row found')
            toast.error('No row found')
            onComplete(saveRowError)
            return
          }

          try {
            await updateRow({
              tableId: selectedTable.id,
              table: selectedTable as unknown as Entity,
              row,
              rowIdentifiers: configuration.identifiers,
              payload,
              enumArrayColumns,
              onSuccess: () => toast.success('Successfully updated row'),
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
      if (!configuration.createMore) snap.closeSidePanel()
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

      await saveRow(value, isNewRecord, configuration, (error) => {
        if (error) {
          toast.error(`Failed to save row: ${error?.message ?? 'Unknown error'}`)
        }
      })
    } catch (error: any) {
      toast.error(`Failed to save row: ${error?.message ?? 'Unknown error'}`)
      Sentry.captureException(error, { tags: { workflow: 'save-foreign-row' } })
    }
  }

  const saveColumn = async (
    payload: CreateColumnPayload | UpdateColumnPayload,
    isNewRecord: boolean,
    configuration: {
      columnId?: string
      primaryKey?: Constraint
      foreignKeyRelations: ForeignKey[]
      existingForeignKeyRelations: ForeignKeyConstraint[]
      createMore?: boolean
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
        queryClient.invalidateQueries({
          queryKey: tableEditorKeys.tableEditor(project?.ref, selectedTable?.id),
        }),
        queryClient.invalidateQueries({
          queryKey: databaseKeys.foreignKeyConstraints(project?.ref, selectedTable?.schema),
        }),
        queryClient.invalidateQueries({
          queryKey: databaseKeys.tableDefinition(project?.ref, selectedTable?.id),
        }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(project?.ref) }),
        queryClient.invalidateQueries({
          queryKey: tableKeys.list(project?.ref, selectedTable?.schema, includeColumns),
        }),
      ])

      // We need to invalidate tableRowsAndCount after tableEditor
      // to ensure the query sent is correct
      await queryClient.invalidateQueries({
        queryKey: tableRowKeys.tableRowsAndCount(project?.ref, selectedTable?.id),
      })

      setIsEdited(false)
      if (!configuration.createMore) snap.closeSidePanel()
    }

    resolve(response?.error)
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

        track(enabled ? 'table_realtime_enabled' : 'table_realtime_disabled', {
          method: 'ui',
          schema_name: table.schema,
          table_name: table.name,
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

        track(enabled ? 'table_realtime_enabled' : 'table_realtime_disabled', {
          method: 'ui',
          schema_name: table.schema,
          table_name: table.name,
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

      track(enabled ? 'table_realtime_enabled' : 'table_realtime_disabled', {
        method: 'ui',
        schema_name: table.schema,
        table_name: table.name,
      })
    } catch (error: any) {
      toast.error(`Failed to update realtime for ${table.name}: ${error.message}`)
    }
  }

  const updateTableApiAccess = async (
    table: RetrieveTableResult,
    privileges: DeepReadonly<ApiPrivilegesByRole>
  ) => {
    if (!project) return console.error('Project is required')

    try {
      await updateApiPrivileges({
        projectRef: project.ref,
        connectionString: project.connectionString ?? undefined,
        relationId: table.id,
        privileges,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      const toastDetail = message ? `: ${message}` : ''
      toast.error(`Failed to update API access privileges for ${table.name}${toastDetail}`)
    }
  }

  const saveTable = async ({
    action,
    payload,
    configuration,
    columns,
    foreignKeyRelations,
    generatedPolicies = [],
    resolve,
  }: SaveTableParams) => {
    let toastId
    let saveTableError = false

    if (!apiAccessToggleHandler.isSuccess) {
      if (apiAccessToggleHandler.isPending) {
        toast.info(
          'Cannot save table yet because Data API settings are still loading. Please try again in a moment.'
        )
      } else {
        toast.error(
          'Cannot save table because there was an error loading Data API settings. Please refresh the page and try again.'
        )
      }
      return
    }

    const {
      importContent,
      isRLSEnabled,
      isRealtimeEnabled,
      isDuplicateRows,
      existingForeignKeyRelations,
      primaryKey,
    } = configuration

    try {
      if (action === 'create') {
        await Sentry.startSpan(
          {
            name: 'Create Table',
            op: 'db.table.create',
          },
          async (createTableSpan) => {
            toastId = toast.loading(`Creating new table: ${payload.name}...`)

            // Get existing table count from cache — try entity types first (always loaded
            // by the Table Editor sidebar), then fall back to tables query cache.
            // Entity types uses useInfiniteQuery, so the cache shape is { pages: [...] }.
            // Each page has data.count (total count from SQL count(*) over()).
            const entityTypesEntries = queryClient.getQueriesData<{
              pages?: Array<{ data?: { count?: number } }>
            }>({
              queryKey: ['projects', project?.ref, 'entity-types'],
            })
            const existingTableCount =
              entityTypesEntries
                .map(([, data]) => data?.pages?.[0]?.data?.count)
                .find((count) => typeof count === 'number') ??
              queryClient.getQueryData<unknown[]>(
                tableKeys.list(project?.ref, payload.schema, true)
              )?.length ??
              queryClient.getQueryData<unknown[]>(
                tableKeys.list(project?.ref, payload.schema, false)
              )?.length

            createTableSpan.setAttributes({
              'table.name': payload.name,
              'table.schema': payload.schema ?? 'public',
              'table.columns_count': columns.length,
              'table.has_rls': isRLSEnabled ? 1 : 0,
              'table.has_foreign_keys': foreignKeyRelations.length > 0 ? 1 : 0,
              'table.has_import': importContent !== undefined ? 1 : 0,
              'table.generated_policies_count': generatedPolicies.length,
              'project.region': project?.region ?? 'local',
              ...(project?.cloud_provider && {
                'project.cloud_provider': project.cloud_provider,
              }),
              ...(existingTableCount != null && {
                'project.existing_table_count': String(existingTableCount),
              }),
            })

            try {
              const { table, failedPolicies } = await createTable({
                projectRef: project?.ref!,
                connectionString: project?.connectionString,
                toastId,
                payload,
                columns,
                foreignKeyRelations,
                isRLSEnabled,
                importContent,
                organizationSlug: org?.slug,
                generatedPolicies,
                onCreatePoliciesSuccess: () => track('rls_generated_policies_created'),
              })

              createTableSpan.setAttribute('table.created', 1)
              createTableSpan.setAttribute('table.failed_policies', failedPolicies.length)

              await Sentry.startSpan(
                { name: 'create_table.post_creation', op: 'db.table.post_creation' },
                async () => {
                  if (isRealtimeEnabled) await updateTableRealtime(table, true)

                  const privilegesToSet = apiAccessToggleHandler.data?.schemaExposed
                    ? apiAccessToggleHandler.data.privileges
                    : undefined
                  if (privilegesToSet) {
                    await updateTableApiAccess(table, privilegesToSet)
                  }
                }
              )

              // Invalidate queries for table creation
              await Sentry.startSpan(
                { name: 'create_table.cache_invalidation', op: 'cache.invalidate' },
                async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: tableKeys.list(project?.ref, table.schema, includeColumns),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: entityTypeKeys.list(project?.ref),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: databasePoliciesKeys.list(project?.ref),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: privilegeKeys.tablePrivilegesList(project?.ref),
                    }),
                    queryClient.invalidateQueries({ queryKey: lintKeys.lint(project?.ref) }),
                  ])
                }
              )

              // Show success toast after everything is complete
              if (failedPolicies.length > 0) {
                toast.success(
                  `Table ${table.name} is created successfully, but we ran into issues creating ${failedPolicies.length} policie${failedPolicies.length > 1 ? 's' : ''}`,
                  {
                    id: toastId,
                    description: (
                      <ul className="list-disc pl-6">
                        {failedPolicies.map((x) => (
                          <li key={x.name}>{x.name}</li>
                        ))}
                      </ul>
                    ),
                  }
                )
              } else {
                toast.success(`Table ${table.name} is good to go!`, { id: toastId })
              }

              onTableCreated(table)
            } catch (error) {
              createTableSpan.setAttribute('table.error', 1)
              Sentry.captureException(error, {
                tags: { workflow: 'create-table' },
              })
              saveTableError = true
              throw error
            }
          }
        )
      } else if (action === 'duplicate' && !!selectedTable) {
        const tableToDuplicate = selectedTable
        toastId = toast.loading(`Duplicating table: ${tableToDuplicate.name}...`)

        const table = await duplicateTable(project?.ref!, project?.connectionString, payload, {
          isRLSEnabled,
          isDuplicateRows,
          duplicateTable: tableToDuplicate,
          foreignKeyRelations,
        })
        if (isRealtimeEnabled) await updateTableRealtime(table, isRealtimeEnabled)

        const privilegesToSet = apiAccessToggleHandler.data?.schemaExposed
          ? apiAccessToggleHandler.data.privileges
          : undefined
        if (privilegesToSet) {
          await updateTableApiAccess(table, privilegesToSet)
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: tableKeys.list(project?.ref, table.schema, includeColumns),
          }),
          queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(project?.ref) }),
          queryClient.invalidateQueries({
            queryKey: privilegeKeys.tablePrivilegesList(project?.ref),
          }),
          queryClient.invalidateQueries({ queryKey: lintKeys.lint(project?.ref) }),
        ])

        toast.success(
          `Table ${tableToDuplicate.name} has been successfully duplicated into ${table.name}!`,
          { id: toastId }
        )
        onTableCreated(table)
      } else if (action === 'update' && selectedTable) {
        toastId = toast.loading(`Updating table: ${selectedTable.name}...`)

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
          const privilegesToSet = apiAccessToggleHandler.data?.schemaExposed
            ? apiAccessToggleHandler.data.privileges
            : undefined
          if (privilegesToSet) {
            await updateTableApiAccess(table, privilegesToSet)
          }
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

    const { file, rowCount, selectedHeaders, emptyStringAsNullHeaders, resolve } = importContent
    const toastId = toast.loading(
      `Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`
    )

    if (file && rowCount > 0) {
      const res = await insertRowsViaSpreadsheet({
        projectRef: project.ref!,
        connectionString: project.connectionString,
        file,
        table: selectedTable,
        selectedHeaders,
        emptyStringAsNullHeaders,
        onProgressUpdate: (progress: number) => {
          toast.loading(
            <SonnerProgress
              progress={progress}
              message={`Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`}
            />,
            { id: toastId }
          )
        },
      })
      if (res.error) {
        const message = isObjectContainingKeys(res.error, ['message'])
          ? res.error.message
          : 'An unknown error occurred during import'
        toast.error(`Failed to import data: ${message}`, { id: toastId })
        return resolve()
      }
    } else {
      const res = await insertTableRows({
        projectRef: project.ref!,
        connectionString: project.connectionString,
        table: selectedTable,
        rows: importContent.rows,
        selectedHeaders,
        emptyStringAsNullHeaders,
        onProgressUpdate: (progress: number) => {
          toast.loading(
            <SonnerProgress
              progress={progress}
              message={`Adding ${importContent.rows.length.toLocaleString()} rows to ${
                selectedTable.name
              }`}
            />,
            { id: toastId }
          )
        },
      })
      if (res.error) {
        const message = isObjectContainingKeys(res.error, ['message'])
          ? res.error.message
          : 'An unknown error occurred during import'
        toast.error(`Failed to import data: ${message}`, { id: toastId })
        return resolve()
      }
    }

    await queryClient.invalidateQueries({
      queryKey: tableRowKeys.tableRowsAndCount(project?.ref, selectedTable?.id),
    })
    toast.success(`Successfully imported ${rowCount} rows of data into ${selectedTable.name}`, {
      id: toastId,
    })
    resolve()
    snap.closeSidePanel()
  }

  const onClosePanel = confirmOnClose

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
        isDuplicating={isDuplicating}
        templateData={
          snap.sidePanel?.type === 'table' && snap.sidePanel.templateData
            ? {
                ...snap.sidePanel.templateData,
                columns: snap.sidePanel.templateData.columns
                  ? [...snap.sidePanel.templateData.columns]
                  : undefined,
              }
            : undefined
        }
        visible={snap.sidePanel?.type === 'table'}
        closePanel={onClosePanel}
        saveChanges={saveTable}
        updateEditorDirty={() => setIsEdited(true)}
        apiAccessToggleHandler={apiAccessToggleHandler}
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
        applyButtonLabel={isQueueOperationsEnabled ? 'Queue changes' : 'Save changes'}
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
        isSaving={isEditPending}
        closePanel={onClosePanel}
        onSelect={onSaveForeignRow}
      />
      <SpreadsheetImport
        key={csvImportKey}
        visible={snap.sidePanel?.type === 'csv-import'}
        selectedTable={selectedTable}
        saveContent={onImportData}
        closePanel={onClosePanel}
        updateEditorDirty={setIsEdited}
      />
      <OperationQueueSidePanel />
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
