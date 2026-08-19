import { Archive, File, Film, Image as ImageIcon, Music, RotateCcw } from 'lucide-react'
import { cn } from 'ui'

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

interface VersionThumbnailProps {
  mimeType?: string
  isCurrent: boolean
  isDeleteMarker?: boolean
  size?: number
}

export const VersionThumbnail = ({
  mimeType,
  isCurrent,
  isDeleteMarker = false,
  size = 14,
}: VersionThumbnailProps) => (
  <span
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
      isCurrent && 'border-brand-400 bg-surface-200',
      !isCurrent && isDeleteMarker && 'border-strong border-dashed bg-surface-100',
      !isCurrent && !isDeleteMarker && 'border-overlay bg-surface-100'
    )}
  >
    {isCurrent && <RotateCcw size={size} className="text-brand" />}
    {!isCurrent && isDeleteMarker && <Archive size={size} className="text-foreground-muted" />}
    {!isCurrent && !isDeleteMarker && <MimeTypeIcon mimeType={mimeType} size={size} />}
  </span>
)
