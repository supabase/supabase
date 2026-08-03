import { useState } from 'react'
import { DialogSection, DialogSectionSeparator, Input, Label, Switch } from 'ui'

import {
  getMockBucketProtection,
  PROJECT_VERSIONING_DEFAULTS,
  type BucketProtection,
} from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  bucketName?: string
}

/**
 * "Object versioning" section for the create/edit bucket modals.
 *
 * Prototype: manages local state and isn't persisted through the bucket
 * mutation yet.
 */
export const BucketDataProtectionFields = ({ bucketName }: BucketDataProtectionFieldsProps) => {
  const initial: BucketProtection = getMockBucketProtection(bucketName)

  const [isVersioningEnabled, setIsVersioningEnabled] = useState(initial.versioning === 'enabled')
  const [expiryDays, setExpiryDays] = useState<number>(
    initial.versionExpiryDays ?? PROJECT_VERSIONING_DEFAULTS.versionExpiryDays
  )
  const [maxVersions, setMaxVersions] = useState<number>(
    initial.maxNoncurrentVersions ?? PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions
  )

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex flex-col">
            <Label htmlFor="enable-versioning">Object versioning</Label>
            <p className="text-sm text-foreground-lighter">
              Keep previous versions of objects when they are overwritten or deleted
            </p>
          </div>
          <Switch
            id="enable-versioning"
            size="large"
            checked={isVersioningEnabled}
            onCheckedChange={setIsVersioningEnabled}
          />
        </div>

        {isVersioningEnabled && (
          <div className="flex flex-col gap-y-3 border-l border-border pl-4">
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="version-expiry-days">Noncurrent version retention (days)</Label>
              <p className="text-sm text-foreground-lighter">
                Automatically expire noncurrent versions after this many days
              </p>
              <Input
                id="version-expiry-days"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="max-w-[160px]"
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="max-noncurrent-versions">Max noncurrent versions</Label>
              <p className="text-sm text-foreground-lighter">
                Keep at most this many noncurrent versions per object
              </p>
              <Input
                id="max-noncurrent-versions"
                type="number"
                min={1}
                max={100}
                value={maxVersions}
                onChange={(e) => setMaxVersions(Number(e.target.value))}
                className="max-w-[160px]"
              />
            </div>
          </div>
        )}
      </DialogSection>
    </>
  )
}
