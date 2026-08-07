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
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

import { type BucketProtectionFormValues } from './BucketDataProtectionFields.schema'
import {
  getVersioningPlanLimits,
  type BucketVersioningState,
  type ExpirationMode,
} from './StorageProtection.constants'

interface BucketDataProtectionFieldsProps {
  /** The bucket's versioning state when the modal opened (unset when creating a new bucket, which is always `disabled`). */
  initialVersioningState?: BucketVersioningState
  /** The bucket's current retention-days setting when the modal opened, for tightening detection. */
  initialRetentionDays?: number | null
  /** The bucket's current max-versions setting when the modal opened, for tightening detection. */
  initialMaxVersions?: number | null
  /** Whether the bucket is public — public + versioned surfaces every version by default. */
  isPublicBucket?: boolean
}

export const BucketDataProtectionFields = ({
  initialVersioningState = 'disabled',
  initialRetentionDays,
  initialMaxVersions,
  isPublicBucket = false,
}: BucketDataProtectionFieldsProps) => {
  const { control, getValues, setValue } = useFormContext<BucketProtectionFormValues>()
  const { data: organization, isSuccess: isOrganizationLoaded } = useSelectedOrganizationQuery()

  const initialVersioningEnabled = initialVersioningState === 'enabled'
  // Versioning can't go back to a plain "disabled" state once it's ever been
  // turned on — turning the switch off on a bucket like this suspends it
  // instead, which only stops new noncurrent versions from being created.
  // Nothing already retained is affected, so unlike enabling for the first
  // time, this doesn't need a destructive confirmation.
  const wasEverVersioned = initialVersioningState !== 'disabled'

  const planLimits = getVersioningPlanLimits(organization?.plan.id)
  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  const retentionDaysRaw = useWatch({ control, name: 'version_expiry_days' })
  const maxVersionsRaw = useWatch({ control, name: 'max_noncurrent_versions' })
  // Avoid flashing the "upgrade" prompt before we actually know the org's plan
  const showUpgradePrompt = isOrganizationLoaded && !planLimits

  // Detect a tightening of retention (fewer days OR fewer versions than before)
  // while versioning was already enabled and still is. That's not destructive
  // enough for a typed confirmation, but users should know it can immediately
  // expire retained versions that no longer fit within the new bounds.
  const nextRetentionDays = typeof retentionDaysRaw === 'number' ? retentionDaysRaw : null
  const nextMaxVersions = typeof maxVersionsRaw === 'number' ? maxVersionsRaw : null
  const isTighteningRetention =
    initialVersioningEnabled &&
    isVersioningEnabled &&
    initialRetentionDays !== null &&
    initialRetentionDays !== undefined &&
    nextRetentionDays !== null &&
    nextRetentionDays < initialRetentionDays
  const isTighteningMaxVersions =
    initialVersioningEnabled &&
    isVersioningEnabled &&
    initialMaxVersions !== null &&
    initialMaxVersions !== undefined &&
    nextMaxVersions !== null &&
    nextMaxVersions < initialMaxVersions
  const isTightening = isTighteningRetention || isTighteningMaxVersions

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

  // Turning versioning off never deletes anything by itself — a bucket that's
  // ever had it enabled can only be suspended, not returned to a plain
  // "disabled" state, so nothing needs a destructive confirmation here.
  const handleVersioningToggle = (checked: boolean, onChange: (value: boolean) => void) => {
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
          )}
        />

        {!isVersioningEnabled && wasEverVersioned && (
          <Admonition
            type="default"
            title={
              initialVersioningEnabled
                ? 'Versioning will be suspended once saved'
                : 'Versioning is suspended on this bucket'
            }
            description="New noncurrent versions won't be created, but every version and soft-deleted file this bucket is already retaining stays exactly where it is until it's deleted or a lifecycle policy expires it. You can re-enable versioning at any time."
          />
        )}

        {showUpgradePrompt && (
          <UpgradeToPro
            primaryText="Object versioning requires the Pro plan or higher"
            secondaryText="The Free plan doesn't support object versioning or lifecycle policy management. Upgrade to keep previous versions of objects and automatically manage their retention."
            source="storage-object-versioning"
          />
        )}

        {!!planLimits && isVersioningEnabled && isPublicBucket && (
          <Admonition
            type="warning"
            title="Public bucket exposes every version"
            description="Anyone with a version ID can fetch a noncurrent version of a public object. To hide noncurrent versions, add an RLS policy on storage.objects that filters where metadata->>'isCurrent' = 'true'."
          />
        )}

        {!!planLimits && isVersioningEnabled && isTightening && (
          <Admonition
            type="warning"
            title="Tightening retention will expire some data"
            description={
              isTighteningRetention && isTighteningMaxVersions
                ? 'Noncurrent versions past the shorter retention window, and any beyond the lower per-object cap, will be permanently deleted once saved.'
                : isTighteningRetention
                  ? 'Noncurrent versions past the shorter retention window will be permanently deleted once saved.'
                  : 'Noncurrent versions beyond the lower per-object cap will be permanently deleted once saved.'
            }
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
                  label="Noncurrent version expiration"
                  description="Days a noncurrent version is kept before it expires."
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

            <ExpirationModeToggle control={control} />

            <FormField
              name="max_noncurrent_versions"
              control={control}
              render={({ field }) => (
                <FormItemLayout
                  name="max_noncurrent_versions"
                  label="Retained noncurrent versions"
                  description="Maximum noncurrent versions kept per object. The oldest expires once the cap is reached."
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

const EXPIRATION_MODE_OPTIONS: { value: ExpirationMode; label: string; description: string }[] = [
  {
    value: 'and',
    label: 'AND',
    description: 'Both conditions must be met before a version expires (single lifecycle policy)',
  },
  {
    value: 'or',
    label: 'OR',
    description: 'Either condition independently triggers expiration (two lifecycle rules)',
  },
]

interface ExpirationModeToggleProps {
  control: ReturnType<typeof useFormContext<BucketProtectionFormValues>>['control']
}

const ExpirationModeToggle = ({ control }: ExpirationModeToggleProps) => {
  return (
    <FormField
      name="expiration_mode"
      control={control}
      render={({ field }) => (
        <FormItemLayout
          name="expiration_mode"
          label="Expiration policy evaluation"
          description={
            field.value === 'and'
              ? 'A noncurrent version expires only when both the age and cap conditions are met simultaneously.'
              : 'A noncurrent version expires as soon as either the age or cap condition is met independently.'
          }
          layout="flex-row-reverse"
        >
          <FormControl>
            <div className="inline-flex rounded-md border border-default overflow-hidden">
              {EXPIRATION_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'px-3 py-1 text-xs font-mono font-medium transition-colors',
                    field.value === option.value
                      ? 'bg-foreground text-background'
                      : 'bg-surface-100 text-foreground-light hover:bg-surface-200'
                  )}
                  onClick={() => field.onChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
