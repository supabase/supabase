import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  DialogSection,
  DialogSectionSeparator,
  FormControl,
  FormField,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

import { type BucketProtectionFormValues } from './BucketDataProtectionFields.schema'
import { getVersioningPlanLimits } from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  bucketName?: string
  /** Whether versioning is currently enabled on the bucket being edited (unset when creating a new bucket). */
  initialVersioningEnabled?: boolean
}

export const BucketDataProtectionFields = ({
  bucketName,
  initialVersioningEnabled = false,
}: BucketDataProtectionFieldsProps) => {
  const { control, getValues, setValue } = useFormContext<BucketProtectionFormValues>()
  const { data: organization, isSuccess: isOrganizationLoaded } = useSelectedOrganizationQuery()

  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  const planLimits = getVersioningPlanLimits(organization?.plan.id)
  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  // Avoid flashing the "upgrade" prompt before we actually know the org's plan
  const showUpgradePrompt = isOrganizationLoaded && !planLimits

  // Prefill the retention fields with the plan's defaults when versioning is
  // switched on, so the user doesn't have to fill in an empty input to proceed.
  const enableVersioning = (onChange: (value: boolean) => void) => {
    onChange(true)
    if (planLimits) {
      if (getValues('version_expiry_days') === '') {
        setValue('version_expiry_days', planLimits.defaultRetentionDays, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
      if (getValues('max_noncurrent_versions') === '') {
        setValue('max_noncurrent_versions', planLimits.defaultVersions, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    }
  }

  // Disabling versioning on a bucket that already has it enabled permanently
  // deletes every noncurrent version and soft-deleted file it's retaining —
  // require an explicit, typed confirmation before flipping the switch off.
  const handleVersioningToggle = (checked: boolean, onChange: (value: boolean) => void) => {
    if (!checked && initialVersioningEnabled) {
      setShowDisableConfirm(true)
      return
    }
    if (checked) {
      enableVersioning(onChange)
    } else {
      onChange(false)
    }
  }

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <FormField
          name="enable_versioning"
          control={control}
          render={({ field }) => (
            <>
              <FormItemLayout
                hideMessage
                name="enable_versioning"
                label="Object versioning"
                description="Keep previous versions of objects when they are overwritten or deleted"
                layout="flex"
              >
                <FormControl>
                  <Switch
                    id="enable-versioning"
                    size="large"
                    checked={field.value}
                    disabled={!planLimits}
                    onCheckedChange={(checked) => handleVersioningToggle(checked, field.onChange)}
                  />
                </FormControl>
              </FormItemLayout>

              <TextConfirmModal
                variant="destructive"
                visible={showDisableConfirm}
                loading={false}
                title="Disable object versioning"
                confirmLabel="Disable versioning"
                confirmPlaceholder="Type bucket name"
                confirmString={bucketName ?? ''}
                onCancel={() => setShowDisableConfirm(false)}
                onConfirm={() => {
                  field.onChange(false)
                  setShowDisableConfirm(false)
                }}
                alert={{
                  title: 'This cannot be undone',
                  description:
                    'Every noncurrent object version and soft-deleted file this bucket is retaining will be permanently deleted once you save.',
                }}
              >
                <p className="text-sm text-foreground-light">
                  Disabling versioning on <span className="font-mono">{bucketName}</span> will
                  permanently delete all noncurrent versions and soft-deleted files once saved. This
                  action cannot be undone.
                </p>
              </TextConfirmModal>
            </>
          )}
        />

        {!isVersioningEnabled && initialVersioningEnabled && (
          <Admonition
            type="warning"
            title="Object versioning will be disabled once saved"
            description="Every noncurrent version and soft-deleted file this bucket is retaining will be permanently deleted. This cannot be undone."
          />
        )}

        {showUpgradePrompt && (
          <UpgradeToPro
            primaryText="Object versioning requires the Pro plan or higher"
            secondaryText="The Free plan doesn't support object versioning or lifecycle policy management. Upgrade to keep previous versions of objects and automatically manage their retention."
            source="storage-object-versioning"
          />
        )}

        {!!planLimits && isVersioningEnabled && (
          <div className="flex flex-col gap-y-3">
            <FormField
              name="version_expiry_days"
              control={control}
              render={({ field }) => (
                <FormItemLayout
                  name="version_expiry_days"
                  label="Noncurrent version retention"
                  description="Automatically expire noncurrent versions after this many days"
                  layout="flex-row-reverse"
                >
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        id="version-expiry-days"
                        type="number"
                        min={planLimits.minRetentionDays}
                        max={planLimits.maxRetentionDays}
                        placeholder={`${planLimits.defaultRetentionDays}`}
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>days</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <FormField
              name="max_noncurrent_versions"
              control={control}
              render={({ field }) => (
                <FormItemLayout
                  name="max_noncurrent_versions"
                  label="Max noncurrent versions"
                  description="Keep at most this many noncurrent versions per object"
                  layout="flex-row-reverse"
                >
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        id="max-noncurrent-versions"
                        type="number"
                        min={planLimits.minVersions}
                        max={planLimits.maxVersions}
                        placeholder={`${planLimits.defaultVersions}`}
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>versions</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </div>
        )}
      </DialogSection>
    </>
  )
}
