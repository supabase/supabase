import * as z from 'zod'

// [Joshen] JFYI if we plan to add another type here, I reckon we split this out into smaller components
// then as FormSchema is getting quite complex with some fields that aren't necessary if the type is one or the other
export const DestinationPanelFormSchema = z.object({
  // Common fields
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

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
