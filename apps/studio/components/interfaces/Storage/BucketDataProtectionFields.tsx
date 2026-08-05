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
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

import { type BucketProtectionFormValues } from './BucketDataProtectionFields.schema'
import { getVersioningPlanLimits } from './StorageProtection.constants'

export const BucketDataProtectionFields = () => {
  const { control } = useFormContext<BucketProtectionFormValues>()
  const { data: organization, isSuccess: isOrganizationLoaded } = useSelectedOrganizationQuery()

  const planLimits = getVersioningPlanLimits(organization?.plan.id)
  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  // Avoid flashing the "upgrade" prompt before we actually know the org's plan
  const showUpgradePrompt = isOrganizationLoaded && !planLimits

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <FormField
          name="enable_versioning"
          control={control}
          render={({ field }) => (
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
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        {showUpgradePrompt && (
          <UpgradeToPro
            primaryText="Object versioning requires the Pro plan or higher"
            secondaryText="The Free plan doesn't support object versioning or lifecycle policy management. Upgrade to keep previous versions of objects and automatically manage their retention."
            source="storage-object-versioning"
          />
        )}

        {!!planLimits && isVersioningEnabled && (
          <div className="flex flex-col gap-y-3 border-l border-border pl-4">
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
