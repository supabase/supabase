import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { Archive, ArrowDown, ArrowUp, Loader2, RefreshCw, Search, X } from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  LoadingLine,
  ResizablePanel,
  ResizablePanelGroup,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useBucketsQuery } from 'data/storage/buckets-query'
import type { StorageBucket } from 'components/interfaces/Storage/Storage.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import CreateBucketModal from './CreateBucketModal'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'

type Filter = 'all' | 'public' | 'private'
export type BucketsTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const BUCKETS_TABLE_COLUMNS: BucketsTableColumn[] = [
  { id: 'name', name: 'Name', width: 280 },
  { id: 'public', name: 'Public', width: 100 },
  { id: 'created_at', name: 'Created at', width: 260 },
  { id: 'file_count', name: 'Files', width: 100 },
  { id: 'size', name: 'Size', width: 100 },
  { id: 'owner', name: 'Owner', width: 200 },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const StorageBucketList = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const canCreateBuckets = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedRow, setSelectedRow] = useState<number>()
  const [sortByValue, setSortByValue] = useState<string>('created_at:desc')
  const [columnConfiguration, setColumnConfiguration] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.STORAGE_BUCKETS_COLUMN_CONFIG(ref ?? ''),
    null as ColumnConfiguration[] | null
  )
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)

  const [sortColumn, sortOrder] = sortByValue.split(':')

  const { data, error, isLoading, isError, isSuccess, isRefetching, refetch } = useBucketsQuery({
    projectRef: ref,
  })

  const buckets = data ?? []
  const sortedBuckets =
    sortColumn === 'name'
      ? buckets.sort(
          (a, b) =>
            (sortOrder === 'asc' ? 1 : -1) *
            a.name.toLowerCase().trim().localeCompare(b.name.toLowerCase().trim())
        )
      : buckets.sort(
          (a, b) =>
            (sortOrder === 'asc' ? 1 : -1) *
            (new Date(b.created_at) > new Date(a.created_at) ? -1 : 1)
        )

  const filteredBuckets =
    filterKeywords.length > 1
      ? sortedBuckets.filter((bucket) =>
          bucket.name.toLowerCase().includes(filterKeywords.toLowerCase().trim())
        )
      : sortedBuckets

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    // if (isLoading || !isAtBottom(event)) return
    // refetch()
  }

  const clearSearch = () => {
    setSearch('')
    setFilterKeywords('')
  }

  const swapColumns = (data: any[], sourceIdx: number, targetIdx: number) => {
    const updatedColumns = data.slice()
    const [removed] = updatedColumns.splice(sourceIdx, 1)
    updatedColumns.splice(targetIdx, 0, removed)
    return updatedColumns
  }

  // [Joshen] Left off here - it's tricky trying to do both column toggling and re-ordering
  const saveColumnConfiguration = AwesomeDebouncePromise(
    (event: 'resize' | 'reorder' | 'toggle', value) => {
      if (event === 'toggle') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'resize') {
        const columnConfig = columns.map((col, idx) => ({
          id: col.key,
          width: idx === value.idx ? value.width : col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'reorder') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      }
    },
    500
  )

  useEffect(() => {
    if (!isRefetching) {
      const columns = formatBucketColumns({
        config: columnConfiguration ?? [],
        buckets: buckets ?? [],
        visibleColumns: selectedColumns,
        setSortByValue,
        sortByValue,
        ref,
      })
      setColumns(columns)
      if (columns.length < BUCKETS_TABLE_COLUMNS.length) {
        setSelectedColumns(columns.map((col) => col.key))
      }
    }
  }, [isSuccess, isRefetching, buckets, columnConfiguration, selectedColumns, sortByValue])

  return (
    <div className="h-full flex flex-col">
      <div className="py-3 px-5 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            className="w-52 pl-7 bg-transparent"
            iconContainerClassName="pl-2"
            icon={<Search size={14} className="text-foreground-lighter" />}
            placeholder="Search bucket name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter') {
                setSearch(search.trim())
                setFilterKeywords(search.trim().toLocaleLowerCase())
              }
            }}
            actions={[
              search && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={() => clearSearch()}
                  className="p-0 h-5 w-5"
                />
              ),
            ]}
          />

          <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
            <SelectTrigger_Shadcn_
              size="tiny"
              className={cn('w-[140px] !bg-transparent', filter === 'all' && 'border-dashed')}
            >
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectItem_Shadcn_ value="all">All buckets</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="public">Public buckets</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="private">Private buckets</SelectItem_Shadcn_>
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={sortOrder === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                Sorted by {sortColumn.replaceAll('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by name</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="name:asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name:desc">Descending</DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by created at</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="created_at:asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at:desc">
                      Descending
                    </DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {isNewAPIDocsEnabled && <APIDocsButton section={['storage']} />}
          <Button
            size="tiny"
            icon={<RefreshCw />}
            type="default"
            loading={isRefetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            size="tiny"
            type="primary"
            disabled={!canCreateBuckets}
            onClick={() => setShowCreateBucketModal(true)}
          >
            Create bucket
          </Button>
        </div>
      </div>

      <LoadingLine loading={isLoading || isRefetching} />
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
      >
        <ResizablePanel defaultSize={1}>
          <div className="flex flex-col w-full h-full">
            <DataGrid
              ref={gridRef}
              className="flex-grow border-t-0"
              rowHeight={44}
              headerRowHeight={36}
              columns={columns}
              rows={filteredBuckets}
              rowClass={(_, idx) => {
                const isSelected = idx === selectedRow
                return [
                  `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                  '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                  '[&>.rdg-cell:first-child>div]:ml-4',
                ].join(' ')
              }}
              renderers={{
                noRowsFallback: isLoading ? (
                  <div className="absolute top-14 px-6 w-full">
                    <GenericSkeletonLoader />
                  </div>
                ) : isError ? (
                  <div className="absolute top-14 px-6 flex flex-col items-center justify-center w-full">
                    <AlertError subject="Failed to retrieve buckets" error={error} />
                  </div>
                ) : (
                  <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                    <Archive className="text-foreground-lighter" strokeWidth={1} />
                    <div className="text-center">
                      <p className="text-foreground">
                        {filter !== 'all' || filterKeywords.length > 0
                          ? 'No buckets found'
                          : 'No buckets in your project'}
                      </p>
                      <p className="text-foreground-light">
                        {filter !== 'all' || filterKeywords.length > 0
                          ? 'There are currently no buckets based on the filters applied'
                          : 'There are currently no buckets in your project'}
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
        {isLoading || isRefetching
          ? 'Loading buckets...'
          : `Total: ${filteredBuckets.length} buckets`}
        {(isLoading || isRefetching) && (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        )}
      </div>

      <CreateBucketModal
        visible={showCreateBucketModal}
        onClose={() => setShowCreateBucketModal(false)}
      />
    </div>
  )
}

const formatBucketColumns = ({
  config,
  buckets,
  visibleColumns,
  setSortByValue,
  sortByValue,
  ref,
}: {
  config: ColumnConfiguration[]
  buckets: StorageBucket[]
  visibleColumns: string[]
  setSortByValue: (value: string) => void
  sortByValue: string
  ref
}) => {
  const columnOrder = config.map((c) => c.id) ?? BUCKETS_TABLE_COLUMNS.map((c) => c.id)

  let gridColumns = BUCKETS_TABLE_COLUMNS.map((col) => {
    const savedConfig = config.find((c) => c.id === col.id)

    return {
      key: col.id,
      name: col.name,
      resizable: col.resizable ?? true,
      sortable: ['name', 'created_at'].includes(col.id),
      draggable: true,
      width: savedConfig?.width ?? col.width,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'z-50 outline-none !shadow-none',
      onSort: () => {
        if (col.id === 'name' || col.id === 'created_at') {
          const order = sortByValue === `${col.id}:asc` ? 'desc' : 'asc'
          setSortByValue(`${col.id}:${order}`)
        }
      },
      renderHeaderCell: () => {
        const icon = sortByValue.includes(col.id) ? (
          sortByValue.includes('asc') ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : null

        return (
          <div className={`flex items-center gap-2 ${col.id === 'name' ? 'pl-3' : ''}`}>
            {col.name}
            {icon && <div className="opacity-50">{icon}</div>}
          </div>
        )
      },
      renderCell: ({ row }) => {
        switch (col.id) {
          case 'name':
            return (
              <Link
                href={`/project/${ref}/storage/buckets/${row.name}`}
                className="flex items-center gap-2 text-foreground hover:text-foreground-light transition pl-3"
              >
                {row.name}
              </Link>
            )
          case 'public':
            return row.public ? 'Public' : 'Private'
          case 'created_at':
            return new Date(row.created_at).toLocaleString()
          case 'file_count':
            return row.file_count ?? 0
          case 'size':
            return formatBytes(row.size ?? 0)
          case 'owner':
            return row.owner ?? '-'
          default:
            return row[col.id]
        }
      },
    }
  })

  if (columnOrder.length > 0) {
    gridColumns = gridColumns
      .filter((col) => columnOrder.includes(col.key))
      .sort((a: any, b: any) => columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key))
  }

  return visibleColumns.length === 0
    ? gridColumns
    : gridColumns.filter((col) => visibleColumns.includes(col.key))
}
