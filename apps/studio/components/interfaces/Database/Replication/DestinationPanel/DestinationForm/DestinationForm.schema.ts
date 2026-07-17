import * as z from 'zod'

// [Joshen] JFYI if we plan to add another type here, I reckon we split this out into smaller components
// then as FormSchema is getting quite complex with some fields that aren't necessary if the type is one or the other
export const DestinationPanelFormSchema = z.object({
  // Common fields
  name: z.string().min(1, 'Name is required'),
  publicationName: z.string().min(1, 'Publication is required'),
  maxFillMs: z
    .number()
    .int('Batch wait time must be a whole number of milliseconds')
    .min(0, 'Batch wait time must be 0 or greater')
    .optional(),
  maxTableSyncWorkers: z
    .number()
    .min(1, 'Max table sync workers must be greater than 0')
    .int('Max table sync workers must be a whole number')
    .optional(),
  maxCopyConnectionsPerTable: z
    .number()
    .int()
    .min(1, 'Max copy connections per table must be greater than 0')
    .optional(),
  invalidatedSlotBehavior: z.enum(['error', 'recreate']).optional(),
  // BigQuery fields
  projectId: z.string().optional(),
  datasetId: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  connectionPoolSize: z
    .number()
    .int()
    .min(1, 'Connection pool size must be greater than 0')
    .optional(),
  maxStalenessMins: z
    .number()
    .int('Maximum staleness must be a whole number of minutes')
    .min(0, 'Maximum staleness must be 0 or greater')
    .optional(),
  // Analytics Bucket fields, only warehouse name and namespace are visible + editable fields
  warehouseName: z.string().optional(),
  namespace: z.string().optional(),
  newNamespaceName: z.string().optional(),
  catalogToken: z.string().optional(),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  s3Region: z.string().optional(),
  // DuckLake fields
  // `supabase` mode picks Supabase projects for catalog + storage (managed), while `custom`
  // mode keeps the manual PostgreSQL catalog URL + S3-compatible credentials.
  ducklakeMode: z.enum(['supabase', 'custom']).optional(),
  // DuckLake "Use Supabase" fields
  ducklakeCatalogProjectRef: z.string().optional(),
  ducklakeStorageProjectRef: z.string().optional(),
  ducklakeStorageBucket: z.string().optional(),
  // DuckLake "Custom parameters" fields
  ducklakeCatalogUrl: z.string().optional(),
  ducklakeDataPath: z.string().optional(),
  ducklakePoolSize: z
    .number()
    .int()
    .min(1, 'Pool size must be greater than 0')
    .max(6, 'Pool size must be 6 or less')
    .optional(),
  ducklakeS3AccessKeyId: z.string().optional(),
  ducklakeS3SecretAccessKey: z.string().optional(),
  ducklakeS3Region: z.string().optional(),
  ducklakeS3Endpoint: z.string().optional(),
  ducklakeS3UrlStyle: z.enum(['path', 'vhost']).optional(),
  ducklakeS3UseSsl: z.boolean().optional(),
  ducklakeMetadataSchema: z.string().optional(),
  // Snowflake fields
  snowflakeAccountId: z.string().optional(),
  snowflakeUser: z.string().optional(),
  snowflakePrivateKey: z.string().optional(),
  snowflakePrivateKeyPassphrase: z.string().optional(),
  snowflakeDatabase: z.string().optional(),
  snowflakeSchema: z.string().optional(),
  snowflakeRole: z.string().optional(),
})

export type DestinationPanelSchemaType = z.infer<typeof DestinationPanelFormSchema>
