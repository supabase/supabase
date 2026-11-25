import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/public-url')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { path } = await parseJsonBody<{ path: string }>(request)

        const { data } = supabase.storage.from(params.id as string).getPublicUrl(path)

        // change the domain name to the SUPABASE_PUBLIC_URL since SUPABASE_URL is not accessible from the client
        const publicUrl = new URL(data.publicUrl)
        const parsed = new URL(process.env.SUPABASE_PUBLIC_URL!)
        publicUrl.protocol = parsed.protocol
        publicUrl.host = parsed.host
        publicUrl.port = parsed.port
        data.publicUrl = publicUrl.href

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
