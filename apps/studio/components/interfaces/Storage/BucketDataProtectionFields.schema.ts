import { z } from 'zod'

import type { VersioningPlanLimits } from './StorageProtection.constants'

/**
 * Shared zod fields for the object-versioning controls in the create/edit
 * bucket modals. `''` is the in-form empty sentinel (per the react-hook-form
 * convention) so the number inputs stay fully deletable/controlled; it's
 * coerced to a real number on parse.
 */
const versioningNumberField = z.union([z.literal(''), z.coerce.number().int()])

export const bucketProtectionFormFields = {
  enable_versioning: z.boolean().default(false),
  version_expiry_days: versioningNumberField.default(''),
  max_noncurrent_versions: versioningNumberField.default(''),
}

export interface BucketProtectionFormValues {
  enable_versioning: boolean
  version_expiry_days: '' | number
  max_noncurrent_versions: '' | number
}

/**
 * Validates the versioning fields against the org's plan limits. Call this
 * from the parent modal's `.superRefine` so errors surface through the usual
 * `FormItemLayout`/`FormMessage` rendering.
 */
export const superRefineBucketProtection = (
  data: BucketProtectionFormValues,
  ctx: z.RefinementCtx,
  planLimits: VersioningPlanLimits | null
) => {
  if (!data.enable_versioning || !planLimits) return

  if (data.version_expiry_days === '') {
    ctx.addIssue({
      path: ['version_expiry_days'],
      code: z.ZodIssueCode.custom,
      message: 'Please provide a retention period',
    })
  } else if (
    data.version_expiry_days < planLimits.minRetentionDays ||
    data.version_expiry_days > planLimits.maxRetentionDays
  ) {
    ctx.addIssue({
      path: ['version_expiry_days'],
      code: z.ZodIssueCode.custom,
      message: `Must be between ${planLimits.minRetentionDays} and ${planLimits.maxRetentionDays} days on your plan`,
    })
  }

  if (data.max_noncurrent_versions === '') {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: 'Please provide a value',
    })
  } else if (
    data.max_noncurrent_versions < planLimits.minVersions ||
    data.max_noncurrent_versions > planLimits.maxVersions
  ) {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: `Must be between ${planLimits.minVersions} and ${planLimits.maxVersions} versions on your plan`,
    })
  }
}
