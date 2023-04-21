import { has } from 'lodash'
import { useState, useEffect, useRef } from 'react'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { RowIcon } from './FileExplorerRow'

export interface FileExplorerRowEditingProps {
  item: any
  view: string
  columnIndex: number
}

const FileExplorerRowEditing = ({ item, view, columnIndex }: FileExplorerRowEditingProps) => {
  const storageExplorerStore = useStorageStore()
  const { renameFile, renameFolder, addNewFolder } = storageExplorerStore

  const inputRef = useRef<any>(null)
  const [itemName, setItemName] = useState(item.name)

  const onSetItemName = async (event: any) => {
    event.preventDefault()
    event.stopPropagation()
    if (item.type === STORAGE_ROW_TYPES.FILE) {
      await renameFile(item, itemName, columnIndex)
    } else if (has(item, 'id')) {
      const itemWithColumnIndex = { ...item, columnIndex }
      renameFolder(itemWithColumnIndex, itemName, columnIndex)
    } else {
      addNewFolder(itemName, columnIndex)
    }
  }

  useEffect(() => {
    if (inputRef.current) inputRef.current.select()
  }, [])

  return (
    <div className="storage-row flex items-center justify-between rounded bg-gray-500">
      <div className="flex h-full flex-grow items-center px-2.5">
        <div className="">
          <RowIcon
            view={view}
            status={item.status}
            fileType={item.type}
            mimeType={item.metadata?.mimetype}
          />
        </div>
        <form className="h-9" onSubmit={onSetItemName}>
          <input
            autoFocus
            ref={inputRef}
            className="storage-row-input ml-3 h-full bg-inherit p-0 px-1 text-sm"
            type="text"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            onBlur={onSetItemName}
          />
          <button className="hidden" type="submit" onClick={onSetItemName} />
        </form>
      </div>
    </div>
  )
}

export default FileExplorerRowEditing
