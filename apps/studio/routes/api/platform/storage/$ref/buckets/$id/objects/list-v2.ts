import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

type ListV2Options = Parameters<ReturnType<typeof supabase.storage.from>['listV2']>[0]

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/list-v2')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const body = await parseJsonBody<ListV2Options>(request)

        const { data, error } = await supabase.storage.from(params.id as string).listV2(body)
        if (error) {
          return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
