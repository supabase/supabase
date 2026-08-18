import { z } from 'zod'

import {
  bucketVersioningFormFields,
  superRefineBucketVersioning,
} from './BucketVersioningFields/BucketVersioningFields.schema'
import {
  inverseValidBucketNameRegex,
  validBucketNameRegex,
} from '@/components/interfaces/Storage/Storage.utils'

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
