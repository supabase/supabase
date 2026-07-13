import * as z from 'zod'

// `supabase` mode picks Supabase projects for catalog + storage (managed), while `custom`
// mode keeps the manual PostgreSQL catalog URL + S3-compatible credentials.
export const DuckLakeFormSchema = z.object({
  ducklakeMode: z.enum(['supabase', 'custom']).optional(),
  // "Use Supabase" fields
  ducklakeCatalogProjectRef: z.string().optional(),
  ducklakeStorageProjectRef: z.string().optional(),
  ducklakeStorageBucket: z.string().optional(),
  // "Custom parameters" fields
  ducklakeCatalogUrl: z.string().optional(),
  ducklakeDataPath: z.string().optional(),
  ducklakePoolSize: z.number().int().min(1).max(6).optional(),
  ducklakeS3AccessKeyId: z.string().optional(),
  ducklakeS3SecretAccessKey: z.string().optional(),
  ducklakeS3Region: z.string().optional(),
  ducklakeS3Endpoint: z.string().optional(),
  ducklakeS3UrlStyle: z.enum(['path', 'vhost']).optional(),
  ducklakeS3UseSsl: z.boolean().optional(),
  ducklakeMetadataSchema: z.string().optional(),
})
