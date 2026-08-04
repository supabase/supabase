import { FilesBucket as FilesBucketIcon } from 'icons'
import { File, Film, FolderOpen, Image as ImageIcon, LoaderCircle, Music } from 'lucide-react'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from './Storage.constants'

const ICON_STROKE_WIDTH = 1.5

interface StorageRowIconProps {
  view: STORAGE_VIEWS
  status: STORAGE_ROW_STATUS
  fileType: string
  isOpened?: boolean
  mimeType: string | undefined
}

export const StorageRowIcon = ({
  view,
  status,
  fileType,
  isOpened = false,
  mimeType,
}: StorageRowIconProps) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return (
      <LoaderCircle
        size={14}
        strokeWidth={ICON_STROKE_WIDTH}
        className="animate-spin text-foreground-lighter"
      />
    )
  }

  if (fileType === STORAGE_ROW_TYPES.FOLDER) {
    return isOpened ? (
      <FolderOpen size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
    ) : (
      <FilesBucketIcon
        size={16}
        strokeWidth={ICON_STROKE_WIDTH}
        className="text-foreground-lighter"
      />
    )
  }

  if (mimeType?.includes('image')) {
    return (
      <ImageIcon size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
    )
  }

  if (mimeType?.includes('audio')) {
    return <Music size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
  }

  if (mimeType?.includes('video')) {
    return <Film size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
  }

  return <File size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
}
