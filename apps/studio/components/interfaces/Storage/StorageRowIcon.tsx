import { FilesBucket as FilesBucketIcon } from 'icons'
import {
  FileIcon,
  FilmIcon,
  FolderOpenIcon,
  ImageIcon,
  LoaderCircleIcon,
  MusicIcon,
} from 'lucide-react'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from './Storage.constants'

export const ICON_STROKE_WIDTH = 1.5

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
      <LoaderCircleIcon
        size={14}
        strokeWidth={ICON_STROKE_WIDTH}
        className="animate-spin text-foreground-lighter"
      />
    )
  }

  if (fileType === STORAGE_ROW_TYPES.FOLDER) {
    return isOpened ? (
      <FolderOpenIcon
        size={16}
        strokeWidth={ICON_STROKE_WIDTH}
        className="text-foreground-lighter"
      />
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
    return (
      <MusicIcon size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
    )
  }

  if (mimeType?.includes('video')) {
    return (
      <FilmIcon size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
    )
  }

  return <FileIcon size={16} strokeWidth={ICON_STROKE_WIDTH} className="text-foreground-lighter" />
}
