import * as z from 'zod'

export const DuckLakeFormSchema = z.object({
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
