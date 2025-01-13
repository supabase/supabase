import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import {
  Check,
  Columns,
  Copy,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Table2,
  Trash,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useForeignTablesQuery } from 'data/foreign-tables/foreign-tables-query'
import { useMaterializedViewsQuery } from 'data/materialized-views/materialized-views-query'
import { usePrefetchEditorTablePage } from 'data/prefetchers/project.$ref.editor.$id'
import { useTablesQuery } from 'data/tables/tables-query'
import { useViewsQuery } from 'data/views/views-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import {
  Button,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'
import { formatAllEntities } from './Tables.utils'

interface TableListProps {
  onAddTable: () => void
  onEditTable: (table: PostgresTable) => void
  onDeleteTable: (table: PostgresTable) => void
  onDuplicateTable: (table: PostgresTable) => void
}

const TableList = ({
  onDuplicateTable,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
}: TableListProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()

  const prefetchEditorTablePage = usePrefetchEditorTablePage()

  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [filterString, setFilterString] = useState<string>('')
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))
  const canUpdateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const {
    data: tables,
    error: tablesError,
    isError: isErrorTables,
    isLoading: isLoadingTables,
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
    isLoading: isLoadingViews,
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
    isLoading: isLoadingMaterializedViews,
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
    isLoading: isLoadingForeignTables,
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

  const isLocked = PROTECTED_SCHEMAS.includes(selectedSchema)

  const error = tablesError || viewsError || materializedViewsError || foreignTablesError
  const isError = isErrorTables || isErrorViews || isErrorMaterializedViews || isErrorForeignTables
  const isLoading =
    isLoadingTables || isLoadingViews || isLoadingMaterializedViews || isLoadingForeignTables
  const isSuccess =
    isSuccessTables && isSuccessViews && isSuccessMaterializedViews && isSuccessForeignTables

  const formatTooltipText = (entityType: string) => {
    return Object.entries(ENTITY_TYPE)
      .find(([, value]) => value === entityType)?.[0]
      ?.toLowerCase()
      ?.split('_')
      ?.join(' ')
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2 flex-wrap">
        <SchemaSelector
          className="w-[180px]"
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

        <Input
          size="tiny"
          className="w-52"
          placeholder="Search for a table"
          value={filterString}
          onChange={(e) => setFilterString(e.target.value)}
          icon={<Search size={12} />}
        />

        {!isLocked && (
          <ButtonTooltip
            className="ml-auto"
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

      {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="tables" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="w-full">
          <Table
            head={[
              <Table.th key="icon" className="!px-0" />,
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
                {entities.length === 0 && filterString.length === 0 && (
                  <Table.tr key={selectedSchema}>
                    <Table.td colSpan={7}>
                      {visibleTypes.length === 0 ? (
                        <>
                          <p className="text-sm text-foreground">
                            Please select at least one entity type to filter with
                          </p>
                          <p className="text-sm text-foreground-light">
                            There are currently no results based on the filter that you have applied
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
                    </Table.td>
                  </Table.tr>
                )}
                {entities.length === 0 && filterString.length > 0 && (
                  <Table.tr key={selectedSchema}>
                    <Table.td colSpan={7}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-light">
                        Your search for "{filterString}" did not return any results
                      </p>
                    </Table.td>
                  </Table.tr>
                )}
                {entities.length > 0 &&
                  entities.map((x) => (
                    <Table.tr key={x.id}>
                      <Table.td className="!pl-5 !pr-1">
                        <Tooltip_Shadcn_>
                          <TooltipTrigger_Shadcn_ asChild>
                            {x.type === ENTITY_TYPE.TABLE ? (
                              <Table2
                                size={15}
                                strokeWidth={1.5}
                                className="text-foreground-lighter"
                              />
                            ) : x.type === ENTITY_TYPE.VIEW ? (
                              <Eye
                                size={15}
                                strokeWidth={1.5}
                                className="text-foreground-lighter"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
                                  x.type === ENTITY_TYPE.FOREIGN_TABLE &&
                                    'text-yellow-900 bg-yellow-500',
                                  x.type === ENTITY_TYPE.MATERIALIZED_VIEW &&
                                    'text-purple-1000 bg-purple-500'
                                  // [Alaister]: tables endpoint doesn't distinguish between tables and partitioned tables
                                  // once we update the endpoint to include partitioned tables, we can uncomment this
                                  // x.type === ENTITY_TYPE.PARTITIONED_TABLE &&
                                  //   'text-foreground-light bg-border-stronger'
                                )}
                              >
                                {Object.entries(ENTITY_TYPE)
                                  .find(([, value]) => value === x.type)?.[0]?.[0]
                                  ?.toUpperCase()}
                              </div>
                            )}
                          </TooltipTrigger_Shadcn_>
                          <TooltipContent_Shadcn_ side="bottom" className="capitalize">
                            {formatTooltipText(x.type)}
                          </TooltipContent_Shadcn_>
                        </Tooltip_Shadcn_>
                      </Table.td>
                      <Table.td>
                        {/* only show tooltips if required, to reduce noise */}
                        {x.name.length > 20 ? (
                          <Tooltip.Root delayDuration={0} disableHoverableContent={true}>
                            <Tooltip.Trigger
                              asChild
                              className="max-w-[95%] overflow-hidden text-ellipsis whitespace-nowrap"
                            >
                              <p>{x.name}</p>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200',
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-foreground">{x.name}</span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ) : (
                          <p>{x.name}</p>
                        )}
                      </Table.td>
                      <Table.td className="hidden lg:table-cell ">
                        {x.comment !== null ? (
                          <span className="lg:max-w-48 truncate inline-block" title={x.comment}>
                            {x.comment}
                          </span>
                        ) : (
                          <p className="text-border-stronger">No description</p>
                        )}
                      </Table.td>
                      <Table.td className="hidden text-right xl:table-cell">
                        {x.rows !== undefined ? x.rows.toLocaleString() : '-'}
                      </Table.td>
                      <Table.td className="hidden text-right xl:table-cell">
                        {x.size !== undefined ? <code className="text-xs">{x.size}</code> : '-'}
                      </Table.td>
                      <Table.td className="hidden xl:table-cell text-center">
                        {(realtimePublication?.tables ?? []).find((table) => table.id === x.id) ? (
                          <div className="flex justify-center">
                            <Check size={18} strokeWidth={2} className="text-brand" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <X size={18} strokeWidth={2} className="text-foreground-lighter" />
                          </div>
                        )}
                      </Table.td>
                      <Table.td>
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            type="default"
                            iconRight={<Columns size={14} className="text-foreground-light" />}
                            className="whitespace-nowrap hover:border-muted"
                            style={{ paddingTop: 3, paddingBottom: 3 }}
                          >
                            <Link href={`/project/${ref}/database/tables/${x.id}`}>
                              {x.columns.length} columns
                            </Link>
                          </Button>

                          {!isLocked && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="default" className="px-1" icon={<MoreVertical />} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="bottom" align="end" className="w-40">
                                <DropdownMenuItem
                                  className="flex items-center space-x-2"
                                  onClick={() =>
                                    router.push(`/project/${project?.ref}/editor/${x.id}`)
                                  }
                                  onMouseEnter={() =>
                                    prefetchEditorTablePage({ id: x.id ? String(x.id) : undefined })
                                  }
                                >
                                  <Eye size={12} />
                                  <p>View in Table Editor</p>
                                </DropdownMenuItem>

                                {x.type === ENTITY_TYPE.TABLE && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <Tooltip_Shadcn_>
                                      <TooltipTrigger_Shadcn_ asChild>
                                        <DropdownMenuItem
                                          className="!pointer-events-auto gap-x-2"
                                          disabled={!canUpdateTables}
                                          onClick={() => {
                                            if (canUpdateTables) onEditTable(x)
                                          }}
                                        >
                                          <Edit size={12} />
                                          <p>Edit table</p>
                                        </DropdownMenuItem>
                                      </TooltipTrigger_Shadcn_>
                                      {!canUpdateTables && (
                                        <TooltipContent_Shadcn_ side="left">
                                          You need additional permissions to edit this table
                                        </TooltipContent_Shadcn_>
                                      )}
                                    </Tooltip_Shadcn_>
                                    <DropdownMenuItem
                                      key="duplicate-table"
                                      className="space-x-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (canUpdateTables) {
                                          onDuplicateTable(x)
                                        }
                                      }}
                                    >
                                      <Copy size={12} />
                                      <span>Duplicate Table</span>
                                    </DropdownMenuItem>
                                    <Tooltip_Shadcn_>
                                      <TooltipTrigger_Shadcn_ asChild>
                                        <DropdownMenuItem
                                          disabled={!canUpdateTables || isLocked}
                                          className="!pointer-events-auto gap-x-2"
                                          onClick={() => {
                                            if (canUpdateTables && !isLocked) {
                                              onDeleteTable({
                                                ...x,
                                                schema: selectedSchema,
                                              })
                                            }
                                          }}
                                        >
                                          <Trash stroke="red" size={12} />
                                          <p>Delete table</p>
                                        </DropdownMenuItem>
                                      </TooltipTrigger_Shadcn_>
                                      {!canUpdateTables && (
                                        <TooltipContent_Shadcn_ side="left">
                                          You need additional permissions to delete tables
                                        </TooltipContent_Shadcn_>
                                      )}
                                    </Tooltip_Shadcn_>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </Table.td>
                    </Table.tr>
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
