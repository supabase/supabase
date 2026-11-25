import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/download')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { path } = await parseJsonBody<{ path: string }>(request)

        const { data, error } = await supabase.storage.from(params.id as string).download(path)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return new Response(await data.arrayBuffer(), {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' },
        })
      },
    }),
  },
})
