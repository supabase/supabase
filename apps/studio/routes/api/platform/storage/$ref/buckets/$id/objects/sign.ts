import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/sign')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { path, expiresIn = 60 * 60 * 24 } = await parseJsonBody<{
          path: string
          expiresIn?: number
        }>(request)

        const { data, error } = await supabase.storage
          .from(params.id as string)
          .createSignedUrl(path, expiresIn)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        // change the domain name to the SUPABASE_PUBLIC_URL since SUPABASE_URL is not accessible from the client
        const signedUrl = new URL(data.signedUrl)
        const parsed = new URL(process.env.SUPABASE_PUBLIC_URL!)
        signedUrl.protocol = parsed.protocol
        signedUrl.host = parsed.host
        signedUrl.port = parsed.port
        data.signedUrl = signedUrl.href

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
