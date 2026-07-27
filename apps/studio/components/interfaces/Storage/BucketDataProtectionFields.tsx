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

import { type BucketProtection, getMockBucketProtection } from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  /** Existing bucket name (Edit) to pre-populate current protection config. */
  bucketName?: string
}

/**
 * "Data protection" section for the create/edit bucket modals — object
 * versioning + bucket snapshots with their lifecycle policies.
 *
 * Prototype: this manages its own local state and is not yet persisted through
 * the bucket mutation, so the enable/lifecycle UX can be demoed end-to-end.
 */
export const BucketDataProtectionFields = ({ bucketName }: BucketDataProtectionFieldsProps) => {
  const initial: BucketProtection = getMockBucketProtection(bucketName)

  const [versioning, setVersioning] = useState(initial.versioning === 'enabled')
  const [versionExpiryDays, setVersionExpiryDays] = useState(initial.versionExpiryDays ?? 30)
  const [maxNoncurrentVersions, setMaxNoncurrentVersions] = useState(
    initial.maxNoncurrentVersions ?? 100
  )

  const [snapshots, setSnapshots] = useState(initial.snapshots)
  const [snapshotOnBackup, setSnapshotOnBackup] = useState(initial.snapshotOnDatabaseBackup)
  const [snapshotExpiryDays, setSnapshotExpiryDays] = useState(initial.snapshotExpiryDays ?? 90)

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
          </div>
        )}
      </DialogSection>

      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex flex-col">
            <Label htmlFor="bucket-snapshots">Bucket snapshots</Label>
            <p className="text-sm text-foreground-lighter">
              Capture point-in-time restore points for the whole bucket
            </p>
          </div>
          <Switch
            id="bucket-snapshots"
            size="large"
            checked={snapshots}
            onCheckedChange={setSnapshots}
          />
        </div>

        {snapshots && (
          <div className="flex flex-col gap-y-3 border-l border-border pl-4 pt-1">
            <div className="flex items-center justify-between gap-x-4">
              <Label htmlFor="snapshot-on-backup" className="font-normal text-foreground-light">
                Snapshot before each database backup
              </Label>
              <Switch
                id="snapshot-on-backup"
                size="large"
                checked={snapshotOnBackup}
                onCheckedChange={setSnapshotOnBackup}
              />
            </div>
            <div className="flex items-center justify-between gap-x-4">
              <Label htmlFor="snapshot-expiry" className="font-normal text-foreground-light">
                Keep snapshots for
              </Label>
              <InputGroup className="w-40">
                <InputGroupInput
                  id="snapshot-expiry"
                  type="number"
                  min={1}
                  value={snapshotExpiryDays}
                  onChange={(e) => setSnapshotExpiryDays(e.target.valueAsNumber)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        )}

        {(versioning || snapshots) && (
          <Admonition
            type="warning"
            title="Retained versions and snapshots add to your storage bill"
            description="Objects held by a snapshot can't be deleted until the snapshot expires."
          />
        )}
      </DialogSection>
    </>
  )
}
