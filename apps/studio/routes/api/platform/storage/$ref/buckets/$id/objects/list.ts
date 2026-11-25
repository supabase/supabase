import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

type ListOptions = Parameters<ReturnType<typeof supabase.storage.from>['list']>[1]

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/list')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { path, options } = await parseJsonBody<{ path?: string; options?: ListOptions }>(
          request
        )

        const { data, error } = await supabase.storage.from(params.id as string).list(path, options)
        if (error) {
          return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
