import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { get, noop, sum, uniqBy } from 'lodash'
import { ChevronsDown, ChevronsUp, Copy, Eye, FolderPlus, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Checkbox,
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuSub_Shadcn_,
  ContextMenuSubContent_Shadcn_,
  ContextMenuSubTrigger_Shadcn_,
  ContextMenuTrigger_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from '../Storage.constants'
import type { StorageColumn, StorageItemWithColumn } from '../Storage.types'
import { FileExplorerRow } from './FileExplorerRow'
import { FileExplorerRowContextMenuProvider } from './FileExplorerRowContextMenu'
import { useStoragePreference } from './useStoragePreference'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const DragOverOverlay = ({ isOpen, onDragLeave, onDrop, folderIsEmpty }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="h-full w-full absolute top-0"
        >
          <div
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className="absolute top-0 flex h-full w-full items-center justify-center"
            style={{ backgroundColor: folderIsEmpty ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)' }}
          >
            {!folderIsEmpty && (
              <div
                className="w-3/4 h-32 border-2 border-dashed border-muted rounded-md flex flex-col items-center justify-center p-6 pointer-events-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <Upload className="text-white pointer-events-none" size={20} strokeWidth={2} />
                <p className="text-center text-sm  text-white mt-2 pointer-events-none">
                  Drop your files to upload to this folder
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export interface FileExplorerColumnProps {
  index?: number
  column: StorageColumn
  fullWidth?: boolean
  selectedItems?: StorageItemWithColumn[]
  itemSearchString?: string
  onFilesUpload?: (event: any, index: number) => void
  onSelectAllItemsInColumn?: (index: number) => void
  onSelectColumnEmptySpace?: (index: number) => void
  onColumnLoadMore?: (index: number, column: StorageColumn) => void
}

export const FileExplorerColumn = ({
  index = 0,
  column,
  fullWidth = false,
  selectedItems = [],
  itemSearchString = '',
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
}: FileExplorerColumnProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const fileExplorerColumnRef = useRef<any>(null)

  const snap = useStorageExplorerStateSnapshot()
  const { view, setSortByOrder, setSortBy, setView } = useStoragePreference(snap.projectRef)
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  useEffect(() => {
    if (fileExplorerColumnRef) {
      const { scrollHeight, clientHeight } = fileExplorerColumnRef.current
      if (scrollHeight > clientHeight) {
        fileExplorerColumnRef.current.scrollTop += scrollHeight - clientHeight
      }
    }
  }, [column])

  const haveSelectedItems = selectedItems.length > 0
  const columnItemsId = column.items.map((item) => item.id)
  const columnFiles = column.items.filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
  const selectedItemsFromColumn = selectedItems.filter((item) => columnItemsId.includes(item.id))
  const selectedFilesFromColumn = selectedItemsFromColumn.filter(
    (item) => item.type === STORAGE_ROW_TYPES.FILE
  )

  const columnItems = column.items.map((item, index) => ({ ...item, columnIndex: index }))
  const columnItemsSize = sum(columnItems.map((item) => get(item, ['metadata', 'size'], 0)))

  const isEmpty =
    column.items.filter((item) => item.status !== STORAGE_ROW_STATUS.LOADING).length === 0

  const onDragOver = (event: any) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      }
    }
  }

  const onDrop = (event: any) => {
    onDragOver(event)

    if (!canUpdateStorage) {
      toast('You need additional permissions to upload files to this project')
    } else {
      onFilesUpload(event, index)
    }
  }

  const getItemKey = useCallback(
    (index: number) => {
      const item = columnItems[index]
      return item?.id || `file-explorer-item-${index}`
    },
    [columnItems]
  )

  const itemProps = useMemo(
    () => ({
      view: view,
      columnIndex: index,
      selectedItems,
    }),
    [view, index, selectedItems]
  )

  const onSelectCreateFolder = () => {
    snap.addNewFolderPlaceholder(index)
  }

  const onSelectAllItems = () => {
    const colFiles = snap.columns[index].items
      .filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item) => ({ ...item, columnIndex: index }))
    const colFilesId = colFiles.map((item) => item.id).filter(Boolean)
    const selectedFromCol = selectedItems.filter((item) => item.id && colFilesId.includes(item.id))

    if (selectedFromCol.length === colFiles.length) {
      snap.setSelectedItems(
        selectedItems.filter((item) => item.id && !colFilesId.includes(item.id))
      )
    } else {
      snap.setSelectedItems(uniqBy(selectedItems.concat(colFiles), 'id'))
    }
  }

  return (
    <ContextMenu_Shadcn_ modal={false}>
      <ContextMenuTrigger_Shadcn_ asChild>
        <div
          ref={fileExplorerColumnRef}
          className={cn(
            fullWidth ? 'w-full' : 'w-64 border-r border-overlay',
            view === STORAGE_VIEWS.LIST && 'h-full',
            'hide-scrollbar relative flex shrink-0 flex-col overflow-auto'
          )}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => {
            onSelectColumnEmptySpace(index)
          }}
        >
          {/* Checkbox selection for select all */}
          {view === STORAGE_VIEWS.COLUMNS && (
            <div
              className={cn(
                'sticky top-0 z-10 mb-0 flex items-center bg-table-header-light px-2.5 in-data-[theme*=dark]:bg-table-header-dark',
                haveSelectedItems ? 'h-10 py-3 opacity-100' : 'h-0 py-0 opacity-0',
                'transition-all duration-200'
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {columnFiles.length > 0 ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkbox-select-all"
                      className="-mt-0.5"
                      checked={
                        columnFiles.length !== 0 &&
                        selectedFilesFromColumn.length === columnFiles.length
                      }
                      disabled={columnFiles.length === 0}
                      onCheckedChange={() => onSelectAllItemsInColumn(index)}
                    />
                    <label
                      htmlFor="checkbox-select-all"
                      className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select all {columnFiles.length} files
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground-light">No files available for selection</p>
              )}
            </div>
          )}

          {/* List Interface Header */}
          {view === STORAGE_VIEWS.LIST && (
            <div className="sticky top-0 py-2 z-10 flex min-w-min items-center border-b border-overlay bg-surface-100 px-2.5">
              <div className="flex w-[40%] min-w-[250px] items-center">
                <div className="relative w-[30px]" onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    id="checkbox-select-all"
                    className="-mt-0.5"
                    checked={
                      columnFiles.length !== 0 &&
                      selectedFilesFromColumn.length === columnFiles.length
                    }
                    disabled={columnFiles.length === 0}
                    onCheckedChange={() => onSelectAllItemsInColumn(index)}
                  />
                  <label
                    htmlFor="checkbox-select-all"
                    className="sr-only text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select all {columnFiles.length} files
                  </label>
                </div>
                <p className="text-sm">Name</p>
              </div>
              <p className="w-[11%] min-w-[100px] text-sm">Size</p>
              <p className="w-[14%] min-w-[100px] text-sm">Type</p>
              <p className="w-[15%] min-w-[160px] text-sm">Created at</p>
              <p className="w-[15%] min-w-[160px] text-sm">Last modified at</p>
            </div>
          )}

          {/* Shimmering loaders while fetching contents */}
          {column.status === STORAGE_ROW_STATUS.LOADING && (
            <div
              className={`
                ${fullWidth ? 'w-full' : 'w-64 border-r border-default'}
                px-2 py-1 my-1 flex shrink-0 flex-col space-y-2 overflow-auto
              `}
            >
              <ShimmeringLoader />
              <ShimmeringLoader />
              <ShimmeringLoader />
            </div>
          )}

          {/* Column Interface */}
          {columnItems.length > 0 && (
            <FileExplorerRowContextMenuProvider>
              <InfiniteListDefault
                className="h-full"
                items={columnItems}
                itemProps={itemProps}
                getItemKey={getItemKey}
                getItemSize={(index) => (index !== 0 && index === columnItems.length ? 85 : 37)}
                ItemComponent={FileExplorerRow}
                LoaderComponent={LoaderForIconMenuItems}
                hasNextPage={column.status !== STORAGE_ROW_STATUS.LOADING && column.hasMoreItems}
                isLoadingNextPage={column.isLoadingMoreItems}
                onLoadNextPage={() => onColumnLoadMore(index, column)}
              />
            </FileExplorerRowContextMenuProvider>
          )}

          {/* Drag drop upload CTA for when column is empty */}
          {!(snap.isSearching && itemSearchString.length > 0) &&
            column.items.length === 0 &&
            column.status !== STORAGE_ROW_STATUS.LOADING && (
              <div className="h-full w-full flex flex-col items-center justify-center">
                <img
                  alt="storage-placeholder"
                  src={`${BASE_PATH}/img/storage-placeholder.svg`}
                  className="opacity-75 pointer-events-none"
                />
                <p className="text-sm my-3 opacity-75">Drop your files here</p>
                <p className="w-40 text-center text-xs text-foreground-light">
                  Or upload them via the "Upload file" button above
                </p>
              </div>
            )}

          {snap.isSearching &&
            itemSearchString.length > 0 &&
            isEmpty &&
            column.status !== STORAGE_ROW_STATUS.LOADING && (
              <div className="h-full w-full flex flex-col items-center justify-center">
                <p className="text-sm my-3 text-foreground">No results found in this folder</p>
                <p className="w-40 text-center text-sm text-foreground-light">
                  Your search for "{itemSearchString}" did not return any results
                </p>
              </div>
            )}

          {/* Drag drop upload CTA for when column has files */}
          <DragOverOverlay
            isOpen={isDraggedOver}
            folderIsEmpty={isEmpty}
            onDragLeave={() => setIsDraggedOver(false)}
            onDrop={() => setIsDraggedOver(false)}
          />

          {/* List interface footer */}
          {view === STORAGE_VIEWS.LIST && (
            <div className="shrink-0 rounded-b-md z-10 flex min-w-min items-center bg-panel-footer-light px-2.5 py-2 in-data-[theme*=dark]:bg-panel-footer-dark w-full">
              <p className="text-sm">
                {formatBytes(columnItemsSize)} for {columnItems.length} items
              </p>
            </div>
          )}
        </div>
      </ContextMenuTrigger_Shadcn_>
      <ContextMenuContent_Shadcn_>
        {canUpdateStorage && (
          <>
            <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onSelectCreateFolder}>
              <FolderPlus size={14} />
              <span className="text-xs">New folder</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuSeparator_Shadcn_ />
          </>
        )}
        <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onSelectAllItems}>
          <Copy size={14} />
          <span className="text-xs">Select all items</span>
        </ContextMenuItem_Shadcn_>
        <ContextMenuSub_Shadcn_>
          <ContextMenuSubTrigger_Shadcn_ className="gap-x-2">
            <Eye size={14} />
            <span className="text-xs">View</span>
          </ContextMenuSubTrigger_Shadcn_>
          <ContextMenuSubContent_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setView(STORAGE_VIEWS.COLUMNS)}>
              <span className="text-xs">As columns</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setView(STORAGE_VIEWS.LIST)}>
              <span className="text-xs">As list</span>
            </ContextMenuItem_Shadcn_>
          </ContextMenuSubContent_Shadcn_>
        </ContextMenuSub_Shadcn_>
        <ContextMenuSub_Shadcn_>
          <ContextMenuSubTrigger_Shadcn_ className="gap-x-2">
            <ChevronsDown size={14} />
            <span className="text-xs">Sort by</span>
          </ContextMenuSubTrigger_Shadcn_>
          <ContextMenuSubContent_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortBy(STORAGE_SORT_BY.NAME)}>
              <span className="text-xs">Name</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortBy(STORAGE_SORT_BY.CREATED_AT)}>
              <span className="text-xs">Last created</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortBy(STORAGE_SORT_BY.UPDATED_AT)}>
              <span className="text-xs">Last modified</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortBy(STORAGE_SORT_BY.LAST_ACCESSED_AT)}>
              <span className="text-xs">Last accessed</span>
            </ContextMenuItem_Shadcn_>
          </ContextMenuSubContent_Shadcn_>
        </ContextMenuSub_Shadcn_>
        <ContextMenuSub_Shadcn_>
          <ContextMenuSubTrigger_Shadcn_ className="gap-x-2">
            <ChevronsUp size={14} />
            <span className="text-xs">Sort by order</span>
          </ContextMenuSubTrigger_Shadcn_>
          <ContextMenuSubContent_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortByOrder(STORAGE_SORT_BY_ORDER.ASC)}>
              <span className="text-xs">Ascending</span>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ onSelect={() => setSortByOrder(STORAGE_SORT_BY_ORDER.DESC)}>
              <span className="text-xs">Descending</span>
            </ContextMenuItem_Shadcn_>
          </ContextMenuSubContent_Shadcn_>
        </ContextMenuSub_Shadcn_>
      </ContextMenuContent_Shadcn_>
    </ContextMenu_Shadcn_>
  )
}
