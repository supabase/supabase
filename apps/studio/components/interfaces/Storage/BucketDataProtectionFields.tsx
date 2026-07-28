import { useParams } from 'common'
import { useState } from 'react'
import { DialogSection, DialogSectionSeparator, Label, Switch } from 'ui'

import { getMockBucketProtection, type BucketProtection } from './StorageProtection.constants'
import { InlineLink } from '@/components/ui/InlineLink'
import { SNAPSHOT_FREQUENCY_LABELS } from '@/data/restore-points/restore-points-mocks'
import { useRestorePointPolicyQuery } from '@/data/restore-points/restore-points-query'

interface BucketDataProtectionFieldsProps {
  /** Existing bucket name (Edit) to pre-populate current protection config. */
  bucketName?: string
}

/**
 * "Data protection" section for the create/edit bucket modals.
 *
 * Deliberately down to a single switch. Object versioning always applies at
 * the project default and isn't configurable per bucket here — a footgun of
 * switches (versioning on/off, retention override, expiry days, max versions)
 * asks users to make decisions before they've even seen the bucket in use.
 * The one thing that is genuinely per-bucket right now is whether it
 * participates in the project's snapshots; frequency and retention for those
 * are project-level (see RestorePointsSettings).
 *
 * Prototype: manages local state and isn't persisted through the bucket mutation.
 */
export const BucketDataProtectionFields = ({ bucketName }: BucketDataProtectionFieldsProps) => {
  const { ref: projectRef } = useParams()
  const { data: policy } = useRestorePointPolicyQuery({ projectRef })

  const initial: BucketProtection = getMockBucketProtection(bucketName)

  const [isIncludedInRestorePoints, setIsIncludedInRestorePoints] = useState(
    initial.isIncludedInRestorePoints
  )

  const isRestorePointsEnabled = policy?.isEnabled ?? false

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex flex-col">
            <Label htmlFor="include-in-restore-points">Include in snapshots</Label>
            <p className="text-sm text-foreground-lighter">
              Capture this bucket so it can be restored alongside a database backup
            </p>
          </div>
          <Switch
            id="include-in-restore-points"
            size="large"
            checked={isIncludedInRestorePoints}
            onCheckedChange={setIsIncludedInRestorePoints}
          />
        </div>

        {isIncludedInRestorePoints && (
          <p className="text-sm text-foreground-lighter border-l border-border pl-4">
            {isRestorePointsEnabled && policy ? (
              <>
                Captured {SNAPSHOT_FREQUENCY_LABELS[policy.frequency].toLowerCase()}, kept for{' '}
                {policy.retentionDays} days.{' '}
              </>
            ) : (
              <>Snapshot capture is turned off for this project. </>
            )}
            Frequency and retention are set for the whole project in{' '}
            <InlineLink href={`/project/${projectRef}/storage/files/settings`}>
              Storage settings
            </InlineLink>
            .
          </p>
        )}
      </DialogSection>
    </>
  )
}
