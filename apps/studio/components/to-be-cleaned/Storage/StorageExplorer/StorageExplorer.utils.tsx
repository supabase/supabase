import { downloadBucketObject } from 'data/storage/bucket-object-download-mutation'
import { copyToClipboard } from 'lib/helpers'
import { toast } from 'sonner'
import { SONNER_DEFAULT_DURATION } from 'ui'
import { StorageItem, StorageItemWithColumn } from '../Storage.types'

export const copyPathToFolder = (openedFolders: StorageItem[], item: StorageItemWithColumn) => {
  const folders = openedFolders.slice(0, item.columnIndex).map((folder) => folder.name)
  const path = folders.length > 0 ? `${folders.join('/')}/${item.name}` : item.name
  copyToClipboard(path)
  toast.success(`Copied path to folder "${item.name}"`)
}

export const formatTime = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 3600))
  seconds %= 24 * 3600
  const hours = Math.floor(seconds / 3600)
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
  seconds = Math.floor(seconds % 60)

  if (days > 0) return `${days}d `
  if (hours > 0) return `${hours}h `
  if (minutes > 0) return `${minutes}m `
  return `${seconds}s`
}

export const downloadFile = async ({
  projectRef,
  bucketId,
  file,
  showToast = true,
  returnBlob = false,
}: {
  projectRef?: string
  bucketId?: string
  file: StorageItemWithColumn
  showToast?: boolean
  returnBlob?: boolean
}) => {
  if (!projectRef) return toast.error('Failed to download: Project ref is required')
  if (!bucketId) return toast.error('Failed to download: Bucket ID is required')
  if (!file.path) return toast.error('Failed to download: Unable to find path to file')

  const fileName: string = file.name
  const fileMimeType = file?.metadata?.mimetype ?? undefined

  const toastId = showToast ? toast.loading(`Retrieving ${fileName}...`) : undefined

  try {
    const data = await downloadBucketObject({
      projectRef,
      bucketId,
      path: file.path,
    })

    const blob = await data.blob()
    const newBlob = new Blob([blob], { type: fileMimeType })
    if (returnBlob) return { name: fileName, blob: newBlob }

    const blobUrl = window.URL.createObjectURL(newBlob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', `${fileName}`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(blob)
    if (toastId) {
      toast.success(`Downloading ${fileName}`, {
        id: toastId,
        closeButton: true,
        duration: SONNER_DEFAULT_DURATION,
      })
    }
    return true
  } catch (err) {
    if (toastId) {
      toast.error(`Failed to download ${fileName}`, {
        id: toastId,
        closeButton: true,
        duration: SONNER_DEFAULT_DURATION,
      })
    }
    return false
  }
}
