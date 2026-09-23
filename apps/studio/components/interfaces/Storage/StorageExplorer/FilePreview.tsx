import { LoaderCircle } from 'lucide-react'
import SVG from 'react-inlinesvg'

import { useFetchFileUrlQuery } from './useFetchFileUrlQuery'
import { BASE_PATH } from '@/lib/constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const PREVIEW_SIZE_LIMIT = 10 * 1024 * 1024 // 10MB

const FileIcon = ({ className }: { className?: string }) => (
  <SVG
    src={`${BASE_PATH}/img/file-filled.svg`}
    preProcessor={(code) =>
      code.replace(
        /svg/,
        `svg class="${className ?? 'mx-auto w-32 h-32 text-color-inherit opacity-75'}"`
      )
    }
  />
)

interface FilePreviewProps {
  path: string
  mimeType?: string
  /** Bytes. Anything over the limit renders a placeholder instead. */
  size?: number
  /** Renders that version's bytes. Without it, the current ones. */
  versionId?: string
}

export const FilePreview = ({ path, mimeType, size, versionId }: FilePreviewProps) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()

  // An unknown size counts as too large, matching the pre-versioning behavior.
  const effectiveSize = size ?? PREVIEW_SIZE_LIMIT + 1
  const isSkipped = !!mimeType && effectiveSize > PREVIEW_SIZE_LIMIT

  const { data: previewUrl, isPending } = useFetchFileUrlQuery(
    { path, projectRef, bucket: selectedBucket, versionId },
    { enabled: !isSkipped && !!projectRef && !!selectedBucket }
  )

  if (isSkipped) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <FileIcon />
        <p className="mt-2 w-2/5 text-center text-sm">
          File size is too large to preview in the explorer
        </p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center text-foreground-lighter">
        <LoaderCircle size={14} className="animate-spin text-foreground-lighter" />
      </div>
    )
  }

  if (!mimeType || !previewUrl) return <FileIcon />

  if (mimeType.includes('image')) {
    return (
      <div
        className="h-full w-full bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${previewUrl}')` }}
      />
    )
  }
  if (mimeType.includes('audio')) {
    return (
      <div className="flex h-full w-full items-center justify-center px-10">
        <audio key={previewUrl} controls style={{ width: 'inherit' }}>
          <source src={previewUrl} type="audio/mpeg" />
          <p className="text-sm text-foreground-light">
            Your browser does not support the audio element.
          </p>
        </audio>
      </div>
    )
  }
  if (mimeType.includes('video')) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <video key={previewUrl} controls style={{ maxHeight: '100%' }}>
          <source src={previewUrl} type="video/mp4" />
          <p className="text-sm text-foreground-light">
            Your browser does not support the video tag.
          </p>
        </video>
      </div>
    )
  }
  return <FileIcon />
}
