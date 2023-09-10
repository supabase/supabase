import { useParams } from 'common'
import { compact, get, isEmpty, uniqBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'

import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { Bucket } from 'data/storage/buckets-query'
import { useStore } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID, IS_PLATFORM } from 'lib/constants'
import { copyToClipboard } from 'lib/helpers'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { STORAGE_ROW_TYPES } from '../Storage.constants'
import ConfirmDeleteModal from './ConfirmDeleteModal'
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
    currentBucketName,
    openBucket,

    loadExplorerPreferences,
    fetchFolderContents,
    fetchMoreFolderContents,
    deleteFolder,
    uploadFiles,
    deleteFiles,
    moveFiles,
  } = storageExplorerStore

  const storageExplorerRef = useRef(null)

  const { ui } = useStore()
  const { ref } = useParams()
  const { data: customDomainData } = useCustomDomainsQuery(
    { projectRef: ref },
    { enabled: IS_PLATFORM }
  )
  const { data: projectSettings } = useProjectSettingsQuery({ projectRef: ref })
  const apiService = (projectSettings?.services ?? []).find(
    (x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
  const apiConfig = apiService?.app_config
  const apiUrl = `${apiConfig?.protocol ?? 'https'}://${apiConfig?.endpoint ?? '-'}`

  // This state exists outside of the header because FileExplorerColumn needs to listen to these as well
  // I'm keeping them outside of the mobx store as I feel that the store should contain persistent data
  // Things like showing results from a search filter is "temporary", hence we use react state to manage
  const [itemSearchString, setItemSearchString] = useState('')

  // Requires a fixed height to ensure that explorer is constrained to the viewport
  const fileExplorerHeight = window.innerHeight - 122

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchContents = async () => {
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
    }

    fetchContents()
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

  const onSelectAllItemsInColumn = (columnIndex: number) => {
    const columnFiles = columns[columnIndex].items
      .filter((item: any) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item: any) => {
        return { ...item, columnIndex }
      })
    const columnFilesId = compact(columnFiles.map((item: any) => item.id))
    const selectedItemsFromColumn = selectedItems.filter((item: any) =>
      columnFilesId.includes(item.id)
    )

    if (selectedItemsFromColumn.length === columnFiles.length) {
      // Deselect all items from column
      const updatedSelectedItems = selectedItems.filter(
        (item: any) => !columnFilesId.includes(item.id)
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
    await uploadFiles(items, columnIndex, isDrop)
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
          await deleteFiles([itemToDelete])
          break
      }
    } else {
      await deleteFiles(selectedItemsToDelete)
    }
  }

  /** Misc UI methods */
  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    closeFilePreview()
    clearSelectedItems()
  }

  const onCopyUrl = (name: string, url: string) => {
    const formattedUrl =
      customDomainData?.customDomain?.status === 'active'
        ? url.replace(apiUrl, `https://${customDomainData.customDomain.hostname}`)
        : url
    copyToClipboard(formattedUrl, () => {
      ui.setNotification({
        category: 'success',
        message: `Copied URL for ${name} to clipboard.`,
        duration: 4000,
      })
    })
  }

  return (
    <div
      ref={storageExplorerRef}
      className="
        bg-scale-200
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
          onColumnLoadMore={(index, column) =>
            fetchMoreFolderContents(index, column, itemSearchString)
          }
          onCopyUrl={onCopyUrl}
        />
        <PreviewPane onCopyUrl={onCopyUrl} />
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
      <CustomExpiryModal onCopyUrl={onCopyUrl} />
    </div>
  )
}

StorageExplorer.displayName = 'StorageExplorer'
export default observer(StorageExplorer)
