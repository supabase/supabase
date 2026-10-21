import { z } from 'zod'

const LOG_DRAIN_RESOURCE_TYPE = 'log_drain'

const logDrainRequestSchema = z.object({
  data: z.object({
    attributes: z.object({
      name: z.string(),
      description: z.string().optional(),
      backend_type: z.string(),
      config: z.record(z.string(), z.unknown()),
    }),
  }),
})

type LogflareBackend = {
  token: string
  name: string
  description?: string | null
  type: string
  config: unknown
}

/**
 * Converts a v2 log drain request body ({ data: { attributes } }) into a Logflare backend payload.
 */
export function parseLogDrainRequest(body: unknown) {
  const result = logDrainRequestSchema.safeParse(body)
  if (!result.success) return { success: false as const, error: result.error }

  const { backend_type, ...attributes } = result.data.data.attributes
  return { success: true as const, data: { ...attributes, type: backend_type } }
}

/**
 * Converts a Logflare backend into a v2 log drain resource, where `id` is the Logflare token.
 */
export function asLogDrainResource({ token, name, description, type, config }: LogflareBackend) {
  return {
    type: LOG_DRAIN_RESOURCE_TYPE,
    id: token,
    attributes: { name, description, config, backend_type: type },
  }
}
