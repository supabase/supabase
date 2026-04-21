import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { noop } from 'lodash'
import { Check, Copy, Edit, Eye, Filter, MoreVertical, Plus, Search, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  Card,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import { formatAllEntities } from './Tables.utils'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import AlertError from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import SchemaSelector from '@/components/ui/SchemaSelector'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useForeignTablesQuery } from '@/data/foreign-tables/foreign-tables-query'
import { useMaterializedViewsQuery } from '@/data/materialized-views/materialized-views-query'
import { usePrefetchEditorTablePage } from '@/data/prefetchers/project.$ref.editor.$id'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useViewsQuery } from '@/data/views/views-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'

interface TableListProps {
  onAddTable: () => void
  onEditTable: (table: PostgresTable) => void
  onDeleteTable: (table: PostgresTable) => void
  onDuplicateTable: (table: PostgresTable) => void
}

export const TableList = ({
  onDuplicateTable,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
}: TableListProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const prefetchEditorTablePage = usePrefetchEditorTablePage()

  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [filterString, setFilterString] = useQueryState('search', parseAsString.withDefault(''))
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))

  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const {
    data: tables,
    error: tablesError,
    isError: isErrorTables,
    isPending: isLoadingTables,
    isSuccess: isSuccessTables,
  } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
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

  const {
    data: views,
    error: viewsError,
    isError: isErrorViews,
    isPending: isLoadingViews,
    isSuccess: isSuccessViews,
  } = useViewsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
    },
    {
      select(views) {
        return filterString.length === 0
          ? views
          : views.filter((view) => view.name.toLowerCase().includes(filterString.toLowerCase()))
      },
    }
  )

  const {
    data: materializedViews,
    error: materializedViewsError,
    isError: isErrorMaterializedViews,
    isPending: isLoadingMaterializedViews,
    isSuccess: isSuccessMaterializedViews,
  } = useMaterializedViewsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
    },
    {
      select(materializedViews) {
        return filterString.length === 0
          ? materializedViews
          : materializedViews.filter((view) =>
              view.name.toLowerCase().includes(filterString.toLowerCase())
            )
      },
    }
  )

  const {
    data: foreignTables,
    error: foreignTablesError,
    isError: isErrorForeignTables,
    isPending: isLoadingForeignTables,
    isSuccess: isSuccessForeignTables,
  } = useForeignTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
    },
    {
      select(foreignTables) {
        return filterString.length === 0
          ? foreignTables
          : foreignTables.filter((table) =>
              table.name.toLowerCase().includes(filterString.toLowerCase())
            )
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

  const entities = formatAllEntities({ tables, views, materializedViews, foreignTables }).filter(
    (x) => visibleTypes.includes(x.type)
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const error = tablesError || viewsError || materializedViewsError || foreignTablesError
  const isError = isErrorTables || isErrorViews || isErrorMaterializedViews || isErrorForeignTables
  const isLoading =
    isLoadingTables || isLoadingViews || isLoadingMaterializedViews || isLoadingForeignTables
  const isSuccess =
    isSuccessTables && isSuccessViews && isSuccessMaterializedViews && isSuccessForeignTables

  const formatTooltipText = (entityType: string) => {
    const text =
      Object.entries(ENTITY_TYPE)
        .find(([, value]) => value === entityType)?.[0]
        ?.toLowerCase()
        ?.split('_')
        ?.join(' ') || ''
    // Return sentence case (capitalize first letter only)
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
        <div className="flex gap-2 items-center">
          <SchemaSelector
            className="flex-grow lg:flex-grow-0 w-[180px]"
            size="tiny"
            showError={false}
            selectedSchemaName={selectedSchema}
            onSelectSchema={setSelectedSchema}
          />
          <Popover_Shadcn_>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type={visibleTypes.length !== 5 ? 'default' : 'dashed'}
                className="px-1"
                icon={<Filter />}
              />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center">
              <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
                <p className="text-xs">Show entity types</p>
                <div className="flex flex-col">
                  {Object.entries(ENTITY_TYPE).map(([key, value]) => (
                    <div key={key} className="group flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-x-2">
                        <Checkbox_Shadcn_
                          id={key}
                          name={key}
                          checked={visibleTypes.includes(value)}
                          onCheckedChange={() => {
                            if (visibleTypes.includes(value)) {
                              setVisibleTypes(visibleTypes.filter((y) => y !== value))
                            } else {
                              setVisibleTypes(visibleTypes.concat([value]))
                            }
                          }}
                        />
                        <Label_Shadcn_ htmlFor={key} className="capitalize text-xs">
                          {key.toLowerCase().replace('_', ' ')}
                        </Label_Shadcn_>
                      </div>
                      <Button
                        size="tiny"
                        type="default"
                        onClick={() => setVisibleTypes([value])}
                        className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                      >
                        Select only
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
        <div className="flex flex-grow justify-between gap-2 items-center">
          <Input
            size="tiny"
            className="flex-grow lg:flex-grow-0 w-52"
            placeholder="Search for a table"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<Search />}
          />

          {!isSchemaLocked && (
            <ButtonTooltip
              className="w-auto ml-auto"
              icon={<Plus />}
              disabled={!canUpdateTables}
              onClick={() => onAddTable()}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdateTables
                    ? 'You need additional permissions to create tables'
                    : undefined,
                },
              }}
            >
              New table
            </ButtonTooltip>
          )}
        </div>
      </div>

      {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="tables" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="w-full">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="icon" className="w-0 !px-0" />
                  <TableHead key="name" className="max-w-[160px] sm:max-w-[280px]">
                    Name
                  </TableHead>
                  <TableHead key="columns">Columns</TableHead>
                  <TableHead key="rows">Rows (Estimated)</TableHead>
                  <TableHead key="size">Size (Estimated)</TableHead>
                  <TableHead key="realtime">Realtime</TableHead>
                  <TableHead key="buttons"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <>
                  {entities.length === 0 && filterString.length === 0 && (
                    <TableRow key={selectedSchema}>
                      <TableCell colSpan={7}>
                        {visibleTypes.length === 0 ? (
                          <>
                            <p className="text-sm text-foreground">
                              Please select at least one entity type to filter with
                            </p>
                            <p className="text-sm text-foreground-light">
                              There are currently no results based on the filter that you have
                              applied
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">No tables created yet</p>
                            <p className="text-sm text-foreground-light">
                              There are no{' '}
                              {visibleTypes.length === 5
                                ? 'tables'
                                : visibleTypes.length === 1
                                  ? `${formatTooltipText(visibleTypes[0])}s`
                                  : `${visibleTypes
                                      .slice(0, -1)
                                      .map((x) => `${formatTooltipText(x)}s`)
                                      .join(
                                        ', '
                                      )}, and ${formatTooltipText(visibleTypes[visibleTypes.length - 1])}s`}{' '}
                              found in the schema "{selectedSchema}"
                            </p>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {entities.length === 0 && filterString.length > 0 && (
                    <TableRow key={selectedSchema}>
                      <TableCell colSpan={7}>
                        <p className="text-sm text-foreground">No results found</p>
                        <p className="text-sm text-foreground-light">
                          Your search for "{filterString}" did not return any results
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {entities.length > 0 &&
                    entities.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell className="w-0 !pl-5 !pr-1">
                          <Tooltip>
                            <TooltipTrigger asChild className="cursor-default">
                              <div className="flex w-4 justify-center">
                                <EntityTypeIcon type={x.type} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {formatTooltipText(x.type)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="max-w-[160px] sm:max-w-[280px]">
                          <div className="flex min-w-0 flex-col">
                            {/* only show tooltips if required, to reduce noise */}
                            {x.name.length > 20 ? (
                              <Tooltip disableHoverableContent={true}>
                                <TooltipTrigger
                                  asChild
                                  className="max-w-[95%] overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                  <p>{x.name}</p>
                                </TooltipTrigger>

                                <TooltipContent side="bottom">{x.name}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <p>{x.name}</p>
                            )}
                            {x.comment !== null ? (
                              <span
                                className="max-w-md truncate text-foreground-lighter"
                                title={x.comment}
                              >
                                {x.comment}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-foreground-light">
                            {x.columns.length.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          {x.rows !== undefined ? (
                            <p className="text-foreground-light">{x.rows.toLocaleString()}</p>
                          ) : (
                            <p className="text-foreground-muted">–</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {x.size !== undefined ? (
                            <p className="text-foreground-light">{x.size}</p>
                          ) : (
                            <p className="text-foreground-muted">–</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {(realtimePublication?.tables ?? []).find(
                            (table) => table.id === x.id
                          ) ? (
                            <div className="flex items-center gap-x-2">
                              <Check size={16} strokeWidth={2} className="text-brand-link" />
                              <p className="text-foreground-light">Enabled</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-x-2">
                              <X size={16} strokeWidth={2} className="text-foreground-muted" />
                              <p className="text-foreground-lighter">Disabled</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild type="default">
                              <Link href={`/project/${ref}/database/tables/${x.id}`}>
                                View columns
                              </Link>
                            </Button>

                            {!isSchemaLocked && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="default" className="px-1" icon={<MoreVertical />} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="bottom" align="end" className="w-40">
                                  <DropdownMenuItem
                                    className="flex items-center space-x-2"
                                    onClick={() =>
                                      router.push(
                                        buildTableEditorUrl({
                                          projectRef: project?.ref,
                                          tableId: x.id,
                                          schema: x.schema,
                                        })
                                      )
                                    }
                                    onMouseEnter={() =>
                                      prefetchEditorTablePage({
                                        id: x.id ? String(x.id) : undefined,
                                      })
                                    }
                                  >
                                    <Eye size={12} />
                                    <p>View in Table Editor</p>
                                  </DropdownMenuItem>

                                  {x.type === ENTITY_TYPE.TABLE && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItemTooltip
                                        className="gap-x-2"
                                        disabled={!canUpdateTables}
                                        onClick={() => {
                                          if (canUpdateTables) onEditTable(x)
                                        }}
                                        tooltip={{
                                          content: {
                                            side: 'left',
                                            text: 'You need additional permissions to edit this table',
                                          },
                                        }}
                                      >
                                        <Edit size={12} />
                                        <p>Edit table</p>
                                      </DropdownMenuItemTooltip>
                                      <DropdownMenuItemTooltip
                                        key="duplicate-table"
                                        className="gap-x-2"
                                        disabled={!canUpdateTables}
                                        onClick={() => {
                                          if (canUpdateTables) onDuplicateTable(x)
                                        }}
                                        tooltip={{
                                          content: {
                                            side: 'left',
                                            text: 'You need additional permissions to duplicate tables',
                                          },
                                        }}
                                      >
                                        <Copy size={12} />
                                        <span>Duplicate Table</span>
                                      </DropdownMenuItemTooltip>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItemTooltip
                                        disabled={!canUpdateTables || isSchemaLocked}
                                        className="gap-x-2"
                                        onClick={() => {
                                          if (canUpdateTables && !isSchemaLocked) {
                                            onDeleteTable({ ...x, schema: selectedSchema })
                                          }
                                        }}
                                        tooltip={{
                                          content: {
                                            side: 'left',
                                            text: 'You need additional permissions to delete tables',
                                          },
                                        }}
                                      >
                                        <Trash size={12} />
                                        <p>Delete table</p>
                                      </DropdownMenuItemTooltip>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              </TableBody>
              <TableFooter className="font-normal">
                <TableRow className="border-b-0 [&>td]:hover:bg-inherit">
                  <TableCell colSpan={7} className="text-foreground-muted">
                    {entities.length} {entities.length === 1 ? 'table' : 'tables'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
