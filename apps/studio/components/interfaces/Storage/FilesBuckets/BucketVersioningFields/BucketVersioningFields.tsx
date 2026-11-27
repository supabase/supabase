import { LOCAL_STORAGE_KEYS } from 'common'
import { AnimatePresence } from 'motion/react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import {
  Badge,
  Button,
  DialogSection,
  DialogSectionSeparator,
  FormControl,
  FormField,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { type BucketFormValues } from '../FilesBucket.schema'
import {
  getRetentionTightening,
  RETENTION_TIGHTENING_DESCRIPTION,
  toNullableNumber,
} from './BucketVersioningFields.utils'
import { LifecyclePolicySection } from './LifecyclePolicySection'
import { useFeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { BucketVersioningState } from '@/components/interfaces/Storage/StorageVersioning.constants'
import { FormSectionCollapse } from '@/components/ui/FormSectionCollapse'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface BucketVersioningFieldsProps {
  form: UseFormReturn<BucketFormValues>
  initialVersioningState?: BucketVersioningState
  initialRetentionDays?: number | null
  initialMaxVersions?: number | null
  isPublicBucket?: boolean
  isLoadingPolicy?: boolean
  isUnsupportedPolicy?: boolean
  policyError?: { message: string } | null
  bucketName?: string
}

export const BucketVersioningFields = ({
  form,
  initialVersioningState = 'disabled',
  initialRetentionDays,
  initialMaxVersions,
  isPublicBucket = false,
  isLoadingPolicy = false,
  isUnsupportedPolicy = false,
  policyError,
  bucketName,
}: BucketVersioningFieldsProps) => {
  const { control } = form

  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  const retentionDays = useWatch({ control, name: 'version_expiry_days' })
  const maxVersions = useWatch({ control, name: 'max_noncurrent_versions' })
  const expirationMode = useWatch({ control, name: 'expiration_mode' })

  const isSuspending = !isVersioningEnabled && initialVersioningState !== 'disabled'
  const canEditLifecycle = isVersioningEnabled || initialVersioningState === 'suspended'

  // bounds are only known if the policy is loaded and supported,
  // otherwise we can't know if the user is tightening or loosening retention
  const hasKnownBounds = !isLoadingPolicy && !isUnsupportedPolicy && !policyError

  const tightening = getRetentionTightening({
    initialVersioningState,
    isVersioningEnabled,
    initialRetentionDays: hasKnownBounds ? initialRetentionDays : undefined,
    initialMaxVersions: hasKnownBounds ? initialMaxVersions : undefined,
    nextRetentionDays: toNullableNumber(retentionDays),
    nextMaxVersions: toNullableNumber(maxVersions),
  })

  const hasDays = typeof retentionDays === 'number' && retentionDays > 0
  const hasVersions = typeof maxVersions === 'number' && maxVersions > 0

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
              labelAddon={<StorageVersioningAlphaPopover />}
              description="Retains previous versions when an object is overwritten or deleted"
              layout="flex"
            >
              <FormControl>
                <Switch
                  id="enable_versioning"
                  aria-label="Object versioning"
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

          {canEditLifecycle && (
            <FormSectionCollapse key="lifecycle-policy">
              <LifecyclePolicySection
                form={form}
                hasDays={hasDays}
                hasVersions={hasVersions}
                mode={expirationMode}
                isLoading={isLoadingPolicy}
                isUnsupported={isUnsupportedPolicy}
                error={policyError}
                bucketName={bucketName}
              />
            </FormSectionCollapse>
          )}
        </AnimatePresence>
      </DialogSection>
    </>
  )
}

const StorageVersioningAlphaPopover = () => {
  const { selectFeaturePreview } = useFeaturePreviewModal()

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label="Public Alpha feature details"
          tabIndex={0}
          className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Badge variant="warning">Public Alpha</Badge>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-80 space-y-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Storage object versioning is in public alpha
          </p>
          <p className="text-xs text-foreground-light text-pretty">
            The behavior of this feature may change during development and is not recommended
            production use.
          </p>
        </div>
        <Button
          size="tiny"
          onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING)}
        >
          Review feature
        </Button>
      </HoverCardContent>
    </HoverCard>
  )
}
