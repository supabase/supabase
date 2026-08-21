import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { compact, get, sum, uniqBy } from 'lodash'
import { Upload } from 'lucide-react'
import { DragEventHandler, useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Checkbox, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import { formatFolderItems } from '../StorageExplorer/StorageExplorer.utils'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { uploadFilesToBucket } from './BucketFilePickerDialog.utils'
import { BucketFilePickerRow } from './BucketFilePickerRow'
import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useBucketObjectsInfiniteQuery } from '@/data/storage/bucket-objects-infinite-query'
import { storageKeys } from '@/data/storage/keys'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { noop } from '@/lib/void'

const SelectAllCheckbox = ({
  columnFiles,
  selectedFilesFromColumn,
  onChange,
}: {
  columnFiles: StorageItem[]
  selectedFilesFromColumn: StorageItem[]
  onChange: () => void
}) => (
  <Checkbox
    className="-mt-0.5"
    checked={columnFiles.length !== 0 && selectedFilesFromColumn.length === columnFiles.length}
    disabled={columnFiles.length === 0}
    onChange={onChange}
  />
)

const DragOverOverlay = ({
  isOpen,
  onDragLeave,
  onDrop,
  folderIsEmpty,
}: {
  isOpen: boolean
  onDragLeave: () => void
  onDrop: () => void
  folderIsEmpty: boolean
}) => {
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
                <p className="text-center text-sm text-white mt-2 pointer-events-none">
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

export interface BucketFilePickerColumnProps {
  index: number
  fullWidth?: boolean
}

export const BucketFilePickerColumn = ({
  index,
  fullWidth = false,
}: BucketFilePickerColumnProps) => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()

  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const columnRef = useRef<HTMLDivElement | null>(null)

  const { hostEndpoint } = useProjectApiUrl({ projectRef: projectRef! })
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const {
    columns,
    itemSearchString,
    bucket,
    maxFiles,
    acceptedFileExtensions,
    pushColumnAtIndex,
    selectedItems,
    setSelectedItems,
    clearSelectedItems,
    selectedFilePreview,
    setSelectedFilePreview,
    popColumnAtIndex,
  } = useBucketFilePickerStateSnapshot()

  const isFileAccepted = (fileName: string) => {
    if (!acceptedFileExtensions || acceptedFileExtensions.length === 0) return true
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    return acceptedFileExtensions.map((e) => e.replace(/^\./, '').toLowerCase()).includes(ext)
  }

  const path = columns.slice(0, index).join('/')
  const selectedFolder = columns[index]
  const setSelectedFolder = (folderName: string | null) => {
    if (folderName) {
      pushColumnAtIndex(folderName, index)
    }
  }
  const isLastFolder = index === columns.length

  const { view, sortBy, sortByOrder } = useStoragePreference(projectRef!)

  const debouncedSearchString = useDebounce(itemSearchString, 500)
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useBucketObjectsInfiniteQuery(
    {
      projectRef,
      bucketId: bucket.id,
      path,
      options: {
        sortBy: {
          column: sortBy,
          order: sortByOrder,
        },
        // When a user tries to search, only search in the last opened folder (rightmost column)
        ...(isLastFolder && debouncedSearchString ? { search: debouncedSearchString } : {}),
      },
    }
  )

  const items = useMemo(() => {
    const objs = data?.pages.flatMap((page) => page) || []
    return formatFolderItems(objs)
  }, [data])

  const haveSelectedItems = selectedItems.length > 0
  const columnItemsId = items.map((item) => item.id)
  const columnFiles = items.filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
  const selectedItemsFromColumn = selectedItems.filter((item) => columnItemsId.includes(item.id))
  const selectedFilesFromColumn = selectedItemsFromColumn.filter(
    (item) => item.type === STORAGE_ROW_TYPES.FILE
  )

  const columnItems = items.map((item) => ({ ...item, columnIndex: index }))
  const columnItemsSize = sum(columnItems.map((item) => get(item, ['metadata', 'size'], 0)))

  const isEmpty = items.filter((item) => item.status !== STORAGE_ROW_STATUS.LOADING).length === 0

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
      hideCheckbox: maxFiles === 1,
    }),
    [view, index, selectedItems, maxFiles]
  )

  const onSelectAllItemsInColumn = () => {
    const columnFiles = columnItems.filter((item) => item.type === STORAGE_ROW_TYPES.FILE)

    const columnFilesId = compact(columnFiles.map((item) => item.id))
    const selectedItemsFromColumn = selectedItems.filter(
      (item) => item.id && columnFilesId.includes(item.id)
    )

    if (selectedItemsFromColumn.length === columnFiles.length) {
      // Deselect all items from column
      const updatedSelectedItems = selectedItems.filter(
        (item) => item.id && !columnFilesId.includes(item.id)
      )
      setSelectedItems(updatedSelectedItems)
    } else {
      // Select all items from column
      const updatedSelectedItems = uniqBy(selectedItems.concat(columnFiles), 'id')
      setSelectedItems(updatedSelectedItems)
    }
  }

  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    setSelectedFilePreview(undefined)
    clearSelectedItems()
  }

  const onDragOver: DragEventHandler<HTMLDivElement> = (event) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      }
    }
  }

  const onDrop: DragEventHandler<HTMLDivElement> = async (event) => {
    onDragOver(event)

    if (!canUpdateStorage) {
      toast('You need additional permissions to upload files to this project')
      return
    }
    if (!hostEndpoint) {
      toast.error('Unable to upload files at this time. Please try again.')
      return
    }

    const files = Array.from(event.dataTransfer?.files ?? []) as File[]
    await uploadFilesToBucket({
      files,
      projectRef: projectRef!,
      hostEndpoint: hostEndpoint,
      bucketName: bucket.name,
      bucketId: bucket.id,
      currentPath: columns.slice(0, index).join('/'),
      queryClient,
    })

    queryClient.invalidateQueries({
      queryKey: storageKeys.objects(projectRef!, bucket.id, columns.slice(0, index).join('/')),
    })

    setIsDraggedOver(false)
  }

  return (
    <>
      <div
        ref={columnRef}
        className={cn(
          fullWidth ? 'w-full' : 'w-64 border-r border-overlay',
          view === STORAGE_VIEWS.LIST && 'h-full',
          'hide-scrollbar relative flex shrink-0 flex-col overflow-auto'
        )}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={(event) => {
          const eventTarget = get(event.target, ['className'], '')
          if (typeof eventTarget === 'string' && eventTarget.includes('react-contexify')) return
          onSelectColumnEmptySpace(index)
        }}
      >
        {/* Checkbox selection for select all */}
        {view === STORAGE_VIEWS.COLUMNS && maxFiles !== 1 && (
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
                <SelectAllCheckbox
                  columnFiles={columnFiles}
                  selectedFilesFromColumn={selectedFilesFromColumn}
                  onChange={() => onSelectAllItemsInColumn()}
                />
                <p className="text-sm text-foreground-light">
                  Select all {columnFiles.length} files
                </p>
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
              {maxFiles !== 1 && (
                <SelectAllCheckbox
                  columnFiles={columnFiles}
                  selectedFilesFromColumn={selectedFilesFromColumn}
                  onChange={() => onSelectAllItemsInColumn()}
                />
              )}
              <p className="text-sm">Name</p>
            </div>
            <p className="w-[11%] min-w-[100px] text-sm">Size</p>
            <p className="w-[14%] min-w-[100px] text-sm">Type</p>
            <p className="w-[15%] min-w-[160px] text-sm">Created at</p>
            <p className="w-[15%] min-w-[160px] text-sm">Last modified at</p>
          </div>
        )}

        {/* Shimmering loaders while fetching contents */}
        {isLoading && (
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
          <InfiniteListDefault
            className="h-full"
            items={columnItems}
            itemProps={itemProps}
            getItemKey={getItemKey}
            getItemSize={(index) => (index !== 0 && index === columnItems.length ? 85 : 37)}
            // eslint-disable-next-line react/no-unstable-nested-components
            ItemComponent={(props) => {
              const item = props.item
              const isPreviewed = !!(
                selectedFilePreview?.id !== null && selectedFilePreview?.id === item.id
              )
              const isOpened =
                selectedFolder !== null &&
                item.type === STORAGE_ROW_TYPES.FOLDER &&
                selectedFolder === item.name

              return (
                <BucketFilePickerRow
                  {...props}
                  onCheck={noop}
                  isPreviewed={isPreviewed}
                  isOpened={isOpened}
                  isSelected={!!props.selectedItems.find((i) => i.id === item.id)}
                  hideCheckbox={maxFiles === 1}
                  isDisabled={
                    item.type === STORAGE_ROW_TYPES.FILE && !isFileAccepted(item.name ?? '')
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
                      if (item.type === STORAGE_ROW_TYPES.FOLDER) {
                        setSelectedFilePreview(undefined)
                        setSelectedFolder(item.name)
                      } else {
                        setSelectedFilePreview(item)
                        // deselect all folders when previewing a file
                        popColumnAtIndex(index)
                        clearSelectedItems()
                      }
                    }
                  }}
                />
              )
            }}
            LoaderComponent={LoaderForIconMenuItems}
            hasNextPage={hasNextPage}
            isLoadingNextPage={isFetching}
            onLoadNextPage={fetchNextPage}
          />
        )}

        {debouncedSearchString.length > 0 && isEmpty && !isLoading && (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <p className="text-sm my-3 text-foreground">No results found in this folder</p>
            <p className="w-40 text-center text-sm text-foreground-light">
              Your search for "{debouncedSearchString}" did not return any results
            </p>
          </div>
        )}

        {debouncedSearchString.length === 0 && isEmpty && !isLoading && (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <p className="text-sm my-3 opacity-75">Drop your files here</p>
            <p className="w-40 text-center text-xs text-foreground-light">
              Or upload them via the "Upload files" button above
            </p>
          </div>
        )}

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
      {selectedFolder ? (
        <BucketFilePickerColumn key={`column-${index + 1}`} index={index + 1} />
      ) : null}
    </>
  )
}
