import dayjs from 'dayjs'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import {
  useObjectVersionRestoreMutation,
  useObjectVersionsQuery,
} from '@/data/storage/protection/object-versions-query'
import { type ObjectVersion } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

interface VersionHistoryProps {
  projectRef?: string
  bucketId?: string
  objectName: string
  mimeType?: string
}

const shortVersion = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

export const VersionHistory = ({
  projectRef,
  bucketId,
  objectName,
  mimeType,
}: VersionHistoryProps) => {
  const {
    data: versions,
    isPending,
    isError,
    error,
    isSuccess,
  } = useObjectVersionsQuery({ projectRef, bucketId, objectName })

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: () => toast.success('Version restored as the current version'),
  })

  const handleRestore = (version: ObjectVersion) => {
    if (!projectRef || !bucketId) return
    restoreVersion({ projectRef, bucketId, objectName, versionId: version.versionId })
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve versions" />

  const totalSize = versions.reduce((sum, version) => sum + version.size, 0)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h5 className="wrap-break-word text-base text-foreground">{objectName}</h5>
        <p className="text-sm text-foreground-light">
          {[mimeType, `${versions.length} versions`, `${formatBytes(totalSize)} total`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {isSuccess && (
        <ol className="relative flex flex-col">
          {versions.map((version, index) => {
            const isLast = index === versions.length - 1
            return (
              <li key={version.versionId} className="flex gap-x-3">
                {/* timeline rail */}
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      version.isCurrent ? 'bg-brand' : 'bg-foreground-muted'
                    )}
                  />
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>

                <div
                  className={cn(
                    'flex-1 pb-8',
                    version.isCurrent && 'rounded-md border border-border bg-surface-100 p-3'
                  )}
                >
                  <div className="flex items-center justify-between gap-x-2">
                    <div className="flex items-center gap-x-2">
                      <span className="text-sm text-foreground">
                        {dayjs(version.createdAt).format('MMM D, HH:mm')}
                      </span>
                      {version.isCurrent && <Badge variant="success">Latest</Badge>}
                    </div>
                    {!version.isCurrent && (
                      <Button
                        variant="default"
                        size="tiny"
                        icon={<RotateCcw />}
                        loading={isRestoring}
                        onClick={() => handleRestore(version)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-lighter">
                    {formatBytes(version.size)} · {version.action}
                  </p>
                  <p className="mt-1 font-mono text-xs text-foreground-muted">
                    v: {shortVersion(version.versionId)}
                    {version.heldBySnapshot && ` · held by ${version.heldBySnapshot}`}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <Admonition
        showIcon={false}
        type="default"
        title="Restoring is non-destructive"
        description="Restoring makes an older version the new current version. The previous current version becomes a noncurrent version you can still recover."
      />
    </div>
  )
}
