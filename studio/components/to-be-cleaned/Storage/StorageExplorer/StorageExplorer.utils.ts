import { copyToClipboard } from 'lib/helpers'
import toast from 'react-hot-toast'

export const copyPathToFolder = (openedFolders: any[], item: any) => {
  const folders = openedFolders.slice(0, item.columnIndex).map((folder: any) => folder.name)
  const path = folders.length > 0 ? `${folders.join('/')}/${item.name}` : item.name
  copyToClipboard(path)
  toast.success(`Copied path to folder "${item.name}"`)
}
