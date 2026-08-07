import { useParams } from 'common'
import { useState } from 'react'
import { DialogSection, DialogSectionSeparator, Input, Label, Switch } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLink } from '@/components/ui/InlineLink'
import { SNAPSHOT_FREQUENCY_LABELS } from '@/data/restore-points/restore-points-mocks'
import { useRestorePointPolicyQuery } from '@/data/restore-points/restore-points-query'

import {
  getMockBucketProtection,
  PROJECT_VERSIONING_DEFAULTS,
  type BucketProtection,
  type ExpirationMode,
} from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  /** Existing bucket name (Edit) to pre-populate current protection config. */
  bucketName?: string
  /** Whether the bucket is public — shown as a warning when versioning is on. */
  isPublicBucket?: boolean
}

/**
 * "Data protection" section for the create/edit bucket modals.
 *
 * Includes:
 * - Snapshot participation toggle
 * - Object versioning toggle
 * - Noncurrent version expiration settings with AND/OR lifecycle policy toggle
 *
 * Prototype: manages local state and isn't persisted through the bucket mutation.
 */
export const BucketDataProtectionFields = ({
  bucketName,
  isPublicBucket,
}: BucketDataProtectionFieldsProps) => {
  const { ref: projectRef } = useParams()
  const { data: policy } = useRestorePointPolicyQuery({ projectRef })

  const initial: BucketProtection = getMockBucketProtection(bucketName)

  const [isIncludedInRestorePoints, setIsIncludedInRestorePoints] = useState(
    initial.isIncludedInRestorePoints
  )
  const [isVersioningEnabled, setIsVersioningEnabled] = useState(initial.versioning === 'enabled')
  const [versionExpiryDays, setVersionExpiryDays] = useState<string>(
    initial.versionExpiryDays?.toString() ??
      PROJECT_VERSIONING_DEFAULTS.versionExpiryDays.toString()
  )
  const [maxNoncurrentVersions, setMaxNoncurrentVersions] = useState<string>(
    initial.maxNoncurrentVersions?.toString() ??
      PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions.toString()
  )
  const [expirationMode, setExpirationMode] = useState<ExpirationMode>(initial.expirationMode)

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

      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex flex-col">
            <Label htmlFor="enable-versioning">Object versioning</Label>
            <p className="text-sm text-foreground-lighter">
              Keep noncurrent versions of overwritten and deleted objects
            </p>
          </div>
          <Switch
            id="enable-versioning"
            size="large"
            checked={isVersioningEnabled}
            onCheckedChange={setIsVersioningEnabled}
          />
        </div>

        {isVersioningEnabled && isPublicBucket && (
          <Admonition
            type="warning"
            title="Public bucket"
            description="Noncurrent versions in a public bucket are accessible without authorization. Consider making this bucket private first."
          />
        )}

        {isVersioningEnabled && (
          <div className="space-y-3 border-l border-border pl-4">
            <FormItemLayout
              name="version_expiry_days"
              label="Noncurrent version expiration"
              description="Expire noncurrent versions after this many days"
            >
              <Input
                id="version_expiry_days"
                type="number"
                min={1}
                max={3650}
                size="small"
                value={versionExpiryDays}
                onChange={(e) => setVersionExpiryDays(e.target.value)}
                placeholder={PROJECT_VERSIONING_DEFAULTS.versionExpiryDays.toString()}
              />
            </FormItemLayout>

            {/* AND/OR lifecycle policy toggle */}
            <div className="flex items-center gap-x-3 px-1">
              <div className="flex-1 border-t border-default" />
              <div className="flex items-center gap-x-1 rounded-full border border-default px-1 py-0.5">
                <button
                  type="button"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    expirationMode === 'and'
                      ? 'bg-foreground text-background'
                      : 'text-foreground-lighter hover:text-foreground'
                  }`}
                  onClick={() => setExpirationMode('and')}
                >
                  AND
                </button>
                <button
                  type="button"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    expirationMode === 'or'
                      ? 'bg-foreground text-background'
                      : 'text-foreground-lighter hover:text-foreground'
                  }`}
                  onClick={() => setExpirationMode('or')}
                >
                  OR
                </button>
              </div>
              <div className="flex-1 border-t border-default" />
            </div>
            <p className="text-xs text-foreground-lighter text-center -mt-1">
              {expirationMode === 'and'
                ? 'Both conditions must be met before a noncurrent version expires'
                : 'Either condition independently triggers expiration of a noncurrent version'}
            </p>

            <FormItemLayout
              name="max_noncurrent_versions"
              label="Retained noncurrent versions"
              description="Maximum number of noncurrent versions to keep per object"
            >
              <Input
                id="max_noncurrent_versions"
                type="number"
                min={1}
                max={100}
                size="small"
                value={maxNoncurrentVersions}
                onChange={(e) => setMaxNoncurrentVersions(e.target.value)}
                placeholder={PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions.toString()}
              />
            </FormItemLayout>
          </div>
        )}
      </DialogSection>
    </>
  )
}
