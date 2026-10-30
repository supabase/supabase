import * as z from 'zod'

// Only warehouse name and namespace are visible + editable fields
export const AnalyticsBucketFormSchema = z.object({
  warehouseName: z.string().optional(),
  namespace: z.string().optional(),
  newNamespaceName: z.string().optional(),
  catalogToken: z.string().optional(),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  s3Region: z.string().optional(),
})
