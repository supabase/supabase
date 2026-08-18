import { z } from 'zod'

import type { ExpirationMode } from './StorageVersioning.constants'

/**
 * `''` is the in-form empty sentinel for both number fields, so they stay
 * controlled and deletable. Empty means the condition isn't part of the policy,
 * which is distinct from zero.
 */
const versioningNumberField = z.union([z.literal(''), z.coerce.number().int()])

/** S3 lifecycle policies support at most 100 noncurrent versions per rule. */
export const S3_MAX_NONCURRENT_VERSIONS = 100

/** Spread into the create/edit bucket form schemas so both share one definition. */
export const bucketVersioningFormFields = {
  enable_versioning: z.boolean().default(false),
  version_expiry_days: versioningNumberField.default(''),
  max_noncurrent_versions: versioningNumberField.default(''),
  expiration_mode: z.enum(['and', 'or']).default('and'),
}

export interface BucketVersioningFormValues {
  enable_versioning: boolean
  version_expiry_days: '' | number
  max_noncurrent_versions: '' | number
  expiration_mode: ExpirationMode
}

/**
 * Call from the parent modal's `.superRefine` so errors surface through the
 * usual `FormItemLayout`/`FormMessage` rendering. Both number fields are
 * optional — an empty value drops that condition from the policy.
 */
export const superRefineBucketVersioning = (
  data: BucketVersioningFormValues,
  ctx: z.RefinementCtx
) => {
  if (!data.enable_versioning) return

  const { version_expiry_days: days, max_noncurrent_versions: versions } = data

  if (days !== '' && days < 1) {
    ctx.addIssue({
      path: ['version_expiry_days'],
      code: z.ZodIssueCode.custom,
      message: 'Must be at least 1 day',
    })
  }

  if (versions === '') return

  // S3 only accepts a noncurrent-count condition alongside a noncurrent-days
  // one. The form disables the cap while no age is set, so this is a backstop.
  if (days === '') {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: 'Requires an expiration age to be set',
    })
    return
  }

  if (versions < 1) {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: 'Must be at least 1 version',
    })
  } else if (versions > S3_MAX_NONCURRENT_VERSIONS) {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: `Cannot exceed ${S3_MAX_NONCURRENT_VERSIONS} versions`,
    })
  }
}
