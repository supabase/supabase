import { compact, get, isEmpty, uniqBy } from 'lodash'
import { useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import type { Bucket } from 'data/storage/buckets-query'
import { IS_PLATFORM } from 'lib/constants'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import CustomExpiryModal from './CustomExpiryModal'
import FileExplorer from './FileExplorer'
import FileExplorerHeader from './FileExplorerHeader'
import FileExplorerHeaderSelection from './FileExplorerHeaderSelection'
import MoveItemsModal from './MoveItemsModal'
import PreviewPane from './PreviewPane'

interface StorageExplorerProps {
  bucket: Bucket
}

const StorageExplorer = ({ bucket }: StorageExplorerProps) => {
  const { ref } = useParams()
  const storageExplorerRef = useRef(null)
  const {
    view,
    columns,
    selectedItems,
    selectedItemsToDelete,
    openedFolders,
    selectedItemsToMove,
    selectedBucket,
    openBucket,
    fetchFolderContents,
    fetchMoreFolderContents,
    fetchFoldersByPath,
    deleteFolder,
    uploadFiles,
    deleteFiles,
    moveFiles,
    popColumnAtIndex,
    popOpenedFoldersAtIndex,
    setSelectedItems,
    clearSelectedItems,
    setSelectedFilePreview,
    setSelectedItemsToMove,
    setSelectedItemsToDelete,
  } = useStorageExplorerStateSnapshot()

  useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })

  // This state exists outside of the header because FileExplorerColumn needs to listen to these as well
  // Things like showing results from a search filter is "temporary", hence we use react state to manage
  const [itemSearchString, setItemSearchString] = useState('')

  // Requires a fixed height to ensure that explorer is constrained to the viewport
  const fileExplorerHeight = window.innerHeight - 122

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchContents = async () => {
      if (view === STORAGE_VIEWS.LIST) {
        const currentFolderIdx = openedFolders.length - 1
        const currentFolder = openedFolders[currentFolderIdx]

        const folderId = !currentFolder ? bucket.id : currentFolder.id
        const folderName = !currentFolder ? bucket.name : currentFolder.name
        const index = !currentFolder ? -1 : currentFolderIdx

        await fetchFolderContents({
          bucketId: bucket.id,
          folderId,
          folderName,
          index,
          searchString: itemSearchString,
        })
      } else if (view === STORAGE_VIEWS.COLUMNS) {
        if (openedFolders.length > 0) {
          const paths = openedFolders.map((folder) => folder.name)
          fetchFoldersByPath({ paths, searchString: itemSearchString, showLoading: true })
        } else {
          await fetchFolderContents({
            bucketId: bucket.id,
            folderId: bucket.id,
            folderName: bucket.name,
            index: -1,
            searchString: itemSearchString,
          })
        }
      }
    }

    fetchContents()
  }, [itemSearchString])

  useEffect(() => {
    openBucket(bucket)
  }, [bucket])

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

  const onFilesUpload = async (event: any, columnIndex = -1) => {
    event.persist()
    const items = event.target.files || event.dataTransfer.items
    const isDrop = !isEmpty(get(event, ['dataTransfer', 'items'], []))
    await uploadFiles({ files: items, columnIndex, isDrop })
    event.target.value = ''
  }

  const onMoveSelectedFiles = async (newPath: string) => {
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
          await deleteFiles({ files: [itemToDelete] })
          break
      }
    } else {
      await deleteFiles({ files: selectedItemsToDelete })
    }
  }

  /** Misc UI methods */
  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setSelectedFilePreview(undefined)
    clearSelectedItems()
  }

  return (
    <div
      ref={storageExplorerRef}
      className="bg-studio border rounded-md border-overlay flex h-full w-full flex-col m-4"
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
          columns={columns}
          openedFolders={openedFolders}
          selectedItems={selectedItems}
          itemSearchString={itemSearchString}
          onFilesUpload={onFilesUpload}
          onSelectAllItemsInColumn={onSelectAllItemsInColumn}
          onSelectColumnEmptySpace={onSelectColumnEmptySpace}
          onColumnLoadMore={(index, column) =>
            fetchMoreFolderContents({ index, column, searchString: itemSearchString })
          }
        />
        <PreviewPane />
      </div>
      <ConfirmDeleteModal
        visible={selectedItemsToDelete.length > 0}
        selectedItemsToDelete={selectedItemsToDelete}
        onSelectCancel={() => setSelectedItemsToDelete([])}
        onSelectDelete={onDeleteSelectedFiles}
      />
      <MoveItemsModal
        bucketName={selectedBucket.name}
        visible={selectedItemsToMove.length > 0}
        selectedItemsToMove={selectedItemsToMove}
        onSelectCancel={() => setSelectedItemsToMove([])}
        onSelectMove={onMoveSelectedFiles}
      />
      <CustomExpiryModal />
    </div>
  )
}

StorageExplorer.displayName = 'StorageExplorer'
export default StorageExplorer
