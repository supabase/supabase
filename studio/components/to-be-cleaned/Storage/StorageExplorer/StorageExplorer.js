import { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { compact, isEmpty, uniqBy, get } from 'lodash'

import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { STORAGE_ROW_TYPES } from '../Storage.constants'

import FileExplorer from './FileExplorer'
import FileExplorerHeader from './FileExplorerHeader'
import FileExplorerHeaderSelection from './FileExplorerHeaderSelection'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import MoveItemsModal from './MoveItemsModal'
import PreviewPane from './PreviewPane'
import CustomExpiryModal from './CustomExpiryModal'

const StorageExplorer = observer(({ bucket }) => {
  const storageExplorerStore = useStorageStore()
  const {
    columns,
    selectedFilePreview,
    closeFilePreview,
    selectedItems,
    setSelectedItems,
    clearSelectedItems,
    selectedItemsToDelete,
    clearSelectedItemsToDelete,
    openedFolders,
    popColumnAtIndex,
    popOpenedFoldersAtIndex,
    selectedItemsToMove,
    clearSelectedItemsToMove,
    view,
    setView,
    setSortBy,
    setSortByOrder,
    currentBucketName,
    openBucket,

    loadExplorerPreferences,
    addNewFolderPlaceholder,
    fetchFolderContents,
    fetchMoreFolderContents,
    deleteFolder,
    uploadFiles,
    deleteFiles,
    moveFiles,
  } = storageExplorerStore

  const storageExplorerRef = useRef(null)

  // This state exists outside of the header because FileExplorerColumn needs to listen to these as well
  // I'm keeping them outside of the mobx store as I feel that the store should contain persistent data
  // Things like showing results from a search filter is "temporary", hence we use react state to manage
  const [itemSearchString, setItemSearchString] = useState('')

  // Requires a fixed height to ensure that explorer is constrained to the viewport
  const fileExplorerHeight = window.innerHeight - 122

  useEffect(async () => {
    const currentFolderIdx = openedFolders.length - 1
    const currentFolder = openedFolders[currentFolderIdx]

    if (itemSearchString) {
      if (!currentFolder) {
        // At root of bucket
        await fetchFolderContents(bucket.id, bucket.name, -1, itemSearchString)
      } else {
        await fetchFolderContents(
          currentFolder.id,
          currentFolder.name,
          currentFolderIdx,
          itemSearchString
        )
      }
    } else {
      if (!currentFolder) {
        // At root of bucket
        await fetchFolderContents(bucket.id, bucket.name, -1)
      } else {
        await fetchFolderContents(currentFolder.id, currentFolder.name, currentFolderIdx)
      }
    }
  }, [itemSearchString])

  useEffect(() => {
    // Load user preferences (view and sort)
    loadExplorerPreferences()
  }, [])

  useEffect(() => {
    openBucket(bucket)
  }, [bucket])

  /** Checkbox selection methods */
  /** [Joshen] We'll only support checkbox selection for files ONLY */

  const onSelectAllItemsInColumn = (columnIndex) => {
    const columnFiles = columns[columnIndex].items
      .filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item) => {
        return { ...item, columnIndex }
      })
    const columnFilesId = compact(columnFiles.map((item) => item.id))
    const selectedItemsFromColumn = selectedItems.filter((item) => columnFilesId.includes(item.id))

    if (selectedItemsFromColumn.length === columnFiles.length) {
      // Deselect all items from column
      const updatedSelectedItems = selectedItems.filter((item) => !columnFilesId.includes(item.id))
      setSelectedItems(updatedSelectedItems)
    } else {
      // Select all items from column
      const updatedSelectedItems = uniqBy(selectedItems.concat(columnFiles), 'id')
      setSelectedItems(updatedSelectedItems)
    }
  }

  /** File manipulation methods */

  const onSelectCreateFolder = (columnIndex = -1) => {
    addNewFolderPlaceholder(columnIndex)
  }

  const onFilesUpload = async (event, columnIndex = -1) => {
    event.persist()
    const items = event.target.files || event.dataTransfer.items
    const isDrop = !isEmpty(get(event, ['dataTransfer', 'items'], []))
    await uploadFiles(items, columnIndex, isDrop)
    event.target.value = ''
  }

  const onMoveSelectedFiles = async (newPath) => {
    await moveFiles(newPath)
  }

  const onDeleteSelectedFiles = async () => {
    if (selectedItemsToDelete.length === 1) {
      const [itemToDelete] = selectedItemsToDelete
      if (!itemToDelete) return

      switch (itemToDelete.type) {
        case STORAGE_ROW_TYPES.FOLDER:
          await deleteFolder(itemToDelete)
          break
        case STORAGE_ROW_TYPES.FILE:
          await deleteFiles([itemToDelete])
          break
      }
    } else {
      await deleteFiles(selectedItemsToDelete)
    }
  }

  /** Misc UI methods */
  const onSelectColumnEmptySpace = (columnIndex) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    closeFilePreview()
    clearSelectedItems()
  }

  const onChangeView = (view) => setView(view)

  const onChangeSortBy = (sortBy) => setSortBy(sortBy)

  const onChangeSortByOrder = (sortByOrder) => setSortByOrder(sortByOrder)

  return (
    <div
      ref={storageExplorerRef}
      className="
        bg-bg-primary-light dark:bg-bg-primary-dark
        border-panel-border-light dark:border-panel-border-dark flex
        h-full w-full flex-col rounded-md border"
    >
      {selectedItems.length === 0 ? (
        <FileExplorerHeader
          itemSearchString={itemSearchString}
          setItemSearchString={setItemSearchString}
          onFilesUpload={onFilesUpload}
        />
      ) : (
        <FileExplorerHeaderSelection />
      )}
      <div className="flex h-full" style={{ height: fileExplorerHeight }}>
        <FileExplorer
          view={view}
          columns={columns}
          openedFolders={openedFolders}
          selectedItems={selectedItems}
          selectedFilePreview={selectedFilePreview}
          onFilesUpload={onFilesUpload}
          onSelectAllItemsInColumn={onSelectAllItemsInColumn}
          onSelectColumnEmptySpace={onSelectColumnEmptySpace}
          onSelectCreateFolder={onSelectCreateFolder}
          onChangeView={onChangeView}
          onChangeSortBy={onChangeSortBy}
          onChangeSortByOrder={onChangeSortByOrder}
          onColumnLoadMore={(index, column) =>
            fetchMoreFolderContents(index, column, itemSearchString)
          }
        />
        <PreviewPane />
      </div>
      <ConfirmDeleteModal
        visible={selectedItemsToDelete.length > 0}
        selectedItemsToDelete={selectedItemsToDelete}
        onSelectCancel={clearSelectedItemsToDelete}
        onSelectDelete={onDeleteSelectedFiles}
      />
      <MoveItemsModal
        bucketName={currentBucketName}
        visible={selectedItemsToMove.length > 0}
        selectedItemsToMove={selectedItemsToMove}
        onSelectCancel={clearSelectedItemsToMove}
        onSelectMove={onMoveSelectedFiles}
      />
      <CustomExpiryModal />
    </div>
  )
})

export default StorageExplorer
