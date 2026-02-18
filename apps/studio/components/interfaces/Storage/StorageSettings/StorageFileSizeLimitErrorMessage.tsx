import { InlineLink } from 'components/ui/InlineLink'
import { LARGEST_SIZE_LIMIT_BUCKETS_COUNT } from 'data/storage/storage.sql'
import Link from 'next/link'
import { type FieldError } from 'react-hook-form'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  decodeBucketLimitErrorMessage,
  formatBytesForDisplay,
  isBucketLimitErrorMessage,
} from './StorageSettings.utils'

interface StorageFileSizeLimitErrorMessageProps {
  error?: FieldError
  projectRef?: string
}

export const StorageFileSizeLimitErrorMessage = ({
  error,
  projectRef,
}: StorageFileSizeLimitErrorMessageProps) => {
  if (!error?.message) return null

  const isBucketLimitError = isBucketLimitErrorMessage(error.message)
  if (!isBucketLimitError) return <>{error.message}</>

  const bucketLimitErrorBuckets = decodeBucketLimitErrorMessage(error.message)
  if (bucketLimitErrorBuckets.length === 0) return null

  const hasUnfetchedBuckets = bucketLimitErrorBuckets.length > LARGEST_SIZE_LIMIT_BUCKETS_COUNT

  const [primaryBucket, ...remainingBuckets] = bucketLimitErrorBuckets
  const otherBuckets = remainingBuckets.slice(0, LARGEST_SIZE_LIMIT_BUCKETS_COUNT - 1)

  const primaryBucketLimit = formatBytesForDisplay(primaryBucket.limit)

  const primaryBucketLink =
    projectRef !== undefined ? (
      <InlineLink
        href={`/project/${projectRef}/storage/files/buckets/${primaryBucket.name}?edit=true`}
        className={cn(
          'text-destructive decoration-destructive-500',
          'hover:text-destructive hover:decoration-destructive transition'
        )}
      >
        {primaryBucket.name}
      </InlineLink>
    ) : (
      <span className="text-destructive">{primaryBucket.name}</span>
    )

  const showOtherCount = otherBuckets.length > 0 && !hasUnfetchedBuckets

  return (
    <>
      <p>Global limit must be greater than that of individual buckets.</p>
      <p>
        Remove or decrease the limit on {primaryBucketLink} ({primaryBucketLimit})
        {otherBuckets.length > 0 && (
          <>
            {' '}
            and{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'underline underline-offset-2',
                    'decoration-dotted decoration-destructive-500',
                    'hover:decoration-destructive transition',
                    'cursor-default'
                  )}
                >
                  {showOtherCount && `+${otherBuckets.length} `}other bucket
                  {otherBuckets.length > 1 ? 's' : ''}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <ul>
                  {otherBuckets.map(({ name, limit }) => {
                    const formattedLimit = formatBytesForDisplay(limit)
                    return (
                      <li key={name} className="hover:underline underline-offset-2">
                        {projectRef !== undefined ? (
                          <Link
                            href={`/project/${projectRef}/storage/files/buckets/${name}?edit=true`}
                          >
                            {name} ({formattedLimit})
                          </Link>
                        ) : (
                          <span>
                            {name} ({formattedLimit})
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {hasUnfetchedBuckets && <p>...and others</p>}
              </TooltipContent>
            </Tooltip>{' '}
            first
          </>
        )}
        .
      </p>
    </>
  )
}
