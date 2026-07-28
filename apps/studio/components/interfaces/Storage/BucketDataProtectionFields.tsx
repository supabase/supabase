import { useParams } from 'common'
import { useState } from 'react'
import {
  DialogSection,
  DialogSectionSeparator,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import {
  getMockBucketProtection,
  PROJECT_VERSIONING_DEFAULTS,
  type BucketProtection,
} from './StorageProtection.constants'
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
 * Deliberately scoped to what is genuinely per-bucket: versioning (recovery depth
 * for individual files, where churn varies bucket to bucket) and whether this
 * bucket participates in the project's snapshots. Snapshot frequency and
 * retention are project-level — a snapshot generation only means anything if it
 * covers every bucket the database references, so per-bucket retention would let
 * older snapshots quietly become partial.
 *
 * Prototype: manages local state and isn't persisted through the bucket mutation.
 */
export const BucketDataProtectionFields = ({ bucketName }: BucketDataProtectionFieldsProps) => {
  const { ref: projectRef } = useParams()
  const { data: policy } = useRestorePointPolicyQuery({ projectRef })

  const initial: BucketProtection = getMockBucketProtection(bucketName)

  const [versioning, setVersioning] = useState(initial.versioning === 'enabled')
  const [hasVersioningOverride, setHasVersioningOverride] = useState(initial.hasVersioningOverride)
  const [versionExpiryDays, setVersionExpiryDays] = useState(
    initial.versionExpiryDays ?? PROJECT_VERSIONING_DEFAULTS.versionExpiryDays
  )
  const [maxNoncurrentVersions, setMaxNoncurrentVersions] = useState(
    initial.maxNoncurrentVersions ?? PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions
  )
  const [isIncludedInRestorePoints, setIsIncludedInRestorePoints] = useState(
    initial.isIncludedInRestorePoints
  )

  const effectiveExpiryDays = hasVersioningOverride
    ? versionExpiryDays
    : PROJECT_VERSIONING_DEFAULTS.versionExpiryDays
  const effectiveMaxVersions = hasVersioningOverride
    ? maxNoncurrentVersions
    : PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions

  const isRestorePointsEnabled = policy?.isEnabled ?? false

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex flex-col">
            <Label htmlFor="object-versioning">Object versioning</Label>
            <p className="text-sm text-foreground-lighter">
              Keep previous versions when objects are overwritten or deleted
            </p>
          </div>
          <Switch
            id="object-versioning"
            size="large"
            checked={versioning}
            onCheckedChange={setVersioning}
          />
        </div>

        {versioning && (
          <div className="flex flex-col gap-y-3 border-l border-border pl-4 pt-1">
            <p className="text-sm text-foreground-light">
              Keeping {effectiveMaxVersions} versions per file for {effectiveExpiryDays} days{' '}
              <span className="text-foreground-lighter">
                {hasVersioningOverride ? '(overridden for this bucket)' : '(project default)'}
              </span>
            </p>

            <div className="flex items-center justify-between gap-x-4">
              <Label htmlFor="versioning-override" className="font-normal text-foreground-light">
                Use different retention for this bucket
              </Label>
              <Switch
                id="versioning-override"
                checked={hasVersioningOverride}
                onCheckedChange={setHasVersioningOverride}
              />
            </div>

            {hasVersioningOverride && (
              <>
                <div className="flex items-center justify-between gap-x-4">
                  <Label htmlFor="version-expiry" className="font-normal text-foreground-light">
                    Expire noncurrent versions after
                  </Label>
                  <InputGroup className="w-40">
                    <InputGroupInput
                      id="version-expiry"
                      type="number"
                      min={1}
                      value={versionExpiryDays}
                      onChange={(e) => setVersionExpiryDays(e.target.valueAsNumber)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>days</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="flex items-center justify-between gap-x-4">
                  <Label htmlFor="max-versions" className="font-normal text-foreground-light">
                    Max noncurrent versions
                  </Label>
                  <Input
                    id="max-versions"
                    type="number"
                    min={1}
                    max={100}
                    className="w-40"
                    value={maxNoncurrentVersions}
                    onChange={(e) => setMaxNoncurrentVersions(e.target.valueAsNumber)}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </DialogSection>

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

        {versioning && (
          <Admonition
            type="warning"
            title="Retained versions and snapshots add to your storage bill"
            description="Objects held by a snapshot can't be deleted until it expires."
          />
        )}
      </DialogSection>
    </>
  )
}
