import { copyToClipboard } from 'lib/helpers'
import { toast } from 'sonner'
import { StorageItem, StorageItemWithColumn } from '../Storage.types'

export const copyPathToFolder = (openedFolders: StorageItem[], item: StorageItemWithColumn) => {
  const folders = openedFolders.slice(0, item.columnIndex).map((folder) => folder.name)
  const path = folders.length > 0 ? `${folders.join('/')}/${item.name}` : item.name
  copyToClipboard(path)
  toast.success(`Copied path to folder "${item.name}"`)
}
