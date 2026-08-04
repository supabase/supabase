import { useState } from 'react'
import {
  DialogSection,
  DialogSectionSeparator,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  getMockBucketProtection,
  PROJECT_VERSIONING_DEFAULTS,
  type BucketProtection,
} from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  bucketName?: string
}

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
        <FormItemLayout
          name="enable-versioning"
          label="Object versioning"
          description="Keep previous versions of objects when they are overwritten or deleted"
          layout="flex"
        >
          <Switch
            id="enable-versioning"
            size="large"
            checked={isVersioningEnabled}
            onCheckedChange={setIsVersioningEnabled}
          />
        </FormItemLayout>

        {isVersioningEnabled && (
          <div className="flex flex-col gap-y-3 border-l border-border pl-4">
            <FormItemLayout
              name="version-expiry-days"
              label="Noncurrent version retention"
              description="Automatically expire noncurrent versions after this many days"
              layout="flex-row-reverse"
            >
              <InputGroup>
                <InputGroupInput
                  id="version-expiry-days"
                  type="number"
                  min={1}
                  max={365}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormItemLayout>

            <FormItemLayout
              name="max-noncurrent-versions"
              label="Max noncurrent versions"
              description="Keep at most this many noncurrent versions per object"
              layout="flex-row-reverse"
            >
              <InputGroup>
                <InputGroupInput
                  id="max-noncurrent-versions"
                  type="number"
                  min={1}
                  max={100}
                  value={maxVersions}
                  onChange={(e) => setMaxVersions(Number(e.target.value))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>versions</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormItemLayout>
          </div>
        )}
      </DialogSection>
    </>
  )
}
