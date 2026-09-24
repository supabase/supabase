import { FileStack } from 'lucide-react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { getBucketVersioningState } from './StorageVersioning.constants'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { Bucket } from '@/data/storage/buckets-query'

const COPY = {
  enabled: {
    variant: 'success' as const,
    state: 'Enabled',
    tooltip: 'Overwriting or archiving a file keeps a recoverable copy.',
  },
  suspended: {
    variant: 'warning' as const,
    state: 'Suspended',
    tooltip: 'Existing versions stay retained, but new writes no longer create one.',
  },
}

interface BucketVersioningPillProps {
  bucket?: Bucket
  /** Drop the "Versioning" prefix where the surrounding UI already names the setting. */
  showPrefix?: boolean
}

/** Renders nothing for a never-versioned bucket, which by default is every bucket. */
export const BucketVersioningPill = ({ bucket, showPrefix = true }: BucketVersioningPillProps) => {
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()
  const versioningState = getBucketVersioningState(bucket)

  if (!isStorageVersioningEnabled || versioningState === 'disabled') return null

  const { variant, state, tooltip } = COPY[versioningState]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className="flex shrink-0 items-center gap-1">
          <FileStack size={12} aria-hidden />
          {showPrefix ? `Versioning ${state.toLowerCase()}` : state}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
