import dayjs from 'dayjs'
import { Download, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useObjectVersionDeleteMutation,
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

  const [versionToDelete, setVersionToDelete] = useState<ObjectVersion>()

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: () => toast.success('Version restored as the current version'),
  })

  const { mutate: deleteVersion, isPending: isDeleting } = useObjectVersionDeleteMutation({
    onSuccess: () => {
      toast.success('Version permanently deleted')
      setVersionToDelete(undefined)
    },
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

                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between gap-x-2">
                    <div className="flex items-center gap-x-2">
                      <span className="text-sm text-foreground">
                        {dayjs(version.createdAt).format('MMM D, HH:mm')}
                      </span>
                      {version.isCurrent && <Badge variant="success">Latest</Badge>}
                    </div>

                    <div className="flex items-center gap-x-1">
                      <ButtonTooltip
                        variant="text"
                        size="tiny"
                        className="px-1.5"
                        icon={<Download size={14} />}
                        aria-label={`Download version ${shortVersion(version.versionId)}`}
                        onClick={() =>
                          toast.success(`Downloading ${shortVersion(version.versionId)}`)
                        }
                        tooltip={{ content: { side: 'bottom', text: 'Download' } }}
                      />

                      {/* The current version can't be restored onto itself, nor deleted */}
                      {!version.isCurrent && (
                        <>
                          <ButtonTooltip
                            variant="text"
                            size="tiny"
                            className="px-1.5"
                            icon={<RotateCcw size={14} />}
                            loading={isRestoring}
                            aria-label={`Restore version ${shortVersion(version.versionId)}`}
                            onClick={() => handleRestore(version)}
                            tooltip={{ content: { side: 'bottom', text: 'Restore as current' } }}
                          />
                          <ButtonTooltip
                            variant="text"
                            size="tiny"
                            className="px-1.5 hover:text-destructive"
                            icon={<Trash2 size={14} />}
                            disabled={version.heldBySnapshot !== null}
                            aria-label={`Delete version ${shortVersion(version.versionId)}`}
                            onClick={() => setVersionToDelete(version)}
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text:
                                  version.heldBySnapshot !== null
                                    ? 'Held by a snapshot — delete the snapshot first'
                                    : 'Delete permanently',
                              },
                            }}
                          />
                        </>
                      )}
                    </div>
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

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={() => {
          if (!projectRef || !bucketId || !versionToDelete) return
          deleteVersion({
            projectRef,
            bucketId,
            objectName,
            versionId: versionToDelete.versionId,
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Version{' '}
          <span className="font-mono text-foreground">
            {versionToDelete ? shortVersion(versionToDelete.versionId) : ''}
          </span>{' '}
          of {objectName} will be permanently deleted. The current version is not affected. This
          action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  )
}
