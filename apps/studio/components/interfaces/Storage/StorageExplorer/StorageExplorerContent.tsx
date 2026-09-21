import { compact, get, isEmpty, uniqBy } from 'lodash'
import { useCallback } from 'react'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { CustomExpiryModal } from './CustomExpiryModal'
import { FileExplorer } from './FileExplorer'
import { FileExplorerHeader } from './FileExplorerHeader'
import { FileExplorerHeaderSelection } from './FileExplorerHeaderSelection'
import { MoveItemsModal } from './MoveItemsModal'
import { PreviewPane } from './PreviewPane'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { StorageSearchResults } from './StorageSearchResults'
import { useStorageExplorerShortcuts } from './useStorageExplorerShortcuts'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

interface StorageExplorerContentProps {
  itemSearchString: string
  /** `itemSearchString` once the typing settles — what the bucket-wide search runs on */
  debouncedSearchString: string
  setItemSearchString: (value: string) => void
  isLoading: boolean
}

export const StorageExplorerContent = ({
  itemSearchString,
  debouncedSearchString,
  setItemSearchString,
  isLoading,
}: StorageExplorerContentProps) => {
  const {
    projectRef,
    columns,
    openedFolders,
    selectedItems,
    selectedItemsToMove,
    selectedBucket,
    fetchMoreFolderContents,
    uploadFiles,
    moveFiles,
    setSelectedItems,
    setSelectedItemsToMove,
  } = useStorageExplorerStateSnapshot()
  const { truncateToColumn } = useStorageExplorerNavigation()

  const handleClearSearch = useCallback(() => {
    setItemSearchString('')
  }, [setItemSearchString])

  useStorageExplorerShortcuts({
    isSearching: itemSearchString.length > 0,
    onClearSearch: handleClearSearch,
  })

  // A bucket-wide search spans folders, so its matches replace the folder columns rather
  // than filtering them. Keyed off the raw term, not the debounced one, so typing and
  // clearing both land right away — the debounce only paces the search itself.
  const isShowingSearchResults = itemSearchString.trim().length > 0

  /** Checkbox selection methods */
  /** [Joshen] We'll only support checkbox selection for files ONLY */

  const onSelectAllItemsInColumn = (columnIndex: number) => {
    const columnFiles = columns[columnIndex].items
      .filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item) => {
        return { ...item, columnIndex }
      })
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

  /** File manipulation methods */

  const onFilesUpload = async (event: any, columnIndex: number = -1) => {
    event.persist()
    const items = event.target.files || event.dataTransfer.items
    const isDrop = !isEmpty(get(event, ['dataTransfer', 'items'], []))
    await uploadFiles({ files: items, columnIndex, isDrop })
    event.target.value = ''
  }

  const onMoveSelectedFiles = async (newPath: string) => {
    await moveFiles(newPath)
  }

  return (
    <>
      {selectedItems.length === 0 ? (
        <FileExplorerHeader
          itemSearchString={itemSearchString}
          setItemSearchString={setItemSearchString}
          onFilesUpload={onFilesUpload}
        />
      ) : (
        <FileExplorerHeaderSelection />
      )}
      <div className="flex flex-1 min-h-0">
        {isShowingSearchResults ? (
          <StorageSearchResults
            searchString={debouncedSearchString}
            onClearSearch={handleClearSearch}
          />
        ) : (
          <FileExplorer
            columns={columns}
            selectedItems={selectedItems}
            isLoading={isLoading}
            onFilesUpload={onFilesUpload}
            onSelectAllItemsInColumn={onSelectAllItemsInColumn}
            onSelectColumnEmptySpace={truncateToColumn}
            onColumnLoadMore={(index, column) => fetchMoreFolderContents({ index, column })}
          />
        )}
        <PreviewPane />
      </div>

      <ConfirmDeleteModal />

      <MoveItemsModal
        visible={selectedItemsToMove.length > 0}
        projectRef={projectRef}
        bucketId={selectedBucket.id}
        bucketName={selectedBucket.name}
        selectedItemsToMove={selectedItemsToMove}
        openedFolders={openedFolders}
        onSelectCancel={() => setSelectedItemsToMove([])}
        onSelectMove={onMoveSelectedFiles}
      />

      <CustomExpiryModal />
    </>
  )
}
