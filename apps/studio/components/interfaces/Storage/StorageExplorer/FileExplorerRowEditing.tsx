import { has } from 'lodash'
import { useEffect, useRef, useState } from 'react'

import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import { RowIcon } from './FileExplorerRow'

export interface FileExplorerRowEditingProps {
  item: StorageItem
  view: STORAGE_VIEWS
  columnIndex: number
}

const FileExplorerRowEditing = ({ item, view, columnIndex }: FileExplorerRowEditingProps) => {
  const { renameFile, renameFolder, addNewFolder } = useStorageExplorerStateSnapshot()

  const inputRef = useRef<any>(null)
  const [itemName, setItemName] = useState(item.name)

  const onSaveItemName = async (name: string, event?: any) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (item.type === STORAGE_ROW_TYPES.FILE) {
      await renameFile(item, name, columnIndex)
    } else if (has(item, 'id')) {
      const itemWithColumnIndex = { ...item, columnIndex }
      renameFolder(itemWithColumnIndex, name, columnIndex)
    } else {
      addNewFolder(name, columnIndex)
    }
  }

  useEffect(() => {
    // select just the name of the file without the extension
    if (inputRef.current) {
      const dotIndex = item.name.lastIndexOf('.')
      const selectionEnd = dotIndex !== -1 ? dotIndex : item.name.length
      inputRef.current.setSelectionRange(0, selectionEnd)
      inputRef.current.focus()
    }

    // [Joshen] Esc should revert changes
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (item?.id !== undefined) onSaveItemName(item.name)
        else addNewFolder('', columnIndex)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="storage-row flex items-center justify-between rounded bg-gray-500">
      <div className="flex h-full flex-grow items-center px-2.5">
        <div>
          <RowIcon
            view={view}
            status={item.status}
            fileType={item.type}
            mimeType={item.metadata?.mimetype}
          />
        </div>
        <form className="h-9" onSubmit={(event) => onSaveItemName(itemName, event)}>
          <input
            autoFocus
            ref={inputRef}
            className="storage-row-input ml-3 h-full bg-inherit p-0 px-1 text-sm"
            type="text"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            onBlur={(event) => onSaveItemName(itemName, event)}
          />
          <button
            className="hidden"
            type="submit"
            onClick={(event) => onSaveItemName(itemName, event)}
          />
        </form>
      </div>
    </div>
  )
}

export default FileExplorerRowEditing
