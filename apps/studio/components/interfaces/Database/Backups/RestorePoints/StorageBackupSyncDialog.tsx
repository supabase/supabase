import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Label,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { StorageBackupSyncSettings } from '@/data/restore-points/restore-points-mocks'
import {
  useStorageBackupSyncQuery,
  useStorageBackupSyncUpdateMutation,
} from '@/data/restore-points/restore-points-query'
import { formatBytes } from '@/lib/helpers'

interface StorageBackupSyncDialogProps {
  visible: boolean
  projectRef?: string
  onClose: () => void
}

/**
 * Project-level control for keeping Storage in sync with database backups.
 *
 * Configuring this per bucket alone is the trap: a bucket added later defaults to
 * unprotected, so a project that was fully recoverable quietly stops being so.
 * The project-level switch plus "include new buckets" keeps the guarantee, while
 * per-bucket rows stay available as the deliberate opt-out for buckets not worth
 * snapshotting.
 */
export const StorageBackupSyncDialog = ({
  visible,
  projectRef,
  onClose,
}: StorageBackupSyncDialogProps) => {
  const { data, isSuccess } = useStorageBackupSyncQuery({ projectRef })
  const [draft, setDraft] = useState<StorageBackupSyncSettings>()

  const { mutate: updateSync, isPending } = useStorageBackupSyncUpdateMutation({
    onSuccess: () => {
      toast.success('Storage backup settings updated')
      handleClose()
    },
  })

  // The dialog opens from a banner, so seed the draft from the loaded settings the
  // first time it renders with data rather than syncing state in an effect.
  const settings = draft ?? data

  const handleClose = () => {
    setDraft(undefined)
    onClose()
  }

  const handleSubmit = () => {
    if (!projectRef || !settings) return
    updateSync({ projectRef, settings })
  }

  const includedCount = settings?.buckets.filter((bucket) => bucket.isIncluded).length ?? 0
  const includedBytes =
    settings?.buckets
      .filter((bucket) => bucket.isIncluded)
      .reduce((sum, bucket) => sum + bucket.sizeBytes, 0) ?? 0

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Storage in database backups</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        {!isSuccess || !settings ? (
          <DialogSection>
            <GenericSkeletonLoader />
          </DialogSection>
        ) : (
          <>
            <DialogSection className="space-y-3">
              <div className="flex items-center justify-between gap-x-6">
                <div className="flex flex-col">
                  <Label htmlFor="sync-enabled">Snapshot Storage with each backup</Label>
                  <p className="text-sm text-foreground-lighter">
                    Takes a bucket snapshot immediately before each scheduled database backup, so
                    both restore to the same point in time.
                  </p>
                </div>
                <Switch
                  id="sync-enabled"
                  size="large"
                  checked={settings.isEnabled}
                  onCheckedChange={(checked) => setDraft({ ...settings, isEnabled: checked })}
                />
              </div>

              {settings.isEnabled && (
                <div className="flex items-center justify-between gap-x-6 border-l border-border pl-4 pt-1">
                  <div className="flex flex-col">
                    <Label htmlFor="sync-new-buckets" className="font-normal text-foreground-light">
                      Include new buckets automatically
                    </Label>
                    <p className="text-sm text-foreground-lighter">
                      Without this, buckets created later are left out and coverage silently
                      regresses.
                    </p>
                  </div>
                  <Switch
                    id="sync-new-buckets"
                    size="large"
                    checked={settings.applyToNewBuckets}
                    onCheckedChange={(checked) =>
                      setDraft({ ...settings, applyToNewBuckets: checked })
                    }
                  />
                </div>
              )}
            </DialogSection>

            {settings.isEnabled && (
              <>
                <DialogSectionSeparator />
                <DialogSection className="space-y-2">
                  <p className="text-sm">Buckets</p>
                  {settings.buckets.map((bucket) => (
                    <div key={bucket.name} className="flex items-center justify-between gap-x-4">
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`sync-bucket-${bucket.name}`}
                          className="font-mono font-normal"
                        >
                          {bucket.name}
                        </Label>
                        <p className="text-xs text-foreground-lighter">
                          {formatBytes(bucket.sizeBytes)}
                        </p>
                      </div>
                      <Switch
                        id={`sync-bucket-${bucket.name}`}
                        checked={bucket.isIncluded}
                        onCheckedChange={(checked) =>
                          setDraft({
                            ...settings,
                            buckets: settings.buckets.map((b) =>
                              b.name === bucket.name ? { ...b, isIncluded: checked } : b
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                  <Admonition
                    type="default"
                    title={`${includedCount} of ${settings.buckets.length} buckets included`}
                    description={`Adds roughly ${formatBytes(includedBytes)} of retained storage per snapshot, released when the snapshot expires.`}
                  />
                </DialogSection>
              </>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          <Button loading={isPending} disabled={!settings} onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
