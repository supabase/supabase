import { Archive, File, Film, Image as ImageIcon, Music, RotateCcw } from 'lucide-react'
import { cn } from 'ui'

import { useFetchFileUrlQuery } from './useFetchFileUrlQuery'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

// The box is 28px, so the whole object is downloaded to draw almost nothing.
const THUMBNAIL_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB

const MimeTypeIcon = ({ mimeType, size }: { mimeType?: string; size: number }) => {
  if (mimeType?.includes('image')) {
    return <ImageIcon size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('audio')) {
    return <Music size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('video')) {
    return <Film size={size} className="text-foreground-lighter" />
  }
  return <File size={size} className="text-foreground-lighter" />
}

/** Falls back to the generic icon while the URL is in flight or if it fails. */
const ThumbnailImage = ({
  path,
  versionId,
  mimeType,
  size,
}: {
  path: string
  versionId?: string
  mimeType?: string
  size: number
}) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()

  const { data: url } = useFetchFileUrlQuery(
    { path, projectRef, bucket: selectedBucket, versionId },
    { enabled: !!projectRef && !!selectedBucket }
  )

  if (!url) return <MimeTypeIcon mimeType={mimeType} size={size} />

  return (
    <span
      role="presentation"
      className="h-full w-full rounded-[5px] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${url}')` }}
    />
  )
}

interface VersionThumbnailProps {
  mimeType?: string
  isCurrent: boolean
  isDeleteMarker?: boolean
  size?: number
  /** Full path within the bucket. Given one, an image renders its own bytes. */
  path?: string
  /** Omit to render the object's current version. */
  versionId?: string
  /** Bytes, used to skip the fetch for a file too large to thumbnail. */
  byteSize?: number
}

export const VersionThumbnail = ({
  mimeType,
  isCurrent,
  isDeleteMarker = false,
  size = 14,
  path,
  versionId,
  byteSize,
}: VersionThumbnailProps) => {
  const isImage = !!mimeType?.includes('image')
  const canShowImage =
    isImage && !isDeleteMarker && !!path && (byteSize ?? Infinity) <= THUMBNAIL_SIZE_LIMIT

  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border',
        isCurrent && 'border-brand-400 bg-surface-200',
        !isCurrent && isDeleteMarker && 'border-strong border-dashed bg-surface-100',
        !isCurrent && !isDeleteMarker && 'border-overlay bg-surface-100'
      )}
    >
      {canShowImage && (
        <ThumbnailImage path={path} versionId={versionId} mimeType={mimeType} size={size} />
      )}
      {!canShowImage && isCurrent && <RotateCcw size={size} className="text-brand" />}
      {!canShowImage && !isCurrent && isDeleteMarker && (
        <Archive size={size} className="text-foreground-muted" />
      )}
      {!canShowImage && !isCurrent && !isDeleteMarker && (
        <MimeTypeIcon mimeType={mimeType} size={size} />
      )}
    </span>
  )
}
