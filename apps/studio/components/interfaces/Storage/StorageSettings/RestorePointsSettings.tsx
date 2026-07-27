import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import {
  SNAPSHOT_FREQUENCY_LABELS,
  type RestorePointPolicy,
  type SnapshotFrequency,
} from '@/data/restore-points/restore-points-mocks'
import {
  useRestorePointPolicyQuery,
  useRestorePointPolicyUpdateMutation,
} from '@/data/restore-points/restore-points-query'
import { formatBytes } from '@/lib/helpers'

const FREQUENCIES: SnapshotFrequency[] = ['with-database-backup', 'daily', 'hourly']

/**
 * Project-level restore point policy — the canonical editor.
 *
 * Frequency and retention live here rather than per bucket because a restore
 * point only means anything if it's consistent across every bucket the database
 * references. Per bucket you choose participation, which is the cost lever.
 *
 * Prototype: backed by mock data, so nothing is persisted beyond the session.
 */
export const RestorePointsSettings = () => {
  const { ref: projectRef } = useParams()
  const { data, isPending, isError, error, isSuccess } = useRestorePointPolicyQuery({ projectRef })
  const [draft, setDraft] = useState<RestorePointPolicy>()

  const { mutate: updatePolicy, isPending: isUpdating } = useRestorePointPolicyUpdateMutation({
    onSuccess: () => {
      toast.success('Restore points updated')
      setDraft(undefined)
    },
  })

  const policy = draft ?? data
  const isDirty = draft !== undefined

  const includedBuckets = policy?.buckets.filter((bucket) => bucket.isIncluded) ?? []
  const includedBytes = includedBuckets.reduce((sum, bucket) => sum + bucket.sizeBytes, 0)

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-y-1">
          <h3 className="text-base text-foreground">Restore points</h3>
          <p className="text-sm text-foreground-light">
            Captures your buckets at a point in time so Storage can be restored alongside a database
            backup. Applies to every bucket you include below.
          </p>
        </div>
      </CardContent>

      {isPending && (
        <CardContent>
          <GenericSkeletonLoader />
        </CardContent>
      )}
      {isError && (
        <CardContent>
          <AlertError error={error} subject="Failed to retrieve restore point policy" />
        </CardContent>
      )}

      {isSuccess && policy && (
        <>
          <CardContent className="flex items-center justify-between gap-x-6">
            <div className="flex flex-col">
              <Label htmlFor="restore-points-enabled">Capture restore points</Label>
              <p className="text-sm text-foreground-lighter">
                Snapshots the included buckets so a restore brings back files as well as data.
              </p>
            </div>
            <Switch
              id="restore-points-enabled"
              size="large"
              checked={policy.isEnabled}
              onCheckedChange={(checked) => setDraft({ ...policy, isEnabled: checked })}
            />
          </CardContent>

          {policy.isEnabled && (
            <>
              <CardContent className="flex items-center justify-between gap-x-6">
                <div className="flex flex-col">
                  <Label htmlFor="restore-points-frequency">Frequency</Label>
                  <p className="text-sm text-foreground-lighter">
                    Matching your database backups keeps both restorable to the same point in time.
                  </p>
                </div>
                <Select
                  value={policy.frequency}
                  onValueChange={(value) =>
                    setDraft({ ...policy, frequency: value as SnapshotFrequency })
                  }
                >
                  <SelectTrigger id="restore-points-frequency" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {SNAPSHOT_FREQUENCY_LABELS[frequency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>

              <CardContent className="flex items-center justify-between gap-x-6">
                <div className="flex flex-col">
                  <Label htmlFor="restore-points-retention">Keep restore points for</Label>
                  <p className="text-sm text-foreground-lighter">
                    One retention for the whole project, so older restore points stay complete
                    rather than covering only some buckets.
                  </p>
                </div>
                <InputGroup className="w-40">
                  <InputGroupInput
                    id="restore-points-retention"
                    type="number"
                    min={1}
                    value={policy.retentionDays}
                    onChange={(e) => setDraft({ ...policy, retentionDays: e.target.valueAsNumber })}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>days</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </CardContent>

              <CardContent className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between gap-x-6">
                  <div className="flex flex-col">
                    <Label htmlFor="restore-points-new-buckets">
                      Include new buckets automatically
                    </Label>
                    <p className="text-sm text-foreground-lighter">
                      Without this, buckets created later are left out and coverage silently
                      regresses.
                    </p>
                  </div>
                  <Switch
                    id="restore-points-new-buckets"
                    size="large"
                    checked={policy.applyToNewBuckets}
                    onCheckedChange={(checked) =>
                      setDraft({ ...policy, applyToNewBuckets: checked })
                    }
                  />
                </div>

                <div className="flex flex-col gap-y-2 border-t border-border pt-3">
                  <p className="text-sm">Buckets included</p>
                  {policy.buckets.map((bucket) => (
                    <div key={bucket.name} className="flex items-center justify-between gap-x-4">
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`restore-points-bucket-${bucket.name}`}
                          className="font-mono font-normal"
                        >
                          {bucket.name}
                        </Label>
                        <p className="text-xs text-foreground-lighter">
                          {formatBytes(bucket.sizeBytes)}
                        </p>
                      </div>
                      <Switch
                        id={`restore-points-bucket-${bucket.name}`}
                        checked={bucket.isIncluded}
                        onCheckedChange={(checked) =>
                          setDraft({
                            ...policy,
                            buckets: policy.buckets.map((b) =>
                              b.name === bucket.name ? { ...b, isIncluded: checked } : b
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <Admonition
                  type={includedBuckets.length === 0 ? 'warning' : 'default'}
                  title={
                    includedBuckets.length === 0
                      ? 'No buckets included'
                      : `You can roll Storage back to any of the last ${policy.retentionDays} days`
                  }
                  description={
                    includedBuckets.length === 0
                      ? 'Restoring a database backup will leave your files untouched, so rows may reference objects that no longer exist.'
                      : `${includedBuckets.length} of ${policy.buckets.length} buckets included, adding roughly ${formatBytes(includedBytes)} of retained storage per restore point.`
                  }
                />
              </CardContent>
            </>
          )}

          <CardFooter className="justify-end gap-x-2">
            {isDirty && (
              <Button variant="default" disabled={isUpdating} onClick={() => setDraft(undefined)}>
                Cancel
              </Button>
            )}
            <Button
              loading={isUpdating}
              disabled={!isDirty}
              onClick={() => {
                if (!projectRef) return
                updatePolicy({ projectRef, policy })
              }}
            >
              Save
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
