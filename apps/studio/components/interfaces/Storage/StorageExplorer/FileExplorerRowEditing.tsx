import { has } from 'lodash'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import { RowIcon } from './FileExplorerRow'

export interface FileExplorerRowEditingProps {
  item: StorageItem
  view: STORAGE_VIEWS
  columnIndex: number
  style?: CSSProperties
}

export const FileExplorerRowEditing = ({
  item,
  view,
  columnIndex,
  style,
}: FileExplorerRowEditingProps) => {
  const { renameFile, renameFolder, addNewFolder, updateRowStatus } =
    useStorageExplorerStateSnapshot()

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
      renameFolder({
        folder: itemWithColumnIndex,
        newName: name,
        columnIndex,
        onError: () => {
          if (event.type === 'blur') {
            updateRowStatus({
              name: itemWithColumnIndex.name,
              status: STORAGE_ROW_STATUS.READY,
              columnIndex,
            })
          } else {
            inputRef.current.select()
          }
        },
      })
    } else {
      addNewFolder({
        folderName: name,
        columnIndex,
        onError: () => {
          if (event.type === 'blur') {
            addNewFolder({ folderName: '', columnIndex })
          } else {
            inputRef.current.select()
          }
        },
      })
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
        else addNewFolder({ folderName: '', columnIndex })
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div
      style={style}
      className="storage-row flex items-center justify-between rounded bg-gray-500"
    >
      <div className="flex h-full flex-grow items-center px-2.5">
        <div>
          <RowIcon
            view={view}
            status={item.status}
            fileType={item.type}
            mimeType={item.metadata?.mimetype}
          />
        </div>
        <form
          className="h-9"
          onSubmit={(event) => onSaveItemName(itemName.trim() || item.name, event)}
        >
          <input
            autoFocus
            ref={inputRef}
            className="storage-row-input ml-3 h-full bg-inherit p-0 px-1 text-sm"
            type="text"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            onBlur={(event) => onSaveItemName(itemName.trim() || item.name, event)}
          />
          <button
            className="hidden"
            type="submit"
            onClick={(event) => onSaveItemName(itemName.trim() || item.name, event)}
          />
        </form>
      </div>
    </div>
  )
}
