import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { noop } from 'lodash'
import {
  Check,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  Button,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useSnapshot } from 'valtio'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import {
  getWarehouseStorageSummaryLabel,
  warehouseDemoStore,
  type WarehouseMode,
} from '../Warehouse/warehouseDemoStore'
import { WarehouseSyncChip } from '../Warehouse/WarehouseSyncChip'
import { formatAllEntities } from './Tables.utils'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import AlertError from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import SchemaSelector from '@/components/ui/SchemaSelector'
import { Shortcut } from '@/components/ui/Shortcut'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useForeignTablesQuery } from '@/data/foreign-tables/foreign-tables-query'
import { useMaterializedViewsQuery } from '@/data/materialized-views/materialized-views-query'
import { usePrefetchEditorTablePage } from '@/data/prefetchers/project.$ref.editor.$id'
import { useInfiniteTablesQuery } from '@/data/tables/tables-query'
import { useViewsQuery } from '@/data/views/views-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { onSearchInputEscape } from '@/lib/keyboard'
import { createNavigationHandler } from '@/lib/navigation'
import type { SafePostgresTable } from '@/lib/postgres-types'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

type TableListSortColumn = 'name' | 'columns' | 'rows' | 'storage' | 'realtime'
type TableListSort = `${TableListSortColumn}:asc` | `${TableListSortColumn}:desc`

interface TableListProps {
  onAddTable: () => void
  onEditTable: (table: SafePostgresTable) => void
  onDeleteTable: (table: SafePostgresTable) => void
  onDuplicateTable: (table: SafePostgresTable) => void
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
  const debouncedFilterString = useDebounce(filterString, 300)
  const [visibleTypes, setVisibleTypes] = useState<string[]>(Object.values(ENTITY_TYPE))
  const [schemaSelectorOpen, setSchemaSelectorOpen] = useState(false)
  const [sort, setSort] = useState<TableListSort>('name:asc')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const {
    data: tablesData,
    error: tablesError,
    isError: isErrorTables,
    isPending: isLoadingTables,
    isSuccess: isSuccessTables,
    hasNextPage: hasNextTablesPage,
    isFetchingNextPage: isFetchingNextTablesPage,
    fetchNextPage: fetchNextTablesPage,
  } = useInfiniteTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
    includeColumns: true,
    pageSize: 50,
    nameFilter: debouncedFilterString,
  })

  const tables = tablesData?.pages.flat() ?? []

  const [sentinelRef, sentinelEntry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '200px 0px 200px 0px',
  })

  useEffect(() => {
    if (sentinelEntry?.isIntersecting && hasNextTablesPage && !isFetchingNextTablesPage) {
      fetchNextTablesPage()
    }
  }, [
    sentinelEntry?.isIntersecting,
    hasNextTablesPage,
    isFetchingNextTablesPage,
    fetchNextTablesPage,
  ])

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

  const [sortColumn, sortDirection] = sort.split(':') as [TableListSortColumn, 'asc' | 'desc']

  const getAriaSort = (column: TableListSortColumn) => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const handleSortChange = (column: TableListSortColumn) => {
    if (sortColumn !== column) {
      setSort(`${column}:asc`)
      return
    }

    setSort(`${column}:${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  const sortedEntities = useMemo(() => {
    const items = [...entities]

    const isRealtimeEnabled = (entity: (typeof entities)[number]) =>
      (realtimePublication?.tables ?? []).some((table) => table.id === entity.id)

    const getBytes = (entity: (typeof entities)[number]) =>
      'bytes' in entity && typeof entity.bytes === 'number' ? entity.bytes : undefined

    items.sort((a, b) => {
      let comparison = 0

      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortColumn === 'columns') {
        comparison = a.columns.length - b.columns.length
      } else if (sortColumn === 'rows') {
        if (a.rows === undefined && b.rows === undefined) {
          comparison = 0
        } else if (a.rows === undefined) {
          return 1
        } else if (b.rows === undefined) {
          return -1
        } else {
          comparison = a.rows - b.rows
        }
      } else if (sortColumn === 'storage') {
        const bytesA = getBytes(a)
        const bytesB = getBytes(b)

        if (bytesA === undefined && bytesB === undefined) {
          comparison = 0
        } else if (bytesA === undefined) {
          return 1
        } else if (bytesB === undefined) {
          return -1
        } else {
          comparison = bytesA - bytesB
        }
      } else if (sortColumn === 'realtime') {
        comparison = Number(isRealtimeEnabled(a)) - Number(isRealtimeEnabled(b))
      }

      if (comparison !== 0) {
        return sortDirection === 'asc' ? comparison : -comparison
      }

      return a.name.localeCompare(b.name)
    })

    return items
  }, [entities, sortColumn, sortDirection, realtimePublication])

  const footerCount = hasNextTablesPage ? tables.length : entities.length

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const canAddTables = canUpdateTables && !isSchemaLocked

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search tables' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => {
    setVisibleTypes(Object.values(ENTITY_TYPE))
    setFilterString('')
  })

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
          <Shortcut
            id={SHORTCUT_IDS.LIST_PAGE_FOCUS_SCHEMA}
            onTrigger={() => setSchemaSelectorOpen(true)}
            side="bottom"
            tooltipOpen={schemaSelectorOpen ? false : undefined}
          >
            <SchemaSelector
              className="grow lg:grow-0 w-[180px]"
              size="tiny"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
              open={schemaSelectorOpen}
              onOpenChange={setSchemaSelectorOpen}
            />
          </Shortcut>
          <Popover>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="tiny"
                    variant={visibleTypes.length !== 5 ? 'default' : 'dashed'}
                    className="px-1"
                    icon={<Filter />}
                    aria-label="Filter"
                  />
                </TooltipTrigger>
                <TooltipContent>Filter</TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56" side="bottom" align="center">
              <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
                <p className="text-xs">Show entity types</p>
                <div className="flex flex-col">
                  {Object.entries(ENTITY_TYPE).map(([key, value]) => (
                    <div key={key} className="group flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-x-2">
                        <Checkbox
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
                        <Label htmlFor={key} className="capitalize text-xs">
                          {key.toLowerCase().replace('_', ' ')}
                        </Label>
                      </div>
                      <Button
                        size="tiny"
                        variant="default"
                        onClick={() => setVisibleTypes([value])}
                        className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                      >
                        Select only
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex grow justify-between gap-2 items-center">
          <Input
            ref={searchInputRef}
            size="tiny"
            containerClassName="grow lg:grow-0 w-52"
            placeholder="Search for a table"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            onKeyDown={onSearchInputEscape(filterString, setFilterString)}
            icon={<Search />}
          />

          {!isSchemaLocked &&
            (canAddTables ? (
              <Shortcut
                id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
                label="Create new table"
                onTrigger={() => onAddTable()}
                side="bottom"
              >
                <Button className="w-auto ml-auto" icon={<Plus />} onClick={() => onAddTable()}>
                  New table
                </Button>
              </Shortcut>
            ) : (
              <ButtonTooltip
                className="w-auto ml-auto"
                icon={<Plus />}
                disabled
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to create tables',
                  },
                }}
              >
                New table
              </ButtonTooltip>
            ))}
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
                  <TableHead key="icon" className="w-0 px-0!" />
                  <TableHead
                    key="name"
                    aria-sort={getAriaSort('name')}
                    className="max-w-[160px] sm:max-w-[280px]"
                  >
                    <TableHeadSort column="name" currentSort={sort} onSortChange={handleSortChange}>
                      Name
                    </TableHeadSort>
                  </TableHead>
                  <TableHead key="columns" aria-sort={getAriaSort('columns')}>
                    <TableHeadSort
                      column="columns"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                    >
                      Columns
                    </TableHeadSort>
                  </TableHead>
                  <TableHead key="rows" aria-sort={getAriaSort('rows')}>
                    <TableHeadSort column="rows" currentSort={sort} onSortChange={handleSortChange}>
                      Rows (Est)
                    </TableHeadSort>
                  </TableHead>
                  <TableHead key="storage" aria-sort={getAriaSort('storage')}>
                    <TableHeadSort
                      column="storage"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                    >
                      Storage
                    </TableHeadSort>
                  </TableHead>
                  <TableHead key="realtime" aria-sort={getAriaSort('realtime')}>
                    <TableHeadSort
                      column="realtime"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                    >
                      Realtime
                    </TableHeadSort>
                  </TableHead>
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
                  {sortedEntities.length > 0 &&
                    sortedEntities.map((x) => {
                      const tableDetailUrl = `/project/${ref}/database/tables/${x.id}`
                      const handleRowNavigation = createNavigationHandler(tableDetailUrl, router)

                      return (
                        <TableRow
                          key={x.id}
                          className="group relative cursor-pointer inset-focus"
                          onClick={handleRowNavigation}
                          onAuxClick={handleRowNavigation}
                          onKeyDown={handleRowNavigation}
                          tabIndex={0}
                        >
                          <TableCell className="w-0 pl-5! pr-1!">
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
                            {x.type === ENTITY_TYPE.TABLE ? (
                              (() => {
                                const tableKey = `${selectedSchema}.${x.name}`
                                const wState = warehouseSnap.tables[tableKey] ?? {
                                  mode: 'postgres',
                                }
                                const mode = wState.mode as WarehouseMode
                                const storageSummary = getWarehouseStorageSummaryLabel(
                                  wState,
                                  x.size
                                )
                                const storageUrl = `${tableDetailUrl}/settings`
                                const showSyncChip =
                                  wState.syncState === 'syncing' || wState.syncState === 'error'

                                if (mode === 'postgres') {
                                  return (
                                    <p className="text-sm text-foreground-light">{x.size ?? '—'}</p>
                                  )
                                }

                                return (
                                  <Link
                                    href={storageUrl}
                                    onClick={(event: MouseEvent) => event.stopPropagation()}
                                    className="inline-flex max-w-full items-center gap-2 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter"
                                  >
                                    <span className="text-sm text-foreground-light">
                                      {storageSummary}
                                    </span>
                                    {showSyncChip && (
                                      <WarehouseSyncChip syncState={wState.syncState!} />
                                    )}
                                  </Link>
                                )
                              })()
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
                            <div
                              className="flex items-center justify-end gap-3"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="default"
                                    className="h-[28px] w-7 hit-area-2"
                                    icon={<MoreVertical />}
                                    aria-label={`Table ${x.name} actions`}
                                  />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="bottom" align="end" className="w-48">
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
                                        <p>Edit definitions</p>
                                      </DropdownMenuItemTooltip>
                                      <DropdownMenuItem className="flex items-center space-x-2" asChild>
                                        <Link href={`${tableDetailUrl}/settings`}>
                                          <Settings size={12} />
                                          <p>Edit settings</p>
                                        </Link>
                                      </DropdownMenuItem>
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
                                        <span>Duplicate table</span>
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
                              <ChevronRight
                                aria-hidden
                                size={14}
                                className="text-foreground-muted/60"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </>
              </TableBody>
              <TableFooter className="font-normal">
                <TableRow ref={sentinelRef} className="border-b-0">
                  <TableCell colSpan={7} className="text-foreground-muted hover:bg-inherit">
                    {isFetchingNextTablesPage
                      ? 'Loading more tables…'
                      : `${footerCount} ${footerCount === 1 ? 'table' : 'tables'}${
                          hasNextTablesPage ? ' loaded' : ''
                        }`}
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
