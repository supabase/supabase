import { z } from 'zod'

import {
  inverseValidBucketNameRegex,
  validBucketNameRegex,
} from '@/components/interfaces/Storage/Storage.utils'
import type { ExpirationMode } from '@/components/interfaces/Storage/StorageVersioning.constants'

/** Empty drops the condition from the policy, which is distinct from zero. */
const versioningNumberField = z.union([z.literal(''), z.coerce.number().int()])

export const S3_MAX_NONCURRENT_VERSIONS = 100

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

  // S3 only accepts a noncurrent-count condition alongside a noncurrent-days one
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
      message: 'Must be at least 1 version or empty to disable',
    })
  } else if (versions > S3_MAX_NONCURRENT_VERSIONS) {
    ctx.addIssue({
      path: ['max_noncurrent_versions'],
      code: z.ZodIssueCode.custom,
      message: `Cannot exceed ${S3_MAX_NONCURRENT_VERSIONS} versions`,
    })
  }
}

const BucketFormObjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please provide a name for your bucket')
    .max(100, 'Bucket name should be below 100 characters')
    .refine((value) => !value.endsWith(' '), 'The name of the bucket cannot end with a whitespace')
    .refine(
      (value) => value !== 'public',
      '"public" is a reserved name. Please choose another name'
    ),
  public: z.boolean().default(false),
  has_file_size_limit: z.boolean().default(false),
  formatted_size_limit: z.coerce
    .number()
    .min(0, 'File size upload limit has to be at least 0')
    .optional(),
  allowed_mime_types: z.string().trim().default(''),
  ...bucketVersioningFormFields,
})

export const EditBucketFormSchema = BucketFormObjectSchema.extend({
  name: z.string(),
}).superRefine((data, ctx) => {
  superRefineBucketVersioning(data, ctx)
})

export const BucketFormSchema = BucketFormObjectSchema.superRefine((data, ctx) => {
  if (!validBucketNameRegex.test(data.name)) {
    const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
    ctx.addIssue({
      path: ['name'],
      code: z.ZodIssueCode.custom,
      message: !!match
        ? `Bucket name cannot contain the "${match}" character`
        : 'Bucket name contains an invalid special character',
    })
  }

  superRefineBucketVersioning(data, ctx)
})

export type BucketFormValues = z.infer<typeof BucketFormSchema>
