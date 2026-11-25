import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/auth/$ref/users/$id/')({
  server: {
    handlers: createApiHandlers({
      PATCH: async ({ request, params }) => {
        const id = params.id as string
        const { ban_duration } = await parseJsonBody<{ ban_duration?: string }>(request)
        const { data, error } = await supabase.auth.admin.updateUserById(id, { ban_duration })

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data.user, { status: 200 })
      },
      DELETE: async ({ params }) => {
        const id = params.id as string
        const { data, error } = await supabase.auth.admin.deleteUser(id)

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data, { status: 200 })
      },
    }),
  },
})
