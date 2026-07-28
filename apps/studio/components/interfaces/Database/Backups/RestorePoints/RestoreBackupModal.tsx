import dayjs from 'dayjs'
import { AlertTriangle, Check, GitBranch } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn, Label, RadioGroup, RadioGroupItem } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import type { DatabaseBackup } from '@/data/database/backups-query'
import type { RestorePointCoverage } from '@/data/restore-points/restore-points-mocks'
import {
  useRestorePointRestoreMutation,
  type RestoreMode,
} from '@/data/restore-points/restore-points-query'
import { formatBytes } from '@/lib/helpers'

interface RestoreBackupModalProps {
  projectRef?: string
  backup?: DatabaseBackup
  coverage?: RestorePointCoverage
  /** Existing in-place database restore. */
  isRestoringInPlace: boolean
  onRestoreInPlace: () => void
  onCancel: () => void
}

/**
 * Restore a platform backup.
 *
 * Two modes, because branching is a platform primitive: restoring into a preview
 * branch is a copy-on-write clone — cheap, non-destructive, and verifiable
 * before promotion — so it is the default. In-place restore over production
 * stays available as the escape hatch.
 */
export const RestoreBackupModal = ({
  projectRef,
  backup,
  coverage,
  isRestoringInPlace,
  onRestoreInPlace,
  onCancel,
}: RestoreBackupModalProps) => {
  const [mode, setMode] = useState<RestoreMode>('branch')

  const { mutate: restoreToBranch, isPending: isCreatingBranch } = useRestorePointRestoreMutation({
    onSuccess: () => {
      toast.success(
        `Creating a preview branch from ${dayjs(backup?.inserted_at).format('DD MMM YYYY HH:mm')}`
      )
      onCancel()
    },
  })

  const isInPlace = mode === 'in-place'
  const storageCoverage = coverage?.primitives.find((p) => p.primitive === 'storage')
  const hasStorageGap = storageCoverage?.status === 'uncovered'

  const handleConfirm = () => {
    if (!projectRef || !backup) return
    if (isInPlace) return onRestoreInPlace()
    restoreToBranch({
      projectRef,
      backupTimestamp: backup.inserted_at,
      mode,
      includeStorage: !hasStorageGap,
    })
  }

  return (
    <ConfirmationModal
      size="medium"
      variant={isInPlace ? 'warning' : 'default'}
      visible={backup !== undefined}
      title={`Restore from ${dayjs(backup?.inserted_at).format('DD MMM YYYY HH:mm:ss')}`}
      confirmLabel={isInPlace ? 'Restore over production' : 'Create branch from this point'}
      confirmLabelLoading="Starting restore..."
      loading={isRestoringInPlace || isCreatingBranch}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm mb-2">What this backup includes</p>
          <div className="flex flex-col">
            {coverage?.primitives.map((primitive) => {
              const isCovered = primitive.status === 'covered'
              return (
                <div
                  key={primitive.primitive}
                  className="flex items-start gap-x-2 border-b py-2 last:border-b-0"
                >
                  {isCovered ? (
                    <Check size={14} className="text-brand mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-warning-600 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className="text-xs text-foreground">{primitive.label}</p>
                    <p className="text-xs text-foreground-lighter">{primitive.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {coverage?.storageSnapshot && (
            <p className="text-xs text-foreground-lighter pt-2">
              Storage snapshot{' '}
              <span className="font-mono text-foreground-light">
                {coverage.storageSnapshot.id.slice(0, 12)}…
              </span>{' '}
              · {coverage.storageSnapshot.bucketCount} buckets ·{' '}
              {formatBytes(coverage.storageSnapshot.sizeBytes)}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm mb-2">How to restore</p>
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value === 'in-place' ? 'in-place' : 'branch')}
            className="gap-y-2"
          >
            <label
              htmlFor="restore-branch"
              className={cn(
                'flex gap-x-3 rounded-md border p-3 cursor-pointer',
                !isInPlace ? 'border-foreground-muted bg-surface-200' : 'border-border'
              )}
            >
              <RadioGroupItem id="restore-branch" value="branch" className="mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-x-2">
                  <GitBranch size={13} className="text-foreground-light" />
                  <Label htmlFor="restore-branch" className="cursor-pointer">
                    Into a new preview branch
                  </Label>
                </div>
                <p className="text-xs text-foreground-lighter">
                  Production keeps running. The branch is a copy-on-write clone, so it&apos;s
                  near-instant and costs almost nothing. Verify it, then promote.
                </p>
              </div>
            </label>

            <label
              htmlFor="restore-in-place"
              className={cn(
                'flex gap-x-3 rounded-md border p-3 cursor-pointer',
                isInPlace ? 'border-warning-500 bg-warning/5' : 'border-border'
              )}
            >
              <RadioGroupItem id="restore-in-place" value="in-place" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="restore-in-place" className="cursor-pointer">
                  In place, over production
                </Label>
                <p className="text-xs text-foreground-lighter">
                  Your project goes offline during the restore and any data written after this point
                  is lost. This can&apos;t be undone.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {hasStorageGap && (
          <Admonition
            showIcon={false}
            type="warning"
            title="Storage objects won't be restored"
            description="There's no bucket snapshot at this point in time, so files stay as they are today. Restored rows may reference objects that no longer exist."
          />
        )}

        {isInPlace && (
          <Admonition
            showIcon={false}
            type="warning"
            title="This action cannot be undone"
            description="Restoring into a branch first lets you confirm the data is what you expect before touching production."
          />
        )}
      </div>
    </ConfirmationModal>
  )
}
