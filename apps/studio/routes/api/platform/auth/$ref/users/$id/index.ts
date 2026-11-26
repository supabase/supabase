import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/auth/$ref/users/$id/')({
  server: {
    handlers: createApiHandlers({
      PATCH: async ({ request, params }) => {
        const { ban_duration } = await parseJsonBody<{ ban_duration?: string }>(request)
        const { data, error } = await supabase.auth.admin.updateUserById(params.id, {
          ban_duration,
        })

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data.user)
      },
      DELETE: async ({ params }) => {
        const { data, error } = await supabase.auth.admin.deleteUser(params.id)

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data)
      },
    }),
  },
})
