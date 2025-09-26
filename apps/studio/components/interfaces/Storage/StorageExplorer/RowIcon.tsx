import { File, Film, Image, Loader, Music } from 'lucide-react'
import SVG from 'react-inlinesvg'

import { BASE_PATH } from 'lib/constants'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'

export const RowIcon = ({
  view,
  status,
  fileType,
  mimeType,
}: {
  view: STORAGE_VIEWS
  status: STORAGE_ROW_STATUS
  fileType: string
  mimeType: string | undefined
}) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return <Loader size={16} strokeWidth={2} className="animate-spin" />
  }

  if (fileType === STORAGE_ROW_TYPES.BUCKET || fileType === STORAGE_ROW_TYPES.FOLDER) {
    const iconSrc =
      fileType === STORAGE_ROW_TYPES.BUCKET
        ? `${BASE_PATH}/img/bucket-filled.svg`
        : fileType === STORAGE_ROW_TYPES.FOLDER
          ? `${BASE_PATH}/img/folder-filled.svg`
          : `${BASE_PATH}/img/file-filled.svg`
    return (
      <SVG
        src={iconSrc}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="w-4 h-4 text-color-inherit opacity-75"')
        }
      />
    )
  }

  if (mimeType?.includes('image')) {
    return <Image size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('audio')) {
    return <Music size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('video')) {
    return <Film size={16} strokeWidth={2} />
  }

  return <File size={16} strokeWidth={2} />
}
