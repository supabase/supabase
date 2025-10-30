import * as z from 'zod'

const types = ['BigQuery', 'Analytics Bucket'] as const
export const TypeEnum = z.enum(types)

// [Joshen] JFYI if we plan to add another type here, I reckon we split this out into smaller components
// then as FormSchema is getting quite complex with some fields that aren't necessary if the type is one or the other
export const DestinationPanelFormSchema = z
  .object({
    // Common fields
    type: TypeEnum,
    name: z.string().min(1, 'Name is required'),
    publicationName: z.string().min(1, 'Publication is required'),
    maxFillMs: z.number().min(1, 'Max Fill milliseconds should be greater than 0').int().optional(),
    // BigQuery fields
    projectId: z.string().optional(),
    datasetId: z.string().optional(),
    serviceAccountKey: z.string().optional(),
    maxStalenessMins: z.number().nonnegative().optional(),
    // Analytics Bucket fields, only warehouse name and namespace are visible + editable fields
    warehouseName: z.string().optional(),
    namespace: z.string().optional(),
    newNamespaceName: z.string().optional(),
    catalogToken: z.string().optional(),
    s3AccessKeyId: z.string().optional(),
    s3SecretAccessKey: z.string().optional(),
    s3Region: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'BigQuery') {
      if (!data.projectId || data.projectId.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project ID is required',
          path: ['projectId'],
        })
      }
      if (!data.datasetId || data.datasetId.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dataset ID is required',
          path: ['datasetId'],
        })
      }
      if (!data.serviceAccountKey || data.serviceAccountKey.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Service Account Key is required',
          path: ['serviceAccountKey'],
        })
      }
    } else if (data.type === 'Analytics Bucket') {
      if (!data.warehouseName || data.warehouseName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bucket is required',
          path: ['warehouseName'],
        })
      }

      const hasValidNamespace =
        (data.namespace &&
          data.namespace.length > 0 &&
          data.namespace !== 'create-new-namespace') ||
        (data.namespace === 'create-new-namespace' &&
          data.newNamespaceName &&
          data.newNamespaceName.length > 0)

      if (!hasValidNamespace) {
        if (data.namespace === 'create-new-namespace') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Namespace name is required',
            path: ['newNamespaceName'],
          })
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Namespace is required',
            path: ['namespace'],
          })
        }
      }

      if (!data.s3Region || data.s3Region.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'S3 Region is required',
          path: ['s3Region'],
        })
      }

      // Validate S3 keys when not creating new
      if (
        data.s3AccessKeyId !== 'create-new' &&
        (!data.s3SecretAccessKey || data.s3SecretAccessKey.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'S3 Secret Access Key is required',
          path: ['s3SecretAccessKey'],
        })
      }
    }
  })

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
