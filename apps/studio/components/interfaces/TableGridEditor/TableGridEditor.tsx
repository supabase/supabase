import type { PostgresColumn, PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { find, isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { SupaTable } from 'components/grid/types'
import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Loading } from 'components/ui/Loading'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { sqlKeys } from 'data/sql/keys'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import useEntityType from 'hooks/misc/useEntityType'
import useLatest from 'hooks/misc/useLatest'
import type { TableLike } from 'hooks/misc/useTable'
import { useUrlState } from 'hooks/ui/useUrlState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { EMPTY_ARR } from 'lib/void'
import { ExternalLink } from 'lucide-react'
import { useGetImpersonatedRole } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { Dictionary, SchemaView } from 'types'
import { Button, toast as UiToast } from 'ui'
import GridHeaderActions from './GridHeaderActions'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor/SidePanelEditor'
import { useEncryptedColumns } from './SidePanelEditor/SidePanelEditor.utils'
import TableDefinition from './TableDefinition'

export interface TableGridEditorProps {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  isLoadingSelectedTable?: boolean
  selectedTable?: TableLike
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

  const encryptedColumns = useEncryptedColumns({
    schemaName: selectedTable?.schema,
    tableName: selectedTable?.name,
  })

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

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
  })
  const foreignKeyMeta = data || []

  const entityType = useEntityType(selectedTable?.id)
  const columnsRef = useLatest(selectedTable?.columns ?? EMPTY_ARR)

  // NOTE: DO NOT PUT HOOKS AFTER THIS LINE
  if (isLoadingSelectedTable) {
    return <Loading />
  }

  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(id)} />
  }

  const isViewSelected =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const isTableSelected = entityType?.type === ENTITY_TYPE.TABLE
  const isForeignTableSelected = entityType?.type === ENTITY_TYPE.FOREIGN_TABLE
  const isLocked = EXCLUDED_SCHEMAS.includes(entityType?.schema ?? '')
  const canEditViaTableEditor = isTableSelected && !isLocked

  // [Joshen] We can tweak below to eventually support composite keys as the data
  // returned from foreignKeyMeta should be easy to deal with, rather than pg-meta
  const formattedRelationships = (
    ('relationships' in selectedTable && selectedTable.relationships) ||
    []
  ).map((relationship: PostgresRelationship) => {
    const relationshipMeta = foreignKeyMeta.find(
      (fk: ForeignKeyConstraint) => fk.id === relationship.id
    )
    return {
      ...relationship,
      deletion_action: relationshipMeta?.deletion_action ?? FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
    }
  })

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

  const onTableCreated = (table: PostgresTable) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  // columns must be accessed via columnsRef.current as these two functions immediately become
  // stale as they are accessed via some react-tracked madness
  // [TODO]: refactor out all of react-tracked
  const onSelectEditColumn = (name: string) => {
    const column = find(columnsRef.current, { name }) as PostgresColumn
    if (column) {
      snap.onEditColumn(column)
    } else {
      toast.error(`Unable to find column ${name} in ${selectedTable?.name}`)
    }
  }

  const onSelectDeleteColumn = (name: string) => {
    const column = find(columnsRef.current ?? [], { name }) as PostgresColumn
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

    const enumArrayColumns =
      ('columns' in selectedTable &&
        selectedTable.columns
          ?.filter((column) => {
            return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
          })
          .map((column) => column.name)) ||
      []

    const identifiers = {} as Dictionary<any>
    ;(selectedTable as PostgresTable).primary_keys.forEach(
      (column) => (identifiers[column.name] = previousRow[column.name])
    )

    const configuration = { identifiers }
    if (Object.keys(identifiers).length === 0) {
      return UiToast({
        variant: 'default',
        style: { flexDirection: 'column' },
        title: (
          <Markdown
            className="text-foreground [&>p]:m-0"
            content="Unable to update row as table has no primary keys"
          />
        ) as any,
        description: (
          <Markdown
            className="[&>p]:m-0"
            content="Add a primary key column to your table first to serve as a unique identifier for each row before updating or deleting the row."
          />
        ),
        action: (
          <div className="w-full flex gap-x-2 !mx-0 mt-3">
            <Button asChild type="outline" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/database/tables#primary-keys"
              >
                Documentation
              </a>
            </Button>
          </div>
        ),
      })
    }

    mutateUpdateTableRow({
      projectRef: project.ref,
      connectionString: project.connectionString,
      table: gridTable as SupaTable,
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
          <GridHeaderActions
            table={selectedTable as TableLike}
            canEditViaTableEditor={canEditViaTableEditor}
          />
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
        {(isViewSelected || isTableSelected) && <TableDefinition id={selectedTable?.id} />}
      </SupabaseGrid>

      {snap.selectedSchemaName !== undefined && (
        <SidePanelEditor
          editable={!isReadOnly && canEditViaTableEditor}
          selectedTable={selectedTable as PostgresTable}
          onTableCreated={onTableCreated}
        />
      )}
    </>
  )
}

export default TableGridEditor
