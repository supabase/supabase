import type { AdminUserAttributes } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/auth/$ref/users/')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request }) => {
        const body = await parseJsonBody<AdminUserAttributes>(request)
        const { data, error } = await supabase.auth.admin.createUser(body)

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data.user, { status: 200 })
      },
    }),
  },
})
