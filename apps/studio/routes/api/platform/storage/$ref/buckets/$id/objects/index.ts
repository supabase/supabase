import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/')({
  server: {
    handlers: createApiHandlers({
      DELETE: async ({ request, params }) => {
        const { paths } = await parseJsonBody<{ paths: string[] }>(request)

        const { data, error } = await supabase.storage.from(params.id as string).remove(paths)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
