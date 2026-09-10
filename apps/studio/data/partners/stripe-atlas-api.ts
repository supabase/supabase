import { z } from 'zod'

import { API_BASE_URL, fetchHandler, handleError } from '@/data/fetchers'

/**
 * The Stripe Atlas perk endpoints live in the partners spec, which `packages/api-types` doesn't
 * pull into codegen (`redocly.yaml` only covers v1, v2 and platform), so they can't go through the
 * typed `get`/`post` client. They're also reachable without a Supabase session — the Stripe Atlas
 * token in the link is the only credential — so we send no `Authorization` header and parse every
 * response with zod rather than trusting a generated type.
 */
export const STRIPE_ATLAS_APPLICATION_PATH = '/partners/stripe/atlas/application'
export const STRIPE_ATLAS_COMPLETE_PATH = '/partners/stripe/atlas/complete'

const ErrorBodySchema = z.object({ message: z.string() })

/**
 * Calls a Stripe Atlas perk endpoint and returns the parsed body. Failures are funnelled through
 * `handleError` so callers see the same `ResponseError` shape the typed client produces.
 */
export async function stripeAtlasFetch<TSchema extends z.ZodTypeAny>(
  path: string,
  { schema, ...init }: RequestInit & { schema: TSchema }
): Promise<z.infer<TSchema>> {
  const response = await fetchHandler(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  })

  const body = await response.json().catch(() => undefined)

  if (!response.ok) {
    const parsedError = ErrorBodySchema.safeParse(body)
    handleError({
      message: parsedError.success ? parsedError.data.message : undefined,
      code: response.status,
    })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    handleError({ message: 'Received an unexpected response from the server.' })
  }

  return parsed.data
}
