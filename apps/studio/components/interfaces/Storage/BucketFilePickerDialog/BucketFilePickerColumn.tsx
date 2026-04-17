import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { compact, find, get, sum, uniqBy } from 'lodash'
import { useCallback, useMemo } from 'react'
import { Checkbox, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import { formatFolderItems } from '../StorageExplorer/StorageExplorer.utils'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { BucketFilePickerRow } from './BucketFilePickerRow'
import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { useBucketObjectsInfiniteQuery } from '@/data/storage/bucket-objects-infinite-query'
import { formatBytes } from '@/lib/helpers'

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
    label=""
    className="-mt-0.5"
    checked={columnFiles.length !== 0 && selectedFilesFromColumn.length === columnFiles.length}
    disabled={columnFiles.length === 0}
    onChange={onChange}
  />
)

export interface BucketFilePickerColumnProps {
  index: number
  fullWidth?: boolean
}

export const BucketFilePickerColumn = ({
  index,
  fullWidth = false,
}: BucketFilePickerColumnProps) => {
  const { ref: projectRef } = useParams()

  const {
    columns,
    itemSearchString,
    bucket,
    maxFiles,
    pushColumnAtIndex,
    selectedItems,
    setSelectedItems,
    clearSelectedItems,
    selectedFilePreview,
    setSelectedFilePreview,
    popColumnAtIndex,
  } = useBucketFilePickerStateSnapshot()

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

  const onSelectAllItemsInColumn = (columnIndex: number) => {
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

  const selectRangeItems = (columnIndex: number, toItemIndex: number) => {
    const toItem = columnItems[toItemIndex]
    const selectedItemIds = selectedItems.map((item) => item.id)
    const lastSelectedItemId = selectedItemIds[selectedItemIds.length - 1]
    const lastSelectedItemIndex = columnItems.findIndex((item) => item.id === lastSelectedItemId)

    // Get the start and end index of the range to select
    const start = Math.min(toItemIndex, lastSelectedItemIndex)
    const end = Math.max(toItemIndex, lastSelectedItemIndex)

    // Get the range to select and reverse the order if necessary
    const rangeToSelect = columnItems
      .slice(start, end + 1)
      // we need `columnIndex` in all item of `selectedItems`
      .map((item) => ({ ...item, columnIndex }))
    if (toItemIndex < lastSelectedItemIndex) {
      rangeToSelect.reverse()
    }

    if (selectedItemIds.includes(toItem.id)) {
      const rangeToDeselectIds = rangeToSelect.map((item) => item.id)
      // Deselect all items within the selection range
      setSelectedItems(
        selectedItems.filter(
          (item) => item.id === toItem.id || !rangeToDeselectIds.includes(item.id)
        )
      )
    } else {
      // Select items within the range
      setSelectedItems(uniqBy(selectedItems.concat(rangeToSelect), 'id'))
    }
  }

  const onCheckItem = (itemIndex: number, item: StorageItemWithColumn, isShiftKeyHeld: boolean) => {
    // Select a range if shift is held down
    if (isShiftKeyHeld && selectedItems.length !== 0) {
      selectRangeItems(index, itemIndex)
      return
    }
    if (find(selectedItems, (selectedItem) => selectedItem.id === item.id) !== undefined) {
      setSelectedItems(selectedItems.filter((selectedItem) => item.id !== selectedItem.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
    setSelectedFilePreview(undefined)
  }

  const onSelectFile = async (item: StorageItemWithColumn) => {
    setSelectedFilePreview(item)
    setSelectedFolder(null)
    clearSelectedItems()
  }

  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    setSelectedFilePreview(undefined)
    clearSelectedItems()
  }

  return (
    <>
      <div
        className={cn(
          fullWidth ? 'w-full' : 'w-64 border-r border-overlay',
          view === STORAGE_VIEWS.LIST && 'h-full',
          'hide-scrollbar relative flex flex-shrink-0 flex-col overflow-auto'
        )}
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
              'sticky top-0 z-10 mb-0 flex items-center bg-table-header-light px-2.5 [[data-theme*=dark]_&]:bg-table-header-dark',
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
                  onChange={() => onSelectAllItemsInColumn(index)}
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
                  onChange={() => onSelectAllItemsInColumn(index)}
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
            px-2 py-1 my-1 flex flex-shrink-0 flex-col space-y-2 overflow-auto
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
                  onCheck={(isShiftKeyHeld) => onCheckItem(index, item, isShiftKeyHeld)}
                  isPreviewed={isPreviewed}
                  isOpened={isOpened}
                  isSelected={!!props.selectedItems.find((i) => i.id === item.id)}
                  hideCheckbox={maxFiles === 1}
                  onClick={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
                      item.type === STORAGE_ROW_TYPES.FOLDER
                        ? setSelectedFolder(item.path ?? null)
                        : onSelectFile(item)
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

        {/* List interface footer */}
        {view === STORAGE_VIEWS.LIST && (
          <div className="shrink-0 rounded-b-md z-10 flex min-w-min items-center bg-panel-footer-light px-2.5 py-2 [[data-theme*=dark]_&]:bg-panel-footer-dark w-full">
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
