import { FileStackIcon } from 'lucide-react'
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
    tooltip: 'Existing versions stay retained, but new writes are not versioned.',
  },
}

interface BucketVersioningPillProps {
  bucket?: Bucket
  showPrefix?: boolean
}

export const BucketVersioningPill = ({ bucket, showPrefix = true }: BucketVersioningPillProps) => {
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()
  const versioningState = getBucketVersioningState(bucket)

  if (!isStorageVersioningEnabled || versioningState === 'disabled') return null

  const { variant, state, tooltip } = COPY[versioningState]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="shrink-0">
          <Badge variant={variant}>
            <FileStackIcon size={12} aria-hidden />
            {showPrefix ? `Versioning ${state.toLowerCase()}` : state}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
