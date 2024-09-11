import { z } from 'zod'

const TroubleshootingSchema = z.object({
  title: z.string(),
  topics: z.array(
    z.enum([
      'ai',
      'auth',
      'branching',
      'cli',
      'database',
      'functions',
      'platform',
      'realtime',
      'self-hosting',
      'storage',
      'studio',
      'supavisor',
      'terraform',
    ])
  ),
  keywords: z.array(z.string()).optional(),
  api: z
    .object({
      sdk: z.array(z.string()).optional(),
      management_api: z.array(z.string()).optional(),
      cli: z.array(z.string()).optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        httpStatusCode: z.number().optional(),
        code: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
})

export type ITroubleshootingMetadata = z.infer<typeof TroubleshootingSchema>

export const validateTroubleshootingMetadata = (troubleshootingMetadata: unknown) => {
  return TroubleshootingSchema.safeParse(troubleshootingMetadata)
}
