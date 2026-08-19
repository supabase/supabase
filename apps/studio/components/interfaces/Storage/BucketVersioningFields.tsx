import { AnimatePresence } from 'framer-motion'
import { useFormContext, useWatch } from 'react-hook-form'
import { DialogSection, DialogSectionSeparator, FormControl, FormField, Switch } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { type BucketVersioningFormValues } from './BucketVersioningFields.schema'
import {
  getRetentionTightening,
  RETENTION_TIGHTENING_DESCRIPTION,
  toNullableNumber,
} from './BucketVersioningFields.utils'
import { LifecyclePolicySection } from './LifecyclePolicySection'
import type { BucketVersioningState, ExpirationMode } from './StorageVersioning.constants'
import { FormSectionCollapse } from '@/components/ui/FormSectionCollapse'

interface BucketVersioningFieldsProps {
  initialVersioningState?: BucketVersioningState
  initialRetentionDays?: number | null
  initialMaxVersions?: number | null
  isPublicBucket?: boolean
}

export const BucketVersioningFields = ({
  initialVersioningState = 'disabled',
  initialRetentionDays,
  initialMaxVersions,
  isPublicBucket = false,
}: BucketVersioningFieldsProps) => {
  const { control, setValue } = useFormContext<BucketVersioningFormValues>()

  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  const retentionDays = useWatch({ control, name: 'version_expiry_days' })
  const maxVersions = useWatch({ control, name: 'max_noncurrent_versions' })
  const expirationMode = useWatch({ control, name: 'expiration_mode' })

  // Turning the switch off suspends rather than disables,
  // so this is a heads-up rather than a destructive confirmation.
  const isSuspending = !isVersioningEnabled && initialVersioningState !== 'disabled'

  const tightening = getRetentionTightening({
    initialVersioningState,
    isVersioningEnabled,
    initialRetentionDays,
    initialMaxVersions,
    nextRetentionDays: toNullableNumber(retentionDays),
    nextMaxVersions: toNullableNumber(maxVersions),
  })

  const hasDays = typeof retentionDays === 'number' && retentionDays > 0
  const hasVersions = typeof maxVersions === 'number' && maxVersions > 0

  const handleModeChange = (mode: ExpirationMode) => {
    setValue('expiration_mode', mode, { shouldDirty: true })
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
              description="Keeps previous versions of an object when it is overwritten or deleted"
              layout="flex"
            >
              <FormControl>
                <Switch
                  id="enable-versioning"
                  size="large"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <AnimatePresence initial={false}>
          {isSuspending && (
            <FormSectionCollapse key="suspension-notice">
              <Admonition
                type="default"
                title={
                  initialVersioningState === 'enabled'
                    ? 'Saving will suspend versioning'
                    : 'Versioning is suspended on this bucket'
                }
                description="Existing versions stay put. Re-enable versioning at any time."
              />
            </FormSectionCollapse>
          )}

          {isVersioningEnabled && isPublicBucket && (
            <FormSectionCollapse key="public-bucket-warning">
              <Admonition
                type="warning"
                title="A public bucket serves every version"
                description={
                  <>
                    Anyone with a version ID can fetch a noncurrent version of a public object. To
                    hide noncurrent versions, add an RLS policy on <code>storage.objects</code> that
                    filters on <code>metadata-&gt;&gt;'isCurrent' = 'true'</code>.
                  </>
                }
              />
            </FormSectionCollapse>
          )}

          {isVersioningEnabled && tightening !== 'none' && (
            <FormSectionCollapse key="tightening-warning">
              <Admonition
                type="warning"
                title="Tightening retention expires some versions"
                description={RETENTION_TIGHTENING_DESCRIPTION[tightening]}
              />
            </FormSectionCollapse>
          )}

          {isVersioningEnabled && (
            <FormSectionCollapse key="lifecycle-policy">
              <LifecyclePolicySection
                control={control}
                hasDays={hasDays}
                hasVersions={hasVersions}
                mode={expirationMode}
                onModeChange={handleModeChange}
              />
            </FormSectionCollapse>
          )}
        </AnimatePresence>
      </DialogSection>
    </>
  )
}
