import { fetchPost } from '@/data/fetchers'
import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

/**
 * POST handler for the self-hosted GoTrue endpoints that send an email or SMS (invite, magic
 * link, OTP, password recovery). Forwards only `field` from the request body, authenticated
 * with the service role key, and passes upstream errors through with their status code.
 */
export function createAuthSenderHandlers(
  endpoint: 'invite' | 'magiclink' | 'otp' | 'recover',
  field: 'email' | 'phone'
) {
  return createApiHandlers({
    POST: async ({ request }) => {
      const body = await parseJsonBody<Partial<Record<typeof field, string>>>(request)
      const headers = constructHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      })

      const response = await fetchPost(
        `${process.env.SUPABASE_URL}/auth/v1/${endpoint}`,
        { [field]: body[field] },
        { headers }
      )
      if (response.error) {
        const { code, message } = response.error
        return Response.json({ message }, { status: code ?? 500 })
      }
      return Response.json(response)
    },
  })
}
