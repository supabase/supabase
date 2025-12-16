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
    const addRequiredFieldError = (path: string, message: string) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [path],
      })
    }

    if (data.type === 'BigQuery') {
      if (!data.projectId?.length) addRequiredFieldError('projectId', 'Project ID is required')
      if (!data.datasetId?.length) addRequiredFieldError('datasetId', 'Dataset ID is required')
      if (!data.serviceAccountKey?.length)
        addRequiredFieldError('serviceAccountKey', 'Service Account Key is required')
    } else if (data.type === 'Analytics Bucket') {
      if (!data.warehouseName?.length) addRequiredFieldError('warehouseName', 'Bucket is required')

      const hasValidNamespace =
        (data.namespace?.length && data.namespace !== 'create-new-namespace') ||
        (data.namespace === 'create-new-namespace' && data.newNamespaceName?.length)

      if (!hasValidNamespace) {
        const isCreatingNew = data.namespace === 'create-new-namespace'
        addRequiredFieldError(
          isCreatingNew ? 'newNamespaceName' : 'namespace',
          isCreatingNew ? 'Namespace name is required' : 'Namespace is required'
        )
      }

      if (!data.s3Region?.length) addRequiredFieldError('s3Region', 'S3 Region is required')

      if (!data.s3AccessKeyId?.length)
        addRequiredFieldError('s3AccessKeyId', 'S3 Access Key ID is required')

      if (data.s3AccessKeyId !== 'create-new' && !data.s3SecretAccessKey?.length) {
        addRequiredFieldError('s3SecretAccessKey', 'S3 Secret Access Key is required')
      }
    }
  })

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
