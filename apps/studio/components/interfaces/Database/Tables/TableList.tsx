import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button, IconPlus, IconSearch, Input } from 'ui'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'
import TableListItem from './TableListItem'

interface TableListProps {
  onAddTable: () => void
  onEditTable: (table: any) => void
  onDeleteTable: (table: any) => void
}

const TableList = ({
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
}: TableListProps) => {
  const router = useRouter()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [filterString, setFilterString] = useState<string>('')
  const canUpdateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )

  const {
    data: tables,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: snap.selectedSchemaName,
      sortByProperty: 'name',
      includeColumns: true,
    },
    {
      select(tables) {
        return filterString.length === 0
          ? tables
          : tables.filter((table) => table.name.toLowerCase().includes(filterString.toLowerCase()))
      },
    }
  )

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )

  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SchemaSelector
            className="w-[260px]"
            size="small"
            showError={false}
            selectedSchemaName={snap.selectedSchemaName}
            onSelectSchema={snap.setSelectedSchemaName}
          />
          <Input
            size="small"
            className="w-64"
            placeholder="Search for a table"
            value={filterString}
            onChange={(e: any) => setFilterString(e.target.value)}
            icon={<IconSearch size="tiny" />}
          />
        </div>

        {!isLocked && (
          <div>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  disabled={!canUpdateTables}
                  icon={<IconPlus />}
                  onClick={() => onAddTable()}
                >
                  New table
                </Button>
              </Tooltip.Trigger>
              {!canUpdateTables && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to create tables
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        )}
      </div>

      {isLocked && <ProtectedSchemaWarning schema={snap.selectedSchemaName} entity="tables" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="my-4 w-full">
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="description" className="hidden lg:table-cell">
                Description
              </Table.th>,
              <Table.th key="rows" className="hidden text-right xl:table-cell">
                Rows (Estimated)
              </Table.th>,
              <Table.th key="size" className="hidden text-right xl:table-cell">
                Size (Estimated)
              </Table.th>,
              <Table.th key="realtime" className="hidden xl:table-cell text-center">
                Realtime Enabled
              </Table.th>,
              <Table.th key="buttons"></Table.th>,
            ]}
            body={
              <>
                {tables.length === 0 && filterString.length === 0 && (
                  <Table.tr key={snap.selectedSchemaName}>
                    <Table.td colSpan={6}>
                      <p className="text-sm text-foreground">No tables created yet</p>
                      <p className="text-sm text-foreground-light">
                        There are no tables found in the schema "{snap.selectedSchemaName}"
                      </p>
                    </Table.td>
                  </Table.tr>
                )}
                {tables.length === 0 && filterString.length > 0 && (
                  <Table.tr key={snap.selectedSchemaName}>
                    <Table.td colSpan={6}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-light">
                        Your search for "{filterString}" did not return any results
                      </p>
                    </Table.td>
                  </Table.tr>
                )}
                {tables.length > 0 &&
                  tables.map((table: any, i: any) => (
                    <TableListItem
                      key={table.id}
                      table={table}
                      realtimePublication={realtimePublication}
                      isLocked={isLocked}
                      canUpdateTables={canUpdateTables}
                      onEditTable={onEditTable}
                      onDeleteTable={onDeleteTable}
                    />
                  ))}
              </>
            }
          />
        </div>
      )}
    </div>
  )
}

export default TableList
