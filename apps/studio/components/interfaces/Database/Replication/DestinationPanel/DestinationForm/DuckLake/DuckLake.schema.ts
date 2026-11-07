import * as z from 'zod'

// `supabase` mode uses the current project for managed catalog and storage. `custom` mode connects
// to an existing Postgres catalog and S3-compatible storage.
export const DuckLakeFormSchema = z.object({
  ducklakeMode: z.enum(['supabase', 'custom']).optional(),
  // Managed DuckLake fields
  ducklakeStorageBucket: z.string().optional(),
  // DuckLake connection fields
  ducklakeCatalogUrl: z.string().optional(),
  ducklakeDataPath: z.string().optional(),
  ducklakePoolSize: z
    .union([
      z.literal(''),
      z
        .number()
        .int()
        .min(1, 'Pool size must be greater than 0.')
        .max(6, 'Pool size must be 6 or less.'),
    ])
    .optional(),
  ducklakeS3AccessKeyId: z.string().optional(),
  ducklakeS3SecretAccessKey: z.string().optional(),
  ducklakeS3Region: z.string().optional(),
  ducklakeS3Endpoint: z.string().optional(),
  ducklakeS3UrlStyle: z.enum(['path', 'vhost']).optional(),
  ducklakeS3UseSsl: z.boolean().optional(),
  ducklakeMetadataSchema: z.string().optional(),
})
